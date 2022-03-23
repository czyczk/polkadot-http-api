import fs from 'fs';

const mapExampleAbiPaths = new Map();
mapExampleAbiPaths.set('flipper', './src/controller/contract/example-contracts/flipper/metadata.json');
mapExampleAbiPaths.set('incrementer', './src/controller/contract/example-contracts/incrementer/metadata.json');
mapExampleAbiPaths.set('struct', './src/controller/contract/example-contracts/struct/metadata.json');

const mapExampleWasmPaths = new Map();
mapExampleWasmPaths.set('flipper', './src/controller/contract/example-contracts/flipper/flipper.wasm');
mapExampleWasmPaths.set('incrementer', './src/controller/contract/example-contracts/incrementer/incrementer.wasm');
mapExampleWasmPaths.set('struct', './src/controller/contract/example-contracts/struct/blbc.wasm');

export const loadExampleAbi = (contractName: string) => {
	const abiPath = mapExampleAbiPaths.get(contractName);
	if (!abiPath) {
		throw new Error('Unknown contract name');
	}

	const abi = fs.readFileSync(abiPath).toString();
	return abi;
};

export const loadExampleWasm = (contractName: string) => {
	const wasmPath = mapExampleWasmPaths.get(contractName);
	if (!wasmPath) {
		throw new Error('Unknown contract name');
	}

	const wasm = fs.readFileSync(wasmPath);
	return wasm;
};

export const availableBuiltinContracts = ['flipper', 'incrementer', 'struct'];