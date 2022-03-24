import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';

import { subscribableContractEventForTypes } from '../controller/model';

import { ApiConfig } from './api-config';


export const initApi = async (config: ApiConfig): Promise<InitApiResult> => {
	const wsProvider = new WsProvider(config.nodeURL);
	const api = await ApiPromise.create({ provider: wsProvider, types: subscribableContractEventForTypes });
	await api.isReady;

	const keyring = new Keyring({ type: config.keyringType });

	return new InitApiResult(api, keyring);
};

export class InitApiResult {
	constructor(readonly api: ApiPromise, readonly keyring: Keyring) { }
}