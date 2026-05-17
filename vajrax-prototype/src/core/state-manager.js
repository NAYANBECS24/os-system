// VajraX OS - State Manager Module
// Maintains single source of truth for cloud desired state, device current state, and queues

class StateManager {
    constructor() {
        // Cloud desired state
        this.desiredState = {
            version: '1.0.0',
            policy: {},
            branding: {},
            lastUpdated: null
        };

        // Device current state
        this.currentState = {
            version: '1.0.0',
            batteryLevel: 85,
            storageUsed: 45,
            networkType: 'wifi',
            isOnline: true,
            queuedItems: 0,
            lastSync: null,
            appliedPolicyVersion: '1.0.0'
        };

        // Transaction queue (offline-first)
        this.transactionQueue = [];

        // Audit log queue
        this.auditQueue = [];

        // Telemetry queue
        this.telemetryQueue = [];

        // Tenant context
        this.tenantContext = null;

        // Device context
        this.deviceContext = null;

        // State history for rollback
        this.stateHistory = [];
        this.maxHistorySize = 10;

        console.log('[StateManager] Initialized');
    }

    /**
     * Initialize with tenant and device data
     */
    initialize(tenantData, deviceData) {
        this.tenantContext = tenantData;
        this.deviceContext = deviceData;
        
        // Set initial desired state from policy
        this.desiredState.policy = this.buildPolicyFromConfig();
        this.desiredState.branding = this.buildBrandingFromConfig();
        this.desiredState.lastUpdated = new Date().toISOString();
        
        // Set initial current state from device
        this.currentState.batteryLevel = deviceData.batteryLevel;
        this.currentState.storageUsed = deviceData.storageUsed;
        this.currentState.isOnline = deviceData.status === 'online';
        this.currentState.appliedPolicyVersion = deviceData.policyVersion;
        
        console.log('[StateManager] Initialized with tenant:', tenantData.id, 'device:', deviceData.id);
    }

    /**
     * Build policy from configuration
     */
    buildPolicyFromConfig() {
        return {
            lockdown: {
                disableCamera: true,
                disableUSB: true,
                disableSettings: false,
                kioskMode: true
            },
            network: {
                wifiRequired: false,
                cellularFallback: true,
                proxyUrl: ''
            },
            security: {
                encryptionEnabled: true,
                auditLogEnabled: true
            }
        };
    }

    /**
     * Build branding from configuration
     */
    buildBrandingFromConfig() {
        return {
            themeColor: '#6366f1',
            companyName: 'ACME Corp',
            primaryLanguage: 'en',
            supportedLanguages: ['en', 'hi', 'ta', 'te']
        };
    }

    /**
     * Get desired state
     */
    getDesiredState() {
        return { ...this.desiredState };
    }

    /**
     * Update desired state (cloud action)
     */
    updateDesiredState(updates) {
        // Save to history for potential rollback
        this.saveToHistory('desiredState', { ...this.desiredState });
        
        // Apply updates
        if (updates.policy) {
            this.desiredState.policy = { ...this.desiredState.policy, ...updates.policy };
        }
        if (updates.branding) {
            this.desiredState.branding = { ...this.desiredState.branding, ...updates.branding };
        }
        if (updates.version) {
            this.desiredState.version = updates.version;
        }
        
        this.desiredState.lastUpdated = new Date().toISOString();
        
        console.log('[StateManager] Desired state updated to version:', this.desiredState.version);
        return this.desiredState;
    }

    /**
     * Get current state
     */
    getCurrentState() {
        return { ...this.currentState };
    }

    /**
     * Update current state (device action)
     */
    updateCurrentState(updates) {
        this.saveToHistory('currentState', { ...this.currentState });
        
        Object.assign(this.currentState, updates);
        this.currentState.lastSync = new Date().toISOString();
        
        console.log('[StateManager] Current state updated:', updates);
        return this.currentState;
    }

    /**
     * Compute diff between desired and current state
     */
    computeDiff() {
        const diff = {
            policy: {},
            branding: {},
            hasChanges: false
        };

        // Compare policy
        if (this.desiredState.policy) {
            Object.keys(this.desiredState.policy).forEach(key => {
                if (!this.currentState[key] || 
                    JSON.stringify(this.desiredState.policy[key]) !== JSON.stringify(this.currentState[key])) {
                    diff.policy[key] = this.desiredState.policy[key];
                    diff.hasChanges = true;
                }
            });
        }

        // Compare branding
        if (this.desiredState.branding) {
            Object.keys(this.desiredState.branding).forEach(key => {
                if (this.currentState.branding && 
                    this.desiredState.branding[key] !== this.currentState.branding[key]) {
                    diff.branding[key] = this.desiredState.branding[key];
                    diff.hasChanges = true;
                }
            });
        }

        // Check version difference
        if (this.desiredState.version !== this.currentState.appliedPolicyVersion) {
            diff.version = this.desiredState.version;
            diff.hasChanges = true;
        }

        console.log('[StateManager] Computed diff:', diff);
        return diff;
    }

