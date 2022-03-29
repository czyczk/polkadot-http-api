import ReadWrtieLock from 'rwlock';
import { SubscribableContractEvent } from '../controller/model';
class EventManager {
	private static instance: EventManager;
	private eventInfo;
	private lock;
	private constructor() {
		this.eventInfo = new Map();
		this.lock = new ReadWrtieLock();
	}
	static getInstance() {
		if (!this.instance) {
			this.instance = new EventManager();
		}
		return this.instance;
	}
	subscribeEvent(event:EventStruct) {
		this.lock.readLock('read lock',(release) => {
			//console.log('subscribe read lock ');
			if (!this.eventInfo.has(event.serialization())) {
				//console.log('subscribe write lock ');
				this.lock.writeLock('write lock',(release) => {
					this.eventInfo.set(event.serialization(), new Array<SubscribableContractEvent>());
					release();
				});
				//console.log('subscribe write unlock ');
			}
			//console.log('subscribe read unlock ');
			release();
		});
		
	}

	unsubscribeEvent(event:EventStruct) {
		this.lock.readLock('read lock',(release) => {
			//console.log('unsubscribe read lock ');
			if (this.eventInfo.has(event.serialization())) {
				//console.log('unsubscribe write lock ');
				this.lock.writeLock('write lock',(release) => {
					this.eventInfo.delete(event.serialization());
					release();
				});
				//console.log('unsubscribe write unlock ');
			}
			//console.log('unsubscribe read unlock ');
			release();
		});
	}

	addEventInfo(event:EventStruct, eventInfo:SubscribableContractEvent) {
		this.lock.readLock('read lock',(release) => {
			//console.log('add read lock ');
			if (this.eventInfo.has(event.serialization())) {
				this.lock.writeLock('write lock',(release) => {
					//console.log('add write lock ');
					this.eventInfo.get(event.serialization()).push(eventInfo);
					release();
					//console.log('add write unlock ');
				});
			}
			//console.log('add read unlock ');
			release();
		});
	}

	releaseEventInfo(event:EventStruct) {
		let info = new Array<SubscribableContractEvent>();
		//console.log('release read lock ');
		this.lock.readLock('read lock',(release) => {
			if (this.eventInfo.has(event.serialization())) {
				this.lock.writeLock('write lock',(release) => {
					//console.log('release write lock ');
					info = this.eventInfo.get(event.serialization());
					this.eventInfo.set(event.serialization(), new Array<SubscribableContractEvent>());
					release();
					//console.log('release write unlock ');
				});
			}
			//console.log('release read unlock ');
			release();
		});
		return info;
	}

	isExistKey(event:EventStruct) {
		return this.eventInfo.has(event.serialization());
	}

	getEventKeys() {
		return this.eventInfo.keys();
	}
}
class EventStruct {
	private contractAddress:string;
	private eventID:string;
	constructor(contrastAddress:string, eventID:string){
		this.contractAddress=contrastAddress;
		this.eventID = eventID;
	}
	public serialization() {
		return JSON.stringify(this);
	}

	public static deserialization(content:string) {
		const jsonContent = JSON.parse(content);
		if (this.isEmpty(jsonContent['contractAddress']) || this.isEmpty(jsonContent['eventID'])) {
			console.log('deserialization error', jsonContent);
			return undefined;
		} else {
			return new EventStruct(jsonContent['contractAddress'],jsonContent['eventID']);
		}
	}

	private static isEmpty(str:string) {
		if(str == null || typeof str == 'undefined' || str == '' || str.trim() == ''){  
			return true;  
		}  
		return false;
	}

	public getEventID(){
		return this.eventID;
	}

	public getContractAddress() {
		return this.contractAddress;
	}

}
export {EventManager, EventStruct};
