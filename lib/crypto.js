/**
 * crypto.js — AES-256-GCM helpers for encrypting Discord tokens at rest.
 *
 * Key source priority:
 *   1. process.env.MASTER_KEY  (64-char hex = 32 bytes)
 *   2. data/.master_key        (auto-generated on first run, mode 600)
 *
 * Format:  v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGO = 'aes-256-gcm';
const KEY_FILE = path.join(__dirname, '..', 'data', '.master_key');
const PREFIX = 'v1:';

let _key = null;

function _loadOrCreateKey() {
  if (_key) return _key;

  // Prefer env (for cloud/secret managers).
  const envKey = process.env.MASTER_KEY;
  if (envKey) {
    if (!/^[0-9a-fA-F]{64}$/.test(envKey)) {
      throw new Error('MASTER_KEY must be exactly 64 hexadecimal characters');
    }
    _key = Buffer.from(envKey, 'hex');
    return _key;
  }

  try { fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true }); } catch {}

  if (fs.existsSync(KEY_FILE)) {
    let hex = '';
    try { hex = fs.readFileSync(KEY_FILE, 'utf8').trim(); } catch (e) {
      throw new Error(`Cannot read master key file: ${e.message}`);
    }
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
      throw new Error(`Invalid master key file at ${KEY_FILE}; refusing to replace it`);
    }
    _key = Buffer.from(hex, 'hex');
    return _key;
  }

  const newKey = crypto.randomBytes(32);
  try {
    fs.writeFileSync(KEY_FILE, newKey.toString('hex'), { mode: 0o600 });
    try { fs.chmodSync(KEY_FILE, 0o600); } catch {}
    console.warn(`[crypto] generated new master key at ${KEY_FILE} — back this up.`);
  } catch (e) {
    console.warn(`[crypto] could not persist master key: ${e.message}`);
  }
  _key = newKey;
  return _key;
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

function encrypt(plain) {
  if (plain == null) return plain;
  const key = _loadOrCreateKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

function decrypt(blob) {
  if (!isEncrypted(blob)) return blob;
  const [, ivHex, tagHex, encHex] = blob.split(':');
  if (!/^[0-9a-fA-F]{24}$/.test(ivHex || '') || !/^[0-9a-fA-F]{32}$/.test(tagHex || '') || !/^[0-9a-fA-F]+$/.test(encHex || '')) {
    throw new Error('Invalid encrypted envelope');
  }
  const key = _loadOrCreateKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const dec = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
  return dec.toString('utf8');
}

function tryDecrypt(blob) {
  try { return decrypt(blob); }
  catch { return null; }
}

function randomSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { encrypt, decrypt, tryDecrypt, isEncrypted, randomSecret };
