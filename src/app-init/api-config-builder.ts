import { ApiConfig } from './api-config';

export class ApiConfigBuilder {
	private _config: ApiConfig;

	withNodeURL = (nodeURL: string): this => {
		this._config.nodeURL = nodeURL;
		return this;
	};

	getConfig = (): ApiConfig => {
		return this._config;
	};

	constructor() {
		this._config = new ApiConfig();
	}
}
