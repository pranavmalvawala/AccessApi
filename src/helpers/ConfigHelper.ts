import { ISettingsConfig } from './'

export class ConfigHelper {

    static generateCss = (settings: ISettingsConfig) => {
        return ":root { --primaryColor: " + settings.primaryColor + "; --contrastColor: " + settings.contrastColor + "; --headerColor: " + settings.primaryColor + " }"
    }
}