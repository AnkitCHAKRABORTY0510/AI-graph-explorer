import dotenv from 'dotenv';
dotenv.config();

class KeyManager {
  constructor() {
    this.keys = this._loadKeys();
    this.currentIndex = 0;
    this.failureCount = {}; // Track consecutive failures per key if needed
  }

  _loadKeys() {
    return Object.keys(process.env)
      .filter(key => key.startsWith('GEMINI_API_KEY'))
      .map(key => process.env[key])
      .filter(val => !!val);
  }

  getCurrentKey() {
    if (this.keys.length === 0) return null;
    return this.keys[this.currentIndex];
  }

  rotate() {
    if (this.keys.length <= 1) return this.getCurrentKey();
    
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.log(`🔄 Rotating to API Key #${this.currentIndex + 1}`);
    return this.getCurrentKey();
  }

  get allKeys() {
    return this.keys;
  }
}

export const keyManager = new KeyManager();
