import { ApiPromise, Keyring } from '@polkadot/api';
import { Hash } from '@polkadot/types/interfaces';
import { ISubmittableResult } from '@polkadot/types/types';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import errs, { InternalError } from 'restify-errors';

import { Endpoint, IGroupableController, TxExecutionResult } from '../model';

export class TxController implements IGroupableController {
	constructor(private readonly _api: ApiPromise, private readonly _keyring: Keyring) { }

	handlePostBlancesTransferWithSubscription = async (req: Request, res: Response, next: Next) => {
		try {
			const transferDest = req.body.transferDest;
			if (!transferDest) {
				next(new errs.BadRequestError('Param `transferDest` not specified.'));
				return;
			}

			const transferValue = req.body.transferValue;
			if (!transferValue) {
				next(new errs.BadRequestError('Param `transferValue` not specified.'));
				return;
			}

			const signerAddress = req.body.signerAddress;
			if (!signerAddress) {
				next(new errs.BadRequestError('Param `signerAddress` not specified.'));
				return;
			}

			const unsubIfInBlock: boolean = req.body.unsubIfInBlock;

			const signerAccount = this._keyring.getPair(signerAddress);

			await this._api.isReady;
			let inBlockBlockHash: Hash;
			let finalizedBlockHash: Hash;

			const extrinsic = this._api.tx.balances
				.transfer(transferDest, transferValue);
			const extrinsicHash = extrinsic.hash.toHex();

			const unsub = await extrinsic.signAndSend(signerAccount, (result: ISubmittableResult) => {
				if (result.status.isInBlock) {
					inBlockBlockHash = result.status.asInBlock;

					if (unsubIfInBlock) {
						unsub();
						const ret = new TxExecutionResult(extrinsicHash, inBlockBlockHash);
						res.send(200, ret);
						next();
						return;
					}
				} else if (result.status.isFinalized) {
					finalizedBlockHash = result.status.asFinalized;
					unsub();
					const ret = new TxExecutionResult(extrinsicHash, inBlockBlockHash, finalizedBlockHash);
					res.send(200, ret);
					next();
					return;
				} else if (result.status.isDropped) {
					unsub();
					next(new InternalError('Transaction dropped.'));
					return;
				} else if (result.status.isFinalityTimeout) {
					unsub();
					next(new InternalError(`Finality timeout at block hash '${result.status.asFinalityTimeout}'.`));
					return;
				}
			});
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/api/tx';
	endpoints = [
		new Endpoint(HTTPMethod.POST, '/balances/transfer', [this.handlePostBlancesTransferWithSubscription]),
	];
}
