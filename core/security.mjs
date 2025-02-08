import yaml from 'yaml';

const VALID_PERMISSIONS = [
    'metrics:write',
    'metrics:read',
    'system:info'
];

export class PluginValidator {
    static async validate(modPath, rawYaml) {
        try {
            const config = yaml.parse(rawYaml);
            
            // Vérifie les champs obligatoires
            if (!config.id || !config.permissions) {
                throw new Error('⚠️ Configuration invalide : id et permissions sont requis');
            }

            // Vérifie les permissions
            if (!Array.isArray(config.permissions)) {
                throw new Error('⚠️ Les permissions doivent être un tableau');
            }

            const invalidPermissions = config.permissions.filter(p => !VALID_PERMISSIONS.includes(p));
            if (invalidPermissions.length > 0) {
                throw new Error(`⚠️ Permissions invalides : ${invalidPermissions.join(', ')}`);
            }

            return config;
        } catch (e) {
            throw new Error(`⚠️ Erreur de validation du fichier ${modPath} : ${e.message}`);
        }
    }
}