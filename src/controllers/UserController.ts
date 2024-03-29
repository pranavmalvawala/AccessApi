import { controller, httpGet, httpPost } from "inversify-express-utils";
import express from "express";
import bcrypt from "bcryptjs";
import { body, oneOf, validationResult } from "express-validator";
import { LoginRequest, User, ResetPasswordRequest, LoadCreateUserRequest, RegisterUserRequest, Church, EmailPassword, NewPasswordRequest } from "../models";
import { AuthenticatedUser } from "../auth";
import { AccessBaseController } from "./AccessBaseController"
import { EmailHelper, UserHelper, UniqueIdHelper, Environment } from "../helpers";
import { v4 } from 'uuid';
import { ChurchHelper } from "../helpers";
import { ArrayHelper } from "../apiBase"

const emailPasswordValidation = [
  body("email").isEmail().trim().normalizeEmail({ gmail_remove_dots: false }).withMessage("enter a valid email address"),
  body("password").isLength({ min: 6 }).withMessage("must be at least 6 chars long")
];

const loadOrCreateValidation = [
  oneOf([
    [
      body("userEmail").exists().isEmail().withMessage("enter a valid email address").trim().normalizeEmail({ gmail_remove_dots: false }),
      body('firstName').exists().withMessage("enter first name").not().isEmpty().trim().escape(),
      body('lastName').exists().withMessage("enter last name").not().isEmpty().trim().escape()
    ],
    body("userId").exists().withMessage("enter userId").isString()
  ])
]

const registerValidation = [
  oneOf([
    [
      body("email").exists().isEmail().withMessage("enter a valid email address").trim().normalizeEmail({ gmail_remove_dots: false }),
      body('firstName').exists().withMessage("enter first name").not().isEmpty().trim().escape(),
      body('lastName').exists().withMessage("enter last name").not().isEmpty().trim().escape()
    ],
  ])
]

const setDisplayNameValidation = [
  body("userId").optional().isString(),
  body('firstName').exists().withMessage("enter first name").not().isEmpty().trim().escape(),
  body('lastName').exists().withMessage("enter last name").not().isEmpty().trim().escape()
]

const updateEmailValidation = [
  body("userId").optional().isString(),
  body("email").isEmail().trim().normalizeEmail({ gmail_remove_dots: false }).withMessage("enter a valid email address")
]

@controller("/users")
export class UserController extends AccessBaseController {

  @httpPost("/login")
  public async login(req: express.Request<{}, {}, LoginRequest>, res: express.Response): Promise<any> {
    try {
      let user: User = null;
      if (req.body.jwt !== undefined && req.body.jwt !== "") {
        user = await AuthenticatedUser.loadUserByJwt(req.body.jwt, this.repositories);
      }
      else if (req.body.authGuid !== undefined && req.body.authGuid !== "") {
        user = await this.repositories.user.loadByAuthGuid(req.body.authGuid);
        if (user !== null) {
          // user.authGuid = "";
          // await this.repositories.user.save(user);
        }
      } else {
        user = await this.repositories.user.loadByEmail(req.body.email.trim());
        if (user !== null) {
          if (!bcrypt.compareSync(req.body.password, user.password?.toString() || "")) user = null;
        }
      }

      if (user === null) return this.denyAccess(["Login failed"]);
      else {
        const churches = await this.getChurches(user.id);
        await ChurchHelper.appendLogos(churches)
        const result = await AuthenticatedUser.login(churches, user);
        if (result === null) return this.denyAccess(["No permissions"]);
        else {
          user.lastLogin = new Date();
          await this.repositories.user.save(user);
          return this.json(result, 200);
        }
      }
    } catch (e) {
      this.logger.error(e);
      return this.error([e.toString()]);
    }
  }

  private async getChurches(id: string): Promise<Church[]> {

    // Load churches via Roles
    const churches = await this.repositories.rolePermission.loadForUser(id, true)  // Set to true so churches[0] is always a real church.  Not sre why it was false before.  If we need to change this make it a param on the login request

    // Load churches via userChurches relationships
    const userChurches: Church[] = await this.repositories.church.loadForUser(id);
    userChurches.forEach(uc => {
      if (!ArrayHelper.getOne(churches, "id", uc.id)) churches.push(uc);
    });

    return churches;
  }

