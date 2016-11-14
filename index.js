var WebSocketServer = require('ws').Server;
var url = require('url');
var ursa = require('ursa');
var fs = require('fs');
var wss = new WebSocketServer({
  verifyClient: function(info, cb) {
    var encryptedMsg = info.req.headers.encrypted;
    var hashedSig = info.req.headers.signed;
    var deviceId = info.req.headers.devId;
    var privkeyServer = ursa.createPrivateKey(fs.readFileSync('./serverkeys/privkey.pem'));
    var pubkeyClient = ursa.createPublicKey(fs.readFileSync('./clientkeys/pubkey.pem'));
    
    var decrypted = privkeyServer.decrypt(encryptedMsg, 'base64', 'utf8');
    var recrypted = new Buffer(decrypted).toString('base64');

    if (!pubkeyClient.hashAndVerify('sha256', recrypted, hashedSig, 'base64')) {
      console.log('Signature not verified!');
      cb(false, 401, 'Unauthorized');

    }
    else { 
      console.log('Signature verified!');
      cb(true);
    }
  },
   port: 8080 });

var clientSockets = {};

function getChannelForDeviceId(id) {
  var channelId = id.replace(/-[ab]$/i, '');
  return channelId;
}

function getChannelHost(channel) {
  for(var id in channel) {
    return channel[id];
  }
}

wss.on('connection', function connection(ws) {
  var location = url.parse(ws.upgradeReq.url, true);
  var deviceId = location.query.deviceid;
  if (deviceId) {
    clientSockets[deviceId] = ws;
  } else {
    console.log('Unexpected connection: ', ws);
    return;
  }
  console.log('deviceId connected: ' + deviceId);

  ws.on('message', function incoming(_message) {
    if (!_message.includes('}')) {
      // is just a test/debug message
      console.log(_message);
      ws.send('acknowleded: ' + _message);
      return;
    }
    var message = JSON.parse(_message.toString());
    console.log('received message:', message);
    wss.clients.forEach(function each(client) {
      if (client === ws) {
        return;
      }

      if ('candidate' in message) {
        console.log('relaying candidate message');
        client.send(_message);
      }
      else if ('sdp' in message) {
        console.log('relaying sdp message');
        client.send(_message);
      }
    });
  });

  if (Object.keys(clientSockets).length > 1) {
    getChannelHost(clientSockets).send(JSON.stringify({
      'makeOffer': true
    }));
  }

  // ws.send(JSON.stringify({
  //   welcome: Object.keys(clientSockets)
  // }));
});

console.log('Listening for socket connections on: ', wss.options.host + ':' + wss.options.port);
