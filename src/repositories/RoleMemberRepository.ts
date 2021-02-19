import { DB } from "../apiBase/db";
import { RoleMember } from "../models";
import { UniqueIdHelper } from "../helpers";

export class RoleMemberRepository {

    public async save(roleMember: RoleMember) {
        if (UniqueIdHelper.isMissing(roleMember.id)) return this.create(roleMember); else return this.update(roleMember);
    }

    public async create(roleMember: RoleMember) {
        roleMember.id = UniqueIdHelper.shortId();
        return DB.query(
            "INSERT INTO roleMembers (id, churchId, roleId, userId, dateAdded, addedBy) VALUES (?, ?, ?, ?, NOW(), ?);",
            [roleMember.id, roleMember.churchId, roleMember.roleId, roleMember.userId, roleMember.addedBy]
        ).then((row: any) => { return roleMember; });
    }

    public async update(roleMember: RoleMember) {
        return DB.query(
            "UPDATE roleMembers SET roleId=?, userId=?, dateAdded=?, addedBy=? WHERE id=? AND churchId=?",
            [roleMember.roleId, roleMember.userId, roleMember.dateAdded, roleMember.addedBy, roleMember.id, roleMember.churchId]
        ).then(() => { return roleMember });
    }

    public async loadByRoleId(roleId: string, churchId: string): Promise<RoleMember[]> {
        return DB.query("SELECT * FROM roleMembers WHERE roleId=? AND churchId=?", [roleId, churchId]);
    }

    public async loadById(id: string, churchId: string): Promise<RoleMember> {
        return DB.queryOne("SELECT * FROM roleMembers WHERE id=? AND churchId=?", [id, churchId]);
    }

    public async delete(id: string, churchId: string): Promise<RoleMember> {
        return DB.query("DELETE FROM roleMembers WHERE id=? AND churchId=?", [id, churchId]);
    }

    public async deleteForRole(churchId: string, roleId: string) {
        const sql = "DELETE FROM roleMembers WHERE churchId=? AND roleId=?"
        const params = [churchId, roleId];
        return DB.query(sql, params);
    }

}
