import fs from 'fs';

export const loadExampleAbi = () => {
	const abi = fs.readFileSync('./src/controller/contract/example-contract/metadata.json').toString();
	return abi;
};

export const loadExampleWasm = () => {
	const wasm = fs.readFileSync('./src/controller/contract/example-contract/flipper.wasm');
	return wasm;
};