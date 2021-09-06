#!/usr/bin/env node
const encode = require('./encode');
const decode = require('./decode');

module.exports = {
  encode: code => encode(code),
  decode: buffer => decode(buffer),
};