  @httpPost("/verifyCredentials", ...emailPasswordValidation)
  public async verifyCredentials(req: express.Request<{}, {}, EmailPassword>, res: express.Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await this.repositories.user.loadByEmail(req.body.email);
      if (user === null) {
        return this.json({}, 200);
      }

      const passwordMatched = bcrypt.compareSync(req.body.password, user.password);
      if (!passwordMatched) {
        return this.denyAccess(["Incorrect password"]);
      }
      const churches = await this.repositories.rolePermission.loadForUser(user.id, false)
      const churchNames = churches.map(c => c.name);

      return this.json({ churches: churchNames }, 200);
    } catch (e) {
      this.logger.error(e);
      return this.error([e.toString()])
    }
  }

  private async grantAdminAccess(churches: Church[], churchId: string) {
    let universalChurch = null;
    churches.forEach(c => { if (c.id === "") universalChurch = c; });

    if (universalChurch !== null) {
      let selectedChurch = null;
      churches.forEach(c => { if (c.id === churchId) selectedChurch = c; });
      if (selectedChurch === null) {
        selectedChurch = await this.repositories.rolePermission.loadForChurch(churchId, universalChurch);
        churches.push(selectedChurch);
      }
    }
  }

  @httpPost("/loadOrCreate", ...loadOrCreateValidation)
  public async loadOrCreate(req: express.Request<{}, {}, LoadCreateUserRequest>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { userId, userEmail, firstName, lastName } = req.body;
      let user: User;

      if (userId) user = await this.repositories.user.load(userId);
      else user = await this.repositories.user.loadByEmail(userEmail);

      if (!user) {
        user = { email: userEmail, firstName, lastName };
        user.registrationDate = new Date();
        user.lastLogin = user.registrationDate;
        const tempPassword = UniqueIdHelper.shortId();
        user.password = bcrypt.hashSync(tempPassword, 10);
        user.authGuid = v4();
        user = await this.repositories.user.save(user);
        await UserHelper.sendWelcomeEmail(user.email, `/login?auth=${user.authGuid}`, null, null);
      }
      user.password = null;
      return this.json(user, 200);
    });
  }

  @httpPost("/register", ...registerValidation)
  public async register(req: express.Request<{}, {}, RegisterUserRequest>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const register: RegisterUserRequest = req.body;
      let user: User = await this.repositories.user.loadByEmail(register.email);

      if (user) return res.status(400).json({ errors: ["user already exists"] });
      else {
        const tempPassword = UniqueIdHelper.shortId();
        user = { email: register.email, firstName: register.firstName, lastName: register.lastName };
        user.authGuid = v4();
        user.registrationDate = new Date();
        user.password = bcrypt.hashSync(tempPassword, 10);

        try {
          await UserHelper.sendWelcomeEmail(register.email, `/login?auth=${user.authGuid}`, register.appName, register.appUrl);

          if (Environment.emailOnRegistration) {
            const emailBody = "Name: " + register.firstName + " " + register.lastName + "<br/>Email: " + register.email + "<br/>App: " + register.appName;
            await EmailHelper.sendTemplatedEmail(Environment.supportEmail, Environment.supportEmail, register.appName, register.appUrl, "New User Registration", emailBody);
          }
        } catch (err) {
          return this.json({ errors: [err.toString()] })
          // return this.json({ errors: ["Email address does not exist."] })
        }
        const userCount = await this.repositories.user.loadCount();

        user = await this.repositories.user.save(user);

        // Add first user to server admins group
        if (userCount === 0) {
          this.repositories.role.loadAll().then(roles => {
            this.repositories.roleMember.save({ roleId: roles[0].id, userId: user.id, addedBy: user.id });
          })
        }

      }
      user.password = null;
      return this.json(user, 200);
    });
  }

  @httpPost("/setPasswordGuid")
  public async setPasswordGuid(req: express.Request<{}, {}, NewPasswordRequest>, res: express.Response): Promise<any> {
    try {
      const user = await this.repositories.user.loadByAuthGuid(req.body.authGuid);
      if (user !== null) {
        user.authGuid = "";
        const hashedPass = bcrypt.hashSync(req.body.newPassword, 10);
        user.password = hashedPass
        await this.repositories.user.save(user);
        return { success: true };
      } else return { success: false };
    } catch (e) {
      this.logger.error(e);
      return this.error([e.toString()]);
    }
  }

  @httpPost("/forgot", body("userEmail").exists().trim().normalizeEmail({ gmail_remove_dots: false }).withMessage("enter a valid email address"))
  public async forgotPassword(req: express.Request<{}, {}, ResetPasswordRequest>, res: express.Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await this.repositories.user.loadByEmail(req.body.userEmail);
      if (user === null) return this.json({ emailed: false }, 200);
      else {
        user.authGuid = v4();
        const promises = [];
        promises.push(this.repositories.user.save(user));
        promises.push(UserHelper.sendForgotEmail(user.email, `/login?auth=${user.authGuid}`, req.body.appName, req.body.appUrl));
        await Promise.all(promises);
        return this.json({ emailed: true }, 200);
      }
    } catch (e) {
      this.logger.error(e);
      return this.error([e.toString()]);
    }
  }


  @httpPost("/setDisplayName", ...setDisplayNameValidation)
  public async setDisplayName(req: express.Request<{}, {}, { firstName: string, lastName: string, userId?: string }>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let user = await this.repositories.user.load(req.body.userId || au.id);
      if (user !== null) {
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user = await this.repositories.user.save(user);
      }
      user.password = null;
      return this.json(user, 200);
    });
  }

  @httpPost("/updateEmail", ...updateEmailValidation)
  public async updateEmail(req: express.Request<{}, {}, { email: string, userId?: string }>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const workingUserId = req.body.userId || au.id;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let user = await this.repositories.user.load(workingUserId);
      if (user !== null) {
        const existingUser = await this.repositories.user.loadByEmail(req.body.email);
        if (existingUser === null || existingUser.id === workingUserId) {
          user.email = req.body.email;
          user = await this.repositories.user.save(user);
        } else return this.denyAccess(["Access denied"]);
      }

      user.password = null;
      return this.json(user, 200);
    });
  }

  @httpPost("/updatePassword", body("newPassword").isLength({ min: 6 }).withMessage("must be at least 6 chars long"))
  public async updatePassword(req: express.Request<{}, {}, { newPassword: string }>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let user = await this.repositories.user.load(au.id);
      if (user !== null) {
        const hashedPass = bcrypt.hashSync(req.body.newPassword, 10);
        user.password = hashedPass
        user = await this.repositories.user.save(user);
      }
      user.password = null;
      return this.json(user, 200);
    });
  }

}
