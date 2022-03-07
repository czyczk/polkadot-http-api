import { ApiPromise } from '@polkadot/api';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import {EventManager, EventStruct} from '../../event-manager/event-manager';
import { Endpoint, IGroupableController } from '../model';

export class EventController implements IGroupableController {
	private eventManager:EventManager;
	constructor(private readonly _api: ApiPromise) { 
		this.eventManager = EventManager.getInstance();
		this.handleGetSystemChainTest();
	}
	async handleGetSystemChainTest(){
		try {
			await this._api.isReady;
			//const chain = await this._api.rpc.system.chain(); 
			//const lastHeader = await this._api.rpc.chain.getHeader(); 
			const chain = await this._api.rpc.system.chain(); 
			this._api.rpc.beefy.subscribeJustifications;
			await this._api.rpc.chain.subscribeNewHeads(async (lastHeader) => { 
				this._api.hasSubscriptions;
				console.log(`${chain}: last block #${lastHeader.number} has hash ${lastHeader.hash}`);
				/**
				 * managerEvent
				 * headerhasp=>block
				 * for event in Manger Event:
				 *	manager.hashmap.get(event).append(extraction(event, block))
				 * eventId
				 * return hashmap.pull(hashmap.get(event))
				 */
				//const signedBlock = await this._api.rpc.chain.getBlock(lastHeader.hash);
				const allRecords = await this._api.query.system.events.at(lastHeader.hash);
				const allRecords2 = (await this._api.at(lastHeader.hash)).query.system.events;
				// console.log('--------first');
				// console.log(allRecords);
				// console.log('--------second');
				// console.log(allRecords2);
				//console.log((await (allRecords2.events.system)));
				//VSCode eslint
				// signedBlock.block.extrinsics.forEach(({ method: { method, section } }, index) => {
				// 	// filter the specific events based on the phase and then the
				// 	// index of our extrinsic in the block
				// 	//const phase = 'phase';
				// 	const events = allRecords
				// 	  .filter(({ phase }) =>
				// 		phase.isApplyExtrinsic &&
				// 		phase.asApplyExtrinsic.eq(index)
				// 	  )
				// 	  .map(({ event }) => `${event.section}.${event.method}`);
				// eslint-disable-next-line no-mixed-spaces-and-tabs
				  
				// 	console.log(`${section}.${method}:: ${events.join(', ') || 'no events'}`);
				//   });
				for (const name of this.eventManager.getEventKeys()) {
					const event = EventStruct.deserialization(name);
					if (event != undefined){
						this.eventManager.addEventInfo(event, String(lastHeader.number));
					}
					//this._api.query.system.events;
				}
			});
		} catch (err) {
			console.error(err);
		}
	}

	handleSubscriptEvent = (req:Request, res:Response, next:Next) => {
		const eventID = req.body.eventID;
		const contrastAddress = req.body.contrastAddress;
		const event = new EventStruct(contrastAddress, eventID);
		console.log('handleSubscriptEvent',event.serialization());
		try {
			this.eventManager.subscribeEvent(event);
			res.send(200, 'subscribe success');
			return;
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	handleUnsubscriptEvent = (req:Request, res:Response, next:Next) => {
		const eventID = req.params.eventID;
		const contrastAddress = req.params.contrastAddress;
		const event = new EventStruct(contrastAddress, eventID);
		console.log('handleUnsubscriptEvent',event.serialization());
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
	
		const blockNumber = req.params.blockNumber;
		console.log(blockNumber);
		const eventID = req.params.eventID;
		const contrastAddress = req.params.contrastAddress;
		const event = new EventStruct(contrastAddress, eventID);
		console.log('handleReleaseEvent',event.serialization());
		if (!this.eventManager.isExistKey(event)) {
			res.send(404, 'Subscription not exist ');
			return;
		}
		try {
			const result = this.eventManager.releaseEventInfo(event);
			// 404
			res.send(200, result);
			return;
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/event';
	endpoints = [
		new Endpoint(HTTPMethod.POST, '/subscription', [this.handleSubscriptEvent]),
		new Endpoint(HTTPMethod.DELETE, '/subscription/:contrastAddress/:eventID', [this.handleUnsubscriptEvent]),
		new Endpoint(HTTPMethod.GET, '/subscription/:contrastAddress/:eventID', [this.handleReleaseEvent]),
	];
}