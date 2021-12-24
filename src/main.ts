import { Next, Request, Response } from 'restify';
import { ApiPromise } from '@polkadot/api';
import { PingController } from './controller/ping-controller';
import { initApi } from './app-init/init-api';
import { ApiConfigBuilder } from './app-init/api-config-builder';
import { ServerConfigBuilder } from './app-init/server-config-builder';
import { initServer } from './app-init/init-server';
import { ConstController } from './controller/const-controller';
import { QueryController } from './controller/query-controller';
import { QueryService } from './service/query-service';

// Init API
(async () => {
	const apiConfig = new ApiConfigBuilder().withNodeURL('ws://localhost:9944').getConfig();
	const api = await initApi(apiConfig);

	// Init server
	const serverConfig = new ServerConfigBuilder()
		.withPort(8080)
		.withController(new PingController())
		.withController(new ConstController(api))
		.withController(new QueryController(new QueryService(api)))
		.getConfig();
	const server = initServer(serverConfig);
	//server.get('/genesis-hash', testNodeConnection);

	server.listen(serverConfig.port, () => {
		console.log('%s listening at %s', server.name, server.url);
	});
})();

//async function testNodeConnection(req: Request, res: Response, next: Next) {
//	await api.isReady;
//	const genesisHash = api.genesisHash.toHex();
//	res.send(genesisHash);
//	next();
//}
