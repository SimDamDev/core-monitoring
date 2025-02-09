export const MetricSchema = {
    type: 'object',
    required: ['timestamp', 'value', 'source'],
    properties: {
        timestamp: { type: 'number' },
        value: { type: 'number' },
        source: { type: 'string', format: 'plugin-id' },
        unit: { type: 'string', enum: ['%', 'ms', 'MB'] },
        name: { type: 'string' }
    },
    additionalProperties: false
};

export const PluginSchema = {
    type: 'object',
    required: ['id', 'version', 'permissions'],
    properties: {
        id: { type: 'string', format: 'plugin-id' },
        version: { type: 'string' },
        permissions: { 
            type: 'array',
            items: { type: 'string', enum: ['metrics:write', 'metrics:read', 'system:info'] }
        },
        refresh_profile: { 
            type: 'string', 
            enum: ['off', 'low', 'default', 'rapid'],
            default: 'default'
        }
    },
    additionalProperties: false
};

// Format personnalisé pour valider l'ID du plugin
export function addCustomFormats(ajv) {
    ajv.addFormat('plugin-id', {
        validate: (id) => {
            return typeof id === 'string' && /^[a-z0-9-_]+$/.test(id);
        }
    });
} 