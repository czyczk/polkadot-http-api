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
		if (!this.eventInfo.has(event)) {
			this.eventInfo.set(JSON.stringify(event), new Array<string>());
		}
	}

	unsubscribeEvent(event:EventStruct) {
		this.eventInfo.delete(JSON.stringify(event));
	}

	addEventInfo(key:string, eventInfo:string) {
		if (this.eventInfo.has(key)) {
			this.eventInfo.get(key).push(eventInfo);
			//console.log('yes', this.eventInfo);
		}		
	}

	releaseEventInfo(event:EventStruct) {
		console.log(this.eventInfo)
		console.log(JSON.stringify(event))
		if (this.eventInfo.has(JSON.stringify(event))) {
			let info = this.eventInfo.get(JSON.stringify(event));
			this.eventInfo.set(JSON.stringify(event), new Array<string>());
			return info;
		}
		return new Array<String>();
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
}
export {EventManager, EventStruct};