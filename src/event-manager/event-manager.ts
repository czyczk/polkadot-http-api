import { stringify } from 'querystring';

class EventManager {
	private static instance: EventManager;
	private eventInfo;
	private constructor() {
		this.eventInfo = new Map();
	}
	static getInstance() {
		if (!this.instance) {
			this.instance = new EventManager();
		}
		return this.instance;
	}

	subscribeEvent(event:EventStruct) {
		if (!this.eventInfo.has(event.serialization())) {
			this.eventInfo.set(event.serialization(), new Array<string>());
		}
	}

	unsubscribeEvent(event:EventStruct) {
		if(this.eventInfo.has(event.serialization())) {
			this.eventInfo.delete(event.serialization());
		}
	}

	addEventInfo(event:EventStruct, eventInfo:string) {
		if (this.eventInfo.has(event.serialization())) {
			this.eventInfo.get(event.serialization()).push(eventInfo);
			//console.log('yes', this.eventInfo);
		}		
	}

	releaseEventInfo(event:EventStruct) {
		if (this.eventInfo.has(JSON.stringify(event))) {
			const info = this.eventInfo.get(JSON.stringify(event));
			this.eventInfo.set(JSON.stringify(event), new Array<string>());
			return info;
		}
		return new Array<string>();
	}
	isExistKey(event:EventStruct) {
		return this.eventInfo.has(event.serialization());
	}
	getEventKeys() {
		return this.eventInfo.keys();
	}
}
class EventStruct {
	private contrastAddress:string;
	private eventID:string;
	constructor(contrastAddress:string, eventID:string){
		this.contrastAddress=contrastAddress;
		this.eventID = eventID;
	}
	public serialization() {
		return JSON.stringify(this);
	}

	public static deserialization(content:string) {
		const jsonContent = JSON.parse(content);
		if (this.isEmpty(jsonContent['contrastAddress']) || this.isEmpty(jsonContent['contrastAddress'])) {
			console.log('deserialization error');
			return undefined;
		} else {
			return new EventStruct(jsonContent['contrastAddress'],jsonContent['contrastAddress']);
		}
	}

	private static isEmpty(str:string) {
		if(str == null || typeof str == 'undefined' || str == '' || str.trim() == ''){  
			return true;  
		}  
		return false;
	}

}
export {EventManager, EventStruct};
