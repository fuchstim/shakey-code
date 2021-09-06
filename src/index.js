#!/usr/bin/env node
const encode = require('./encode');
const decode = require('./decode');

const utils = require('./utils');

async function run() {
  const { referralCode, inputPath, outputPath } = utils.cli.parseOptions();
  if (referralCode) {
    await encode({ referralCode, outputPath });
  } else if (inputPath) {
    await decode({ inputPath });
  } else {
    throw new Error('Referral code or input file path are required!');
  }

  process.exit(0);
}

run();
