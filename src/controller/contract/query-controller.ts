import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { ContractCallOutcome } from '@polkadot/api-contract/types';
import BN from 'bn.js';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import errs from 'restify-errors';

import { Endpoint, IGroupableController } from '../model';
import { DEFAULT_CONTRACT_QUERY_GAS_LIMIT, DEFAULT_CONTRACT_QUERY_VALUE } from './default-optional-params';
import { loadFlipperAbi } from './example-contracts/util';
import { ContractQueryErrorResult, ContractQuerySuccessResult, ExplainedModuleError } from './model';

export class QueryController implements IGroupableController {
	constructor(private readonly _api: ApiPromise) { }

	private handleTestQueryGetShouldSucceed = async (req: Request, res: Response, next: Next) => {
		try {
			const abi = loadFlipperAbi();
			const address = '5G4gQtoM8aihMBnt7DmJS7aQfh3NjC54NhXLRqKPdsKu8F2H';
			const callerAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

			await this._api.isReady;
			const contract = new ContractPromise(this._api, abi, address);
			const value = DEFAULT_CONTRACT_QUERY_VALUE;
			const gasLimit = 3_000_000_000;

			const callOutcome = await contract.query.get(callerAddress, {
				gasLimit: gasLimit,
				value: value,
			});

			await this._queryResultHelperFunc(callOutcome, res, next);
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	private handleTestQueryGetShouldFail = async (req: Request, res: Response, next: Next) => {
		try {
			const abi = loadFlipperAbi();
			const address = '5Cp5e1C38HtsBB4mnRFgidzxSJu3KZQLXjnrmwH4jLMEK8Lw'; // Non-existent contract address
			const callerAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

			await this._api.isReady;
			const contract = new ContractPromise(this._api, abi, address);
			const value = DEFAULT_CONTRACT_QUERY_VALUE;
			const gasLimit = 3_000_000_000;

			const callOutcome = await contract.query.get(callerAddress, {
				gasLimit: gasLimit,
				value: value,
			});

			await this._queryResultHelperFunc(callOutcome, res, next);
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	// Actually mapped as a POST endpoint, because weird things happen if the GET query string is too long
	handleGetQuery = async (req: Request, res: Response, next: Next) => {
		try {
			// Required params
			const abi = req.body.abi;
			if (!abi) {
				next(new errs.BadRequestError('Param `abi` not specified.'));
				return;
			}

			const contractAddress = req.body.contractAddress;
			if (!contractAddress) {
				next(new errs.BadRequestError('Param `contractAddress` not specified.'));
				return;
			}

			const callerAddress = req.body.callerAddress;
			if (!callerAddress) {
				next(new errs.BadRequestError('Param `callerAddress` not specified.'));
				return;
			}

			const funcName = req.body.funcName;
			if (!funcName) {
				next(new errs.BadRequestError('Param `funcName` not specified.'));
				return;
			}

			let funcArgs = req.body.funcArgs;
			if (!funcArgs) {
				next(new errs.BadRequestError('Param `funcArgs` not specified.'));
				return;
			}

			// Optional params
			let gasLimit = DEFAULT_CONTRACT_QUERY_GAS_LIMIT;
			if (req.body.gasLimit) {
				gasLimit = req.body.gasLimit;
			}

			// Process the params
			// `funcArgs` should be a JSON array. Since it's from the GET query, it'll appear as a string, parse it to a JSON array.
			if (typeof (funcArgs) === 'string') {
				try {
					funcArgs = JSON.parse(funcArgs);
				} catch (_) {
					next(new errs.BadRequestError('`funcArgs` is not a valid JSON string.'));
				}
			}
			if (!Array.isArray(funcArgs)) {
				next(new errs.BadRequestError('`funcArgs` should be an array.'));
				return;
			}

			// Do API calls
			await this._api.isReady;
			const contract = new ContractPromise(this._api, abi, contractAddress);
			const value = DEFAULT_CONTRACT_QUERY_VALUE;

			// Make sure the function exists
			if (!contract.query[funcName]) {
				next(new errs.BadRequestError(`No function named "${funcName}".`));
				return;
			}
			const callOutcome = await contract.query[funcName](callerAddress, {
				gasLimit: gasLimit,
				value: value,
			}, ...funcArgs);

			await this._queryResultHelperFunc(callOutcome, res, next);
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	private readonly _queryResultHelperFunc = async (callOutcome: ContractCallOutcome, res: Response, next: Next) => {
		if (callOutcome.result.isOk) {
			// `output` should `.toJSON()`. Or a normal number, say 1 will be displayed as "0x01".
			const ret = new ContractQuerySuccessResult(callOutcome.output?.toJSON(), callOutcome.gasConsumed.toNumber());
			res.send(200, ret);
			next();
		} else {
			const queryError = callOutcome.result.asErr;
			if (!queryError.isModule) {
				// TODO: Cannot handle non module errors yet.
				throw new errs.NotImplementedError('`result.asErr` is not a module error. We don\'t know how to handle it yet.');
			}

			// Get the explanation for the error
			const moduleError = queryError.asModule;
			const metaError = this._api.registry.findMetaError({ index: new BN(moduleError.index), error: new BN(moduleError.error) });

			const explainedDispatchError = ExplainedModuleError.fromRegistryError(moduleError.index, moduleError.error, metaError);
			const ret = new ContractQueryErrorResult(explainedDispatchError, callOutcome.debugMessage.toString(), callOutcome.gasConsumed.toNumber());
			res.send(500, ret);
			next();
		}
	};

	prefix = '/contract/query';
	endpoints = [
		new Endpoint(HTTPMethod.POST, '', [this.handleGetQuery]),
	];
}
