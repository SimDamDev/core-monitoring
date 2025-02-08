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

// Format personnalisé pour valider l'ID du plugin
export function addCustomFormats(ajv) {
    ajv.addFormat('plugin-id', {
        validate: (id) => {
            return typeof id === 'string' && /^[a-z0-9-_]+$/.test(id);
        }
    });
} 