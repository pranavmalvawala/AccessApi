import { DB } from "../apiBase/db";
import { Application } from "../models";

export class ApplicationRepository {
    public async loadAll() {
        return DB.query("SELECT * FROM applications ORDER BY name", []).then((rows: Application[]) => { return rows; });
    }

    public async loadByKeyName(keyName: string) {
        return DB.queryOne("SELECT * FROM applications WHERE keyName=?", [keyName]).then((row: Application) => { return row; });
    }


    public convertToModel(data: any) {
        const result: Application = { id: data.id, name: data.name, keyName: data.keyName };
        return result;
    }

    public convertAllToModel(data: any[]) {
        const result: Application[] = [];
        data.forEach(d => result.push(this.convertToModel(d)));
        return result;
    }


}
