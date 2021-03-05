import express from 'express'
import { controller, StringContent, httpGet, HttpResponseMessage, requestParam } from "inversify-express-utils";
import { AccessBaseController } from './AccessBaseController'
import { ConfigHelper, ISettingsConfig } from '../helpers'

@controller("/preview")
export class PreviewController extends AccessBaseController {
    @httpGet("/css/:key")
    public async loadCss(@requestParam("key") key: string, req: express.Request, res: express.Response): Promise<any> {
        try {
            const church = await this.repositories.church.convertToModel(await this.repositories.church.loadBySubDomain(key.toString()));
            const settings: ISettingsConfig = await this.baseRepositories.setting.loadByChurchId(church.id);
            const result = ConfigHelper.generateCss(settings);
            const resp = new HttpResponseMessage(200);
            resp.content = new StringContent(result, "text/css");
            return resp;
        } catch (e) {
            this.logger.error(e);
            return this.internalServerError(e);
        }
    }
}