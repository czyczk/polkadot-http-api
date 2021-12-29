import { ApiPromise, Keyring } from '@polkadot/api';
import { Hash } from '@polkadot/types/interfaces';
import { ISubmittableResult } from '@polkadot/types/types';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import errs, { InternalError } from 'restify-errors';

import { Endpoint, IGroupableController, InBlockStatus, TxExecutionResult } from '../model';
import { DEFAULT_UNSUB_IF_IN_BLOCK } from './default-optional-params';

export class TxController implements IGroupableController {
	constructor(private readonly _api: ApiPromise, private readonly _keyring: Keyring) { }

	handlePostBlancesTransferWithSubscription = async (req: Request, res: Response, next: Next) => {
		try {
			// Required params
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

			// Optional params
			let unsubIfInBlock = DEFAULT_UNSUB_IF_IN_BLOCK;
			if (req.body.unsubIfInBlock === false) {
				unsubIfInBlock = false;
			}

			// Process the params
			const signerAccount = this._keyring.getPair(signerAddress);

			// Mess with API calls
			await this._api.isReady;
			let inBlockBlockHash: Hash;
			let finalizedBlockHash: Hash;

			const extrinsic = this._api.tx.balances
				.transfer(transferDest, transferValue);
			const extrinsicHash = extrinsic.hash.toHex();

			const unsub = await extrinsic.signAndSend(signerAccount, (result: ISubmittableResult) => {
				if (result.status.isInBlock || result.status.isFinalized) {
					if (!result.dispatchInfo) {
						unsub();
						next(new InternalError('Cannot get `dispatchInfo` from the result.'));
						return;
					}

					if (result.status.isInBlock) {
						inBlockBlockHash = result.status.asInBlock;

						if (unsubIfInBlock) {
							unsub();
							const ret = new TxExecutionResult(extrinsicHash, result.dispatchInfo, new InBlockStatus(inBlockBlockHash));
							res.send(200, ret);
							next();
							return;
						}
					} else {
						finalizedBlockHash = result.status.asFinalized;
						unsub();
						const ret = new TxExecutionResult(extrinsicHash, result.dispatchInfo, new InBlockStatus(inBlockBlockHash, finalizedBlockHash));
						res.send(200, ret);
						next();
						return;
					}
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
