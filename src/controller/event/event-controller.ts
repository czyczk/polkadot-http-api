import { ApiPromise } from '@polkadot/api';
import { EventRecord, Header } from '@polkadot/types/interfaces';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import errs from 'restify-errors';

import { EventManager, Subscription, SubscribableContractEvent } from '../../event-manager/event-manager';
import { Endpoint, IGroupableController } from '../model';

export class EventController implements IGroupableController {
	private _eventManager: EventManager;

	constructor(private readonly _api: ApiPromise) {
		this._eventManager = EventManager.getInstance();
		this.chainEventListenerWorkerFunc();
	}

	async chainEventListenerWorkerFunc() {
		try {
			await this._api.isReady;
			// Subscribe new headers to listen new events emmitted from now
			await this._api.rpc.chain.subscribeNewHeads(async (lastHeader: Header) => {
				// Iterate through the event records in a certain block identified by its hash
				await (await this._api.at(lastHeader.hash)).query.system.events((records: EventRecord[]) => {
					records.forEach((record: EventRecord) => {
						/*
						* `record` is a map which contains `phase`, `event` and `topic`
						* `phase` is a map which has a key "applyExtrinsic" with value of either '0' or '1'
						* `event` is the map that we'll focus on
						* `topic` is a map that will be useful when topics of events are important. Not useful at this moment though.
						* Type(3) [Map] {
							'phase' => Type {
								<!-- snip -->
							},
							'event' => Type(2) [Map] {
								'index' => Type(2) [Uint8Array] [
								<!-- snip -->
								],
								'data' => GenericEventData(1) [
								[Type [Map]],
								<!-- snip -->
							},
							'topics' => Type(0) [
								registry: TypeRegistry { createdAtHash: undefined },
								createdAtHash: undefined,
								initialU8aLength: 1
							],
							<!-- snip -->
							}
						*/

						// Decompose the record. Only the `event` field is useful for now
						const { event } = record;

						// `event.method` indicates the source of the event.
						// In this case we only care about "ContractEmitted" and ignore others
						if (event.method !== 'ContractEmitted') {
							return;
						}

						// event.data[0] is the contract address
						// event.data[1] is an event struct emmitted from the contract, SCALE encoded
						const contractAddress = event.data[0].toString();
						let decodedContractEvent: { [index: string]: string };
						try {
							console.debug('---');
							console.debug('Received an event likely to be decodable.')
							console.debug(event.data.toHuman());
							decodedContractEvent = this._api.createType('SubscribableContractEvent', event.data[1]).toJSON() as ({ [index: string]: string });
							console.debug('Decoded:');
							console.debug(decodedContractEvent);
						} catch (err) {
							// If it cannot be decoded, it must be an unrecognizable contract event which should be ignored.
							console.warn(err);
							return;
						}

						// Create a `SubscribableContractEvent` object with the collected info
						const eventId = decodedContractEvent['eventId'];
						const subscribableContractEvent = new SubscribableContractEvent(eventId, decodedContractEvent['message']);

						// Check if the event is what the client is expecting (subscribed in the event manager)
						for (const subscription of this._eventManager.getSubscriptions()) {
							if (subscription.contractAddress !== contractAddress || subscription.eventId !== eventId) {
								continue;
							}

							this._eventManager.addEventToSubscription(subscription, subscribableContractEvent);
						}

					});
				});
			});
		} catch (err) {
			console.error(err);
		}
	}

	handleCreateSubscription = (req: Request, res: Response, next: Next) => {
		const clientId = req.body.clientId;
		const eventId = req.body.eventId;
		const contractAddress = req.body.contractAddress;

		if (!clientId) {
			next(new errs.BadRequestError('Param `clientId` not specified.'));
			return;
		}

		if (!eventId) {
			next(new errs.BadRequestError('Param `eventId` not specified.'));
			return;
		}

		if (!contractAddress) {
			next(new errs.BadRequestError('Param `contractAddress` not specified.'));
			return;
		}

		const subscription = new Subscription(clientId, contractAddress, eventId);

		if (this._eventManager.hasSubscription(subscription)) {
			res.send(303, `Subscription of client ID '${clientId}', contract address '${contractAddress}' and event ID '${eventId}' already exists.`);
			next();
			return;
		}

		try {
			this._eventManager.addSubscription(subscription);
			res.send(201);
			return;
		} catch (err) {
			next(new errs.BadRequestError(err));
			return;
		}
	};

	handleRemoveSubscription = (req: Request, res: Response, next: Next) => {
		const clientId = req.params.clientId;
		const eventId = req.params.eventId;
		const contractAddress = req.params.contractAddress;

		if (!clientId) {
			next(new errs.BadRequestError('Param `clientId` not specified.'))
			return;
		}

		if (!eventId) {
			next(new errs.BadRequestError('Param `eventId` not specified.'));
			return;
		}

		if (!contractAddress) {
			next(new errs.BadRequestError('Param `contractAddress` not specified.'));
			return;
		}

		const subscription = new Subscription(clientId, contractAddress, eventId);

		if (!this._eventManager.hasSubscription(subscription)) {
			res.send(404);
			return;
		}

		try {
			this._eventManager.removeSubscription(subscription);
			res.send(204);
			return;
		} catch (err) {
			next(new errs.BadRequestError(err));
			return;
		}
	};

	handleReleaseSubscriptionEvents = (req: Request, res: Response, next: Next) => {
		const clientId = req.params.clientId;
		const eventId = req.params.eventId;
		const contractAddress = req.params.contractAddress;

		if (!clientId) {
			next(new errs.BadRequestError('Param `clientId` not specified.'));
			return;
		}

		if (!eventId) {
			next(new errs.BadRequestError('Param `eventId` not specified.'));
			return;
		}

		if (!contractAddress) {
			next(new errs.BadRequestError('Param `contractAddress` not specified.'));
			return;
		}

		const subscription = new Subscription(clientId, contractAddress, eventId);

		if (!this._eventManager.hasSubscription(subscription)) {
			res.send(404);
			return;
		}

		try {
			const result = this._eventManager.releaseEventsFromSubscription(subscription);
			res.send(200, result);
			return;
		} catch (err) {
			next(new errs.BadRequestError(err));
			return;
		}
	};

	prefix = '/event';
	endpoints = [
		new Endpoint(HTTPMethod.POST, '/subscription', [this.handleCreateSubscription]),
		new Endpoint(HTTPMethod.DELETE, '/subscription/:clientId/:contractAddress/:eventId', [this.handleRemoveSubscription]),
		new Endpoint(HTTPMethod.GET, '/subscription/:clientId/:contractAddress/:eventId', [this.handleReleaseSubscriptionEvents]),
	];
}
