import { ApiPromise } from '@polkadot/api';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import {EventManager, EventStruct} from '../../event-manager/event-manager';
import { Endpoint, IGroupableController, SubscribableContractEvent } from '../model';
import errs from 'restify-errors';

export class EventController implements IGroupableController {
	private eventManager:EventManager;
	constructor(private readonly _api: ApiPromise) { 
		this.eventManager = EventManager.getInstance();
		this.handleGetSystemChainTest();
	}
	async handleGetSystemChainTest(){
		try {
			await this._api.isReady;
			this._api.rpc.beefy.subscribeJustifications;
			// subscribe new header
			await this._api.rpc.chain.subscribeNewHeads(async (lastHeader) => { 
				this._api.hasSubscriptions;
				// iterate events at certain block with hash
				// events is a list collection of event
				await (await this._api.at(lastHeader.hash)).query.system.events((events:any)=> {
					//console.log(events);
					events.forEach((record:any) => {
						/*
						* record basic struct is a map which contain phase, event and topic
						* phase is a map which has key "applyExtrinsic" 0 or '1'
						* event is a map that we focus on
						* topic is a map, but i didn't recognize the using of it.
						*Type(3) [Map] {
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
						// decompose event
						const { event, phase } = record;
						//console.log(event.section, event.section == 'ContractEmitted');
						// event.section is the type of event, in this case we just focus on ContractEmitted
						if (event.method == 'ContractEmitted') {
							//console.log(event);
							let contractAddress;
							let subscribableContractEvent;
							let eventId;
							event.data.forEach((data:any, index:any) => {
								// data[0] is contractAddress
								if (index === 0) {
									contractAddress = data.toString();
								}
								// data[1] is result decoded by substrate code
								if (index === 1) {
									const decodeResult = JSON.parse(this._api.createType('SubscribableContractEvent', data).toString());
									//console.log(decodeResult);
									eventId = decodeResult['eventId'];
									subscribableContractEvent = new SubscribableContractEvent( decodeResult['eventId'], decodeResult['structId']);
								}
		
							});
							for (const eventAsString of this.eventManager.getEventKeys()) {
								const event = EventStruct.deserialization(eventAsString);
								if (event!=undefined && subscribableContractEvent) {
									if(event.getContractAddress() == contractAddress && event.getEventID() == eventId) {
										// console.log(subscribableContractEvent);
										this.eventManager.addEventInfo(event, subscribableContractEvent);
									}
								}
							}
						}
						
					});
				});
			});
		} catch (err) {
			console.error(err);
		}
	}

	handleSubscribeEvent = (req:Request, res:Response, next:Next) => {
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
		
		const event = new EventStruct(contractAddress, eventID);

		if (this.eventManager.isExistKey(event)) {
			next(new errs.BadRequestError(`Subscription contract address ${contractAddress} event id ${eventID} exist`));
			return;
		}

		try {
			this.eventManager.subscribeEvent(event);
			res.send(200, {'message': 'Subscribe success'});
			return;
		} catch (err) {
			next(new errs.BadRequestError(err));
			return;
		}
	};

	handleUnsubscribeEvent = (req:Request, res:Response, next:Next) => {
		const eventID = req.params.eventID;
		const contractAddress = req.params.contractAddress;
		//console.log('handleUnsubscriptEvent',event.serialization());
		
		if (!eventID) {
			next(new errs.BadRequestError('Param `eventID` not specified.'));
			return;
		}

		if (!contractAddress) {
			next(new errs.BadRequestError('Param `contractAddress` not specified.'));
			return;
		}

		const event = new EventStruct(contractAddress, eventID);
		
		if (!this.eventManager.isExistKey(event)) {
			next(new errs.BadRequestError(`Subscription contract address ${contractAddress} event id ${eventID} not exist`));
			return;
		}

		try {
			this.eventManager.unsubscribeEvent(event);
			res.send(200, 
				{'message': 'Unsubscribe success'});
			return;
		} catch (err) {
			next(new errs.BadRequestError(err));
			return;
		}
	};

	handleReleaseEvent = (req:Request, res:Response, next:Next) => {
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

		const event = new EventStruct(contractAddress, eventID);

		if (!this.eventManager.isExistKey(event)) {
			next(new errs.BadRequestError(`Subscription contract address ${contractAddress} event id ${eventID} not exist`));
			return;
		}
		try {
			const result = this.eventManager.releaseEventInfo(event);
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