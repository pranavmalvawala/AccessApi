import { bool } from "aws-sdk/clients/signer";
import fs from "fs";
import path from "path";

import { EnvironmentBase } from "../apiBase";

export class Environment extends EnvironmentBase {

  static jwtExpiration: string;
  static emailOnRegistration: bool;
  static supportEmail: string;
  static accountsAppRoot: string;
  static hubspotKey: string;


  static init(environment: string) {
    let file = "dev.json";
    if (environment === "staging") file = "staging.json";
    if (environment === "prod") file = "prod.json";


    const relativePath = "../../config/" + file;
    const physicalPath = path.resolve(__dirname, relativePath);

    const json = fs.readFileSync(physicalPath, "utf8");
    const data = JSON.parse(json);
    this.populateBase(data);


    this.jwtExpiration = "2 days";
    this.emailOnRegistration = data.emailOnRegistration;
    this.supportEmail = data.supportEmail;
    this.accountsAppRoot = data.accountsAppRoot;
    this.hubspotKey = process.env.HUBSPOT_KEY;

  }

}