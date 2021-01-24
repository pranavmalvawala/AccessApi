import { DB } from "../apiBase/db";
import { Permission } from "../models";

export class PermissionRepository {
    public async loadForApp(appName: string): Promise<Permission[]> {
        return DB.query("SELECT * FROM permissions WHERE apiName IN (SELECT apiName from applicationApis WHERE applicationName=?) ORDER BY apiName, displaySection, displayAction", [appName])
            .then((rows: Permission[]) => { return rows; });
    }

}
