import { KeypairType } from '@polkadot/util-crypto/types';

export class ApiConfig {
	private _nodeURL = 'ws://localhost:9944';
	public get nodeURL(): string {
		return this._nodeURL;
	}
	public set nodeURL(value: string) {
		this._nodeURL = value;
	}

	private _keyringType: KeypairType = 'sr25519';
	public get keyringType() {
		return this._keyringType;
	}
	public set keyringType(value) {
		this._keyringType = value;
	}
}