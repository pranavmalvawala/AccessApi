import { DB } from "../apiBase/db";
import { ChurchApp } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ChurchAppRepository {

    public async loadById(id: string) {
        return DB.queryOne("SELECT * FROM churchApps WHERE id=?;", [id]);
    }

    public async loadByChurchIdAppName(churchId: string, appName: string) {
        return DB.queryOne("SELECT * FROM churchApps WHERE churchId=? AND appName=?;", [churchId, appName]);
    }

    public async loadForChurch(churchId: string) {
        return DB.query("SELECT * FROM churchApps WHERE churchId=? ORDER BY appName", [churchId]).then((rows: ChurchApp[]) => { return rows; });
    }

    public async save(churchApp: ChurchApp) {
        if (UniqueIdHelper.isMissing(churchApp.id)) return this.create(churchApp); else return this.update(churchApp);
    }

    public async create(churchApp: ChurchApp) {
        churchApp.id = UniqueIdHelper.shortId();
        const sql = "INSERT INTO churchApps (id, churchId, appName, registrationDate) VALUES (?, ?, ?, NOW());";
        const params = [churchApp.id, churchApp.churchId, churchApp.appName];
        return DB.query(sql, params).then((row: any) => { return churchApp; });
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
