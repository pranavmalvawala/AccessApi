import { DB } from "../apiBase/db";
import { User } from "../models";
import { UniqueIdHelper, DateTimeHelper } from "../helpers";

export class UserRepository {

  public save(user: User) {
    return user.id ? this.update(user) : this.create(user);
  }

  private async create(user: User) {
    user.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO users (id, email, password, authGuid, displayName) VALUES (?, ?, ?, ?, ?);";
    const params = [user.id, user.email, user.password, user.authGuid, user.displayName];
    await DB.query(sql, params);
    return user;
  }

  private async update(user: User) {
    const registrationDate = DateTimeHelper.toMysqlDate(user.registrationDate);
    const lastLogin = DateTimeHelper.toMysqlDate(user.lastLogin);
    const sql = "UPDATE users SET email=?, password=?, authGuid=?, displayName=?, registrationDate=?, lastLogin=? WHERE id=?;";
    const params = [user.email, user.password, user.authGuid, user.displayName, registrationDate, lastLogin, user.id];
    await DB.query(sql, params);
    return user;
  }


  public load(id: string): Promise<User> {
    return DB.queryOne("SELECT * FROM users WHERE id=?", [id]);
  }

  public loadByEmail(email: string): Promise<User> {
    return DB.queryOne("SELECT * FROM users WHERE email=?", [email]);
  }

  public loadByAuthGuid(authGuid: string): Promise<User> {
    return DB.queryOne("SELECT * FROM users WHERE authGuid=?", [authGuid]);
  }

  public loadByEmailPassword(email: string, hashedPassword: string): Promise<User> {
    return DB.queryOne("SELECT * FROM users WHERE email=? AND password=?", [email, hashedPassword]);
  }

  public loadByIds(ids: string[]): Promise<User[]> {
    return DB.query("SELECT * FROM users WHERE id IN (?)", [ids]);
  }

}
