import { ApiPromise } from '@polkadot/api';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import {EventManager, EventStruct} from '../../event-manager/event-manager';
import { Endpoint, IGroupableController, subscribableContractEventForTypes, SubscribableContractEvent } from '../model';

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
				// console.log(this._api.createType('Uint8Array', allRecords2).toHuman());
				//console.log(stringAllRecords2);
				// stringAllRecords2.forEach((event:any)=>{
				// 	if (event.event.method == 'ContractEmitted') {
				// 		console.log(event.event.data);
				// 		console.log(this._api.createType('Uint8Array', event.event.data[1]).toHuman());

				// 	}
				// });
				//console.log(typeof allRecords2.toHuman());
				//console.log(allRecords2.toHuman()?.toLocaleString());
				// (await this._api.at(lastHeader.hash)).query.system.events((events: any[])=>{
				// 	events.forEach((record: any) => {
				// 		//console.log('hello');
				// 		//console.log(record);
				// 		const {event, phase} = record;
				// 		//console.log(event.section, event.method);
				// 		if (event.method === 'ContractEmitted') {
				// 			event.data.forEach((dataItem:any) => {
				// 				console.log(typeof dataItem);
				// 				console.log(dataItem);
							
				// 			});
				// 		}
				// 		//console.log(phase);
				// 	});
					
				// });
				// for (const item of stringAllRecords) {
				// 	//console.log(item);
				// 	// const eventID = item.event.method;
				// 	//console.log(eventID, event.getEventID(), event.getEventID() == eventID);
				// 	console.log(typeof item.event.data,item.event.data);
				// 	for (const i of item.event.data) {
				// 		console.log(typeof i,i);
				// 	}
				// }
				// for (const name of this.eventManager.getEventKeys()) {
				// 	const event = EventStruct.deserialization(name);
				// 	//console.log(event);
				// 	if (event != undefined){
				// 		for (const item of stringAllRecords) {
				// 			//console.log(item);
				// 			const eventID = item.event.method;
				// 			//console.log(eventID, event.getEventID(), event.getEventID() == eventID);
				// 			if (event.getEventID() == eventID) {
				// 				//console.log(item.event.data, event.getContractAddress(), item.event.data.indexOf(event.getContractAddress()));
				// 				if (item.event.data.indexOf(event.getContractAddress()) != -1) {
				// 					//console.log(item, event);
				// 					this.eventManager.addEventInfo(event, JSON.stringify(item));
				// 				}
				// 			}
				// 		}	
				// 	}
				// 	//this._api.query.system.events;
				// }
			});
		} catch (err) {
			console.error(err);
		}
	}

	handleSubscribeEvent = (req:Request, res:Response, next:Next) => {
		const eventID = req.body.eventID;
		const contractAddress = req.body.contractAddress;
		const event = new EventStruct(contractAddress, eventID);
		if (this.eventManager.isExistKey(event)) {
			res.send(404, 'Subscription exist ');
			return;
		}
		try {
			this.eventManager.subscribeEvent(event);
			res.send(200, 'Subscribe success');
			return;
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleUnsubscribeEvent = (req:Request, res:Response, next:Next) => {
		const eventID = req.params.eventID;
		const contractAddress = req.params.contractAddress;
		const event = new EventStruct(contractAddress, eventID);
		//console.log('handleUnsubscriptEvent',event.serialization());
		if (!this.eventManager.isExistKey(event)) {
			res.send(404, 'Subscription not exist ');
			return;
		}
		try {
			this.eventManager.unsubscribeEvent(event);
			// 404
			res.send(200, 'Unsubscribe success');
			return;
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleReleaseEvent = (req:Request, res:Response, next:Next) => {
		const eventID = req.params.eventID;
		const contractAddress = req.params.contractAddress;
		const event = new EventStruct(contractAddress, eventID);
		//console.log('handleReleaseEvent',event.serialization());
		if (!this.eventManager.isExistKey(event)) {
			res.send(404, 'Subscription not exist ');
			return;
		}
		try {
			const result = this.eventManager.releaseEventInfo(event);
			console.log(result);
			// 404
			res.send(200, result);
			return;
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleBlockTest = async (req:Request, res:Response, next:Next) => {
		const hash = req.body.hash;
		const blockHash = await this._api.rpc.chain.getBlockHash(1);
		const signedBlock = await this._api.rpc.chain.getBlock(blockHash);
		const allRecords = await (await this._api.at(blockHash)).query.system.events();
		
		res.send(200,'');
		return ;
	};

	prefix = '/event';
	endpoints = [
		new Endpoint(HTTPMethod.POST, '/subscription', [this.handleSubscribeEvent]),
		new Endpoint(HTTPMethod.DELETE, '/subscription/:contractAddress/:eventID', [this.handleUnsubscribeEvent]),
		new Endpoint(HTTPMethod.GET, '/subscription/:contractAddress/:eventID', [this.handleReleaseEvent]),
		new Endpoint(HTTPMethod.POST, '/getBlock', [this.handleBlockTest]),
	];
}