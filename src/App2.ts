import dotenv from "dotenv";
import bodyParser from "body-parser";
import "reflect-metadata";
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import { bindings } from "./inversify.config";
import express from "express";
import { CustomAuthProvider } from "./apiBase/auth";
import cors from "cors"

export const init = async () => {
    dotenv.config();
    const container = new Container();
    await container.loadAsync(bindings);
    const app = new InversifyExpressServer(container, null, null, null, CustomAuthProvider);

    const configFunction = (expApp: express.Application) => {
        expApp.use(bodyParser.urlencoded({ extended: true }));
        expApp.use(bodyParser.json());
        expApp.use(cors())
    };

    const server = app.setConfig(configFunction).build();
    return server;
}
