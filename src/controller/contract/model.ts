import { DispatchInfo } from '@polkadot/types/interfaces';
import { AccountId } from '@polkadot/types/interfaces/runtime/types';

import { InBlockStatus, TxExecutionResult } from '../model';


// Contains all the info to be returned to the client about the result of a successful contract instantiation. All info can be found from the `ISubmmittableResult` instance.
export class ContractInstantiationSuccessResult extends TxExecutionResult {
	constructor(public readonly address: AccountId, txHash: string, dispatchInfo: DispatchInfo, inBlockStatus: InBlockStatus) {
		super(txHash, dispatchInfo, inBlockStatus);
	}
}

// Contains all the info to be returned to the client about the result of a failed contract instantiation. All info can be found from the `ISubmmittableResult` instance.
export class ContractInstantiationErrorResult extends TxExecutionResult {
	constructor(txHash: string, public readonly dispatchErrorIndex: ExplainedDispatchError, dispatchInfo: DispatchInfo, inBlockStatus: InBlockStatus) {
		super(txHash, dispatchInfo, inBlockStatus);
	}
}

export class ExplainedDispatchError {
	constructor(public readonly index: number, public readonly error: number, public readonly type: string, public readonly details: string) { }

	static fromDispatchError(index: number, error: number): ExplainedDispatchError {
		// TODO
		return new this(index, error, '', '');
	}
}