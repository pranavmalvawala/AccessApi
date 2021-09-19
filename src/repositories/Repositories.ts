import { UserRepository, ChurchRepository, PermissionRepository, RoleRepository, RoleMemberRepository, RolePermissionRepository, ChurchAppRepository, UserChurchRepository } from ".";

export class Repositories {
  public church: ChurchRepository;
  public churchApp: ChurchAppRepository;
  public permission: PermissionRepository;
  public role: RoleRepository;
  public roleMember: RoleMemberRepository;
  public rolePermission: RolePermissionRepository;
  public user: UserRepository;
  public userChurch: UserChurchRepository;
  private static _current: Repositories = null;

  constructor() {
    this.church = new ChurchRepository();
    this.churchApp = new ChurchAppRepository();
    this.permission = new PermissionRepository();
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
