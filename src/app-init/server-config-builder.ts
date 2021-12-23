import { IGroupableController } from '../controller/model';
import { ServerConfig } from './server-config';

export class ServerConfigBuilder {
	private _config: ServerConfig;

	withPort = (port: number): this => {
		if (port < 0) {
			throw new RangeError('Port number should be >= 0.');
		}

		this._config.port = `${port}`;
		return this;
	};

	withController = (controller: IGroupableController): this => {
		this._config.controllers.add(controller);
		return this;
	};

	getConfig = (): ServerConfig => {
		return this._config;
	};

	constructor() {
		this._config = new ServerConfig();
	}
}