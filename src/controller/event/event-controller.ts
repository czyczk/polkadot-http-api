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
							decodedContractEvent = this._api.createType('SubscribableContractEvent', event.data[1]).toJSON() as ({ [index: string]: string });
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

	handleSubscribeEvent = (req: Request, res: Response, next: Next) => {
		const eventID = req.body.eventID;
		const contractAddress = req.body.contractAddress;
		if (!eventID) {
			next(new errs.BadRequestError('Param `eventID` not specified.'));
			return;
		}

		if (!contractAddress) {
			next(new errs.BadRequestError('Param `contractAddress` not specified.'));
			return;
		}

		const event = new Subscription(contractAddress, eventID);

		if (this._eventManager.hasSubscription(event)) {
			next(new errs.BadRequestError(`Subscription contract address ${contractAddress} event id ${eventID} exist`));
			return;
		}

		try {
			this._eventManager.addSubscription(event);
			res.send(200, { 'message': 'Subscribe success' });
			return;
		} catch (err) {
			next(new errs.BadRequestError(err));
			return;
		}
	};

	handleUnsubscribeEvent = (req: Request, res: Response, next: Next) => {
		const eventID = req.params.eventID;
		const contractAddress = req.params.contractAddress;

		if (!eventID) {
			next(new errs.BadRequestError('Param `eventID` not specified.'));
			return;
		}

		if (!contractAddress) {
			next(new errs.BadRequestError('Param `contractAddress` not specified.'));
			return;
		}

		const event = new Subscription(contractAddress, eventID);

		if (!this._eventManager.hasSubscription(event)) {
			next(new errs.BadRequestError(`Subscription contract address ${contractAddress} event id ${eventID} not exist`));
			return;
		}

		try {
			this._eventManager.removeSubscription(event);
			res.send(200,
				{ 'message': 'Unsubscribe success' });
			return;
		} catch (err) {
			next(new errs.BadRequestError(err));
			return;
		}
	};

	handleReleaseEvent = (req: Request, res: Response, next: Next) => {
		const eventID = req.params.eventID;
		const contractAddress = req.params.contractAddress;

		if (!eventID) {
			next(new errs.BadRequestError('Param `eventID` not specified.'));
			return;
		}

		if (!contractAddress) {
			next(new errs.BadRequestError('Param `contractAddress` not specified.'));
			return;
		}

		const event = new Subscription(contractAddress, eventID);

		if (!this._eventManager.hasSubscription(event)) {
			next(new errs.BadRequestError(`Subscription contract address ${contractAddress} event id ${eventID} not exist`));
			return;
		}
		try {
			const result = this._eventManager.releaseEventsFromSubscription(event);
			// 404
			res.send(200, {
				'parsedContractEventsList': result
			});
			return;
		} catch (err) {
			next(new errs.BadRequestError(err));
			return;
		}
	};

	prefix = '/event';
	endpoints = [
		new Endpoint(HTTPMethod.POST, '/subscription', [this.handleSubscribeEvent]),
		new Endpoint(HTTPMethod.DELETE, '/subscription/:contractAddress/:eventID', [this.handleUnsubscribeEvent]),
		new Endpoint(HTTPMethod.GET, '/subscription/:contractAddress/:eventID', [this.handleReleaseEvent]),
	];
}