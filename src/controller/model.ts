import { DispatchInfo, Hash } from '@polkadot/types/interfaces';
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

// Contains all the info to be returned to the client about the result of the transaction execution. All info can be found from the `ISubmmittableResult` instance.
export class TxExecutionResult {
	constructor(public readonly txHash: string, public readonly dispatchInfo: DispatchInfo, public readonly inBlockStatus: InBlockStatus) { }
}

export class InBlockStatus {
	constructor(public readonly inBlock: Hash, public readonly finalized?: Hash) { }
}