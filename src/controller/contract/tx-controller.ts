import { ApiPromise, Keyring } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import { Endpoint, IGroupableController } from '../model';
import { DEFAULT_CONTRACT_TX_GAS_LIMIT, DEFAULT_CONTRACT_TX_VALUE } from './default-optional-params';
import { loadFlipperAbi, loadIncrementerAbi } from './example-contracts/util';
import { ISubmittableResult } from '@polkadot/types/types';

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

			//const extrinsic = contract.tx['incAndEmitEventAndFail']({
			const extrinsic = contract.tx['incAndReturnValue']({
				gasLimit: gasLimit,
				value: value,
			}, 1);
			const unsub = await extrinsic.signAndSend(signerAccount, (result: ISubmittableResult) => {
				if (result.status.isInBlock || result.status.isFinalized) {
					console.log(result);
					res.send(200, result);
					unsub();
					next();
				}
			});
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handlePostTx = this.handleTestTxShouldSucceed;

	prefix = '/contract/tx';
	endpoints = [
		new Endpoint(HTTPMethod.POST, '', [this.handlePostTx]),
	];
}