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

	subscribeEvent(eventID:string) {
		if (!this.eventInfo.has(eventID)) {
			this.eventInfo.set(eventID, new Array<string>());
		}
	}

	unsubscribeEvent(eventID:string) {
		this.eventInfo.delete(eventID);
	}

	addEventInfo(eventID:string, eventInfo:string) {
		if (this.eventInfo.has(eventID)) {
			this.eventInfo.get(eventID).push(eventInfo);
		}		
	}

	releaseEventInfo(eventID:string) {
		if (this.eventInfo.has(eventID)) {
			let info = this.eventInfo.get(eventID);
			this.eventInfo.set(eventID, new Array<string>());
			return info;
		}
		return new Array<String>();
	}
	getEventKeys() {
		return this.eventInfo.keys();
	}
}
export {EventManager};