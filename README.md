# Polkadot HTTP API

## Description
An HTTP wrapper for Polkadot JS API. Useful for languages that cannot easily call Javascript functions. APIs are arranged in a similar way as the original Polkladot JS APIs.

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
|`api.rpc.chain.getBlockHash`|GET|`/api/rpc/chain/block-hash/:blockNumber`|||
|`api.rpc.chain.getHeader`|GET|`/api/rpc/chain/header`|||
|`api.rpc.system.chain`|GET|`/api/rpc/system/chain`|||
|`api.runtimeChain`|GET|`/api/runtime-chain`|||
|`api.runtimeMetadata`|GET|`/api/runtime-metadata`|||
|`api.runtimeVersion`|GET|`/api/runtime-version`|||
|`api.tx.balances.transfer`|POST|`/api/tx/balances/transfer`|`transferDest: string`, `transferValue: number`, `signerAddress: string`|`unsubIfInBlock: boolean`|
|`keyring.addFromUri`|POST|`/keyring/from-uri`|`phrase`|`meta`|
|`keyring.getPair`|GET|`/keyring/pair/:address`|||

### Additional Parameter Explanations

**`api.tx.balances.transfer`**  
HTTP Method: POST  
Required parameters:
- `transferDest: string`: The address of the transfer destination. Can be in the form of any address type supported by Polkadot JS API.
- `transferValue: number`: The transfer value.
- `signerAddress: string`: The address of the transfer source, who also acts as the transaction signer. Can be in the form of any address type supported by Polkadot JS API. The signer must have been added to the API beforehand. If not, call `keyring.addFromUri` first.  
Optional parameters:
- `unsubIfInBlock: boolean`: Stop the subscription that listens on transaction status changes once the transaction is in block. In this way, you won't be informed if the transaction is not finalized, but in return you can get the result sooner.
