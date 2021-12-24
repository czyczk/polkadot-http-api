import { ApiPromise } from '@polkadot/api';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import { Endpoint, IGroupableController } from './model';

export class ConstController implements IGroupableController {
	// The length of an epoch (session) in Babe
	handleGetBabeEpochDuration = async (req: Request, res: Response, next: Next) => {
		try {
			await this.api.isReady;
			res.send({
				epochDuration: this.api.consts.babe.epochDuration.toNumber()
			});
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	// The amount required to create a new account
	handleGetBalancesExistentialDeposit = async (req: Request, res: Response, next: Next) => {
		try {
			await this.api.isReady;
			const result = this.api.consts.balances.existentialDeposit.toNumber();
			res.send({
				existentialDeposit: result,
			});
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	// The amount required per byte on an extrinsic
	handleGetTransactionPaymentTransactionByteFee = async (req: Request, res: Response, next: Next) => {
		try {
			await this.api.isReady;
			const result = this.api.consts.transactionPayment.transactionByteFee.toNumber();
			res.send({
				transactionByteFee: result,
			});
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	constructor(private readonly api: ApiPromise) { }
	prefix = '/api/consts';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/babe/epoch-duration', [this.handleGetBabeEpochDuration]),
		new Endpoint(HTTPMethod.GET, '/balances/existential-deposit', [this.handleGetBalancesExistentialDeposit]),
		new Endpoint(HTTPMethod.GET, '/transaction-payment/transaction-byte-fee', [this.handleGetTransactionPaymentTransactionByteFee]),
	];
}