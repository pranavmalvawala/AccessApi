// import { DbHelper } from "../helpers/DbHelper.js";

export class RolePermission {
  public id?: string;
  public churchId?: string;
  public roleId?: string;
  public apiName?: string;
  public contentType?: string;
  public contentId?: string | null;
  public action?: string;

  constructor(churchId: string, roleId: string, apiName: string, contentType: string, contentId: string | null, action: string) {
    this.churchId = churchId;
    this.roleId = roleId;
    this.apiName = apiName;
    this.contentType = contentType;
    this.contentId = contentId;
    this.action = action;
  }

}
