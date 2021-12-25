import { ServerConfig } from './server-config';
import restify from 'restify';
import { registerControllers } from '../controller/util';

export const initServer = (config: ServerConfig): restify.Server => {
	const server = restify.createServer();

	for (const plugin of config.plugins) {
		server.use(plugin);
	}

	for (const controller of config.controllers) {
		registerControllers(server, controller);
	}

	return server;
};
