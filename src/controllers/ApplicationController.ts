import { controller, httpGet } from "inversify-express-utils";
import express from "express";
import { AccessBaseController } from "./AccessBaseController"


@controller("/applications")
export class ApplicationController extends AccessBaseController {

    @httpGet("/")
    public async loadAll(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            const data = await this.repositories.application.loadAll();
            const apps = this.repositories.application.convertAllToModel(data);
            return apps;
        });
    }


}
