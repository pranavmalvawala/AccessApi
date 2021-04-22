import { controller, httpGet, requestParam } from "inversify-express-utils";
import express from "express";
import { AccessBaseController } from "./AccessBaseController"

@controller("/permissions")
export class PermissionController extends AccessBaseController {

    @httpGet("/")
    public async loadAll(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            const permissions = await this.repositories.permission.loadAll();
            return this.json(permissions, 200);
        });
    }


}