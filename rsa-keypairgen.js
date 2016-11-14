'use strict';
var ursa = require('ursa');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var deviceId = process.env.HAIKU_DEVICE_ID || 'haiku';

var keydir = path.join(__dirname, '.keys');
var key = ursa.generatePrivateKey(1024, 65537);
var privpem = key.toPrivatePem();
var pubpem = key.toPublicPem();
var privkey = path.join(keydir, deviceId + '.pem');
var pubkey = path.join(keydir, deviceId + '.pub.pem');

mkdirp(keydir, function(err){
  console.log('create keys directory');

  fs.writeFileSync(privkey, privpem, 'ascii');
  fs.writeFileSync(pubkey, pubpem, 'ascii');

});

