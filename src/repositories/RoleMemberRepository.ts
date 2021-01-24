import { DB } from "../apiBase/db";
import { RoleMember } from "../models";

export class RoleMemberRepository {

    public async save(roleMember: RoleMember) {
        if (roleMember.id > 0) return this.update(roleMember); else return this.create(roleMember);
    }

    public async create(roleMember: RoleMember) {
        return DB.query(
            "INSERT INTO roleMembers (churchId, roleId, userId, dateAdded, addedBy) VALUES (?, ?, ?, NOW(), ?);",
            [roleMember.churchId, roleMember.roleId, roleMember.userId, roleMember.addedBy]
        ).then((row: any) => { roleMember.id = row.insertId; return roleMember; });
    }

    public async update(roleMember: RoleMember) {
        return DB.query(
            "UPDATE roleMembers SET roleId=?, userId=?, dateAdded=?, addedBy=? WHERE id=? AND churchId=?",
            [roleMember.roleId, roleMember.userId, roleMember.dateAdded, roleMember.addedBy, roleMember.id, roleMember.churchId]
        ).then(() => { return roleMember });
    }

    public async loadByRoleId(roleId: number, churchId: number): Promise<RoleMember[]> {
        return DB.query("SELECT * FROM roleMembers WHERE roleId=? AND churchId=?", [roleId, churchId]);
    }

    public async loadById(id: number, churchId: number): Promise<RoleMember> {
        return DB.queryOne("SELECT * FROM roleMembers WHERE id=? AND churchId=?", [id, churchId]);
    }

    public async delete(id: number, churchId: number): Promise<RoleMember> {
        return DB.query("DELETE FROM roleMembers WHERE id=? AND churchId=?", [id, churchId]);
    }

    public async deleteForRole(churchId: number, roleId: number) {
        const sql = "DELETE FROM roleMembers WHERE churchId=? AND roleId=?"
        const params = [churchId, roleId];
        return DB.query(sql, params);
    }

}
