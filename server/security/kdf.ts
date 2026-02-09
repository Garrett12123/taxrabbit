import 'server-only';

import { randomBytes, scryptSync } from 'node:crypto';

export type KdfAlgorithm = 'argon2id' | 'scrypt';

export type KdfParams = {
  algorithm: KdfAlgorithm;
  salt: string;
  // argon2id params
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
  // scrypt params
  N?: number;
  r?: number;
  p?: number;
};

export function generateSalt(): string {
  return randomBytes(32).toString('base64');
}

export function getDefaultKdfParams(): KdfParams {
  return {
    algorithm: 'argon2id',
    salt: generateSalt(),
    memoryCost: 65536, // 64 MiB
    timeCost: 3,
    parallelism: 1,
  };
}

export function getScryptFallbackParams(): KdfParams {
  return {
    algorithm: 'scrypt',
    salt: generateSalt(),
    N: 2 ** 17, // 131072
    r: 8,
    p: 1,
  };
}

export async function deriveKey(
  password: string,
  params: KdfParams
): Promise<Buffer> {
  const saltBuffer = Buffer.from(params.salt, 'base64');

  if (params.algorithm === 'argon2id') {
    try {
      const argon2 = await import('argon2');
      const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        salt: saltBuffer,
        memoryCost: params.memoryCost ?? 65536,
        timeCost: params.timeCost ?? 3,
        parallelism: params.parallelism ?? 1,
        hashLength: 32,
        raw: true,
      });
      return Buffer.from(hash);
    } catch {
      throw new Error('Argon2 key derivation failed');
    }
  }

  // scrypt fallback
  const key = scryptSync(password, saltBuffer, 32, {
    N: params.N ?? 2 ** 17,
    r: params.r ?? 8,
    p: params.p ?? 1,
  });
  return Buffer.from(key);
}
