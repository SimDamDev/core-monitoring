 import yaml from 'yaml';

export class PluginValidator{
    static async validate(modPath, rawYaml) {
        try{
            const config = yaml.parse(rawYaml);
            //verifie les champs obligatoires
            if (!config.id || !config.permissions) {
                throw new Error('⚠️ Configuration invalide : id et permissions sont requis');
            }
            return config;
        } catch (e) {
            throw new Error(`⚠️ Erreur de validation du fichier ${modPath} : ${e.message}`);

        }
    }
}