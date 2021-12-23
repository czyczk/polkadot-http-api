import { IGroupableController } from './model';
import restify from 'restify';
import HTTPMethod from 'http-method-enum';

export const registerControllers = (server: restify.Server, controller: IGroupableController) => {
	for (const endpoint of controller.endpoints) {
		// Concatenate to get the actual endpoint URL: controller prefix + endpoint partial URL
		const url = controller.prefix + endpoint.url;

		// Register according to the HTTP method
		switch (endpoint.method) {
			case HTTPMethod.GET:
				server.get(url, ...endpoint.handlers);
				break;
			case HTTPMethod.POST:
				server.post(url, ...endpoint.handlers);
				break;
			case HTTPMethod.PUT:
				server.put(url, ...endpoint.handlers);
				break;
			case HTTPMethod.PATCH:
				server.patch(url, ...endpoint.handlers);
				break;
			case HTTPMethod.DELETE:
				server.del(url, ...endpoint.handlers);
				break;
			case HTTPMethod.HEAD:
				server.head(url, ...endpoint.handlers);
				break;
			case HTTPMethod.OPTIONS:
				server.opts(url, ...endpoint.handlers);
				break;
			default:
				throw new RangeError('Unsupported HTTP method.');
		}
	}
};