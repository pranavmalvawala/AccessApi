import { DB } from "../apiBase/db";
import { Role } from "../models";

export class RoleRepository {

    public async save(role: Role) {
        if (role.id > 0) return this.update(role); else return this.create(role);
    }

    public async create(role: Role) {
        return DB.query(
            "INSERT INTO roles (churchId, appName, name) VALUES (?, ?, ?);",
            [role.churchId, role.appName, role.name]
        ).then((row: any) => { role.id = row.insertId; return role; });
    }

    public async update(role: Role) {
        return DB.query(
            "UPDATE roles SET appName=?, name=? WHERE id=?",
            [role.appName, role.name, role.id]
        ).then(() => { return role });
    }

    public async delete(churchId: number, id: number) {
        const sql = "DELETE FROM roles WHERE id=? AND churchId=?"
        const params = [id, churchId];
        return DB.query(sql, params);
    }

    public async loadById(churchId: number, id: number) {
        return DB.queryOne(
            "SELECT * FROM roles WHERE churchId=? AND id=?",
            [churchId, id]
        ).then((row: Role) => { return row });
    }

    public async loadByIds(ids: number[]) {
        return DB.query(
            "SELECT * FROM roles WHERE id IN (?)",
            [ids]
        ).then((rows: Role[]) => { return rows; });
    }

    public async loadByAppName(appName: string, churchId: number) {
        return DB.query(
            "SELECT * FROM roles WHERE appName=? and churchId=?",
            [appName, churchId]
        ).then((rows: Role[]) => { return rows; });
    }




}
