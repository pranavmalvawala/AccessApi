import { controller, httpGet, requestParam } from "inversify-express-utils";
import express from "express";
import { AccessBaseController } from "./AccessBaseController"

@controller("/permissions")
export class PermissionController extends AccessBaseController {

    @httpGet("/:appName")
    public async loadByApp(@requestParam("appName") appName: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            const permissions = await this.repositories.permission.loadForApp(appName);
            return this.json(permissions, 200);
        });
    }


}