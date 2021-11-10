import dotenv from "dotenv";
import { Pool } from "../src/apiBase/pool";
import { Environment } from "../src/helpers/Environment";
import { DBCreator } from "../src/apiBase/tools/DBCreator"

const init = async () => {
  dotenv.config();
  console.log("Connecting");
  Environment.init(process.env.APP_ENV);
  Pool.initPool();

  const tables: { title: string, file: string }[] = [
    { title: "Churches", file: "churches.mysql" },
    { title: "Role Members", file: "roleMembers.mysql" },
    { title: "Role Permissions", file: "rolePermissions.mysql" },
    { title: "Roles", file: "roles.mysql" },
    { title: "Users", file: "users.mysql" },
    { title: "User Churches", file: "userChurches.mysql" },
    { title: "Populate Data", file: "populateData.mysql" },
  ];

  await DBCreator.init(["Settings"])
  await initTables("Access", tables);
}

const initTables = async (displayName: string, tables: { title: string, file: string }[]) => {
  console.log("");
  console.log("SECTION: " + displayName);
  for (const table of tables) await DBCreator.runScript(table.title, "./tools/dbScripts/" + table.file, false);
}

init()
  .then(() => { console.log("Database Created"); process.exit(0); })
  .catch((ex) => {
    console.log(ex);
    console.log("Database not created due to errors");
    process.exit(0);
  });