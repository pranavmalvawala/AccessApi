// import { DbHelper } from "../helpers/DbHelper.js";

export class RolePermission {
  public id?: number;
  public churchId?: number;
  public roleId?: number;
  public apiName?: string;
  public contentType?: string;
  public contentId?: number | null;
  public action?: string;

  constructor(churchId: number, roleId: number, apiName: string, contentType: string, contentId: number | null, action: string) {
    this.churchId = churchId;
    this.roleId = roleId;
    this.apiName = apiName;
    this.contentType = contentType;
    this.contentId = contentId;
    this.action = action;
  }

}
