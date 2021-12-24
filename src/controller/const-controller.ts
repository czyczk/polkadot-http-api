import { ApiPromise } from '@polkadot/api';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import { Endpoint, IGroupableController } from './model';

export class ConstController implements IGroupableController {
	constructor(private readonly api: ApiPromise) { }
	prefix = '/api/consts';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/babe/epoch-duration', this.handleGetBabeEpochDuration)
	];

	// The length of an epoch (session) in Babe
	async handleGetBabeEpochDuration(req: Request, res: Response, next: Next) {
		await this.api.isReady;
		res.send(this.api.consts.babe.epochDuration.toNumber());
		next();
	}

	// The amount required to create a new account
	async handleGetBalancesExistentialDeposit(req: Request, res: Response, next: Next) {
		await this.api.isReady;
		res.send(this.api.consts.balances.existentialDeposit.toNumber());
		next();
	}

	// The amount required per byte on an extrinsic
	async handleGetTransactionPaymentTransactionByteFee(req: Request, res: Response, next: Next) {
		await this.api.isReady;
		res.send(this.api.consts.transactionPayment.transactionByteFee.toNumber());
		next();
	}
}