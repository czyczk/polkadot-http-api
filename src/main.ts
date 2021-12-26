import restify from 'restify';

import { ApiConfigBuilder } from './app-init/api-config-builder';
import { initApi } from './app-init/init-api';
import { initServer } from './app-init/init-server';
import { ServerConfigBuilder } from './app-init/server-config-builder';
import { ConstController } from './controller/api/const-controller';
import { PingController } from './controller/api/ping-controller';
import { QueryController } from './controller/api/query-controller';
import { RPCController } from './controller/api/rpc-controller';
import { TopLevelController as ApiTopLevelController } from './controller/api/top-level-controller';
import { TxController } from './controller/api/tx-controller';
import { TopLevelController as KeyringTopLevelController } from './controller/keyring/top-level-controller';

// Init API
(async () => {
	const apiConfig = new ApiConfigBuilder()
		.withNodeURL('ws://localhost:9944')
		.withKeyringType('sr25519')
		.getConfig();
	const { api, keyring } = await initApi(apiConfig);

	// Init server
	const serverConfig = new ServerConfigBuilder()
		.withPort(8080)
		.withPlugin(restify.plugins.queryParser({ mapParams: false }))
		.withPlugin(restify.plugins.bodyParser())
		.withController(new PingController())
		.withController(new ApiTopLevelController(api))
		.withController(new ConstController(api))
		.withController(new QueryController(api))
		.withController(new RPCController(api))
		.withController(new TxController(api, keyring))
		.withController(new KeyringTopLevelController(api, keyring))
		.getConfig();
	const server = initServer(serverConfig);

	server.listen(serverConfig.port, () => {
		console.log('%s listening at %s', server.name, server.url);
	});
})();
