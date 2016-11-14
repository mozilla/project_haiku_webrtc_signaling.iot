'use strict';
var ursa = require('ursa');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var key = ursa.generatePrivateKey(1024, 65537);
var privpem = key.toPrivatePem();
var pubpem = key.toPublicPem();
var privkey = path.join('server/serverkeys', 'privkey.pem');
var pubkey = path.join('server/serverkeys', 'pubkey.pem');
mkdirp('./server/serverkeys', function(err){
  console.log('writing server/serverkeys')
})
mkdirp('./server/clientkeys', function(err) {
  console.log('writing server/clientkeys')
});
mkdirp('./node-client/clientkeys', function(err) {
  console.log('writing node-client/clientkeys')
});
mkdirp('./node-client/serverkeys', function(err) {
  console.log('writing node-client/serverkey')
});


fs.writeFileSync(privkey, privpem, 'ascii');
fs.writeFileSync(pubkey, pubpem, 'ascii');

var pubkey = path.join('node-client/serverkeys', 'pubkey.pem');
fs.writeFileSync(pubkey, pubpem, 'ascii');

var keyB = ursa.generatePrivateKey(1024, 65537);
var privpemB = keyB.toPrivatePem();
var pubpemB = keyB.toPublicPem();
var privkeyB = path.join('node-client/clientkeys', 'privkey.pem');
var pubkeyB = path.join('node-client/clientkeys', 'pubkey.pem');

fs.writeFileSync(privkeyB, privpemB, 'ascii');
fs.writeFileSync(pubkeyB, pubpemB, 'ascii')

var pubkeyB = path.join('server/clientkeys', 'pubkey.pem');
fs.writeFileSync(pubkeyB, pubpemB, 'ascii');
