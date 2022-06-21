import restify from 'restify';

import { ApiConfigBuilder } from './app-init/api-config-builder';
import { initApi } from './app-init/init-api';
import { initServer } from './app-init/init-server';
import { ServerConfigBuilder } from './app-init/server-config-builder';
import { ConstController } from './controller/api/const-controller';
import { PingController } from './controller/api/ping-controller';
import { QueryController as ApiQueryController } from './controller/api/query-controller';
import { RegistryController } from './controller/api/registry-controller';
import { RPCController } from './controller/api/rpc-controller';
import { TopLevelController as ApiTopLevelController } from './controller/api/top-level-controller';
import { TxController as ApiTxController } from './controller/api/tx-controller';
import { InstantiationController } from './controller/contract/instantiation-controller';
import { QueryController as ContractQueryController } from './controller/contract/query-controller';
import { TxController as ContractTxController } from './controller/contract/tx-controller';
import { TopLevelController as KeyringTopLevelController } from './controller/keyring/top-level-controller';
import { EventController } from './controller/event/event-controller';

// Init API
(async () => {
	const apiConfig = new ApiConfigBuilder()
		.withNodeURL('ws://localhost:9944')
		.withKeyringType('sm2')
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
		.withController(new ApiQueryController(api))
		.withController(new RegistryController(api))
		.withController(new RPCController(api))
		.withController(new ApiTxController(api, keyring))
		.withController(new InstantiationController(api, keyring))
		.withController(new ContractQueryController(api))
		.withController(new ContractTxController(api, keyring))
		.withController(new KeyringTopLevelController(api, keyring))
		.withController(new EventController(api))
		.getConfig();
	const server = initServer(serverConfig);

	server.listen(serverConfig.port, () => {
		console.log('%s listening at %s', server.name, server.url);
	});
})();
