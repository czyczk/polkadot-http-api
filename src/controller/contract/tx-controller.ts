import { ApiPromise, Keyring } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { ContractSubmittableResult } from '@polkadot/api-contract/base/Contract';
import { Hash } from '@polkadot/types/interfaces';
import BN from 'bn.js';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import errs from 'restify-errors';

import { Endpoint, IGroupableController, InBlockStatus } from '../model';
import { DEFAULT_CONTRACT_TX_GAS_LIMIT, DEFAULT_CONTRACT_TX_VALUE } from './default-optional-params';
import { loadIncrementerAbi } from './example-contracts/util';
import { ContractTxErrorResult, ContractTxSuccessResult, ExplainedModuleError } from './model';

export class TxController implements IGroupableController {
	constructor(private readonly _api: ApiPromise, private readonly _keyring: Keyring) { }

	private handleTestTxShouldSucceed = async (req: Request, res: Response, next: Next) => {
		try {
			const abi = loadIncrementerAbi();
			const address = '5CVxfpAARVp1XEv9EvcyQkA6BgumMAVTe1uusQbo5mTx14GE';
			const signerAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
			const signerAccount = this._keyring.getPair(signerAddress);

			await this._api.isReady;
			const contract = new ContractPromise(this._api, abi, address);
			const value = DEFAULT_CONTRACT_TX_VALUE;
			//const gasLimit = 3_000_000_000;
			const gasLimit = DEFAULT_CONTRACT_TX_GAS_LIMIT;
			const unsubIfInBlock = true;

			//const extrinsic = contract.tx['incAndEmitEventAndFail']({
			const extrinsic = contract.tx['incAndReturnValue']({
				gasLimit: gasLimit,
				value: value,
			}, 1);
			const extrinsicHash = extrinsic.hash.toHex();
			const unsub = await extrinsic.signAndSend(signerAccount, (result: ContractSubmittableResult) => {
			});
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handlePostTx = this.handleTestTxShouldSucceed;

	private readonly _txResultCallbackFunc = (unsub: () => void, result: ContractSubmittableResult, readonlyPack: ReadonlyStatusPack, mutablePack: MutableStatusPack) => {
		if (result.status.isReady) {
			// Nothing to do if it's ready.
			// Status identified here so that it's not an unknown status.
			return;
		} else if (result.status.isInBlock || result.status.isFinalized) {
			if (!result.dispatchInfo) {
				unsub();
				readonlyPack.next(new errs.InternalError('Cannot get `dispatchInfo` from the result.'));
				return;
			}

			// If `result.dispatchError` is available, the transaction failed.
			// Use the `index` and `error` fields to get an explained error and send the collected info to the client.
			// There is no need to handle with the events, since no event could be emitted when the transaction failed.
			if (result.dispatchError) {
				mutablePack.inBlockBlockHash = result.status.asInBlock;
				unsub();

				if (!result.dispatchError.isModule) {
					// TODO: Cannot handle non module errors yet.
					throw new errs.NotImplementedError('`result.dispatchError` is not a module error. We don\'t know how to handle it yet.');
				}

				// Get the explanation for the error
				const moduleError = result.dispatchError.asModule;
				const metaError = this._api.registry.findMetaError({ index: new BN(moduleError.index), error: new BN(moduleError.error) });

				const explainedDispatchError = ExplainedModuleError.fromRegistryError(moduleError.index, moduleError.error, metaError);
				const ret = new ContractTxErrorResult(readonlyPack.extrinsicHash, explainedDispatchError, result.dispatchInfo, new InBlockStatus(mutablePack.inBlockBlockHash));
				readonlyPack.res.send(500, ret);
				return;
			}

			// If `result.dispatchError` is not available, the transaction succeeded -
			// either succeeded with a normal result, or an `Err()`.
			// But we cannot distinguish them here, since the result looks like a normal execution result.
			// We cannot get the error info either, since no event could be emitted when the transaction returned an `Err()`.
			// So all we can do is reorganize the result (from contract events) and tidy the contract events as best as we can.
			if (result.status.isInBlock) {
				// Reorganize the contract events
				if (result.contractEvents) {
					mutablePack.parsedContractEvents = [];
					for (const event of result.contractEvents) {
						const parsedEvent: Record<string, unknown> = {};
						for (let i = 0; i < event.args.length; i++) {
							const fieldName = event.event.args[i].name;
							const fieldValue = event.args[i].toJSON();
							parsedEvent[fieldName] = fieldValue;
						}

						mutablePack.parsedContractEvents.push(parsedEvent);
					}
				}

				mutablePack.inBlockBlockHash = result.status.asInBlock;

				if (readonlyPack.unsubIfInBlock) {
					unsub();
					const ret = new ContractTxSuccessResult(readonlyPack.extrinsicHash, mutablePack.parsedContractEvents, result.dispatchInfo, new InBlockStatus(mutablePack.inBlockBlockHash));
					readonlyPack.res.send(200, ret);
					readonlyPack.next();
					return;
				}

				return;
			} else {
				mutablePack.finalizedBlockHash = result.status.asFinalized;
				unsub();
				if (!mutablePack.inBlockBlockHash) {
					// This should not happen.
					throw new Error();
				}
				const ret = new ContractTxSuccessResult(readonlyPack.extrinsicHash, mutablePack.parsedContractEvents, result.dispatchInfo, new InBlockStatus(mutablePack.inBlockBlockHash, mutablePack.finalizedBlockHash));
				readonlyPack.res.send(200, ret);
				readonlyPack.next();
				return;
			}
		} else if (result.status.isDropped) {
			unsub();
			readonlyPack.next(new errs.InternalError('Transaction dropped.'));
			return;
		} else if (result.status.isFinalityTimeout) {
			unsub();
			readonlyPack.next(new errs.InternalError(`Finality timeout at block hash '${result.status.asFinalityTimeout}'.`));
			return;
		}

		// TODO: not covered result status
		throw new errs.NotImplementedError(`We don't know how to handle result status of ${result.status} yet.`);
	}

	prefix = '/contract/tx';
	endpoints = [
		new Endpoint(HTTPMethod.POST, '', [this.handlePostTx]),
	];
}

class MutableStatusPack {
	constructor(public inBlockBlockHash: Hash | null = null, public finalizedBlockHash: Hash | null = null, public parsedContractEvents: Record<string, unknown>[] | null = null) { }
}

class ReadonlyStatusPack {
	constructor(public readonly res: Response, public readonly next: Next, public readonly extrinsicHash: string, public readonly unsubIfInBlock: boolean) { }
}