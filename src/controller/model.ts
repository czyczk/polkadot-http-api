import { Hash } from '@polkadot/types/interfaces';
import HTTPMethod from 'http-method-enum';
import restify from 'restify';

export interface IGroupableController {
	// A prefix indicating to which API group the endpoints should belong to. The URLs of all the containing endpoints will begin with this prefix.
	readonly prefix?: string;
	// A list indicating the endpoints to register to restify.
	readonly endpoints: Endpoint[];
}

export class Endpoint {
	// HTTP method of the endpoint
	private _method: HTTPMethod;
	public get method() {
		return this._method;
	}

	// URL after the prefix
	private _url: string;
	public get url(): string {
		return this._url;
	}

	// A list of Restify request handler functions
	private _handlers: restify.RequestHandlerType[];
	public get handlers(): restify.RequestHandlerType[] {
		return this._handlers;
	}

	constructor(method: HTTPMethod, url: string, handlers: restify.RequestHandlerType[]) {
		this._method = method;
		this._url = url;
		this._handlers = handlers;
	}
}

export class TxExecutionResult {
	constructor(public txHash: string, public inBlockBlockHash: Hash, public finalizedBlockHash?: Hash) { }
}