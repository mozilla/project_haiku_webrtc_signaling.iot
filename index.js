'use strict';
var WebSocketServer = require('ws').Server;
var url = require('url');
var ursa = require('ursa');
var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express();

var serverKeyId = process.env.HAIKU_DEVICE_ID || 'signaling_server';
var keydir = path.join(__dirname, '.keys');
/*
IN PROGRESS: 
 -making public key exchange easier:

app.post('https://www.signaling_server.herokuapp.com/keyEx', function(req, res) {
  var clientPub = req.body.clientPub;
  fs.writeFileSync(keydir, 'new-client-key.pub.pem', 'ascii');
  res.sendFile(path.join(keydir, 'signaling_server.pub.pem'));
})
*/

var wss = new WebSocketServer({
  verifyClient: function(info, cb) {
    console.log('verifyClient, headers: ', info.req.headers);
    var encryptedMsg = info.req.headers.encrypted;
    var hashedSig = info.req.headers.signed;
    var deviceId = info.req.headers.deviceid;
//    var newSig = info.req.headers.newsig;
    
    var privkeyServerFilename = path.join(keydir, serverKeyId + '.pem');
    var pubkeyClientFilename = path.join(keydir, deviceId + '.pub.pem');
//    var newClientFilename = path.join(keydir, 'new-client-key.pub.pem');
    console.log('verifyClient, looking for public key at: ', pubkeyClientFilename);

    var privkeyServer;
    var pubkeyClient;

    if (fs.existsSync(privkeyServerFilename)) {
      privkeyServer = ursa.createPrivateKey(fs.readFileSync(privkeyServerFilename));
      console.log('Private key created', privkeyServer)
    } else {
      cb(false, 409, 'Private key for server not found');
      return;
    }
 
    if (fs.existsSync(pubkeyClientFilename)) {
      pubkeyClient = ursa.createPublicKey(fs.readFileSync(pubkeyClientFilename));
    } 
    else if (fs.existsSync(newClientFilename)) {
      pubkeyClient = ursa.createPublicKey(fs.readFileSync(newClientFilename));
    }
    else {
      cb(false, 409, 'Public key for client: ' + deviceId + ' not found');
      return;
    }

    if (privkeyServer.decrypt(encryptedMsg, 'base64', 'utf8')) {
          var decrypted = privkeyServer.decrypt(encryptedMsg, 'base64', 'utf8');
    }
    else {
      cb(false, 409, 'Invalid Decrypt');
      return;
    }

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
   port: process.env.PORT || 8080 });

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

//   ws.on('uncaughtException', function (err) {
//   console.log('Caught exception: ' + err);
// });

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
