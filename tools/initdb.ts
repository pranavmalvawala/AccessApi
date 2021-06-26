import dotenv from "dotenv";
import { Pool } from "../src/apiBase/pool";
import { DBCreator } from "../src/apiBase/tools/DBCreator"

const init = async () => {
  dotenv.config();
  console.log("Connecting");
  Pool.initPool();

  const tables: { title: string, file: string }[] = [
    { title: "APIs", file: "apis.mysql" },
    { title: "Applications", file: "applications.mysql" },
    { title: "Application APIs", file: "applicationApis.mysql" },
    { title: "Church Apps", file: "churchApps.mysql" },
    { title: "Churches", file: "churches.mysql" },
    { title: "Permissions", file: "permissions.mysql" },
    { title: "Role Members", file: "roleMembers.mysql" },
    { title: "Role Permissions", file: "rolePermissions.mysql" },
    { title: "Roles", file: "roles.mysql" },
    { title: "Users", file: "users.mysql" },
    { title: "User Churches", file:"userChurches.mysql" },
    { title: "Populate APIs", file: "populateApis.mysql" },
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