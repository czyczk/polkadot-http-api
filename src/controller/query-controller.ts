import { Next, Request, Response } from 'restify';
import errs from 'restify-errors';
import { Endpoint, IGroupableController } from './model';
import HTTPMethod from 'http-method-enum';
import { ApiPromise } from '@polkadot/api';

export class QueryController implements IGroupableController {
	constructor(private readonly _api: ApiPromise) { }

	handleGetNow = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const now = await this._api.query.timestamp.now();
			res.send(200, {
				now: now.toJSON(),
			});
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetSystemAccount = async (req: Request, res: Response, next: Next) => {
		try {
			const addr = req.params.addr;
			if (addr === '') {
				next(new errs.BadRequestError('Param `addr` not specified.'));
				return;
			}

			const result = await this._api.query.system.account(addr);
			res.send(200, result);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/api/query';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/timestamp/now', [this.handleGetNow]),
		new Endpoint(HTTPMethod.GET, '/system/account/:addr', [this.handleGetSystemAccount]),
	];
}