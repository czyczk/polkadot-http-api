import { ApiPromise } from '@polkadot/api';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';

import { Endpoint, IGroupableController } from '../model';

export class ConstController implements IGroupableController {
	// The length of an epoch (session) in Babe
	handleGetBabeEpochDuration = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			res.send(200, this._api.consts.babe.epochDuration.toJSON());
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	// The amount required to create a new account
	handleGetBalancesExistentialDeposit = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const result = this._api.consts.balances.existentialDeposit.toJSON();
			res.send(200, result);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	// The amount required per byte on an extrinsic
	handleGetTransactionPaymentTransactionByteFee = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const result = this._api.consts.transactionPayment.transactionByteFee.toJSON();
			res.send(200, result);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	constructor(private readonly _api: ApiPromise) { }
	prefix = '/api/consts';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/babe/epoch-duration', [this.handleGetBabeEpochDuration]),
		new Endpoint(HTTPMethod.GET, '/balances/existential-deposit', [this.handleGetBalancesExistentialDeposit]),
		new Endpoint(HTTPMethod.GET, '/transaction-payment/transaction-byte-fee', [this.handleGetTransactionPaymentTransactionByteFee]),
	];
}