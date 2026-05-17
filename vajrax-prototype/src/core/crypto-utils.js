// VajraX OS - Crypto Utilities Module
// Provides deterministic hashing and signature simulation for audit chain

class CryptoUtils {
    constructor() {
        this.algorithm = 'SHA-256-simulated';
        this.signatureAlgorithm = 'Ed25519-simulated';
    }

    /**
     * Generate SHA-256 style hash (simulated for browser demo)
     * @param {string} data - Input data to hash
     * @returns {string} Hex-encoded hash
     */
    hash(data) {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        
        // Simulate SHA-256 with a deterministic hash function
        let hash = 0;
        const result = [];
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
            
            // Mix in position-based entropy
            hash = hash ^ (i * 31);
        }
        
        // Generate 64-character hex string (256 bits)
        const baseHash = Math.abs(hash).toString(16).padStart(8, '0');
        let fullHash = baseHash;
        
        while (fullHash.length < 64) {
            const nextChar = str.charCodeAt(fullHash.length % str.length);
            const mixed = ((hash << 7) - hash) + nextChar + fullHash.length;
            fullHash += Math.abs(mixed).toString(16).padStart(8, '0');
        }
        
        return `sha256:${fullHash.substring(0, 64)}`;
    }

    /**
     * Create forward-secure audit chain entry
     * @param {Object} entry - Audit entry payload
     * @param {string} previousHash - Hash of previous entry
     * @returns {Object} Signed audit entry with chain linkage
     */
    createChainEntry(entry, previousHash = '0x' + '0'.repeat(64)) {
        const timestamp = new Date().toISOString();
        const entryData = {
            ...entry,
            timestamp,
            previousHash,
            sequenceNumber: this.getSequenceNumber()
        };
        
        // Create hash of entry data
        const entryHash = this.hash(JSON.stringify(entryData));
        
        // Sign the entry (simulated)
        const signature = this.sign(entryHash);
        
        return {
            ...entryData,
            hash: entryHash,
            signature,
            verified: true
        };
    }

    /**
     * Verify audit chain entry
     * @param {Object} entry - Audit entry to verify
     * @param {string} expectedPreviousHash - Expected hash of previous entry
     * @returns {boolean} True if entry is valid
     */
    verifyEntry(entry, expectedPreviousHash) {
        if (!entry || !entry.hash || !entry.signature) {
            return false;
        }
        
        // Verify chain linkage
        if (entry.previousHash !== expectedPreviousHash) {
            console.warn('[CryptoUtils] Chain linkage broken!');
            return false;
        }
        
        // Verify signature (simulated)
        const recomputedSignature = this.sign(entry.hash);
        if (recomputedSignature !== entry.signature) {
            console.warn('[CryptoUtils] Signature verification failed!');
            return false;
        }
        
        return true;
    }

    /**
     * Verify entire audit chain
     * @param {Array} chain - Array of audit entries in chronological order
     * @returns {Object} Verification result with details
     */
    verifyChain(chain) {
        if (!chain || chain.length === 0) {
            return { valid: true, message: 'Empty chain' };
        }

        let currentHash = '0x' + '0'.repeat(64); // Genesis hash
        
        for (let i = 0; i < chain.length; i++) {
            const entry = chain[i];
            
            if (!this.verifyEntry(entry, currentHash)) {
                return {
                    valid: false,
                    message: `Chain broken at entry ${i}`,
                    failedAtIndex: i,
                    entryId: entry.id
                };
            }
            
            currentHash = entry.hash;
        }
        
        return {
            valid: true,
            message: 'Chain integrity verified',
            chainLength: chain.length,
            headHash: currentHash
        };
    }

    /**
     * Sign data with simulated Ed25519
     * @param {string} data - Data to sign
     * @returns {string} Simulated signature
     */
    sign(data) {
        const hash = this.hash(data);
        // Simulate Ed25519 signature format
        return `ed25519:${hash.substring(7, 71)}`;
    }

    /**
     * Get sequence number for ordering
     * @returns {number} Current sequence number
     */
    getSequenceNumber() {
        if (!this.sequenceCounter) {
            this.sequenceCounter = 0;
        }
        return ++this.sequenceCounter;
    }

    /**
     * Reset sequence counter
     */
    resetSequence() {
        this.sequenceCounter = 0;
    }

    /**
     * Generate idempotency key
     * @param {string} prefix - Key prefix
     * @returns {string} Unique idempotency key
     */
    generateIdempotencyKey(prefix = 'idem') {
        const random = Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now().toString(36);
        return `${prefix}_${timestamp}_${random}`;
    }

    /**
     * Compute state fingerprint
     * @param {Object} state - State object to fingerprint
     * @returns {string} Short fingerprint for display
     */
    fingerprint(state) {
        const hash = this.hash(JSON.stringify(state));
        return hash.substring(0, 16);
    }
}

// Export singleton instance
const cryptoUtils = new CryptoUtils();

// Make available globally
window.CryptoUtils = CryptoUtils;
window.cryptoUtils = cryptoUtils;
