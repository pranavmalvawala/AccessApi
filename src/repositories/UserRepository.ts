import { DB } from "../apiBase/db";
import { User } from "../models";

export class UserRepository {

  public async save(user: User) {
    if (user.id > 0) return this.update(user); else return this.create(user);
  }

  public async create(user: User) {
    return DB.query(
      "INSERT INTO users (email, password, authGuid, displayName) VALUES (?, ?, ?, ?);",
      [user.email, user.password, user.authGuid, user.displayName]
    ).then((row: any) => { user.id = row.insertId; return user; });
  }

  public async update(user: User) {
    return DB.query(
      "UPDATE users SET email=?, password=?, authGuid=?, displayName=?, registrationDate=?, lastLogin=? WHERE id=?;",
      [user.email, user.password, user.authGuid, user.displayName, user.registrationDate, user.lastLogin, user.id]
    ).then(() => { return user });
  }


  public async load(id: number): Promise<User> {
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

  public async loadByIds(ids: number[]): Promise<User[]> {
    return DB.query("SELECT * FROM users WHERE id IN (?)", [ids]);
  }
}
