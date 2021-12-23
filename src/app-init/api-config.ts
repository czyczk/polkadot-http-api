export class ApiConfig {
	private _nodeURL = 'ws://localhost:9944';
	public get nodeURL(): string {
		return this._nodeURL;
	}
	public set nodeURL(value: string) {
		this._nodeURL = value;
	}
}