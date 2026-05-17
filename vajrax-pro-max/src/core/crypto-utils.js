// VajraX OS Pro Max - Crypto Utils Module
// Cryptographic operations simulation

class CryptoUtils {
    constructor() {
        this.algorithm = 'SHA-256';
    }
    
    /**
     * Generate SHA-256 hash
     */
    async sha256(data) {
        const msgBuffer = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest(this.algorithm, msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Generate random hex string
     */
    randomHex(length) {
        const array = new Uint8Array(length / 2);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Generate UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Create forward-secure chain link
     */
    async createChainLink(previousHash, payload, privateKey) {
        const linkData = {
            previousHash,
            payload,
            timestamp: Date.now(),
            nonce: this.randomHex(16)
        };
        
        const linkString = JSON.stringify(linkData);
        const currentHash = await this.sha256(linkString);
        
        // Simulate signature
        const signature = await this.sha256(currentHash + privateKey);
        
        return {
            ...linkData,
            currentHash,
            signature,
            hashShort: currentHash.substring(0, 8)
        };
    }
    
    /**
     * Verify chain link
     */
    async verifyChainLink(link, previousHash, publicKey) {
        // Recompute hash
        const linkData = {
            previousHash: link.previousHash,
            payload: link.payload,
            timestamp: link.timestamp,
            nonce: link.nonce
        };
        
        const linkString = JSON.stringify(linkData);
        const computedHash = await this.sha256(linkString);
        
        if (computedHash !== link.currentHash) {
            return { valid: false, reason: 'Hash mismatch' };
        }
        
        if (link.previousHash !== previousHash) {
            return { valid: false, reason: 'Previous hash mismatch' };
        }
        
        // Verify signature (simulated)
        const expectedSignature = await this.sha256(link.currentHash + 'simulated-key');
        
        return {
            valid: true,
            hashVerified: true,
            chainVerified: true
        };
    }
    
    /**
     * Generate transaction ID
     */
    generateTransactionId() {
        const timestamp = Date.now().toString(36);
        const random = this.randomHex(8);
        return `TXN_${timestamp}_${random}`.toUpperCase();
    }
    
    /**
     * Create HMAC-like signature (simulated)
     */
    async createSignature(data, key) {
        return await this.sha256(data + key);
    }
    
    /**
     * Verify signature (simulated)
     */
    async verifySignature(data, signature, key) {
        const expectedSignature = await this.sha256(data + key);
        return signature === expectedSignature;
    }
    
    /**
     * Encode data to base64
     */
    encodeBase64(data) {
        return btoa(JSON.stringify(data));
    }
    
    /**
     * Decode base64 data
     */
    decodeBase64(encoded) {
        return JSON.parse(atob(encoded));
    }
    
    /**
     * Create merkle tree root hash (simplified)
     */
    async createMerkleRoot(hashes) {
        if (hashes.length === 0) return this.randomHex(64);
        if (hashes.length === 1) return hashes[0];
        
        let level = [...hashes];
        
        while (level.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < level.length; i += 2) {
                const left = level[i];
                const right = i + 1 < level.length ? level[i + 1] : left;
                const combined = await this.sha256(left + right);
                nextLevel.push(combined);
            }
            level = nextLevel;
        }
        
        return level[0];
    }
}

// Create global crypto utils instance
window.VajraXCrypto = new CryptoUtils();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptoUtils;
}
