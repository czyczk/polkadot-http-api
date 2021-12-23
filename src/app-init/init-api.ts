import polkadotApi from '@polkadot/api';
import { ApiConfig } from './api-config';

export const initApi = async (config: ApiConfig): Promise<polkadotApi.ApiPromise> => {
	const wsProvider = new polkadotApi.WsProvider(config.nodeURL);
	const api = new polkadotApi.ApiPromise({ provider: wsProvider });
	await api.isReady;

	return api;
};