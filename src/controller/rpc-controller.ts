import { ApiPromise } from '@polkadot/api';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import { Endpoint, IGroupableController } from './model';

export class RPCController implements IGroupableController {
	constructor(private readonly _api: ApiPromise) { }

	handleGetSystemChain = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const chain = await this._api.rpc.system.chain();
			res.send(200, chain);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetChainHeader = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const latestHeader = await this._api.rpc.chain.getHeader();
			res.send(200, latestHeader);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/api/rpc';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/system/chain', [this.handleGetSystemChain]),
		new Endpoint(HTTPMethod.GET, '/chain/header', [this.handleGetChainHeader]),
	];
}