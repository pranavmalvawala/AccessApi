import { controller, httpGet } from "inversify-express-utils";
import express from "express";
import { AccessBaseController } from "./AccessBaseController"
import { permissionsList } from "../helpers"

@controller("/permissions")
export class PermissionController extends AccessBaseController {

    @httpGet("/")
    public async loadAll(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            return this.json(permissionsList, 200);
        });
    }


}