const restify = require('restify');
const { ApiPromise, WsProvider } = require('@polkadot/api');

const server = restify.createServer();
server.get('/hello/:name', respond);
server.get('/genesis-hash', testNodeConnection);

function respond(req, res, next) {
	res.send('hello, ' + req.params.name);
	next();
}

async function testNodeConnection(req, res, next) {
	const wsProvider = new WsProvider('ws://localhost:9944');
	const api = new ApiPromise({ provider: wsProvider });
	await api.isReady;
	const genesisHash = api.genesisHash.toHex();
	res.send(genesisHash);
	next();
}

server.listen(8080, () => {
	console.log('%s listening at %s', server.name, server.url);
});