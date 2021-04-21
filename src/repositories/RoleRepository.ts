import { DB } from "../apiBase/db";
import { Role } from "../models";
import { UniqueIdHelper } from "../helpers";

export class RoleRepository {

    public async save(role: Role) {
        if (UniqueIdHelper.isMissing(role.id)) return this.create(role); else return this.update(role);
    }

    public async create(role: Role) {
        role.id = UniqueIdHelper.shortId();
        return DB.query(
            "INSERT INTO roles (id, churchId, name) VALUES (?, ?, ?);",
            [role.id, role.churchId, role.name]
        ).then(() => { return role; });
    }

    public async update(role: Role) {
        return DB.query(
            "UPDATE roles SET name=? WHERE id=?",
            [role.name, role.id]
        ).then(() => { return role });
    }

    public async delete(churchId: string, id: string) {
        const sql = "DELETE FROM roles WHERE id=? AND churchId=?"
        const params = [id, churchId];
        return DB.query(sql, params);
    }

    public async loadById(churchId: string, id: string) {
        return DB.queryOne(
            "SELECT * FROM roles WHERE churchId=? AND id=?",
            [churchId, id]
        ).then((row: Role) => { return row });
    }

    public async loadByIds(ids: string[]) {
        return DB.query(
            "SELECT * FROM roles WHERE id IN (?)",
            [ids]
        ).then((rows: Role[]) => { return rows; });
    }

    public async loadByAppName(appName: string, churchId: string) {
        return DB.query(
            "SELECT * FROM roles WHERE appName=? and churchId=?",
            [appName, churchId]
        ).then((rows: Role[]) => { return rows; });
    }

    public async loadAll() {
        return DB.query("SELECT * FROM roles", []).then((rows: Role[]) => { return rows; });
    }

    public async loadByChurchId(id: string) {
        return DB.query("SELECT * FROM roles WHERE churchId=?", [id]).then((rows: Role[]) => rows);
    }

    public convertToModel(churchId: string, data: any) {
        const result: Role = { id: data.id, churchId: data.churchId, name: data.name }
        return result;
    }

    public async convertAllToModel(churchId: string, data: any[]) {
        const result: Role[] = [];
        data.forEach(r => result.push(this.convertToModel(churchId, r)));
        return result;
    }

}
