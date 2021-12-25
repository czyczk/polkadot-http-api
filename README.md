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
The names of the parameters are kept the same as in the Polkadot JS APIs. So you can refer to the Polkadot JS API documentation for explanations.

The column of Polkadot JS API is sorted in alphabetical order (except the ping APIs).

|Polkadot JS API|HTTP Method|HTTP Endpoint|Parameters|
|-|-|-|-|
|N/A|GET|`/api/ping`||
|`at.query.system.account` or `query.system.account.at` (deprecated)|GET|`/api/query/system/account/:addr`|`at`|
|`at.query.timestamp.now` or `query.timestamp.now.at` (deprecated)|GET|`/api/query/timestamp/now`|`at`|
|`consts.babe.epochDuration`|GET|`/api/consts/babe/epoch-duration`||
|`consts.balances.existentialDeposit`|GET|`/api/consts/balances/existential-deposit`||
|`consts.transactionPayment.transactionByteFee`|GET|`/api/consts/transaction-payment/transaction-byte-fee`||
|`query.staking.validators.keys`|GET|`/api/query/staking/validators/keys`||
|`query.system.account`|GET|`/api/query/system/account/:addr`||
|`query.timestamp.now`|GET|`/api/query/timestamp/now`||
|`rpc.chain.getHeader`|GET|`/api/rpc/chain/header`||
|`rpc.system.chain`|GET|`/api/rpc/system/chain`||