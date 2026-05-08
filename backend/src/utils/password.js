import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

const HASH_ALGORITHM = 'sha256';
const HASH_ITERATIONS = 310000;
const KEY_LENGTH = 32;

export const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, HASH_ALGORITHM).toString('hex');

  return `${HASH_ITERATIONS}.${salt}.${hash}`;
};

export const verifyPassword = (password, storedPassword) => {
  const [iterations, salt, hash] = String(storedPassword || '').split('.');

  if (!iterations || !salt || !hash) {
    return false;
  }

  const calculatedHash = pbkdf2Sync(
    password,
    salt,
    Number(iterations),
    KEY_LENGTH,
    HASH_ALGORITHM
  );
  const storedHash = Buffer.from(hash, 'hex');

  return storedHash.length === calculatedHash.length && timingSafeEqual(storedHash, calculatedHash);
};
