import { DB } from "../apiBase/db";
import { User } from "../models";
import { UniqueIdHelper } from "../helpers";

export class UserRepository {

  public async save(user: User) {
    if (UniqueIdHelper.isMissing(user.id)) return this.create(user); else return this.update(user);
  }

  public async create(user: User) {
    return DB.query(
      "INSERT INTO users (id, email, password, authGuid, displayName) VALUES (?, ?, ?, ?, ?);",
      [UniqueIdHelper.shortId(), user.email, user.password, user.authGuid, user.displayName]
    ).then((row: any) => { user.id = row.insertId; return user; });
  }

  public async update(user: User) {
    return DB.query(
      "UPDATE users SET email=?, password=?, authGuid=?, displayName=?, registrationDate=?, lastLogin=? WHERE id=?;",
      [user.email, user.password, user.authGuid, user.displayName, user.registrationDate, user.lastLogin, user.id]
    ).then(() => { return user });
  }


  public async load(id: string): Promise<User> {
    return DB.queryOne("SELECT * FROM users WHERE id=?", [id]);
  }

  public async loadByEmail(email: string): Promise<User> {
    return DB.queryOne("SELECT * FROM users WHERE email=?", [email]);
  }

  public async loadByAuthGuid(authGuid: string): Promise<User> {
    return DB.queryOne("SELECT * FROM users WHERE authGuid=?", [authGuid]);
  }

  public async loadByEmailPassword(email: string, hashedPassword: string): Promise<User> {
    return DB.queryOne("SELECT * FROM users WHERE email=? AND password=?", [email, hashedPassword]);
  }

  public async loadByIds(ids: string[]): Promise<User[]> {
    return DB.query("SELECT * FROM users WHERE id IN (?)", [ids]);
  }
}
