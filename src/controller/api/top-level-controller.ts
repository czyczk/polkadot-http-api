import { ApiPromise } from '@polkadot/api';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';

import { Endpoint, IGroupableController } from '../model';

export class TopLevelController implements IGroupableController {
	constructor(private readonly _api: ApiPromise) { }

	handleGetGenesisHash = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const genesisHash = this._api.genesisHash;
			res.send(200, genesisHash);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetLibraryInfo = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const libraryInfo = this._api.libraryInfo;
			res.send(200, libraryInfo);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetRuntimeChain = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const runtimeChain = this._api.runtimeChain;
			res.send(200, runtimeChain);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetRuntimeMetadata = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const runtimeMetadata = this._api.runtimeMetadata;
			res.send(200, runtimeMetadata);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetRuntimeVersion = async (req: Request, res: Response, next: Next) => {
		try {
			await this._api.isReady;
			const runtimeVersion = this._api.runtimeVersion;
			res.send(200, runtimeVersion);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/api';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/genesis-hash', [this.handleGetGenesisHash]),
		new Endpoint(HTTPMethod.GET, '/library-info', [this.handleGetLibraryInfo]),
		new Endpoint(HTTPMethod.GET, '/runtime-chain', [this.handleGetRuntimeChain]),
		new Endpoint(HTTPMethod.GET, '/runtime-metadata', [this.handleGetRuntimeMetadata]),
		new Endpoint(HTTPMethod.GET, '/runtime-version', [this.handleGetRuntimeVersion]),
	];
}