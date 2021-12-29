# Polkadot HTTP API

## Description
An HTTP wrapper for Polkadot JS API. Useful for languages that cannot easily call Javascript functions. APIs are arranged in a similar way as the original Polkladot JS APIs.  
It covers a lot of useful APIs from not only `@polkadot/api` but also `@polkadot/keyring` and `@polkadot/api-contract`.  

## Versions

`@polkadot/api` and `@polkadot/api-contract` are of version `v6.12.1`.

## Instructions

1.  `yarn install`
2.  `yarn start` to start the HTTP server or
3.  `yarn dev` to start the HTTP server in dev mode so that it will restart automatically when the code changes

## Supported APIs

The following list shows the mapping from the original Polkadot JS APIs to the HTTP APIs provided by this program.

Note that the parameters indicate only the query strings after "?" mark in GET requests and the params in POST forms. The parameters in the path are included in the endpoints.  
For example, in the entry which has an endpoint of `/api/query/system/account/:addr` and a parameter list of `at`, 2 parameters are actually mentioned: `addr` in the path and `at` in the parameter ilst.  
The names of the parameters are mostly kept the same as in the Polkadot JS APIs. So you can refer to the Polkadot JS API documentation for explanations. In case of confusion, additional parameter explanations can be found after the list.

The column of Polkadot JS API is sorted in alphabetical order (except the ping APIs).

|Polkadot JS API|HTTP Method|HTTP Endpoint|Parameters|Optional Parameters|
|-|-|-|-|-|
|N/A|GET|`/ping`|||
|`api.at.query.system.account` or `query.system.account.at` (deprecated)|GET|`/api/query/system/account/:addr`|`at`||
|`api.at.query.timestamp.now` or `query.timestamp.now.at` (deprecated)|GET|`/api/query/timestamp/now`|`at`||
|`api.consts.babe.epochDuration`|GET|`/api/consts/babe/epoch-duration`|||
|`api.consts.balances.existentialDeposit`|GET|`/api/consts/balances/existential-deposit`|||
|`api.consts.transactionPayment.transactionByteFee`|GET|`/api/consts/transaction-payment/transaction-byte-fee`|||
|`api.genesisHash`|GET|`/api/genesis-hash`|||
|`api.libraryInfo`|GET|`/api/library-info`|||
|`api.query.staking.activeEra`|GET|`/api/query/staking/active-era`|||
|`api.query.staking.erasStakers.entries`|GET|`/api/query/staking/eras-stakers/entries/:index`|||
|`api.query.staking.validators.keys`|GET|`/api/query/staking/validators/keys`|||
|`api.query.system.account`|GET|`/api/query/system/account/:addr`|||
|`api.query.timestamp.now`|GET|`/api/query/timestamp/now`|||
|`api.registry.findMetaError`|GET|`/api/registry/meta-error`|`index`, `error`||
|`api.rpc.chain.getBlockHash`|GET|`/api/rpc/chain/block-hash/:blockNumber`|||
|`api.rpc.chain.getHeader`|GET|`/api/rpc/chain/header`|||
|`api.rpc.system.chain`|GET|`/api/rpc/system/chain`|||
|`api.runtimeChain`|GET|`/api/runtime-chain`|||
|`api.runtimeMetadata`|GET|`/api/runtime-metadata`|||
|`api.runtimeVersion`|GET|`/api/runtime-version`|||
|`api.tx.balances.transfer`|POST|`/api/tx/balances/transfer`|`transferDest: string`, `transferValue: number`, `signerAddress: string`|`unsubIfInBlock: boolean`|
|`code.tx.<constructor>`|POST|`/contract/from-code`|`abi`, `wasm`, `signerAddress`, `ctorFuncName`, `ctorArgs`|`gasLimit`, `salt`, `value`, `unsubIfInBlock`|
|`keyring.addFromUri`|POST|`/keyring/from-uri`|`phrase`|`meta`|
|`keyring.getPair`|GET|`/keyring/pair/:address`|||

### Additional Parameter Explanations

**`api.tx.balances.transfer`**

HTTP method: POST  
HTTP endpoint: `/api/tx/balances/transfer`  
Required parameters:  
- `transferDest: string`: The address of the transfer destination. Can be in the form of any address type supported by Polkadot JS API.
- `transferValue: number`: The transfer value.
- `signerAddress: string`: The address of the transfer source, who also acts as the transaction signer. Can be in the form of any address type supported by Polkadot JS API. The signer must have been added to the API beforehand. If not, call `keyring.addFromUri` first.

Optional parameters:
- `unsubIfInBlock: boolean`: Default to `true`. Stop the subscription that listens on transaction status changes once the transaction is in block. In this way, you won't be informed if the transaction is not finalized, but in return you can get the result earlier.

