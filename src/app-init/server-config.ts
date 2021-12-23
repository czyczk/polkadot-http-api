import { IGroupableController } from '../controller/model';

export class ServerConfig {
	private _port = '8080';
	public get port(): string {
		return this._port;
	}
	public set port(value: string) {
		this._port = value;
	}

	private _controllers = new Set<IGroupableController>();
	public get controllers() {
		return this._controllers;
	}
}