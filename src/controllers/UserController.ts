import { controller, httpPost } from "inversify-express-utils";
import express from "express";
import bcrypt from "bcryptjs";
import { LoginRequest, SwitchAppRequest, User, ResetPasswordRequest, LoadCreateUserRequest, Church } from "../models";
import { AuthenticatedUser } from "../auth";
import { AccessBaseController } from "./AccessBaseController"
import { EmailHelper } from "../helpers";
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
          if (!bcrypt.compareSync(req.body.password, user.password)) user = null;
        }
      }

      if (user === null) return this.denyAccess(["Login failed"]);
      else {
        const churches = await this.repositories.rolePermission.loadForUser(user.id, false)
        const result = await AuthenticatedUser.login(churches, user);
        if (result === null) return this.denyAccess(["No permissions"]);
        else return this.json(result, 200);
      }
    } catch (e) {
      this.logger.error(e);
      return this.error([e.toString()]);
    }
  }

  private async grantAdminAccess(churches: Church[], churchId: number) {
    let universalChurch = null;
    churches.forEach(c => { if (c.id === 0) universalChurch = c; });

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
      let user = await this.repositories.user.loadByEmail(req.body.userEmail);
      if (user === null) {
        user = { email: req.body.userEmail, displayName: req.body.userName }
        user.registrationDate = new Date();
        user.lastLogin = user.registrationDate;
        user.authGuid = v4();
        user = await this.repositories.user.save(user);
        const emailBody = req.body.body.replace(/{auth}/g, user.authGuid);
        await EmailHelper.sendEmail(req.body.fromEmail, user.email, req.body.subject, emailBody);
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
        const emailBody = req.body.body.replace(/{auth}/g, user.authGuid);

        const promises = [];
        promises.push(this.repositories.user.save(user));
        promises.push(EmailHelper.sendEmail(req.body.fromEmail, user.email, req.body.subject, emailBody));
        await Promise.all(promises);
        return this.json({ emailed: true }, 200);
      }
    } catch (e) {
      this.logger.error(e);
      return this.error([e.toString()]);
    }
  }


  @httpPost("/setDisplayName")
  public async setDisplayName(req: express.Request<{}, {}, { displayName: string }>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      let user = await this.repositories.user.load(au.id);
      if (user !== null) {
        user.displayName = req.body.displayName;
        user = await this.repositories.user.save(user);
      }
      user.password = null;
      return this.json(user, 200);
    });
  }

  @httpPost("/updateEmail")
  public async updateEmail(req: express.Request<{}, {}, { email: string }>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      let user = await this.repositories.user.load(au.id);
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


}