Return value:  
See "[Common Transaction Execution Result](#common-transaction-execution-result)" section.

**`code.tx.<constructor>`**

HTTP method: POST  
HTTP endpoint: `/contract/from-code`  
Description: Instantiate a new contract from code that hasn't been uploaded onto the chain before. The metadata and the wasm binary of the contract should be provided.  
Required parameters:
- `abi: string | JSON`: The contents of the contract ABI. In most cases, it refers to the contents of file `metadata.json` in the contract directory.
- `wasm: file`: The WASM binary of the contract. Should be provided through a POST form multipart file.
- `signerAddress: string`: The address of the transfer source, who also acts as the transaction signer. Can be in the form of any address type supported by Polkadot JS API. The signer must have been added to the API beforehand. If not, call `keyring.addFromUri` first.
- `ctorFuncName: string`: The function name of the constructor you want to call to instantiate the contract. Refer to the ABI for it. It's usually `default` or `new`.
- `ctorArgs: string | JSON`: The arguments for the constructor.

Optional parameters:  
- `gasLimit: number`: Default to `200_000_000_000` (200,000 million).
- `salt: string`: Default to `null`.
- `value: number`: Default to `1_000_000_000_000_000` (1,000 trillion). Also known as "endowment" in Canvas UI.
- `unsubIfInBlock: boolean`: Default to `true`. Stop the subscription that listens on transaction status changes once the transaction is in block. In this way, you won't be informed if the transaction is not finalized, but in return you can get the result earlier.

Return value:  
See "[Contract Instantiation Result](#contract-instantiation-result)" section.


## Transaction Execution Result

### Common Transaction Execution Result

This section describes the return value of a normal transaction execution.

Model class: [`TxExecutionResult`](./src/controller/model.ts#39).

It includes the transaction hash and the block hashes of the blocks in which the transaction is included or finalized.

An example:

```
{
    "txHash": "0xdde9bb61a9d0aad3bf80dcf2503796310aca9ce6dbbeeda88ac3469ebd8868cf",
    "dispatchInfo": {
        "weight": 4390724202,
        "class": "Normal",
        "paysFee": "Yes"
    },
    "inBlockStatus": {
        "inBlock": "0x999ed3ef07f90f2d238e0d94911f174a31d0c57e915044dd8bbcad04b427920e",
        "finalized": "0x999ed3ef07f90f2d238e0d94911f174a31d0c57e915044dd8bbcad04b427920e"
    }
}
```

### Contract Instantiation Result

This section describes the return value of a contract instantiation.

Model class: [`ContractInstantiationSuccessResult`](./src/controller/contract/model.ts#10) and [`ContractInstantiationErrorResult`](./src/controller/contract/model.ts#17).

**A successful instantiation:**

If a contract instantiation is successful, the return value is of type `ContractInstantiationSuccessResult`.

It contains not only the info of a common transaction execution result (see [Common Transaction Execution Result](#common-transaction-execution-result)), but also the address of the contract instance. An example is as below:

```
{
    "txHash": "0xdde9bb61a9d0aad3bf80dcf2503796310aca9ce6dbbeeda88ac3469ebd8868cf",
    "dispatchInfo": {
        "weight": 4390724202,
        "class": "Normal",
        "paysFee": "Yes"
    },
    "inBlockStatus": {
        "inBlock": "0x999ed3ef07f90f2d238e0d94911f174a31d0c57e915044dd8bbcad04b427920e",
        "finalized": "0x999ed3ef07f90f2d238e0d94911f174a31d0c57e915044dd8bbcad04b427920e"
    },
    "address": "5Cp5e1C38HtsBB4mnRFgidzxSJu3KZQLXjnrmwH4jLMEK8Lw"
}
```

**A failed instantiation:**

If a contract instantiation fails, the return value is of type `ContractInstantiationErrorResult`.

It contains not only the info of a common transaction execution result (see [Common Transaction Execution Result](#common-transaction-execution-result)), but also the the error codes and descriptions. An example is as below:

```
{
    "txHash": "0xaf0354df170ae473f2e72cd6e9a9205ea92df6d8fd8f9f13a0b2c24faafde5eb",
    "dispatchInfo": {
        "weight": 4264251000,
        "class": "Normal",
        "paysFee": "Yes"
    },
    "inBlockStatus": {
        "inBlock": "0x110a3245a0aad9edb005baa8e1b72aa351bec6ae78671e162d04b4702a7ad506"
    },
    "explainedDispatchError": {
        "index": "0x08",
        "error": "0x04",
        "type": "contracts.NewContractNotFunded",
        "details": "The newly created contract is below the subsistence threshold after executing its contructor. No contracts are allowed to exist below that threshold."
    }
}

```

