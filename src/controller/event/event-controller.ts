import { ApiPromise } from '@polkadot/api';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import {EventManager} from '../../event-manager/event-manager';
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
			this._api.rpc.beefy.subscribeJustifications
			await this._api.rpc.chain.subscribeNewHeads((lastHeader) => { 
				this._api.hasSubscriptions
				console.log(`${chain}: last block #${lastHeader.number} has hash ${lastHeader.hash}`);
				/**
				 * managerEvent
				 * headerhasp=>block
				 * for event in Manger Event:
				 *	manager.hashmap.get(event).append(extraction(event, block))
				 * eventId
				 * return hashmap.pull(hashmap.get(event))
				 */
				 for (let name of this.eventManager.getEventKeys()) {
					 this.eventManager.addEventInfo(name, String(lastHeader.number));
				 }
			});
		} catch (err) {
			console.error(err);
		}
	}

	handleSubscriptEvent = (req:Request, res:Response, next:Next) => {
		const eventID = req.body.EventID;
		console.log('handleSubscriptEvent',eventID);
		try {
			this.eventManager.subscribeEvent(eventID);
			res.send(200, "subscribe success");
			return;
		} catch (err) {
			console.error(err);
			next(err);
		}
	}

	handleUnsubscriptEvent = (req:Request, res:Response, next:Next) => {
		const eventID = req.body.EventID;
		console.log('handleUnsubscriptEvent',eventID);

		try {
			this.eventManager.unsubscribeEvent(eventID);
			res.send(200, "unsubscribe success");
			return;
		} catch (err) {
			console.error(err);
			next(err);
		}
	}

	handleReleaseEvent = (req:Request, res:Response, next:Next) => {
		const eventID = req.body.EventID;
		console.log('handleUnsubscriptEvent',eventID);

		try {
			const result = this.eventManager.releaseEventInfo(eventID);
			res.send(200, result);
			return;
		} catch (err) {
			console.error(err);
			next(err);
		}
	}

	prefix = '/event';
	endpoints = [
		new Endpoint(HTTPMethod.POST, '/subscribe', [this.handleSubscriptEvent]),
		new Endpoint(HTTPMethod.POST, '/unsubscript', [this.handleUnsubscriptEvent]),
		new Endpoint(HTTPMethod.POST, '/releaseEvent', [this.handleReleaseEvent]),
	];
}