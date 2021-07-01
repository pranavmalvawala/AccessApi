import { controller, httpGet, httpPost, interfaces, requestParam } from "inversify-express-utils";
import express from "express";
import bcrypt from "bcryptjs";
import { LoginRequest, User, ResetPasswordRequest, LoadCreateUserRequest, Church, EmailPassword, ChurchApp } from "../models";
import { AuthenticatedUser } from "../auth";
import { AccessBaseController } from "./AccessBaseController"
import { EmailHelper, Permissions } from "../helpers";
import { v4 } from 'uuid';

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
          user.authGuid = "";
          await this.repositories.user.save(user);
        }
      } else {
        user = await this.repositories.user.loadByEmail(req.body.email);
        if (user !== null) {
          if (!bcrypt.compareSync(req.body.password, user.password?.toString() || "")) user = null;
        }
      }

      if (user === null) return this.denyAccess(["Login failed"]);
      else {
        const churches = await this.getChurches(user.id)
        const result = await AuthenticatedUser.login(churches, user);
        if (result === null) return this.denyAccess(["No permissions"]);
        else return this.json(result, 200);
      }
    } catch (e) {
      this.logger.error(e);
      return this.error([e.toString()]);
    }
  }

  private async getChurches(id: string): Promise<Church[]> {
    const churches = await this.repositories.rolePermission.loadForUser(id, true)  // Set to true so churches[0] is always a real church.  Not sre why it was false before.  If we need to change this make it a param on the login request
    const churchApps: { [key: string]: ChurchApp[] } = {};
    churches.forEach(c => { churchApps[c.id] = [] });
    const apps: ChurchApp[] = await this.repositories.churchApp.loadForChurches(Object.keys(churchApps));
    apps.forEach(c => { churchApps[c.churchId].push(c) });

    return churches.map(c => { c.apps = churchApps[c.id]; return c });
  }

  @httpPost("/verifyCredentials")
  public async verifyCredentials(req: express.Request<{}, {}, EmailPassword>, res: express.Response): Promise<any> {
    try {
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

  @httpPost("/loadOrCreate")
  public async loadOrCreate(req: express.Request<{}, {}, LoadCreateUserRequest>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const { userId, userEmail, userName } = req.body;
      let user: User;

      if (userId) {
        user = await this.repositories.user.load(userId);
      } else {
        user = await this.repositories.user.loadByEmail(userEmail);
      }

      if (!user) {
        user = { email: userEmail, displayName: userName };
        user.registrationDate = new Date();
        user.lastLogin = user.registrationDate;
        user.authGuid = v4();
        user = await this.repositories.user.save(user);

        const loginLink = this.createLoginLink(user.authGuid);
        const subject = "Live Church Solutions One Time Login Link";
        const body = `Your one time login link: <a href="${loginLink}">${loginLink}</a>`;
        await EmailHelper.sendEmail({ from: process.env.SUPPORT_EMAIL, to: user.email, subject, body});
      }
      user.password = null;
      return this.json(user, 200);
    });
  }



  @httpPost("/forgot")
  public async forgotPassword(req: express.Request<{}, {}, ResetPasswordRequest>, res: express.Response): Promise<any> {
    try {
      const user = await this.repositories.user.loadByEmail(req.body.userEmail);
      if (user === null) return this.json({ emailed: false }, 200);
      else {
        user.authGuid = v4();
        const loginLink = this.createLoginLink(user.authGuid);
        const subject = "Live Church Solutions Password Reset"
        const body = `Please click here to reset your password: <a href="${loginLink}">${loginLink}</a>"`;

        const promises = [];
        promises.push(this.repositories.user.save(user));
        promises.push(EmailHelper.sendEmail({ from: process.env.SUPPORT_EMAIL, to: user.email, subject, body }));
        await Promise.all(promises);
        return this.json({ emailed: true }, 200);
      }
    } catch (e) {
      this.logger.error(e);
      return this.error([e.toString()]);
    }
  }


  @httpPost("/setDisplayName")
  public async setDisplayName(req: express.Request<{}, {}, { displayName: string, userId?: string }>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      let user = await this.repositories.user.load(req.body.userId || au.id);
      if (user !== null) {
        user.displayName = req.body.displayName;
        user = await this.repositories.user.save(user);
      }
      user.password = null;
      return this.json(user, 200);
    });
  }

  @httpPost("/updateEmail")
  public async updateEmail(req: express.Request<{}, {}, { email: string, userId?: string }>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      let user = await this.repositories.user.load(req.body.userId || au.id);
      if (user !== null) {
        const existingUser = await this.repositories.user.loadByEmail(req.body.email);
        if (existingUser === null || existingUser.id === au.id) {
          user.email = req.body.email;
          user = await this.repositories.user.save(user);
        } else return this.denyAccess(["Access denied"]);
      }

      user.password = null;
      return this.json(user, 200);
    });
  }

  @httpPost("/updatePassword")
  public async updatePassword(req: express.Request<{}, {}, { newPassword: string }>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
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

  private createLoginLink(id: string) {
    return process.env.FRONTEND_ACCOUNTS_APP_HOST + `/login?auth=${id}`;
  }

}
