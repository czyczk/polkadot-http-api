import { ApiPromise, Keyring, SubmittableResult } from '@polkadot/api';
import { ISubmittableResult } from '@polkadot/types/types';
import { CodePromise } from '@polkadot/api-contract';
import { BlueprintSubmittableResult } from '@polkadot/api-contract/base/Blueprint';
import { Hash } from '@polkadot/types/interfaces';
import { AccountId } from '@polkadot/types/interfaces/runtime/types';
import fs from 'fs';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import { InternalError } from 'restify-errors';

import { Endpoint, IGroupableController, TxExecutionResult } from '../model';

export class QueryController implements IGroupableController {
	constructor(private readonly _api: ApiPromise, private readonly _keyring: Keyring) { }

	private readonly _abi = fs.readFileSync('./src/controller/contract/example-contract/metadata.json').toString();
	private readonly _wasm = fs.readFileSync('./src/controller/contract/example-contract/flipper.wasm');

	handleGetGet = async (req: Request, res: Response, next: Next) => {
		try {
			const signerAccount = this._keyring.getPair('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

			await this._api.isReady;
			let inBlockBlockHash: Hash;

			const code = new CodePromise(this._api, this._abi, this._wasm);
			const extrinsic = code.tx['default']({});
			//const unsub = await extrinsic.signAndSend(signerAccount, (result: BlueprintSubmittableResult<'promise'>) => {
			const unsub = await extrinsic.signAndSend(signerAccount, (result: SubmittableResult) => {
				if (result.status.isInBlock) {
					inBlockBlockHash = result.status.asInBlock;
					unsub();

					//if (!result.contract) {
					//	next(new InternalError('Cannot get `contract` object from `BlueprintSubmittableResult`.'));
					//	return;
					//}
					//const contract = result.contract;

					//const ret = new ContractInitializationResult(contract.address, extrinsic.hash.toHex(), inBlockBlockHash);
					const ret = result.toHuman(true);
					res.send(200, ret);
				}
			});
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/contract/query';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/get', [this.handleGetGet]),
	];
}

export class ContractInitializationResult extends TxExecutionResult {
	constructor(public address: AccountId, txHash: string, inBlockBlockHash: Hash, finalizedBlockHash?: Hash) {
		super(txHash, inBlockBlockHash, finalizedBlockHash);
	}
}