import fs from 'fs';

export const loadFlipperAbi = () => {
	const abi = fs.readFileSync('./src/controller/contract/example-contracts/flipper/metadata.json').toString();
	return abi;
};

export const loadFlipperWasm = () => {
	const wasm = fs.readFileSync('./src/controller/contract/example-contracts/flipper/flipper.wasm');
	return wasm;
};

export const loadIncrementerAbi = () => {
	const abi = fs.readFileSync('./src/controller/contract/example-contracts/incrementer/metadata.json').toString();
	return abi;
};

export const loadIncrementerWasm = () => {
	const wasm = fs.readFileSync('./src/controller/contract/example-contracts/incrementer/incrementer.wasm');
	return wasm;
};

export const availableBuiltinContracts = ['flipper', 'incrementer'];