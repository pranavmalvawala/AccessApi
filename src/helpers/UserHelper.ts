import { Environment } from ".";
import { EmailHelper } from "../apiBase";

export class UserHelper {
  static sendWelcomeEmail(email: string, tempPassword: string, appName: string, appUrl: string): Promise<any> {
    if (!appName) appName = "ChurchApps";
    if (!appUrl) appUrl = "https://accounts.churchapps.org";

    const contents = "<h2>Welcome to " + appName + "</h2><h3>Your temporary password is <b>" + tempPassword + "</b> .</h3>"
      + "<p>Please login to change your password.</p>"
      + `<p><a href="https://accounts.churchapps.org/login?returnUrl=%2Fprofile&appName=${appName}" class="btn btn-primary">Change Password</a></p>`;
    return EmailHelper.sendTemplatedEmail(Environment.supportEmail, email, appName, appUrl, "Welcome to " + appName + ".", contents);
  }

}

