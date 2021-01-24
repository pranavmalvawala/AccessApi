import { DB } from "../apiBase/db";
import { RolePermission, Church, Api } from "../models";

export class RolePermissionRepository {

    public async save(rolePermission: RolePermission) {
        if (rolePermission.id > 0) return this.update(rolePermission); else return this.create(rolePermission);
    }

    public async create(rolePermission: RolePermission) {
        return DB.query(
            "INSERT INTO rolePermissions (churchId, roleId, apiName, contentType, contentId, action) VALUES (?, ?, ?, ?, ?, ?);",
            [rolePermission.churchId, rolePermission.roleId, rolePermission.apiName, rolePermission.contentType, rolePermission.contentId, rolePermission.action]
        ).then((row: any) => { rolePermission.id = row.insertId; return rolePermission; });
    }

    public async update(rolePermission: RolePermission) {
        return DB.query(
            "UPDATE rolePermissions SET roleId=?, apiName=?, contentType=?, contentId=?, action=? WHERE id=? AND churchId=?",
            [rolePermission.roleId, rolePermission.apiName, rolePermission.contentType, rolePermission.contentId, rolePermission.action, rolePermission.id, rolePermission.churchId]
        ).then(() => { return rolePermission });
    }

    public async deleteForRole(churchId: number, roleId: number) {
        const sql = "DELETE FROM rolePermissions WHERE churchId=? AND roleId=?"
        const params = [churchId, roleId];
        return DB.query(sql, params);
    }

    public async delete(churchId: number, id: number) {
        const sql = "DELETE FROM rolePermissions WHERE churchId=? AND id=?"
        const params = [churchId, id];
        return DB.query(sql, params);
    }


    public async loadForUser(userId: number, removeUniversal: boolean): Promise<Church[]> {

        const query = "SELECT c.name AS churchName, r.churchId, c.subDomain, rp.apiName, rp.contentType, rp.contentId, rp.action"
            + " FROM roleMembers rm"
            + " INNER JOIN roles r on r.id=rm.roleId"
            + " INNER JOIN rolePermissions rp on rp.roleId=r.id"
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

    public async loadForChurch(churchId: number, univeralChurch: Church): Promise<Church> {
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
        if (churches.length < 2 || churches[0].id > 0) return false;
        for (let i = 1; i < churches.length; i++) {
            churches[i].apis.forEach(api => {
                churches[0].apis.forEach(universalApi => {
                    if (universalApi.keyName === api.keyName) universalApi.permissions.forEach(perm => { api.permissions.push(perm) });
                });
            });
        }
        return true;
    }

    public async loadByRoleId(churchId: number, roleId: number): Promise<RolePermission[]> {
        return DB.query("SELECT * FROM rolePermissions WHERE churchId=? AND roleId=?", [churchId, roleId]);
    }

}
