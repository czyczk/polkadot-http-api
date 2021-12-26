import { ApiPromise } from '@polkadot/api';
import { u64 } from '@polkadot/types/primitive';
import { Codec } from '@polkadot/types/types';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import errs from 'restify-errors';

import { Endpoint, IGroupableController } from '../model';

export class QueryController implements IGroupableController {
	constructor(private readonly _api: ApiPromise) { }

	handleGetStakingActiveEra = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const activeEra = await this._api.query.staking.activeEra();
			res.send(200, activeEra);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetStakingErasStakersEntries = async (req: Request, res: Response, next: Next) => {
		try {
			const index = req.params.index;
			if (!index) {
				next(new errs.BadRequestError('Param `index` not specified.'));
				return;
			}

			await this._api.isReady;
			const exposures = await this._api.query.staking.erasStakers.entries(index);
			res.send(200, exposures);
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetStakingValidators = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const validatorKeys = await this._api.query.staking.validators.keys();
			res.send(200, validatorKeys);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetSystemAccount = async (req: Request, res: Response, next: Next) => {
		try {
			const addr = req.params.addr;
			if (!addr) {
				next(new errs.BadRequestError('Param `addr` not specified.'));
				return;
			}

			const blockHash = req.query.at;

			await this._api.isReady;
			let result: Codec;
			if (!blockHash) {
				result = await this._api.query.system.account(addr);
			} else {
				result = await (await this._api.at(blockHash)).query.system.account(addr);
			}

			res.send(200, result);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetNow = async (req: Request, res: Response, next: Next) => {
		try {
			const blockHash = req.query.at;

			await this._api.isReady;
			let now: u64;
			if (!blockHash) {
				now = await this._api.query.timestamp.now();
			} else {
				now = await (await this._api.at(blockHash)).query.timestamp.now();
			}
			res.send(200, now.toJSON());
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/api/query';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/staking/active-era', [this.handleGetStakingActiveEra]),
		new Endpoint(HTTPMethod.GET, '/staking/eras-stakers/entries/:index', [this.handleGetStakingErasStakersEntries]),
		new Endpoint(HTTPMethod.GET, '/staking/validators/keys', [this.handleGetStakingValidators]),
		new Endpoint(HTTPMethod.GET, '/system/account/:addr', [this.handleGetSystemAccount]),
		new Endpoint(HTTPMethod.GET, '/timestamp/now', [this.handleGetNow]),
	];
}