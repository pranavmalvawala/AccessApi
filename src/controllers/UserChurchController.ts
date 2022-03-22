import { controller, httpGet, httpPatch, httpPost, requestParam } from "inversify-express-utils";
import express from "express";
import { AccessBaseController } from "./AccessBaseController";
import { UserChurch } from "../models";
import jwt from "jsonwebtoken";
import { Environment } from "../helpers";


@controller("/userchurch")
export class UserChurchController extends AccessBaseController {

  @httpPost("/claim")
  public async claim(req: express.Request<{}, {}, { encodedPerson: string }, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async ({ id, churchId }) => {
      const decoded: any = jwt.verify(req.body.encodedPerson, Environment.jwtSecret);
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

  @httpPatch("/:userId")
  public async update(@requestParam("userId") userId: string, req: express.Request, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async () => {
      const {churchId} = req.body;
      const existing = await this.repositories.userChurch.loadByUserId(userId, churchId);
      const updatedUserChrurch: UserChurch  = {
        id: existing.id,
        userId,
        personId: existing.personId,
        churchId,
        lastAccessed: new Date()
      }

      if (!existing) {
        return this.json({ message: 'No church found for user' }, 400);
      }
      await this.repositories.userChurch.save(updatedUserChrurch);
      return existing;
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