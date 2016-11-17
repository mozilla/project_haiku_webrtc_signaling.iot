##Project Haiku WebRTC Signaling Server
=====================================

###Install: 
```
npm install
```

###There are two ways to authenticate and create a peer-to-peer connection using this signaling server:
####The instructions below are how to connect your client from this repo:
       https://github.com/sfoster/webrtc-datachannel-test

###Before you do anything, you have to generate the public Private Key pairs:
    - Navigate into the `node-client` folder.
    - Run `node rsa-keypairgen.js`
    - Now you should have a .keys folder containing `node-client-a.pub.pem` & `node-client-a.pem`
    - In order to authenticate & connect to the signaling server, the server needs your `node-client-a.pub.pem` and you need the servers `signaling_server.pub.pem`


###Then to run the node-client (not CLI):
      - Navigate into the `node-client` folder.
      - Make sure you have a `.keys` file with `node-client-a.pem` and `signaling_server.pub.pem` (check above)
      - Make sure the server has the up to date `node-client-a.pub.pem` key
      - Run `node index.js`
      - ...
    
