import { User } from "./";

export class RoleMember {
    public id?: number;
    public churchId?: number;
    public roleId?: number;
    public userId?: number;
    public dateAdded?: Date;
    public addedBy?: number;

    public user?: User;

    /*
    private _id: number;
    private _churchId: number;
    private _roleId: number;
    private _userId: number;
    private _dateAdded: Date;
    private _addedBy: number;

    public get id(): number {
        return this._id;
    }

    public set id(id: number) {
        this._id = id;
    }

    public get churchId(): number {
        return this._churchId;
    }

    public set churchId(churchId: number) {
        this._churchId = churchId;
    }

    public get roleId(): number {
        return this._roleId;
    }

    public set roleId(roleId: number) {
        this._roleId = roleId;
    }

    public get userId(): number {
        return this._userId;
    }

    public set userId(userId: number) {
        this._userId = userId;
    }

    public get dateAdded(): Date {
        return this._dateAdded;
    }

    public set dateAdded(dateAdded: Date) {
        this._dateAdded = dateAdded;
    }

    public get addedBy(): number {
        return this._addedBy;
    }

    public set addedBy(addedBy: number) {
        this._addedBy = addedBy;
    }

    constructor(churchId: number, roleId: number, userId: number, addedBy: number) {
        this._churchId = churchId;
        this._roleId = roleId;
        this._userId = userId;
        this._dateAdded = new Date();
        this._addedBy = addedBy;
    }
*/
}
