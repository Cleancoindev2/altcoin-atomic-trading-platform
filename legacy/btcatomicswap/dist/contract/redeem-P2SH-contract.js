'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Script = require('bitcore').Script;
var Opcode = require('bitcore').Opcode;
var Buffer = require('buffer/').Buffer;

var redeemP2SHContract = exports.redeemP2SHContract = function redeemP2SHContract(contract, sig, pubkey, secret) {
  var script = new Script();
  script.add(sig);
  script.add(new Buffer(pubkey, 'hex'));
  script.add(new Buffer(secret, 'hex'));
  script.add(Opcode.OP_1);
  script.add(new Buffer(contract, 'hex'));

  // script.add(new Buffer(secret, 'hex'));
  // script.add(Buffer.from(secret, "hex"));

  return script;
};