import { controller, httpPost, httpGet, requestParam, httpDelete } from "inversify-express-utils";
import { RolePermission } from "../models";
import express from "express";
import { AccessBaseController } from "./AccessBaseController"
import { AuthenticatedUser } from '../auth';
import { Permissions, IPermission } from '../helpers'

@controller("/rolepermissions")
export class RolePermissionController extends AccessBaseController {

    @httpGet("/roles/:id")
    public async loadByRole(@requestParam("id") id: number, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            const permissions = await this.repositories.rolePermission.loadByRoleId(au.churchId, id);
            const hasAccess = await this.checkAccess(permissions, Permissions.rolePermissions.view, au);
            if (!hasAccess) return this.json({}, 401);
            else {
                return this.json(permissions, 200);
            }
        });
    }

    @httpDelete("/:id")
    public async deletePermission(@requestParam("id") id: number, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.rolePermissions.edit)) return this.json({}, 401);
            else {
                await this.repositories.rolePermission.delete(au.churchId, id)
                return this.json([], 200);
            }
        });
    }


    @httpPost("/")
    public async save(req: express.Request<{}, {}, RolePermission[]>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.rolePermissions.edit)) return this.json({}, 401);
            else {
                let rolePermissions: RolePermission[] = req.body;
                const promises: Promise<RolePermission>[] = [];
                rolePermissions.forEach((rolePermission) => {
                    rolePermission.churchId = au.churchId
                    promises.push(this.repositories.rolePermission.save(rolePermission));
                });
                rolePermissions = await Promise.all(promises);
                return this.json(rolePermissions, 200);
            }
        });
    }


    private async checkAccess(permissions: RolePermission[], permission: IPermission, au: AuthenticatedUser) {
        const hasAccess = au.checkAccess(permission);
        /*
        if (hasAccess) {
            const roleIds: number[] = [];
            permissions.forEach(p => { if (roleIds.indexOf(p.roleId) === -1) roleIds.push(p.roleId); })
            if (roleIds.length > 0) {
                const roles = await this.repositories.role.loadByIds(roleIds);
                roles.forEach(r => { if (r.appName !== au.appName) hasAccess = false; })
            }
        }*/
        return hasAccess;
    }

}