import { Permissions as BasePermissions } from '../apiBase/helpers'

export class Permissions extends BasePermissions{
    static server = {
        admin: { contentType: "Server", action: "Admin" }
    }

    static roles = {
        edit: { contentType: "Roles", action: "Edit" },
        view: { contentType: "Roles", action: "View" }
    }

    static roleMembers = {
        view: { contentType: "RoleMembers", action: "View" },
        edit: { contentType: "RoleMembers", action: "Edit" }
    }

    static rolePermissions = {
        view: { contentType: "RolePermissions", action: "View" },
        edit: { contentType: "RolePermissions", action: "Edit" }
    }
}