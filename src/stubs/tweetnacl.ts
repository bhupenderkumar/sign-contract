// Stub for tweetnacl
export const nacl = {
  sign: {
    keyPair: () => ({
      publicKey: new Uint8Array(32),
      secretKey: new Uint8Array(64)
    }),
    detached: (message: Uint8Array, secretKey: Uint8Array) => new Uint8Array(64),
    detached: {
      verify: (message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array) => false
    }
  },
  box: {
    keyPair: () => ({
      publicKey: new Uint8Array(32),
      secretKey: new Uint8Array(32)
    }),
    before: (publicKey: Uint8Array, secretKey: Uint8Array) => new Uint8Array(32),
    after: (message: Uint8Array, nonce: Uint8Array, sharedKey: Uint8Array) => null,
    open: {
      after: (box: Uint8Array, nonce: Uint8Array, sharedKey: Uint8Array) => null
    }
  },
  secretbox: {
    keyLength: 32,
    nonceLength: 24,
    overheadLength: 16
  },
  hash: (message: Uint8Array) => new Uint8Array(64),
  verify: (x: Uint8Array, y: Uint8Array) => false,
  randomBytes: (length: number) => new Uint8Array(length)
};

export default nacl;
