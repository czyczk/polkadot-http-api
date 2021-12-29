import { DispatchInfo } from '@polkadot/types/interfaces';
import { AccountId } from '@polkadot/types/interfaces/runtime/types';
import { u8 } from '@polkadot/types/primitive/U8';
import { RegistryError } from '@polkadot/types/types';

import { InBlockStatus, TxExecutionResult } from '../model';


// Contains all the info to be returned to the client about the result of a successful contract instantiation. All info can be found from the `ISubmmittableResult` instance.
export class ContractInstantiationSuccessResult extends TxExecutionResult {
	constructor(public readonly address: AccountId, txHash: string, dispatchInfo: DispatchInfo, inBlockStatus: InBlockStatus) {
		super(txHash, dispatchInfo, inBlockStatus);
	}
}

// Contains all the info to be returned to the client about the result of a failed contract instantiation. All info can be found from the `ISubmmittableResult` instance.
export class ContractInstantiationErrorResult extends TxExecutionResult {
	constructor(txHash: string, public readonly explainedDispatchError: ExplainedDispatchError, dispatchInfo: DispatchInfo, inBlockStatus: InBlockStatus) {
		super(txHash, dispatchInfo, inBlockStatus);
	}
}

export class ExplainedDispatchError {
	constructor(public readonly index: u8, public readonly error: u8, public readonly type: string, public readonly details: string) { }

	static fromRegistryError(index: u8, error: u8, registryError: RegistryError): ExplainedDispatchError {
		const type = `${registryError.section}.${registryError.method}`;
		const details = registryError.docs.join(' ');
		return new this(index, error, type, details);
	}
}