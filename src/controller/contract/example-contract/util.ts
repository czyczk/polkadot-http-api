import fs from 'fs';

export const loadAbi = () => {
	const abi = fs.readFileSync('./src/controller/contract/example-contract/metadata.json').toString();
	return abi;
};

export const loadWasm = () => {
	const wasm = fs.readFileSync('./src/controller/contract/example-contract/flipper.wasm');
	return wasm;
};