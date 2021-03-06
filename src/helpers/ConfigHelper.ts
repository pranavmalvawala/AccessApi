import { ISettingsConfig } from './'

export class ConfigHelper {

    static generateCss = (settings: ISettingsConfig) => {
        return ":root { --primaryColor: " + settings.primaryColor + "; --contrastColor: " + settings.contrastColor + "; --headerColor: " + settings.primaryColor + " }"
    }

    static generateJson = (settings: ISettingsConfig) => {
        const result: any = {};
        result.colors = { primary: settings.primaryColor, contrast: settings.contrastColor };
        result.logo = { url: settings.homePageUrl, image: settings.logoUrl };
        return result;
    }
}