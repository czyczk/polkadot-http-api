import { ApiPromise, WsProvider } from '@polkadot/api';
import { ApiConfig } from './api-config';

export const initApi = async (config: ApiConfig): Promise<ApiPromise> => {
	const wsProvider = new WsProvider(config.nodeURL);
	const api = new ApiPromise({ provider: wsProvider });
	await api.isReady;

	return api;
};