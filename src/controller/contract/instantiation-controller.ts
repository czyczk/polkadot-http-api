import { ApiPromise, Keyring, SubmittableResult } from '@polkadot/api';
import BN from 'bn.js';
import { ISubmittableResult } from '@polkadot/types/types';
import { CodePromise } from '@polkadot/api-contract';
import { Hash } from '@polkadot/types/interfaces';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import { InternalError, NotImplementedError } from 'restify-errors';

import { Endpoint, IGroupableController, TxExecutionResult } from '../model';
import { loadAbi, loadWasm } from './example-contract/util';

export class InstantiationController implements IGroupableController {
	constructor(private readonly _api: ApiPromise, private readonly _keyring: Keyring) { }

	handleTestInstantiation = async (req: Request, res: Response, next: Next) => {
		try {
			const signerAccount = this._keyring.getPair('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

			await this._api.isReady;
			const unsubIfInBlock = false;
			let inBlockBlockHash: Hash;
			let finalizedBlockHash: Hash;

			const abi = loadAbi();
			const wasm = loadWasm();

			const code = new CodePromise(this._api, abi, wasm);
			const extrinsic = code.tx['default']({
				gasLimit: 200000000000,
				salt: null,
				value: 1000000000000000,
			});

			const unsub = await extrinsic.signAndSend(signerAccount, (result: ISubmittableResult) => {
				if (result.status.isInBlock || result.status.isFinalized) {
					if (!result.dispatchInfo) {
						unsub();
						next(new InternalError('Cannot get `dispatchInfo` from the result.'));
						return;
					}

					// If `result.dispatchError` is available, the instantiation failed.
					// Use the `index` and `error` fields to get an explained error and send the collected info to the client.
					if (result.dispatchError) {
						if (!result.dispatchError.isModule) {
							// TODO: Cannot handle non module errors yet.
							unsub();
							next(new NotImplementedError('`result.dispatchError` is not a module error. We don\'t know how to handle it yet.'));
							return;
						}

						// Get the explanation for the error
						const moduleError = result.dispatchError.asModule;
						const metaError = this._api.registry.findMetaError({ index: new BN(moduleError.index), error: new BN(moduleError.error) });

						unsub();
						return;
					}


					// If `result.dispatchError` is not available, the instantiation succeeded.
					// The contract instance "address" can be found from the penultimate event. The API hasn't provided an easy way to access it yet!!!
					// So dear API authors, what's your plan? :)
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

	// TODO
	handlePostInstantiation = this.handleTestInstantiation;

	prefix = '/contract/instantiation';
	endpoints = [
		// TODO
		new Endpoint(HTTPMethod.POST, '/from-code', [this.handleTestInstantiation]),
	];
}
