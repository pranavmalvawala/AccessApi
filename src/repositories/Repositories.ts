import { UserRepository, ChurchRepository, PermissionRepository, RoleRepository, RoleMemberRepository, RolePermissionRepository, ChurchAppRepository, ApplicationRepository } from ".";

export class Repositories {
  public application: ApplicationRepository;
  public church: ChurchRepository;
  public churchApp: ChurchAppRepository;
  public permission: PermissionRepository;
  public role: RoleRepository;
  public roleMember: RoleMemberRepository;
  public rolePermission: RolePermissionRepository;
  public user: UserRepository;
  private static _current: Repositories = null;

  constructor() {
    this.application = new ApplicationRepository();
    this.church = new ChurchRepository();
    this.churchApp = new ChurchAppRepository();
    this.permission = new PermissionRepository();
    this.role = new RoleRepository();
    this.roleMember = new RoleMemberRepository();
    this.rolePermission = new RolePermissionRepository();
    this.user = new UserRepository();
  }

  public static getCurrent = () => {
    if (Repositories._current === null) Repositories._current = new Repositories();
    return Repositories._current;
  }

}
