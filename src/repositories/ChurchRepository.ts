import { DB } from "../apiBase/db";
import { Church, Api } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ChurchRepository {

  public async loadCount() {
    const data = await DB.queryOne("SELECT COUNT(*) as count FROM churches", []);
    return parseInt(data.count, 0);
  }

  public loadAll() {
    return DB.query("SELECT * FROM churches ORDER BY name", []).then((rows: Church[]) => { return rows; });
  }

  public search(name: string) {
    let query = "SELECT * FROM churches WHERE name like ?";
    const params = ["%" + name.replace(" ", "%") + "%"];
    query += " ORDER BY name";
    return DB.query(query, params).then((rows: Church[]) => { return rows; });
  }

  public loadBySubDomain(subDomain: string) {
    return DB.queryOne("SELECT * FROM churches WHERE subDomain=?;", [subDomain]);
  }

  public loadById(id: string) {
    return DB.queryOne("SELECT * FROM churches WHERE id=?;", [id]);
  }

  public loadByIds(ids: string[]) {
    return DB.query("SELECT * FROM churches WHERE id IN (?) order by name;", [ids]);
  }

  public async loadForUser(userId: string) {
    const sql = "select c.*, uc.personId from userChurches uc "
      + " inner join churches c on c.id=uc.churchId"
      + " where uc.userId=?";
    const rows = await DB.query(sql, [userId]);
    const result: Church[] = [];
    rows.forEach((row: any) => {
      const apis: Api[] = [];
      const addChurch = { id: row.churchId, name: row.churchName, subDomain: row.subDomain, personId: row.personId, apis };
      result.push(addChurch);
    });
    return rows;

  }

  public save(church: Church) {
    return church.id ? this.update(church) : this.create(church);
  }

  private async create(church: Church) {
    church.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO churches (id, name, subDomain, registrationDate, address1, address2, city, state, zip, country) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?);";
    const params = [church.id, church.name, church.subDomain, church.address1, church.address2, church.city, church.state, church.zip, church.country]
    await DB.query(sql, params);
    return church;
  }

  private async update(church: Church) {
    const sql = "UPDATE churches SET name=?, subDomain=?, address1=?, address2=?, city=?, state=?, zip=?, country=? WHERE id=?;";
    const params = [church.name, church.subDomain, church.address1, church.address2, church.city, church.state, church.zip, church.country, church.id]
    await DB.query(sql, params);
    return church;
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
