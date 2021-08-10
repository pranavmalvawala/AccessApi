import { controller, httpPost, httpGet, interfaces, requestParam } from "inversify-express-utils";
import { RegistrationRequest, Church, Role, RoleMember, RolePermission, User, ChurchApp, Api } from "../models";
import express from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import { AuthenticatedUser } from '../auth';
import { AccessBaseController } from "./AccessBaseController"
import { Utils, Permissions, UserHelper } from "../helpers";
import { Repositories } from "../repositories";
import { ArrayHelper, EmailHelper, UniqueIdHelper } from "../apiBase";

const churchRegisterValidation = [
  body("email").isEmail().trim().normalizeEmail().withMessage("Enter a valid email address"),
  body("churchName").notEmpty().withMessage("Select a church name"),
  body("firstName").notEmpty().withMessage("Enter first name"),
  body("lastName").notEmpty().withMessage("Enter last name"),
]

@controller("/churches")
export class ChurchController extends AccessBaseController {

  @httpGet("/all")
  public async loadAll(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.server.admin)) return this.json({}, 401);
      let term: string = req.query.term.toString();
      if (term === null) term = "";
      const data = await this.repositories.church.search(term, "");
      const churches = this.repositories.church.convertAllToModel(data);
      return churches;
    });
  }

  @httpGet("/search/")
  public async search(req: express.Request<{}, {}, []>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    try {
      let result: Church[] = []
      if (req.query.name !== undefined) {
        const app = (req.query.app === undefined) ? "" : req.query.app.toString();
        const data = await this.repositories.church.search(req.query.name.toString(), app);
        result = this.repositories.church.convertAllToModel(data);
        if (result.length > 0 && this.include(req, "logoSquare")) await this.appendLogos(result);
      }
      return this.json(result, 200);
    } catch (e) {
      this.logger.error(e);
      return this.internalServerError(e);
    }
  }

  @httpGet("/lookup/")
  public async getBySubDomain(req: express.Request<{}, {}, RegistrationRequest>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    try {
      let result = {}
      if (req.query.subDomain !== undefined) {
        const data = await this.repositories.church.loadBySubDomain(req.query.subDomain.toString());
        const church = this.repositories.church.convertToModel(data);
        result = { id: church.id, name: church.name, subDomain: church.subDomain };
      } else if (req.query.id !== undefined) {
        const data = await this.repositories.church.loadById(req.query.id.toString());
        const church = this.repositories.church.convertToModel(data);
        result = { id: church.id, name: church.name, subDomain: church.subDomain };
      }
      return this.json(result, 200);
    } catch (e) {
      this.logger.error(e);
      return this.internalServerError(e);
    }
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, RegistrationRequest>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const churchId = id.toString();
      let hasAccess = au.checkAccess(Permissions.server.admin) || au.churchId === churchId;
      if (!hasAccess) {
        const churches = await this.repositories.rolePermission.loadForUser(au.id, true);
        churches.forEach(c => { if (c.id === churchId) hasAccess = true; });
      }

      if (!hasAccess) return this.json({}, 401);
      else {
        const data = await this.repositories.church.loadById(id);
        const church = this.repositories.church.convertToModel(data);

        // This block could be simplified
        if (this.include(req, "permissions")) {
          let universalChurch = null;
          const churches = await this.repositories.rolePermission.loadForUser(au.id, false);
          churches.forEach(c => { if (c.id === "") universalChurch = c; });
          const result = await this.repositories.rolePermission.loadForChurch(id, universalChurch);
          if (result !== null) church.apis = result.apis;
        }

        return church;
      }
    });
  }

  @httpGet("/:id/impersonate")
  public async impersonate(@requestParam("id") id: string, req: express.Request<{}, {}, {}>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const churchId = id.toString();
      const hasAccess = au.checkAccess(Permissions.server.admin) || au.churchId === churchId;

      if (!hasAccess) return this.json({}, 401);
      else {
        const user = await this.repositories.user.load(au.id);

        let universalChurch = null;
        const churches = await this.repositories.rolePermission.loadForUser(au.id, false);
        churches.forEach(c => { if (c.id === "0") universalChurch = c; });
        const result = await this.repositories.rolePermission.loadForChurch(churchId, universalChurch);

        const churchWithAuth = await AuthenticatedUser.login([result], user);

        return churchWithAuth;
      }
    })
  }


  @httpGet("/")
  public async loadForUser(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const churches = await this.repositories.rolePermission.loadForUser(au.id, true)
      return this.json(churches, 200);
    });
  }

  static async validateSave(church: Church, repositories: Repositories) {
    const result: string[] = [];
    if (Utils.isEmpty(church.name)) result.push("Church name required");
    if (Utils.isEmpty(church.subDomain)) result.push("Subdomain required");
    else {
      if (/^([a-z0-9]{1,99})$/.test(church.subDomain) === false) result.push("Please enter only lower case letters and numbers for the subdomain.  Example: firstchurch");
      else {
        const c = await repositories.church.loadBySubDomain(church.subDomain);
        if (c !== null && c.id !== church.id) result.push("Subdomain unavailable");
      }
    }

    return result;
  }


  @httpPost("/")
  public async save(req: express.Request<{}, {}, Church[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.settings.edit)) return this.json({}, 401);
      else {
        const allErrors: string[] = [];
        let churches: Church[] = req.body;
        const promises: Promise<any>[] = [];
        churches.forEach((church) => {
          if (church.id !== au.churchId) return this.json({}, 401);
          else {
            const c: Church = null;
            const p = ChurchController.validateSave(church, this.repositories).then(errors => {
              if (errors.length === 0) promises.push(this.repositories.church.save(church));
              else allErrors.push(...errors);
            });
            promises.push(p);
          }
        });
        churches = await Promise.all(promises);
        if (allErrors.length > 0) return this.json({ errors: allErrors }, 401);
        else return this.json(churches, 200);
      }
    });
  }


  async validateRegister(subDomain: string, email: string) {
    const result: string[] = [];

    // Verify subdomain isn't taken
    if (subDomain !== undefined && subDomain !== null && subDomain !== "") {
      if (/^([a-z0-9]{1,99})$/.test(subDomain) === false) result.push("Please enter only lower case letters and numbers for the subdomain.  Example: firstchurch");
      else {
        const church = await this.repositories.church.loadBySubDomain(subDomain);
        if (church !== null) result.push("Subdomain unavailable");
      }
    }

    const user = await this.repositories.user.loadByEmail(email);
    if (user !== null) result.push("There is already a user registered with this email.  Please login to the ChurchApps.org control panel to manage churches and applications.");


    return result;
  }

  private async createDomainAdminsRole(church: Church, user: User) {
    let role: Role = { churchId: church.id, name: "Domain Admins" };
    role = await this.repositories.role.save(role);

    let roleMember: RoleMember = { churchId: church.id, roleId: role.id, userId: user.id, addedBy: user.id }
    roleMember = await this.repositories.roleMember.save(roleMember);

    const permissions = [];
    permissions.push(new RolePermission(church.id, role.id, "AccessApi", "Users", null, "View"));
    permissions.push(new RolePermission(church.id, role.id, "AccessApi", "Users", null, "Edit"));
    permissions.push(new RolePermission(church.id, role.id, "AccessApi", "Roles", null, "View"));
    permissions.push(new RolePermission(church.id, role.id, "AccessApi", "Roles", null, "Edit"));
    permissions.push(new RolePermission(church.id, role.id, "AccessApi", "RoleMembers", null, "View"));
    permissions.push(new RolePermission(church.id, role.id, "AccessApi", "RoleMembers", null, "Edit"));
    permissions.push(new RolePermission(church.id, role.id, "AccessApi", "RolePermissions", null, "View"));
    permissions.push(new RolePermission(church.id, role.id, "AccessApi", "RolePermissions", null, "Edit"));
    permissions.push(new RolePermission(church.id, role.id, "AccessApi", "Settings", null, "Edit"));
    permissions.push(new RolePermission(church.id, role.id, "MembershipApi", "People", null, "View"));
    permissions.push(new RolePermission(church.id, role.id, "MembershipApi", "People", null, "Edit"));
    permissions.push(new RolePermission(church.id, role.id, "MembershipApi", "Households", null, "Edit"));

    permissions.push(new RolePermission(church.id, null, "MembershipApi", "People", null, "Edit Self"));
    permissions.push(new RolePermission(church.id, null, "AttendanceApi", "Attendance", null, "Checkin"));

    const promises: Promise<any>[] = [];
    permissions.forEach((permission) => promises.push(this.repositories.rolePermission.save(permission)));
    await Promise.all(promises);
  }

  private async createAllMembersRole(church: Church, user: User) {
    let role: Role = { churchId: church.id, name: "All Members" };
    role = await this.repositories.role.save(role);

    let roleMember: RoleMember = { churchId: church.id, roleId: role.id, userId: user.id, addedBy: user.id }
    roleMember = await this.repositories.roleMember.save(roleMember);

    const permissions = [];
    permissions.push(new RolePermission(church.id, role.id, "MembershipApi", "People", null, "View Members"));
    permissions.push(new RolePermission(church.id, null, "MembershipApi", "People", null, "Edit Self"));
    permissions.push(new RolePermission(church.id, null, "AttendanceApi", "Attendance", null, "Checkin"));

    const promises: Promise<any>[] = [];
    permissions.forEach((permission) => promises.push(this.repositories.rolePermission.save(permission)));
    await Promise.all(promises);
  }

  private async addEveryonePermissions(church: Church, user: User) {
    const permissions = [];
    permissions.push(new RolePermission(church.id, null, "MembershipApi", "People", null, "Edit Self"));
    permissions.push(new RolePermission(church.id, null, "AttendanceApi", "Attendance", null, "Checkin"));

    const promises: Promise<any>[] = [];
    permissions.forEach((permission) => promises.push(this.repositories.rolePermission.save(permission)));
    await Promise.all(promises);
  }

  @httpPost("/register", ...churchRegisterValidation)
  public async register(req: express.Request<{}, {}, RegistrationRequest>, res: express.Response): Promise<any> {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({ errors: validationErrors.array() });
      }

      const errors = await this.validateRegister(req.body.subDomain, req.body.email);
      if (errors.length > 0) return this.json({ errors }, 401);
      else {
        const churchCount = await this.repositories.church.loadCount();

        // create the church
        let church: Church = { name: req.body.churchName, subDomain: req.body.subDomain };
        church = await this.repositories.church.save(church);

        // create user if doesn't exist
        let user = await this.repositories.user.loadByEmail(req.body.email);
        if (user === null) {
          const tempPassword = UniqueIdHelper.shortId();
          const hashedPass = bcrypt.hashSync(tempPassword, 10);
          const newUser: User = { email: req.body.email, firstName: req.body.firstName, lastName: req.body.lastName, password: hashedPass };
          user = await this.repositories.user.save(newUser);
          await UserHelper.sendWelcomeEmail(user.email, tempPassword, req.body.appName, req.body.appUrl);
        }

        // Add first user to server admins group
        if (churchCount === 0) {
          this.repositories.role.loadAll().then(roles => {
            this.repositories.roleMember.save({ churchId: church.id, roleId: roles[0].id, userId: user.id, addedBy: user.id });
          })
        }

        // Add AccessManagement App
        let churchApp: ChurchApp = { churchId: church.id, appName: "AccessManagement", registrationDate: new Date() };
        churchApp = await this.repositories.churchApp.save(churchApp);

        await this.createDomainAdminsRole(church, user);
        await this.createAllMembersRole(church, user);
        await this.addEveryonePermissions(church, user);

        const churches = await this.repositories.rolePermission.loadForUser(user.id, true)
        const result = await AuthenticatedUser.login(churches, user);

        if (process.env.EMAIL_ON_REGISTRATION === "true") {
          await EmailHelper.sendEmail({
            from: process.env.SUPPORT_EMAIL,
            to: process.env.SUPPORT_EMAIL,
            subject: "New Church Registration",
            body: church.name
          });
        }



        return this.json(result, 200);
      }
    } catch (e) {
      this.logger.error(e);
      return this.internalServerError(e);
    }
  }

  private async appendLogos(churches: Church[]) {
    const ids = ArrayHelper.getIds(churches, "id");
    const settings = await this.baseRepositories.setting.loadMulipleChurches(["logoSquare"], ids);
    settings.forEach((s: any) => {
      const church = ArrayHelper.getOne(churches, "id", s.churchId);
      if (church.settings === undefined) church.settings = [];
      church.settings.push(s);
    });
  }

  // if both values (churchId and subDomain) are found in body, churchId will have first preference.
  @httpPost("/select")
  public async select(req: express.Request<{}, {}, { churchId: string, subDomain: string }>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      let { churchId } = req.body;
      if (req.body.subDomain && !churchId) {
        const selectedChurch: Church = await this.repositories.church.loadBySubDomain(req.body.subDomain);
        churchId = selectedChurch.id;
      }
      const church = await this.fetchChurchPermissions(au.id, churchId)
      const user = await this.repositories.user.load(au.id);

      const data = await AuthenticatedUser.login([church], user);
      return this.json(data.churches[0], 200);
    })
  }

  private async fetchChurchPermissions(userId: string, churchId: string): Promise<Church> {
    // church includes user role permission and everyone permission.
    const church = await this.repositories.rolePermission.loadUserPermissionInChurch(userId, churchId);

    if (church) return church;

    const everyonePermission = await this.repositories.rolePermission.loadForEveryone(churchId);
    let result: Church = null;
    let currentApi: Api = null;
    everyonePermission.forEach((row: any) => {
      if (result === null) {
        result = { id: row.churchId, subDomain: row.subDomain, name: row.churchName, apis: [] };
        currentApi = null;
      }

      if (currentApi === null || row.apiName !== currentApi.keyName) {
        currentApi = { keyName: row.apiName, permissions: [] };
        result.apis.push(currentApi);
      }

      const permission: RolePermission = { action: row.action, contentId: row.contentId, contentType: row.contentType }
      currentApi.permissions.push(permission);
    });

    return result;
  }

}
