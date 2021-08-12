import { DB } from "../apiBase/db";
import { ChurchApp } from "../models";
import { UniqueIdHelper, MySqlHelper } from "../helpers";
import { ChurchRepository } from "./ChurchRepository";

export class ChurchAppRepository {

  public loadById(id: string) {
    return DB.queryOne("SELECT * FROM churchApps WHERE id=?;", [id]);
  }

  public loadByChurchIdAppName(churchId: string, appName: string) {
    return DB.queryOne("SELECT * FROM churchApps WHERE churchId=? AND appName=?;", [churchId, appName]);
  }

  public loadForChurch(churchId: string) {
    return DB.query("SELECT * FROM churchApps WHERE churchId=? ORDER BY appName", [churchId]).then((rows: ChurchApp[]) => { return rows; });
  }

  public loadForChurches(churchIds: string[]) {
    return DB.query("SELECT * FROM churchApps WHERE churchId IN (" + MySqlHelper.toQuotedAndCommaSeparatedString(churchIds) + ") ORDER BY churchId", []);
  }

  public save(churchApp: ChurchApp) {
    return churchApp.id ? this.update(churchApp) : this.create(churchApp);
  }

  private async create(churchApp: ChurchApp) {
    churchApp.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO churchApps (id, churchId, appName, registrationDate) VALUES (?, ?, ?, NOW());";
    const params = [churchApp.id, churchApp.churchId, churchApp.appName];
    await DB.query(sql, params);
    return churchApp;
  }

  private async update(churchApp: ChurchApp) {
    const sql = "UPDATE churchApps SET churchId=?, appName=? WHERE id=?;";
    const params = [churchApp.churchId, churchApp.appName, churchApp.id];
    await DB.query(sql, params)
    return churchApp;
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
