import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';

import { Endpoint, IGroupableController } from '../model';

export class PingController implements IGroupableController {
	handlePing = (req: Request, res: Response, next: Next) => {
		res.send(200, 'pong');
		next();
	};

	prefix = '/ping';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '', [this.handlePing]),
	];
}