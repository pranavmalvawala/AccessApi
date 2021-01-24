import { DB } from "../apiBase/db";
import { ChurchApp } from "../models";

export class ChurchAppRepository {

    public async loadById(id: number) {
        return DB.queryOne("SELECT * FROM churchApps WHERE id=?;", [id]);
    }

    public async loadByChurchIdAppName(churchId: number, appName: string) {
        return DB.queryOne("SELECT * FROM churchApps WHERE churchId=? AND appName=?;", [churchId, appName]);
    }

    public async loadForChurch(churchId: number) {
        return DB.query("SELECT * FROM churchApps WHERE churchId=? ORDER BY appName", [churchId]).then((rows: ChurchApp[]) => { return rows; });
    }

    public async save(churchApp: ChurchApp) {
        if (churchApp.id > 0) return this.update(churchApp); else return this.create(churchApp);
    }

    public async create(churchApp: ChurchApp) {
        const sql = "INSERT INTO churchApps (churchId, appName, registrationDate) VALUES (?, ?, NOW());";
        const params = [churchApp.churchId, churchApp.appName];
        return DB.query(sql, params).then((row: any) => { churchApp.id = row.insertId; return churchApp; });
    }

    public async update(churchApp: ChurchApp) {
        const sql = "UPDATE churchApps SET churchId=?, appName=? WHERE id=?;";
        const params = [churchApp.churchId, churchApp.appName, churchApp.id]
        return DB.query(sql, params).then(() => { return churchApp });
    }

    public convertToModel(data: any) {
        const result: ChurchApp = { id: data.id, churchId: data.churchId, appName: data.appName, registrationDate: data.registrationDate };
        return result;
    }

    public convertAllToModel(data: any[]) {
        const result: ChurchApp[] = [];
        data.forEach(d => result.push(this.convertToModel(d)));
        return result;
    }

}
