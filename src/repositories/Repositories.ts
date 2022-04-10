import { UserRepository, ChurchRepository, RoleRepository, RoleMemberRepository, RolePermissionRepository, UserChurchRepository } from ".";
import { AccessLogRepository } from "./AccessLogRepository";

export class Repositories {
  public accessLog: AccessLogRepository;
  public church: ChurchRepository;
  public role: RoleRepository;
  public roleMember: RoleMemberRepository;
  public rolePermission: RolePermissionRepository;
  public user: UserRepository;
  public userChurch: UserChurchRepository;
  private static _current: Repositories = null;

  constructor() {
    this.accessLog = new AccessLogRepository();
    this.church = new ChurchRepository();
    this.role = new RoleRepository();
    this.roleMember = new RoleMemberRepository();
    this.rolePermission = new RolePermissionRepository();
    this.user = new UserRepository();
    this.userChurch = new UserChurchRepository();
  }

  public static getCurrent = () => {
    if (Repositories._current === null) Repositories._current = new Repositories();
    return Repositories._current;
  }

}
