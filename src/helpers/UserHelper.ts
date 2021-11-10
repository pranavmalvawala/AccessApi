import { Environment } from ".";
import { EmailHelper } from "../apiBase";

export class UserHelper {
  static sendWelcomeEmail(email: string, tempPassword: string, appName: string, appUrl: string): Promise<any> {
    if (!appName) appName = "ChurchApps";
    if (!appUrl) appUrl = "https://accounts.churchapps.org";
    return EmailHelper.sendEmail({
      from: Environment.supportEmail,
      to: email,
      subject: "Welcome to " + appName + ".",
      body: "Welcome to " + appName + ".  Your temporary password is <b>" + tempPassword + "</b>.  Please visit <a href=\"" + appUrl + "\">" + appUrl + "</a> to login and change your password."
    });
  }

}

