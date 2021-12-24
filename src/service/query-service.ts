import { ApiPromise } from '@polkadot/api';

export class QueryService {

	getNow = async () => {
		await this.api.isReady;
		return await this.api.query.timestamp.now();
	};

	getSystemAccount = async (addr: string) => {
		await this.api.isReady;
		return await this.api.query.system.account(addr);
	};

	constructor(private readonly api: ApiPromise) { }
}