import { DB } from "../apiBase/db";
import { RolePermission, Church, Api } from "../models";
import { UniqueIdHelper } from "../helpers";

export class RolePermissionRepository {

    public save(rolePermission: RolePermission) {
        if (UniqueIdHelper.isMissing(rolePermission.id)) return this.create(rolePermission); else return this.update(rolePermission);
    }

    public async create(rolePermission: RolePermission) {
        rolePermission.id = UniqueIdHelper.shortId();
        const sql = "INSERT INTO rolePermissions (id, churchId, roleId, apiName, contentType, contentId, action) VALUES (?, ?, ?, ?, ?, ?, ?);";
        const params = [rolePermission.id, rolePermission.churchId, rolePermission.roleId, rolePermission.apiName, rolePermission.contentType, rolePermission.contentId, rolePermission.action];
        await DB.query(sql, params);
        return rolePermission;
    }

    public async update(rolePermission: RolePermission) {
        const sql = "UPDATE rolePermissions SET roleId=?, apiName=?, contentType=?, contentId=?, action=? WHERE id=? AND churchId=?";
        const params = [rolePermission.roleId, rolePermission.apiName, rolePermission.contentType, rolePermission.contentId, rolePermission.action, rolePermission.id, rolePermission.churchId];
        await DB.query(sql, params);
        return rolePermission;
    }

    public deleteForRole(churchId: string, roleId: string) {
        const sql = "DELETE FROM rolePermissions WHERE churchId=? AND roleId=?"
        const params = [churchId, roleId];
        return DB.query(sql, params);
    }

    public delete(churchId: string, id: string) {
        const sql = "DELETE FROM rolePermissions WHERE churchId=? AND id=?"
        const params = [churchId, id];
        return DB.query(sql, params);
    }


    public async loadForUser(userId: string, removeUniversal: boolean): Promise<Church[]> {

        const query = "SELECT c.name AS churchName, r.churchId, c.subDomain, rp.apiName, rp.contentType, rp.contentId, rp.action"
            + " FROM roleMembers rm"
            + " INNER JOIN roles r on r.id=rm.roleId"
            + " INNER JOIN rolePermissions rp on (rp.roleId=r.id or (rp.roleId IS NULL AND rp.churchId=rm.churchId))"
            + " LEFT JOIN churches c on c.id=r.churchId"
            + " WHERE rm.userId=?"
            + " GROUP BY c.name, r.churchId, rp.apiName, rp.contentType, rp.contentId, rp.action"
            + " ORDER BY c.name, r.churchId, rp.apiName, rp.contentType, rp.contentId, rp.action";
        const data = await DB.query(query, [userId]);

        const result: Church[] = [];
        let currentChurch: Church = null;
        let currentApi: Api = null;
        data.forEach((row: any) => {
            if (currentChurch === null || row.churchId !== currentChurch.id) {
                currentChurch = { id: row.churchId, name: row.churchName, subDomain: row.subDomain, apis: [] };
                result.push(currentChurch);
                currentApi = null;
            }
            if (currentApi === null || row.apiName !== currentApi.keyName) {
                currentApi = { keyName: row.apiName, permissions: [] };
                currentChurch.apis.push(currentApi);
            }

            const permission: RolePermission = { action: row.action, contentId: row.contentId, contentType: row.contentType }
            currentApi.permissions.push(permission);
        });

        if (this.applyUniversal(result) && removeUniversal) result.splice(0, 1);
        return result;
    }

    public async loadForChurch(churchId: string, univeralChurch: Church): Promise<Church> {
        const query = "SELECT c.name AS churchName, r.churchId, c.subDomain, rp.apiName, rp.contentType, rp.contentId, rp.action"
            + " FROM roles r"
            + " INNER JOIN rolePermissions rp on rp.roleId=r.id"
            + " LEFT JOIN churches c on c.id=r.churchId"
            + " WHERE c.id=?"
            + " GROUP BY c.name, r.churchId, rp.apiName, rp.contentType, rp.contentId, rp.action"
            + " ORDER BY c.name, r.churchId, rp.apiName, rp.contentType, rp.contentId, rp.action";
        const data = await DB.query(query, [churchId])
        let result: Church = null;
        let currentApi: Api = null;
        data.forEach((row: any) => {
            if (result === null) {
                result = { id: row.churchId, subDomain: row.subDomain, name: row.churchName, apis: [] };
                currentApi = null;
            }

            if (currentApi === null || row.apiName !== currentApi.keyName) {
                currentApi = { keyName: row.apiName, permissions: [] };
                result.apis.push(currentApi);

                // Apply universal permissions
                if (univeralChurch !== null) univeralChurch.apis.forEach(universalApi => { if (universalApi.keyName === currentApi.keyName) universalApi.permissions.forEach(perm => { currentApi.permissions.push(perm) }); });
            }

            const permission: RolePermission = { action: row.action, contentId: row.contentId, contentType: row.contentType }
            currentApi.permissions.push(permission);
        });
        return result;
    }

    // Apply site admin priviledges that aren't tied to a specific church.
    private applyUniversal(churches: Church[]) {
        if (churches.length < 2 || churches[0].id !== "0") return false;
        for (let i = 1; i < churches.length; i++) {
            churches[i].apis.forEach(api => {
                churches[0].apis.forEach(universalApi => {
                    if (universalApi.keyName === api.keyName) universalApi.permissions.forEach(perm => { api.permissions.push(perm) });
                });
            });
        }
        return true;
    }

    public loadByRoleId(churchId: string, roleId: string): Promise<RolePermission[]> {
        return DB.query("SELECT * FROM rolePermissions WHERE churchId=? AND roleId=?", [churchId, roleId]);
    }

    // permissions applied to all the members of church
    public loadForEveryone(churchId: string) {
        return DB.query("SELECT * FROM rolePermissions WHERE churchId=? AND roleId IS NULL", [churchId]);
    }

}
