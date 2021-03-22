const { createServer, proxy } = require('aws-serverless-express');
const { init } = require('./dist/App');
const { Pool } = require('./dist/apiBase/pool');
const { LoggingHelper } = require('./dist/apiBase/helpers/LoggingHelper');


Pool.initPool();

module.exports.universal = function universal(event, context) {
    init().then(app => {
        LoggingHelper.getCurrent().info(JSON.stringify(event));
        const server = createServer(app);
        return proxy(server, event, context);
    });

}