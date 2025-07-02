// Stub for @solana/wallet-adapter-phantom
export class PhantomWalletAdapter {
  constructor() {}
  
  get name() {
    return 'Phantom';
  }
  
  get url() {
    return 'https://phantom.app';
  }
  
  get icon() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgdmlld0JveD0iMCAwIDEwOCAxMDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl8xNzE4XzE0MzUpIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNzguMDc1MiAzNi4yNTQ5QzgwLjA5MzggMzQuMjM2MyA4MC4wOTM4IDMxLjAzNzEgNzguMDc1MiAyOS4wMTg1Qzc2LjA1NjYgMjcgNzIuODU3NCAyNyA3MC44Mzg4IDI5LjAxODVMNTQuNzUgNDUuMTA3M0w0Ni4xNjEyIDM2LjUxODVDNDQuMTQyNiAzNC41IDQwLjk0MzQgMzQuNSAzOC45MjQ4IDM2LjUxODVDMzYuOTA2MiAzOC41MzcxIDM2LjkwNjIgNDEuNzM2MyAzOC45MjQ4IDQzLjc1NDlMNTQuNzUgNTkuNTgwN0w3MC41NzUyIDQzLjc1NDlDNzIuNTkzOCA0MS43MzYzIDc1Ljc5MyA0MS43MzYzIDc3LjgxMTYgNDMuNzU0OUM3OS44MzAyIDQ1Ljc3MzUgNzkuODMwMiA0OC45NzI3IDc3LjgxMTYgNTAuOTkxM0w2MS45ODY0IDY2LjgxNzFDNTkuOTY3OCA2OC44MzU3IDU2Ljc2ODYgNjguODM1NyA1NC43NSA2Ni44MTcxTDM4LjkyNDggNTAuOTkxM0MzNi45MDYyIDQ4Ljk3MjcgMzYuOTA2MiA0NS43NzM1IDM4LjkyNDggNDMuNzU0OUM0MC45NDM0IDQxLjczNjMgNDQuMTQyNiA0MS43MzYzIDQ2LjE2MTIgNDMuNzU0OUw1NC43NSA1Mi4zNDM3TDcwLjgzODggMzYuMjU0OUM3Mi44NTc0IDM0LjIzNjMgNzYuMDU2NiAzNC4yMzYzIDc4LjA3NTIgMzYuMjU0OVoiIGZpbGw9IndoaXRlIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMTcxOF8xNDM1IiB4MT0iMCIgeTE9IjAiIHgyPSIxMDgiIHkyPSIxMDgiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzUzNEJCMSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1NTFCRjkiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K';
  }
  
  get readyState() {
    return 'NotDetected';
  }
  
  get publicKey() {
    return null;
  }
  
  get connecting() {
    return false;
  }
  
  get connected() {
    return false;
  }
  
  async connect() {
    throw new Error('Phantom wallet not available');
  }
  
  async disconnect() {}
  
  async sendTransaction() {
    throw new Error('Phantom wallet not available');
  }
  
  async signTransaction() {
    throw new Error('Phantom wallet not available');
  }
  
  async signAllTransactions() {
    throw new Error('Phantom wallet not available');
  }
  
  async signMessage() {
    throw new Error('Phantom wallet not available');
  }
  
  on() {}
  off() {}
  removeListener() {}
}
