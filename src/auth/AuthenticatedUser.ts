import { Principal, AuthenticatedUser as BaseAuthenticatedUser } from '../apiBase/auth'
import { Api, Church, LoginResponse, User } from '../models'
import jwt from "jsonwebtoken";
import { Repositories } from '../repositories';
import { AppStream } from 'aws-sdk';

export class AuthenticatedUser extends BaseAuthenticatedUser {

    public static async login(allChurches: Church[], user: User) {
        const churches = [...allChurches];
        if (churches.length > 1 && churches[0].id === 0) churches.splice(0, 1); // remove empty church with universal permissions if there are actual church records.

        if (churches.length === 0) return null;
        else {
            AuthenticatedUser.setJwt(churches, user);
            const result: LoginResponse = {
                user: { email: user.email, displayName: user.displayName, id: user.id },
                churches
            }
            return result;
        }
    }

    public static getApiJwt(api: Api, user: User, church: Church) {
        const permList: string[] = [];
        api.permissions.forEach(p => { permList.push(p.contentType + "_" + String(p.contentId).replace('null', '') + "_" + p.action); });
        return jwt.sign({ id: user.id, email: user.email, churchId: church.id, apiName: api.keyName, permissions: permList }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRATION });
    }

    public static setJwt(allChurches: Church[], user: User) {
        allChurches.forEach(c => {
            c.apis.forEach(api => { api.jwt = AuthenticatedUser.getApiJwt(api, user, c) });
        });
    }

    public static async loadUserByJwt(token: string, repositories: Repositories) {
        let result: User = null;
        try {
            const decoded = new Principal(jwt.verify(token, process.env.JWT_SECRET_KEY));
            const userId: number = decoded.details.id;
            result = await repositories.user.load(userId);
        } catch { console.log('No match'); };
        return result;
    }

}
