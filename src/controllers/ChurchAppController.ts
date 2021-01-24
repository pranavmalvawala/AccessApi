import { controller, httpPost, httpGet } from "inversify-express-utils";
import { Role, RoleMember, RolePermission, ChurchApp } from "../models";
import express from "express";
import { AccessBaseController } from "./AccessBaseController"
import { AuthenticatedUser } from "../auth";

@controller("/churchApps")
export class ChurchAppController extends AccessBaseController {

    @httpGet("/")
    public async loadAll(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            const data = await this.repositories.churchApp.loadForChurch(au.churchId);
            const apps = this.repositories.churchApp.convertAllToModel(data);
            return apps;
        });
    }


    async validateRegister(churchId: number, appName: string) {
        const result: string[] = [];
        // Verify access - Need to add a role.
        if (true) {
            const app = await this.repositories.application.loadByKeyName(appName);
            if (app === null) result.push("Invalid app name");
            else {
                const churchApp = await this.repositories.churchApp.loadByChurchIdAppName(churchId, appName);
                if (churchApp !== null) result.push("App already registered");
            }
        }

        return result;
    }

    @httpPost("/register")
    public async register(req: express.Request<{}, {}, { appName: string }>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            const errors = await this.validateRegister(au.churchId, req.body.appName);
            if (errors.length > 0) return this.denyAccess(errors);
            else {
                let churchApp: ChurchApp = { churchId: au.churchId, appName: req.body.appName }
                churchApp = await this.repositories.churchApp.save(churchApp);

                let role: Role = { appName: req.body.appName, churchId: au.churchId, name: "Administrators" };
                role = await this.repositories.role.save(role);

                let member: RoleMember = { churchId: au.churchId, addedBy: au.churchId, roleId: role.id, userId: au.id };
                member = await this.repositories.roleMember.save(member);

                const permissionPromises: Promise<RolePermission>[] = [];
                const permissions = await this.repositories.permission.loadForApp(req.body.appName);
                permissions.forEach(p => {
                    const rp: RolePermission = { roleId: role.id, churchId: au.churchId, contentType: p.section, action: p.action, apiName: p.apiName };
                    permissionPromises.push(this.repositories.rolePermission.save(rp));
                });
                await Promise.all(permissionPromises);

                const church = await this.repositories.rolePermission.loadForChurch(au.churchId, null);
                const user = await this.repositories.user.load(au.id);
                const resp = await AuthenticatedUser.login([church], user);
                return resp;
            }
        });
    }


}
