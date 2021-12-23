import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import { Endpoint, IGroupableController } from './model';

export class PingController implements IGroupableController {
	handlePing = (req: Request, res: Response, next: Next) => {
		res.send('pong');
		next();
	};

	prefix = '/api/ping';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '', [this.handlePing]),
	];
}