import { DB } from "../apiBase/db";
import { Church } from "../models";

export class ChurchRepository {
  public async loadAll() {
    return DB.query("SELECT * FROM churches ORDER BY name", []).then((rows: Church[]) => { return rows; });
  }

  public async search(name: string, app: string) {
    let query = "SELECT * FROM churches WHERE name like ?";
    const params = ["%" + name.replace(" ", "%") + "%"];
    if (app !== undefined && app !== "") {
      query += " AND id in (SELECT churchId from churchApps WHERE appName=?)";
      params.push(app);
    }
    query += " ORDER BY name";
    return DB.query(query, params).then((rows: Church[]) => { return rows; });
  }

  public async loadBySubDomain(subDomain: string) {
    return DB.queryOne("SELECT * FROM churches WHERE subDomain=?;", [subDomain]);
  }

  public async loadById(id: number) {
    return DB.queryOne("SELECT * FROM churches WHERE id=?;", [id]);
  }

  public async save(church: Church) {
    if (church.id > 0) return this.update(church); else return this.create(church);
  }

  public async create(church: Church) {
    const sql = "INSERT INTO churches (name, subDomain, registrationDate, address1, address2, city, state, zip, country) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?);";
    const params = [church.name, church.subDomain, church.address1, church.address2, church.city, church.state, church.zip, church.country]
    return DB.query(sql, params).then((row: any) => { church.id = row.insertId; return church; });
  }

  public async update(church: Church) {
    const sql = "UPDATE churches SET name=?, subDomain=?, address1=?, address2=?, city=?, state=?, zip=?, country=? WHERE id=?;";
    const params = [church.name, church.subDomain, church.address1, church.address2, church.city, church.state, church.zip, church.country, church.id]
    return DB.query(sql, params).then(() => { return church });
  }


  public convertToModel(data: any) {
    const result: Church = { id: data.id, name: data.name, address1: data.address1, address2: data.address2, city: data.city, state: data.state, zip: data.zip, country: data.country, registrationDate: data.registrationDate, subDomain: data.subDomain };
    return result;
  }

  public convertAllToModel(data: any[]) {
    const result: Church[] = [];
    data.forEach(d => result.push(this.convertToModel(d)));
    return result;
  }


}
