// VajraX OS - Audit Chain Manager
// Manages cryptographic audit chain with forward-secure hashing

class ChainManager {
    constructor() {
        this.chain = [];
        this.headHash = '0x' + '0'.repeat(64); // Genesis hash
        this.isIntact = true;
        
        console.log('[ChainManager] Initialized with genesis block');
    }

    /**
     * Add entry to audit chain
     */
    addEntry(eventType, payload = {}) {
        const entry = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            payload,
            tenantId: window.stateManager?.tenantContext?.id || 'unknown',
            deviceId: window.stateManager?.deviceContext?.id || 'sim-001'
        };

        // Create chain entry with cryptographic linkage
        const chainEntry = window.cryptoUtils.createChainEntry(entry, this.headHash);
        
        // Add to chain
        this.chain.push(chainEntry);
        this.headHash = chainEntry.hash;
        
        console.log('[ChainManager] Entry added:', chainEntry.id);
        
        // Publish audit event
        window.eventBus.publish(window.EventTypes.AUDIT_ENTRY, {
            entry: chainEntry,
            chainLength: this.chain.length
        });
        
        return chainEntry;
    }

    /**
     * Get full chain
     */
    getChain() {
        return [...this.chain];
    }

    /**
     * Get recent entries
     */
    getRecent(count = 10) {
        return this.chain.slice(-count);
    }

    /**
     * Verify chain integrity
     */
    verifyIntegrity() {
        const result = window.cryptoUtils.verifyChain(this.chain);
        this.isIntact = result.valid;
        
        if (!result.valid) {
            window.eventBus.publish(window.EventTypes.AUDIT_TAMPER_DETECTED, result);
        } else {
            window.eventBus.publish(window.EventTypes.AUDIT_CHAIN_VALID, result);
        }
        
        return result;
    }

    /**
     * Get chain head
     */
    getHead() {
        return {
            hash: this.headHash,
            sequenceNumber: this.chain.length,
            lastEntry: this.chain[this.chain.length - 1] || null
        };
    }

    /**
     * Get chain statistics
     */
    getStats() {
        const eventTypes = {};
        this.chain.forEach(entry => {
            eventTypes[entry.type] = (eventTypes[entry.type] || 0) + 1;
        });
        
        return {
            totalEntries: this.chain.length,
            eventTypes,
            isIntact: this.isIntact,
            headHash: this.headHash.substring(0, 16) + '...'
        };
    }

    /**
     * Export chain for verification
     */
    export() {
        return JSON.stringify(this.chain, null, 2);
    }

    /**
     * Reset chain (for demo purposes)
     */
    reset() {
        this.chain = [];
        this.headHash = '0x' + '0'.repeat(64);
        this.isIntact = true;
        window.cryptoUtils.resetSequence();
        
        console.log('[ChainManager] Reset complete');
    }
}

// Export singleton instance
const chainManager = new ChainManager();

// Make available globally
window.ChainManager = ChainManager;
window.chainManager = chainManager;
