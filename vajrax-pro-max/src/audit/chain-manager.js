// VajraX OS Pro Max - Audit Chain Manager Module
// Forward-secure cryptographic audit chain with tamper detection

class ChainManager {
    constructor() {
        this.chains = new Map(); // Per-tenant chains
        this.currentTenant = null;
        this.visualizationCanvas = null;
        this.visualizationCtx = null;
    }
    
    /**
     * Initialize chain for tenant
     */
    async initializeChain(tenantId) {
        const chain = {
            tenantId,
            entries: [],
            genesisHash: '0'.repeat(64),
            currentHead: '0'.repeat(64),
            headShort: 'GENESIS',
            createdAt: Date.now(),
            totalEntries: 0,
            integrityValid: true,
            lastVerifiedAt: null
        };
        
        // Create genesis block
        const genesisBlock = await this.createGenesisBlock(tenantId);
        chain.entries.push(genesisBlock);
        chain.currentHead = genesisBlock.currentHash;
        chain.headShort = genesisBlock.currentHash.substring(0, 8);
        
        this.chains.set(tenantId, chain);
        return chain;
    }
    
    /**
     * Create genesis block
     */
    async createGenesisBlock(tenantId) {
        const genesisPayload = {
            type: 'genesis',
            tenantId,
            message: 'Audit chain initialized',
            version: '1.0.0'
        };
        
        const hash = await window.VajraXCrypto.sha256(JSON.stringify({
            previousHash: '0'.repeat(64),
            payload: genesisPayload,
            timestamp: Date.now()
        }));
        
        return {
            id: 'genesis_' + tenantId,
            timestamp: Date.now(),
            eventType: 'system.chain_init',
            severity: 'info',
            payload: genesisPayload,
            previousHash: '0'.repeat(64),
            currentHash: hash,
            signature: hash,
            hashShort: hash.substring(0, 8),
            blockNumber: 0
        };
    }
    
    /**
     * Add entry to chain
     */
    async addEntry(entryData) {
        if (!this.currentTenant) {
            throw new Error('No tenant context set');
        }
        
        const chain = this.chains.get(this.currentTenant);
        if (!chain) {
            throw new Error('Chain not initialized for tenant');
        }
        
        const previousHash = chain.currentHead;
        
        // Create chain link
        const link = await window.VajraXCrypto.createChainLink(
            previousHash,
            entryData,
            'simulated-private-key-' + this.currentTenant
        );
        
        const entry = {
            id: entryData.id || 'entry_' + Date.now(),
            timestamp: entryData.timestamp || Date.now(),
            tenantId: this.currentTenant,
            deviceId: entryData.deviceId || 'device-001',
            eventType: entryData.eventType,
            severity: entryData.severity || 'info',
            payload: entryData.payload || {},
            previousHash,
            currentHash: link.currentHash,
            signature: link.signature,
            hashShort: link.hashShort,
            blockNumber: chain.entries.length,
            nonce: link.nonce
        };
        
        chain.entries.push(entry);
        chain.currentHead = entry.currentHash;
        chain.headShort = entry.currentHash.substring(0, 8);
        chain.totalEntries++;
        
        return entry;
    }
    
    /**
     * Verify entire chain integrity
     */
    async verifyChainIntegrity(tenantId = this.currentTenant) {
        const chain = this.chains.get(tenantId);
        if (!chain) {
            return { valid: false, error: 'Chain not found' };
        }
        
        let previousHash = '0'.repeat(64);
        const errors = [];
        
        for (let i = 0; i < chain.entries.length; i++) {
            const entry = chain.entries[i];
            
            // Check previous hash linkage
            if (entry.previousHash !== previousHash) {
                errors.push({
                    entryId: entry.id,
                    blockNumber: i,
                    error: 'Previous hash mismatch',
                    expected: previousHash.substring(0, 8),
                    actual: entry.previousHash.substring(0, 8)
                });
            }
            
            // Recompute and verify hash
            const linkData = {
                previousHash: entry.previousHash,
                payload: entry.payload,
                timestamp: entry.timestamp,
                nonce: entry.nonce
            };
            
            const computedHash = await window.VajraXCrypto.sha256(JSON.stringify(linkData));
            
            if (computedHash !== entry.currentHash) {
                errors.push({
                    entryId: entry.id,
                    blockNumber: i,
                    error: 'Hash mismatch - possible tampering detected',
                    computed: computedHash.substring(0, 8),
                    stored: entry.currentHash.substring(0, 8)
                });
            }
            
            previousHash = entry.currentHash;
        }
        
        chain.integrityValid = errors.length === 0;
        chain.lastVerifiedAt = Date.now();
        
        return {
            valid: errors.length === 0,
            entriesVerified: chain.entries.length,
            errors,
            verifiedAt: chain.lastVerifiedAt
        };
    }
    
    /**
     * Get chain entries with pagination
     */
    getEntries(tenantId = this.currentTenant, page = 1, limit = 50) {
        const chain = this.chains.get(tenantId);
        if (!chain) return { entries: [], total: 0, page, limit };
        
        const start = (page - 1) * limit;
        const end = start + limit;
        const entries = chain.entries.slice(start, end).reverse();
        
        return {
            entries,
            total: chain.entries.length,
            page,
            limit,
            totalPages: Math.ceil(chain.entries.length / limit)
        };
    }
    
