import { Api } from '.'
export class Church {
  public id?: string;
  public name: string;
  public subDomain?: string;
  public personId?: string;
  public address1?: string;
  public address2?: string;
  public city?: string;
  public state?: string;
  public zip?: string;
  public country?: string;
  public registrationDate?: Date;
  public apis?: Api[];
  public jwt?: string;
}
