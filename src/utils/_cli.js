const COMMANDLINE_OPTIONS = {
  referralCode: {
    shortName: 'c',
    description: 'Referral code to encode in image',
    demandOption: false,
    type: 'string',
  },
  inputPath: {
    shortName: 'i',
    description: 'Input file path',
    demandOption: false,
    type: 'string',
  },
  outputPath: {
    shortName: 'o',
    description: 'Output file path',
    demandOption: false,
    default: 'out',
    type: 'string',
  },
};

function parseOptions() {
  const defaultOptions = Object.values(COMMANDLINE_OPTIONS).reduce((acc, { shortName, default: value }) => ({ ...acc, [shortName]: value }), {});
  const aliases = Object.entries(COMMANDLINE_OPTIONS)
    .map(([ longName, { shortName }]) => ({ shortName, longName }));

  const yargs = require('yargs/yargs')(process.argv.slice(2));

  yargs.default(defaultOptions);

  Object.entries(COMMANDLINE_OPTIONS).forEach(([ longName, options ]) => {
    yargs.option(longName, options);
  });
  aliases.forEach(({ shortName, longName }) => yargs.alias(shortName, longName));

  return yargs.argv;
}

module.exports = {
  parseOptions,
};
