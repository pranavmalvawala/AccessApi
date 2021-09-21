import { DB } from "../apiBase/db";
import { Permission } from "../models";

export class PermissionRepository {
    public loadAll(): Promise<Permission[]> {
        return DB.query("SELECT * FROM permissions ORDER BY apiName, displaySection, displayAction", [])
            .then((rows: Permission[]) => { return rows; });
    }

}
