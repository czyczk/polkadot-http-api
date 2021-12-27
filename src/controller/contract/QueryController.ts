import { ApiPromise } from '@polkadot/api';
import { BlueprintPromise, CodePromise } from '@polkadot/api-contract';
import { Code } from '@polkadot/api-contract/promise';
import fs from 'fs';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';

import { Endpoint, IGroupableController } from '../model';

export class QueryController implements IGroupableController {
	constructor(private readonly _api: ApiPromise) { }

	private readonly _abi = fs.readFileSync('./src/controller/contract/example-contract/metadata.json').toString();
	private readonly _wasm = fs.readFileSync('./src/controller/contract/example-contract/flipper.wasm');

	handleGetGet = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const code = new CodePromise(this._api, this._abi, this._wasm);
			code.tx['constructor']({});
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/contract';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/query/get', [this.handleGetGet]),
	];
}