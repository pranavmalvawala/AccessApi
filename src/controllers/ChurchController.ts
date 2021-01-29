import { controller, httpPost, httpGet, interfaces, requestParam } from "inversify-express-utils";
import { RegistrationRequest, Church, Role, RoleMember, RolePermission, User, ChurchApp } from "../models";
import express from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedUser } from '../auth';
import { AccessBaseController } from "./AccessBaseController"
import { Utils, Permissions } from "../helpers";
import { Repositories } from "../repositories";

@controller("/churches")
export class ChurchController extends AccessBaseController {

  @httpGet("/all")
  public async loadAll(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.server.admin)) return this.json({}, 401);
      const data = await this.repositories.church.loadAll();
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
        result = { id: church.id };
      } else if (req.query.id !== undefined) {
        const data = await this.repositories.church.loadById(parseInt(req.query.id.toString(), 0));
        const church = this.repositories.church.convertToModel(data);
        result = { subDomain: church.subDomain };
      }
      return this.json(result, 200);
    } catch (e) {
      this.logger.error(e);
      return this.internalServerError(e);
    }
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: number, req: express.Request<{}, {}, RegistrationRequest>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const churchId = parseInt(id.toString(), 0); // I think it's a float coming in and the comparisons fail.
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
          churches.forEach(c => { if (c.id === 0) universalChurch = c; });
          const result = await this.repositories.rolePermission.loadForChurch(id, universalChurch);
          if (result !== null) church.apis = result.apis;
        }

        return church;
      }
    });
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
      const c = await repositories.church.loadBySubDomain(church.subDomain);
      if (c !== null && c.id !== church.id) result.push("Subdomain unavailable");
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
      const church = await this.repositories.church.loadBySubDomain(subDomain);
      if (church !== null) result.push("Subdomain unavailable");
    }

    // Verify user doesn't exist
    const user = await this.repositories.user.loadByEmail(email);
    if (user !== null) result.push("User already registered");

    return result;
  }

  @httpPost("/register")
  public async register(req: express.Request<{}, {}, RegistrationRequest>, res: express.Response): Promise<any> {
    try {
      const errors = await this.validateRegister(req.body.subDomain, req.body.email);
      if (errors.length > 0) return this.json({ errors }, 401);
      else {

        // create the church
        let church: Church = { name: req.body.churchName, subDomain: req.body.subDomain };
        church = await this.repositories.church.save(church);

        // create or get the user
        const hashedPass = bcrypt.hashSync(req.body.password, 10);
        const userUUID = uuidv4();
        let user: User = { email: req.body.email, displayName: req.body.displayName, password: hashedPass, authGuid: userUUID };
        user = await this.repositories.user.save(user);

        // Add AccessManagement App
        let churchApp: ChurchApp = { churchId: church.id, appName: "AccessManagement", registrationDate: new Date() };
        churchApp = await this.repositories.churchApp.save(churchApp);

        // create Super Admins role
        let role: Role = { churchId: church.id, appName: "AccessManagement", name: "Domain Admins" };
        role = await this.repositories.role.save(role);

        // add user to role
        let roleMember: RoleMember = { churchId: church.id, roleId: role.id, userId: user.id, addedBy: user.id }
        roleMember = await this.repositories.roleMember.save(roleMember);

        // grant role permissions
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

        const promises: Promise<any>[] = [];
        permissions.forEach((permission) => promises.push(this.repositories.rolePermission.save(permission)));
        await Promise.all(promises);

        const churches = await this.repositories.rolePermission.loadForUser(user.id, true)
        const result = await AuthenticatedUser.login(churches, user);
        return this.json(result, 200);
      }
    } catch (e) {
      this.logger.error(e);
      return this.internalServerError(e);
    }
  }
}
