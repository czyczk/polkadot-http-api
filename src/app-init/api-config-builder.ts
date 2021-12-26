import { KeypairType } from '@polkadot/util-crypto/types';

import { ApiConfig } from './api-config';

export class ApiConfigBuilder {
	private _config: ApiConfig;

	withNodeURL = (nodeURL: string): this => {
		this._config.nodeURL = nodeURL;
		return this;
	};

	withKeyringType = (keyringType: KeypairType): this => {
		this._config.keyringType = keyringType;
		return this;
	};

	getConfig = (): ApiConfig => {
		return this._config;
	};

	constructor() {
		this._config = new ApiConfig();
	}
}
