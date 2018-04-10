const path = require('path');
const dotenv = require('dotenv');
const convict = require('convict');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env')
});

const config = convict({
  key: {
    doc: 'Infura API key.',
    format: '*',
    default: '',
    env: 'INFURA_API_KEY'
  },
  mnemonic: {
    doc: 'Mnenonic phrase (12 words).',
    format: '*',
    default: '',
    env: 'MNEMONIC'
  }
});

config.validate({ allowed: 'strict' });

module.exports = config;
