import { EmailHelper } from "../apiBase";
import { ArrayHelper } from "../apiBase";
import { Repositories as BaseRepositories } from "../apiBase/repositories";
import { Church } from "../models";


export class ChurchHelper {

  static async appendLogos(churches: Church[]) {
    const ids = ArrayHelper.getIds(churches, "id");
    console.log(ids);
    const settings = await BaseRepositories.getCurrent().setting.loadMulipleChurches(["logoLight", "logoDark"], ids);
    console.log(settings.length);
    settings.forEach((s: any) => {
      console.log(s);
      const church = ArrayHelper.getOne(churches, "id", s.churchId);
      if (church.settings === undefined) church.settings = [];
      church.settings.push(s);
    });
  }

}

