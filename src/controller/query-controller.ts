import { Next, Request, Response } from 'restify';
import { QueryService } from '../service/query-service';
import errs from 'restify-errors';
import { Endpoint, IGroupableController } from './model';
import HTTPMethod from 'http-method-enum';

export class QueryController implements IGroupableController {
	constructor(private readonly _queryService: QueryService) { }

	handleGetNow = async (req: Request, res: Response, next: Next) => {
		try {
			const now = await this._queryService.getNow();
			res.send(200, {
				now: now.toJSON(),
			});
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleGetSystemAccount = async (req: Request, res: Response, next: Next) => {
		try {
			const addr = req.params.addr;
			if (addr === '') {
				next(new errs.BadRequestError('Param `addr` not specified.'));
				return;
			}

			const result = await this._queryService.getSystemAccount(addr);
			res.send(200, result);
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/api/query';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/timestamp/now', [this.handleGetNow]),
		new Endpoint(HTTPMethod.GET, '/system/account/:addr', [this.handleGetSystemAccount]),
	];
}