    /**
     * Search entries by criteria
     */
    searchEntries(query, tenantId = this.currentTenant) {
        const chain = this.chains.get(tenantId);
        if (!chain) return [];
        
        const results = chain.entries.filter(entry => {
            const searchText = JSON.stringify(entry).toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
        
        return results.reverse();
    }
    
    /**
     * Filter entries by event type
     */
    filterByEventType(eventType, tenantId = this.currentTenant) {
        const chain = this.chains.get(tenantId);
        if (!chain) return [];
        
        return chain.entries.filter(entry => 
            entry.eventType === eventType
        ).reverse();
    }
    
    /**
     * Filter entries by severity
     */
    filterBySeverity(severity, tenantId = this.currentTenant) {
        const chain = this.chains.get(tenantId);
        if (!chain) return [];
        
        return chain.entries.filter(entry => 
            entry.severity === severity
        ).reverse();
    }
    
    /**
     * Get chain statistics
     */
    getChainStats(tenantId = this.currentTenant) {
        const chain = this.chains.get(tenantId);
        if (!chain) return null;
        
        const eventTypes = {};
        const severities = {};
        
        chain.entries.forEach(entry => {
            eventTypes[entry.eventType] = (eventTypes[entry.eventType] || 0) + 1;
            severities[entry.severity] = (severities[entry.severity] || 0) + 1;
        });
        
        return {
            totalEntries: chain.totalEntries,
            chainHead: chain.headShort,
            fullHeadHash: chain.currentHead,
            integrityValid: chain.integrityValid,
            createdAt: chain.createdAt,
            lastVerifiedAt: chain.lastVerifiedAt,
            eventTypes,
            severities,
            entriesPerHour: chain.totalEntries / ((Date.now() - chain.createdAt) / (1000 * 60 * 60) || 1)
        };
    }
    
    /**
     * Export chain to JSON
     */
    exportChain(tenantId = this.currentTenant) {
        const chain = this.chains.get(tenantId);
        if (!chain) return null;
        
        return {
            tenantId,
            exportedAt: Date.now(),
            chain: {
                genesisHash: chain.genesisHash,
                currentHead: chain.currentHead,
                totalEntries: chain.totalEntries,
                integrityValid: chain.integrityValid,
                entries: chain.entries
            }
        };
    }
    
    /**
     * Visualize chain on canvas
     */
    visualizeChain(canvasId, tenantId = this.currentTenant) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        this.visualizationCanvas = canvas;
        this.visualizationCtx = canvas.getContext('2d');
        
        const chain = this.chains.get(tenantId);
        if (!chain) return;
        
        const ctx = this.visualizationCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Background
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, width, height);
        
        const entries = chain.entries.slice(-10); // Last 10 entries
        const blockWidth = 70;
        const blockHeight = 50;
        const spacing = 10;
        const totalWidth = entries.length * (blockWidth + spacing);
        const startX = (width - totalWidth) / 2;
        const centerY = height / 2;
        
        // Draw blocks
        entries.forEach((entry, index) => {
            const x = startX + index * (blockWidth + spacing);
            const y = centerY - blockHeight / 2;
            
            // Block background
            const gradient = ctx.createLinearGradient(x, y, x + blockWidth, y + blockHeight);
            gradient.addColorStop(0, '#1a2236');
            gradient.addColorStop(1, '#25304d');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, blockWidth, blockHeight);
            
            // Block border
            ctx.strokeStyle = chain.integrityValid ? '#00ff88' : '#ff4757';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, blockWidth, blockHeight);
            
            // Hash text (abbreviated)
            ctx.fillStyle = '#00d9ff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(entry.hashShort, x + blockWidth / 2, y + blockHeight / 2 + 4);
            
            // Block number
            ctx.fillStyle = '#718096';
            ctx.font = '8px sans-serif';
            ctx.fillText(`#${entry.blockNumber}`, x + blockWidth / 2, y + blockHeight - 15);
            
            // Draw connector arrow
            if (index < entries.length - 1) {
                const arrowStart = x + blockWidth;
                const arrowEnd = x + blockWidth + spacing;
                
                ctx.strokeStyle = '#4a5568';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(arrowStart, centerY);
                ctx.lineTo(arrowEnd, centerY);
                ctx.stroke();
                
                // Arrowhead
                ctx.beginPath();
                ctx.moveTo(arrowEnd, centerY - 4);
                ctx.lineTo(arrowEnd + 6, centerY);
                ctx.lineTo(arrowEnd, centerY + 4);
                ctx.closePath();
                ctx.fillStyle = '#4a5568';
                ctx.fill();
            }
        });
        
        // Draw chain status
        ctx.fillStyle = chain.integrityValid ? '#00ff88' : '#ff4757';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(
            chain.integrityValid ? '✓ CHAIN VERIFIED' : '⚠ TAMPER DETECTED',
            width - 20,
            30
        );
    }
    
    /**
     * Set current tenant context
     */
    setTenant(tenantId) {
        this.currentTenant = tenantId;
        if (!this.chains.has(tenantId)) {
            this.initializeChain(tenantId);
        }
    }
    
    /**
     * Reset chain (for demo purposes)
     */
    async resetChain(tenantId) {
        this.chains.delete(tenantId);
        await this.initializeChain(tenantId);
    }
}

// Create global chain manager instance
window.VajraXChainManager = new ChainManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChainManager;
}
