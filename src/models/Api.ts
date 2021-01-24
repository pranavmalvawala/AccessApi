import { RolePermission } from "./RolePermission";

export class Api {
    public id?: number;
    public keyName?: string;
    public name?: string;
    public permissions?: RolePermission[]
    public jwt?: string
}
