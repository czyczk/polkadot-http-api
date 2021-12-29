import { ApiPromise } from '@polkadot/api';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import errs from 'restify-errors';
import BN from 'bn.js';

import { Endpoint, IGroupableController } from '../model';

export class RegistryController implements IGroupableController {
	constructor(private readonly _api: ApiPromise) { }

	handleGetMetaError = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;

			const index = req.query.index;
			if (!index) {
				next(new errs.BadRequestError('Param `index` not specified.'));
				return;
			}

			const error = req.query.error;
			if (!error) {
				next(new errs.BadRequestError('Param `error` not specified.'));
				return;
			}

			const result = this._api.registry.findMetaError({ index: new BN(index), error: new BN(error) });
			res.send(200, result);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/api/registry';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/meta-error', [this.handleGetMetaError]),
	];
}