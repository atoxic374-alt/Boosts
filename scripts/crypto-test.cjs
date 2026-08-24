'use strict';

const assert = require('assert');

// Use an isolated deterministic test key; production must provide its own secret.
process.env.MASTER_KEY = 'a'.repeat(64);
const { encrypt, decrypt, tryDecrypt, isEncrypted } = require('../lib/crypto');

const samples = [
  'example-token-1-not-a-real-credential',
  'example-token-2-not-a-real-credential',
  'كلمة-سرية-اختبارية',
];

const encrypted = samples.map(encrypt);
assert.equal(encrypted.length, samples.length);
assert(encrypted.every(isEncrypted), 'each value should use the encrypted envelope');
assert.equal(new Set(encrypted).size, encrypted.length, 'each encryption should use a fresh IV');
assert.deepEqual(encrypted.map(decrypt), samples, 'encrypted values should round-trip');
assert.equal(decrypt(samples[0]), samples[0], 'plaintext migration remains readable');
assert.equal(tryDecrypt('v1:not-valid'), null, 'invalid ciphertext should fail closed');

console.log('crypto tests passed');
