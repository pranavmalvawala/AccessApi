type ApiName =
  | "AccessApi"
  | "StreamingLiveApi"
  | "B1Api"
  | "MembershipApi"
  | "GivingApi"
  | "AttendanceApi"
  | "MessagingApi"
  | "LessonsApi";

type ContentType =
  | "Roles"
  | "RoleMembers"
  | "RolePermissions"
  | "Users"
  | "Settings"
  | "Links"
  | "Pages"
  | "Services"
  | "Tabs"
  | "Settings"
  | "Forms"
  | "Households"
  | "People"
  | "Notes"
  | "Group Members"
  | "Groups"
  | "Donations"
  | "Attendance"
  | "Chat"
  | "Schedules";

type Actions = "Edit" | "View" | "Edit Self" | "View Members" | "View Summary" | "Checkin" | "Host";

export class RolePermission {
  public id?: string;
  public churchId?: string;
  public roleId?: string;
  public apiName?: ApiName;
  public contentType?: ContentType;
  public contentId?: string;
  public action?: Actions;

  constructor({ churchId, roleId, apiName, contentType, contentId, action }: RolePermission) {
    this.churchId = churchId;
    this.roleId = roleId;
    this.apiName = apiName;
    this.contentType = contentType;
    this.contentId = contentId;
    this.action = action;
  }
}
