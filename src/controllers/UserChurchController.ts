import { controller, httpGet, httpPost, requestParam } from "inversify-express-utils";
import express from "express";
import { AccessBaseController } from "./AccessBaseController";
import { UserChurch } from "../models";
import jwt from "jsonwebtoken";


@controller("/userchurch")
export class UserChurchController extends AccessBaseController {

  @httpPost("/claim")
  public async claim(req: express.Request<{}, {}, { encodedPerson: string }, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async ({ id, churchId }) => {
      const decoded: any = jwt.verify(req.body.encodedPerson, process.env.JWT_SECRET_KEY);
      const userChurch: UserChurch = {
        userId: id,
        churchId,
        personId: decoded.id
      }

      const existing = await this.repositories.userChurch.loadByUserId(id, churchId);
      if (!existing) {
        const result = await this.repositories.userChurch.save(userChurch);
        return this.repositories.userChurch.convertToModel(result);
      } else return existing;
    })
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, UserChurch, { userId: string }>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async ({ id, churchId }) => {
      const record = await this.repositories.userChurch.loadByUserId(req.query.userId || id, churchId);
      if (record) return this.json({ message: 'User already has a linked person record' }, 400);
      const userChurch: UserChurch = {
        userId: req.query.userId || id,
        churchId,
        personId: req.body.personId
      }

      const result = await this.repositories.userChurch.save(userChurch);
      return this.repositories.userChurch.convertToModel(result);
    })
  }

  @httpGet("/userid/:userId")
  public async getByUserId(@requestParam("userId") userId: string, req: express.Request, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async ({ churchId }) => {
      const record = await this.repositories.userChurch.loadByUserId(userId, churchId);
      return this.repositories.userChurch.convertToModel(record);
    })
  }

}