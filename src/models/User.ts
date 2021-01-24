export class User {
  public id?: number;
  public email?: string;
  public authGuid?: string;
  public displayName?: string;
  public registrationDate?: Date;
  public lastLogin?: Date;
  public password?: string;


  /*
  private _id: number;
  private _email: string;
  private _authGuid: string;
  private _displayName: string;
  private _registrationDate: Date;
  private _lastLogin: Date;
  private _password: string;

  public get id(): number {
    return this._id;
  }

  public set id(id: number) {
    this._id = id;
  }

  public get email(): string {
    return this._email;
  }

  public set email(email: string) {
    this._email = email;
  }

  public get authGuid(): string {
    return this._authGuid;
  }

  public set authGuid(authGuid: string) {
    this._authGuid = authGuid;
  }

  public get displayName(): string {
    return this._displayName;
  }

  public set displayName(displayName: string) {
    this._displayName = displayName;
  }

  public get registrationDate(): Date {
    return this._registrationDate;
  }

  public set registrationDate(registrationDate: Date) {
    this._registrationDate = registrationDate;
  }

  public get lastLogin(): Date {
    return this._lastLogin;
  }

  public set lastLogin(lastLogin: Date) {
    this._lastLogin = lastLogin;
  }


  public get password(): string {
    return this._password;
  }

  constructor(email: string, displayName: string, hashedPassword: string, userUUID: string) {
    this._email = email;
    this._displayName = displayName;
    this._password = hashedPassword;
    this._authGuid = userUUID;
    this._registrationDate = new Date();
    this._lastLogin = this._registrationDate;
  }
  */
}
