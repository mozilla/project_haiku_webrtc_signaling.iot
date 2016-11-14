'use strict';
var WebSocketServer = require('ws').Server;
var url = require('url');
var ursa = require('ursa');
var fs = require('fs');
var path = require('path');

var serverKeyId = process.env.HAIKU_DEVICE_ID || 'signaling_server';
var keydir = path.join(__dirname, '.keys');

var wss = new WebSocketServer({
  verifyClient: function(info, cb) {
    console.log('verifyClient, headers: ', info.req.headers);
    var encryptedMsg = info.req.headers.encrypted;
    var hashedSig = info.req.headers.signed;
    var deviceId = info.req.headers.deviceid;

    var privkeyServerFilename = path.join(keydir, serverKeyId + '.pem');
    var pubkeyClientFilename = path.join(keydir, deviceId + '.pub.pem')
    console.log('verifyClient, looking for public key at: ', pubkeyClientFilename);

    var privkeyServer;
    var pubkeyClient;

    if (fs.existsSync(privkeyServerFilename)) {
      privkeyServer = ursa.createPrivateKey( fs.readFileSync(privkeyServerFilename) );
    } else {
      throw new Error('Private key for server not found');
    }

    if (fs.existsSync(pubkeyClientFilename)) {
      pubkeyClient = ursa.createPublicKey(fs.readFileSync(pubkeyClientFilename));
    } else {
      // TODO: just send rejection?
      throw new Error('Public key for client: ' + deviceId + ' not found');
    }

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
