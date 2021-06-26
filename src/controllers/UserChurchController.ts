import { controller, httpGet, httpPost, interfaces } from "inversify-express-utils";
import express from "express";
import { AccessBaseController } from "./AccessBaseController";
import { UserChurch } from "../models";

@controller("/userchurch")
export class UserChurchController extends AccessBaseController {

    @httpPost("/")
    public async save(req: express.Request<{}, {}, UserChurch>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async ({id, churchId}) => {
            const record = await this.repositories.userChurch.loadByUserId(id, churchId);
            if (record) return this.json({ message: 'User already has a linked person record' }, 400);
            const userChurch: UserChurch = {
                userId: id,
                churchId,
                personId: req.body.personId
            }

            const result = await this.repositories.userChurch.save(userChurch);
            return this.repositories.userChurch.convertToModel(result);
        })
    }

}