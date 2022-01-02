import { ApiPromise, Keyring } from '@polkadot/api';
import { CodePromise } from '@polkadot/api-contract';
import { AccountId, Hash } from '@polkadot/types/interfaces';
import { ISubmittableResult } from '@polkadot/types/types';
import BN from 'bn.js';
import fs from 'fs';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import errs from 'restify-errors';

import { Endpoint, IGroupableController, InBlockStatus } from '../model';
import {
	DEFAULT_CONTRACT_INSTANTIATION_GAS_LIMIT,
	DEFAULT_CONTRACT_INSTANTIATION_SALT,
	DEFAULT_CONTRACT_INSTANTIATION_VALUE,
	DEFAULT_UNSUB_IF_IN_BLOCK,
} from './default-optional-params';
import {
	availableBuiltinContracts,
	loadFlipperAbi,
	loadFlipperWasm,
	loadIncrementerAbi,
	loadIncrementerWasm,
} from './example-contracts/util';
import { ContractInstantiationErrorResult, ContractInstantiationSuccessResult, ExplainedModuleError } from './model';

export class InstantiationController implements IGroupableController {
	constructor(private readonly _api: ApiPromise, private readonly _keyring: Keyring) { }

	private handleTestInstantiationShouldSucceed = async (req: Request, res: Response, next: Next) => {
		try {
			// Required params
			const contractName: string = req.body.contractName;
			if (!contractName) {
				next(new errs.BadRequestError('Param `contractName` not specified.'));
				return;
			}
			if (!availableBuiltinContracts.includes(contractName)) {
				console.log(contractName);
				next(new errs.BadRequestError('Param `contractName` should be one of the following: ' + availableBuiltinContracts));
				return;
			}

			const signerAccount = this._keyring.getPair('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

			await this._api.isReady;
			const unsubIfInBlock = false;

			const abi = contractName === 'flipper' ? loadFlipperAbi() : loadIncrementerAbi();
			const wasm = contractName === 'flipper' ? loadIncrementerWasm() : loadIncrementerWasm();

			const code = new CodePromise(this._api, abi, wasm);
			const extrinsic = code.tx['default']({
				gasLimit: DEFAULT_CONTRACT_INSTANTIATION_GAS_LIMIT,
				salt: DEFAULT_CONTRACT_INSTANTIATION_SALT,
				value: DEFAULT_CONTRACT_INSTANTIATION_VALUE,
			});
			const extrinsicHash = extrinsic.hash.toHex();

			const readonlyPack = new ReadonlyStatusPack(res, next, extrinsicHash, unsubIfInBlock);
			const mutablePack = new MutableStatusPack();
			const unsub = await extrinsic.signAndSend(signerAccount, (result: ISubmittableResult) => {
				this._instantiationResultCallbackFunc(unsub, result, readonlyPack, mutablePack);
			});
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	private handleTestInstantiationShouldFailDueToInsufficientFund = async (req: Request, res: Response, next: Next) => {
		try {
			const signerAccount = this._keyring.getPair('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

			await this._api.isReady;
			const unsubIfInBlock = false;

			const abi = loadFlipperAbi();
			const wasm = loadFlipperWasm();

			const code = new CodePromise(this._api, abi, wasm);
			const extrinsic = code.tx['default']({});
			const extrinsicHash = extrinsic.hash.toHex();

			const readonlyPack = new ReadonlyStatusPack(res, next, extrinsicHash, unsubIfInBlock);
			const mutablePack = new MutableStatusPack();
			const unsub = await extrinsic.signAndSend(signerAccount, (result: ISubmittableResult) => {
				this._instantiationResultCallbackFunc(unsub, result, readonlyPack, mutablePack);
			});
		} catch (err) {
			console.error(err);
			next(err);
		}
	};


	private handlePostFromCode = async (req: Request, res: Response, next: Next) => {
		try {
			// Required params
			const signerAddress = req.body.signerAddress;
			if (!signerAddress) {
				next(new errs.BadRequestError('Param `signerAddress` not specified.'));
				return;
			}

			const abi = req.body.abi;
			if (!abi) {
				next(new errs.BadRequestError('Param `abi` not specified.'));
				return;
			}

			if (!req.files || !req.files['wasm']) {
				next(new errs.BadRequestError('Param `wasm` not specified.'));
				return;
			}
			const wasm = req.files['wasm'];

			const ctorFuncName = req.body.ctorFuncName;
			if (!ctorFuncName) {
				next(new errs.BadRequestError('Param `ctorFuncName` not specified.'));
				return;
			}

			let ctorArgs = req.body.ctorArgs;
			if (!ctorArgs) {
				next(new errs.BadRequestError('Param `ctorArgs` not specified.'));
				return;
			}

			// Optional params
			let gasLimit = DEFAULT_CONTRACT_INSTANTIATION_GAS_LIMIT;
			if (req.body.gasLimit) {
				gasLimit = req.body.gasLimit;
			}

			let salt = DEFAULT_CONTRACT_INSTANTIATION_SALT;
			if (req.body.salt) {
				salt = req.body.salt;
			}

			let value = DEFAULT_CONTRACT_INSTANTIATION_VALUE;
			if (req.body.value) {
				value = req.body.value;
			}

			let unsubIfInBlock = DEFAULT_UNSUB_IF_IN_BLOCK;
			if (req.body.unsubIfInBlock === false) {
				unsubIfInBlock = false;
			}

			// Process the params
			const signerAccount = this._keyring.getPair(signerAddress);
			const wasmBuffer = fs.readFileSync(wasm.path);

			// `ctorArgs` should be a JSON array. If it's from a POST form, it'll appear as a string, parse it to a JSON array.
			if (typeof (ctorArgs) === 'string') {
				try {
					ctorArgs = JSON.parse(ctorArgs);
				} catch (_) {
					next(new errs.BadRequestError('`ctorArgs` is not a valid JSON string.'));
				}
			}
			if (!Array.isArray(ctorArgs)) {
				next(new errs.BadRequestError('`ctorArgs` should be an array.'));
				return;
			}

			// Mess with the API calls
			await this._api.isReady;

			const code = new CodePromise(this._api, abi, wasmBuffer);
			// Make sure the constructor exists
			if (!code.tx[ctorFuncName]) {
				next(new errs.BadRequestError(`No constructor function named "${ctorFuncName}".`));
				return;
			}
			const extrinsic = code.tx[ctorFuncName]({
				gasLimit: gasLimit,
				salt: salt,
				value: value,
			}, ...ctorArgs);
			const extrinsicHash = extrinsic.hash.toHex();

			const readonlyPack = new ReadonlyStatusPack(res, next, extrinsicHash, unsubIfInBlock);
			const mutablePack = new MutableStatusPack();
			const unsub = await extrinsic.signAndSend(signerAccount, (result: ISubmittableResult) => {
				this._instantiationResultCallbackFunc(unsub, result, readonlyPack, mutablePack);
			});
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	private readonly _instantiationResultCallbackFunc = (unsub: () => void, result: ISubmittableResult, readonlyPack: ReadonlyStatusPack, mutablePack: MutableStatusPack) => {
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

			// If `result.dispatchError` is available, the instantiation failed.
			// Use the `index` and `error` fields to get an explained error and send the collected info to the client.
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
				const ret = new ContractInstantiationErrorResult(readonlyPack.extrinsicHash, explainedDispatchError, result.dispatchInfo, new InBlockStatus(mutablePack.inBlockBlockHash));
				readonlyPack.res.send(500, ret);
				return;
			}

			// If `result.dispatchError` is not available, the instantiation succeeded.
			// The contract instance "address" can be found from the last "Instantiated" event. The API hasn't provided an easy way to access it yet!!!
			// This workaround is from Canvas UI.
			// So dear API authors, tell us about your plan if you're reading this :)
			if (result.status.isInBlock) {
				const instantiatedRecords = result.filterRecords('contracts', 'Instantiated');
				if (!instantiatedRecords.length) {
					// No "Instantiated" events found, hence an error
					unsub();
					readonlyPack.next(new errs.InternalError('Cannot get any "Instantiated" event.'));
					return;
				}

				mutablePack.address = instantiatedRecords[instantiatedRecords.length - 1].event.data[1] as AccountId;
				mutablePack.inBlockBlockHash = result.status.asInBlock;

				if (readonlyPack.unsubIfInBlock) {
					unsub();
					const ret = new ContractInstantiationSuccessResult(mutablePack.address, readonlyPack.extrinsicHash, result.dispatchInfo, new InBlockStatus(mutablePack.inBlockBlockHash));
					readonlyPack.res.send(200, ret);
					readonlyPack.next();
					return;
				}

				return;
			} else {
				mutablePack.finalizedBlockHash = result.status.asFinalized;
				unsub();
				if (!mutablePack.address || !mutablePack.inBlockBlockHash) {
					// This should not happen.
					throw new Error();
				}
				const ret = new ContractInstantiationSuccessResult(mutablePack.address, readonlyPack.extrinsicHash, result.dispatchInfo, new InBlockStatus(mutablePack.inBlockBlockHash, mutablePack.finalizedBlockHash));
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
	};

	prefix = '/contract';
	endpoints = [
		new Endpoint(HTTPMethod.POST, '/from-code', [this.handlePostFromCode]),
		new Endpoint(HTTPMethod.POST, '/test-from-code', [this.handleTestInstantiationShouldSucceed]),
	];
}

class MutableStatusPack {
	constructor(public inBlockBlockHash: Hash | null = null, public finalizedBlockHash: Hash | null = null, public address: AccountId | null = null) { }
}

class ReadonlyStatusPack {
	constructor(public readonly res: Response, public readonly next: Next, public readonly extrinsicHash: string, public readonly unsubIfInBlock: boolean) { }
}