    /**
     * Add transaction to queue
     */
    queueTransaction(transaction) {
        const queuedItem = {
            id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'transaction',
            payload: transaction,
            timestamp: new Date().toISOString(),
            idempotencyKey: `idem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            retryCount: 0
        };

        this.transactionQueue.push(queuedItem);
        this.currentState.queuedItems = this.transactionQueue.length;
        
        console.log('[StateManager] Transaction queued:', queuedItem.id);
        return queuedItem;
    }

    /**
     * Get queued transactions
     */
    getQueuedTransactions() {
        return [...this.transactionQueue];
    }

    /**
     * Clear synced transactions from queue
     */
    clearSyncedTransactions(ids) {
        this.transactionQueue = this.transactionQueue.filter(item => !ids.includes(item.id));
        this.currentState.queuedItems = this.transactionQueue.length;
        
        console.log('[StateManager] Cleared', ids.length, 'synced transactions');
    }

    /**
     * Queue audit entry
     */
    queueAuditEntry(entry) {
        const auditItem = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'audit',
            payload: entry,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        this.auditQueue.push(auditItem);
        console.log('[StateManager] Audit entry queued:', auditItem.id);
        return auditItem;
    }

    /**
     * Get queued audit entries
     */
    getQueuedAuditEntries() {
        return [...this.auditQueue];
    }

    /**
     * Clear synced audit entries
     */
    clearSyncedAuditEntries(ids) {
        this.auditQueue = this.auditQueue.filter(item => !ids.includes(item.id));
        console.log('[StateManager] Cleared', ids.length, 'synced audit entries');
    }

    /**
     * Queue telemetry data
     */
    queueTelemetry(metrics) {
        const telemetryItem = {
            id: `tel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'telemetry',
            payload: metrics,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        this.telemetryQueue.push(telemetryItem);
        console.log('[StateManager] Telemetry queued:', telemetryItem.id);
        return telemetryItem;
    }

    /**
     * Get queued telemetry
     */
    getQueuedTelemetry() {
        return [...this.telemetryQueue];
    }

    /**
     * Clear synced telemetry
     */
    clearSyncedTelemetry(ids) {
        this.telemetryQueue = this.telemetryQueue.filter(item => !ids.includes(item.id));
        console.log('[StateManager] Cleared', ids.length, 'synced telemetry items');
    }

    /**
     * Save state to history for rollback
     */
    saveToHistory(stateType, state) {
        this.stateHistory.push({
            type: stateType,
            state,
            timestamp: new Date().toISOString()
        });

        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    }

    /**
     * Rollback to previous state
     */
    rollback(steps = 1) {
        if (this.stateHistory.length < steps) {
            console.warn('[StateManager] Cannot rollback, insufficient history');
            return false;
        }

        const targetState = this.stateHistory[this.stateHistory.length - steps];
        
        if (targetState.type === 'desiredState') {
            this.desiredState = targetState.state;
        } else if (targetState.type === 'currentState') {
            this.currentState = targetState.state;
        }

        console.log('[StateManager] Rolled back', steps, 'step(s)');
        return true;
    }

    /**
     * Get queue counts
     */
    getQueueCounts() {
        return {
            transactions: this.transactionQueue.length,
            audit: this.auditQueue.length,
            telemetry: this.telemetryQueue.length,
            total: this.transactionQueue.length + this.auditQueue.length + this.telemetryQueue.length
        };
    }

    /**
     * Get state hash for verification
     */
    getStateHash() {
        const stateString = JSON.stringify({
            desired: this.desiredState,
            current: this.currentState
        });
        
        // Simple hash simulation (in production, use SHA-256)
        let hash = 0;
        for (let i = 0; i < stateString.length; i++) {
            const char = stateString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return `0x${Math.abs(hash).toString(16).padStart(8, '0')}`;
    }

    /**
     * Reset state manager
     */
    reset() {
        this.transactionQueue = [];
        this.auditQueue = [];
        this.telemetryQueue = [];
        this.stateHistory = [];
        this.currentState.queuedItems = 0;
        
        console.log('[StateManager] Reset complete');
    }
}

// Export singleton instance
const stateManager = new StateManager();

// Make available globally
window.StateManager = StateManager;
window.stateManager = stateManager;
