import { ApiPromise, Keyring } from '@polkadot/api';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import errs from 'restify-errors';

import { Endpoint, IGroupableController } from '../model';

export class TopLevelController implements IGroupableController {
	constructor(private readonly _api: ApiPromise, private readonly _keyring: Keyring) { }

	handlePostAddFromUri = async (req: Request, res: Response, next: Next) => {
		try {
			// Required params
			const phrase = req.body.phrase;
			if (!phrase) {
				next(new errs.BadRequestError('Param `phrase` not specified.'));
				return;
			}

			// Optional params
			let meta = req.body.meta;

			// Process the params
			// `meta` should be a JSON object. If it's from a POST form, it'll appear as a string, parse it to a JSON object.
			if (meta && typeof (meta) === 'string') {
				meta = JSON.parse(meta);
			}

			await this._api.isReady;
			const alice = this._keyring.addFromUri(phrase, meta);
			res.send(200, alice);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetGetPair = async (req: Request, res: Response, next: Next) => {
		try {
			const address = req.params.address;
			if (!address) {
				next(new errs.BadRequestError('Param `address` not specified.'));
				return;
			}

			await this._api.isReady;
			const keyringPair = this._keyring.getPair(address);
			res.send(200, keyringPair);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/keyring';
	endpoints = [
		new Endpoint(HTTPMethod.POST, '/from-uri', [this.handlePostAddFromUri]),
		new Endpoint(HTTPMethod.GET, '/pair/:address', [this.handleGetGetPair]),
	];
}