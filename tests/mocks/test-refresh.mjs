var pluginApi;

exports = {
    meta: {
        name: 'test-refresh',
        version: '1.0.0'
    },

    start: function(api) {
        pluginApi = api;
        return Promise.resolve(true);
    },

    collect: function() {
        pluginApi.sendMetric({
            value: Math.random() * 100,
            unit: 'count',
            timestamp: Date.now()
        });
    }
};