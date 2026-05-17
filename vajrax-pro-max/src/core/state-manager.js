// VajraX OS Pro Max - State Manager Module
// Centralized state management with multi-tenant isolation

class StateManager {
    constructor() {
        // Multi-tenant scoped state
        this.tenants = new Map();
        this.currentTenant = null;
        
        // Global application state
        this.appState = {
            isOnline: true,
            connectionType: 'wifi',
            demoRunning: false,
            lastSyncTime: null,
            bootProgress: 0,
            deviceScreen: 'boot' // boot, launcher, transaction, success
        };
        
        // Device current state (data plane)
        this.deviceState = {
            batteryLevel: 87,
            storageUsed: 45, // percentage
            cpuUsage: 23,
            memoryUsage: 1245, // MB
            networkLatency: 45, // ms
            transactionRate: 12, // per minute
            queuedTransactions: [],
            queuedAuditLogs: [],
            queuedTelemetry: [],
            policyVersion: '2.4.1',
            theme: {
                primaryColor: '#00d9ff',
                secondaryColor: '#7b2ff7',
                bgDarkColor: '#0a0e1a',
                accentColor: '#00ff88',
                brandName: 'VajraX POS',
                language: 'en'
            },
            lockdownPolicy: {
                allowedApps: ['payment', 'reports', 'inventory', 'customers', 'settings'],
                blockedApps: ['browser', 'camera', 'gallery'],
                kioskMode: true,
                hardwareButtonsEnabled: false
            }
        };
        
        // Cloud desired state (control plane)
        this.desiredState = {
            policyVersion: '2.4.1',
            theme: { ...this.deviceState.theme },
            lockdownPolicy: { ...this.deviceState.lockdownPolicy },
            networkPolicy: {
                preferredNetwork: 'wifi',
                fallbackToCellular: true,
                dataRoaming: false,
                wifiBlacklist: [],
                wifiWhitelist: ['ACME-Corp', 'Guest-Network']
            },
            schedulePolicy: {
                operatingHours: { start: '09:00', end: '21:00' },
                autoShutdown: false,
                maintenanceWindow: '02:00-04:00'
            },
            geofencePolicy: {
                enabled: false,
                allowedRadius: 100, // meters
                centerLat: null,
                centerLng: null
            }
        };
        
        // Audit chain state
        this.auditState = {
            entries: [],
            chainHead: null,
            previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
            integrityValid: true,
            tenantKeys: new Map()
        };
        
        // Fleet state
        this.fleetState = {
            devices: [],
            totalDevices: 0,
            onlineCount: 0,
            offlineCount: 0,
            pendingSyncCount: 0,
            todayTransactions: 0
        };
    }
    
    /**
     * Initialize tenant context
     */
    async initializeTenant(tenantId) {
        if (!this.tenants.has(tenantId)) {
            const tenantData = {
                id: tenantId,
                createdAt: Date.now(),
                devices: [],
                policies: {},
                auditChain: {
                    entries: [],
                    chainHead: null,
                    previousHash: '0'.repeat(64)
                },
                telemetry: []
            };
            this.tenants.set(tenantId, tenantData);
            
            // Generate simulated tenant key
            const tenantKey = await this.generateTenantKey(tenantId);
            this.auditState.tenantKeys.set(tenantId, tenantKey);
        }
        
        this.currentTenant = tenantId;
        return this.tenants.get(tenantId);
    }
    
    /**
     * Generate simulated tenant signing key
     */
    async generateTenantKey(tenantId) {
        // Simulate Ed25519 key generation
        const hash = await this.sha256(tenantId + Date.now().toString());
        return {
            publicKey: hash.substring(0, 32),
            privateKey: hash // In real implementation, never expose private key
        };
    }
    
    /**
     * SHA-256 hash simulation
     */
    async sha256(data) {
        const msgBuffer = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Get current tenant state
     */
    getCurrentTenantState() {
        if (!this.currentTenant) return null;
        return this.tenants.get(this.currentTenant);
    }
    
    /**
     * Update device state atomically
     */
    updateDeviceState(updates) {
        const oldState = { ...this.deviceState };
        
        // Deep merge updates
        for (const key in updates) {
            if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
                this.deviceState[key] = { ...this.deviceState[key], ...updates[key] };
            } else {
                this.deviceState[key] = updates[key];
            }
        }
        
        return { oldState, newState: { ...this.deviceState } };
    }
    
    /**
     * Queue transaction for offline sync
     */
    queueTransaction(transaction) {
        const idempotencyKey = this.generateIdempotencyKey(transaction);
        const queuedItem = {
            ...transaction,
            idempotencyKey,
            queuedAt: Date.now(),
            status: 'pending',
            retryCount: 0
        };
        
        this.deviceState.queuedTransactions.push(queuedItem);
        
        // Create audit entry
        this.createAuditEntry({
            eventType: 'payment.queued',
            severity: 'info',
            payload: {
                transactionId: transaction.id,
                amount: transaction.amount,
                method: transaction.method
            }
        });
        
        return queuedItem;
    }
    
    /**
     * Generate idempotency key for transaction
     */
    generateIdempotencyKey(transaction) {
        const data = JSON.stringify({
            amount: transaction.amount,
            method: transaction.method,
            timestamp: Date.now(),
            random: Math.random()
        });
        return 'idemp_' + this.sha256Sync(data).substring(0, 16);
    }
    
    /**
     * Synchronous hash for idempotency (simplified)
     */
    sha256Sync(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(16, '0');
    }
    
    /**
     * Process queued transactions on reconnect
     */
    async processQueuedTransactions() {
        const queue = [...this.deviceState.queuedTransactions];
        const processed = [];
        const failed = [];
        
        for (const transaction of queue) {
            try {
                // Simulate cloud acknowledgment
                await this.simulateCloudAck(transaction);
                
                // Create completion audit entry
                this.createAuditEntry({
                    eventType: 'payment.synced',
                    severity: 'info',
                    payload: {
                        transactionId: transaction.id,
                        idempotencyKey: transaction.idempotencyKey
                    }
                });
                
                processed.push(transaction);
            } catch (error) {
                failed.push(transaction);
            }
        }
        
        // Remove processed from queue
        this.deviceState.queuedTransactions = this.deviceState.queuedTransactions.filter(
            t => !processed.includes(t)
        );
        
        return { processed, failed };
    }
    
    /**
     * Simulate cloud acknowledgment
     */
    async simulateCloudAck(transaction) {
        return new Promise(resolve => {
            setTimeout(() => resolve({ ack: true, txnId: transaction.id }), 100);
        });
    }
    
    /**
     * Create audit entry with cryptographic chaining
     */
    async createAuditEntry(entry) {
        const timestamp = Date.now();
        const entryData = {
            id: 'audit_' + timestamp + '_' + Math.random().toString(36).substr(2, 9),
            timestamp,
            tenantId: this.currentTenant,
            deviceId: 'device-001',
            eventType: entry.eventType,
            severity: entry.severity || 'info',
            payload: entry.payload || {},
            previousHash: this.auditState.previousHash,
            version: 1
        };
        
        // Compute hash chain
        const entryString = JSON.stringify(entryData);
        const currentHash = await this.sha256(entryString);
        entryData.currentHash = currentHash;
        
        // Sign entry (simulated)
        const tenantKey = this.auditState.tenantKeys.get(this.currentTenant);
        if (tenantKey) {
            entryData.signature = await this.sha256(currentHash + tenantKey.privateKey);
        }
        
        // Add to chain
        this.auditState.entries.push(entryData);
        this.auditState.previousHash = currentHash;
        this.auditState.chainHead = currentHash.substring(0, 8);
        
        // Also store in tenant-specific chain
        if (this.currentTenant) {
            const tenantState = this.tenants.get(this.currentTenant);
            if (tenantState) {
                tenantState.auditChain.entries.push(entryData);
                tenantState.auditChain.chainHead = currentHash.substring(0, 8);
            }
        }
        
        // Queue for cloud sync if offline
        if (!this.appState.isOnline) {
            this.deviceState.queuedAuditLogs.push(entryData);
        }
        
        return entryData;
    }
    
    /**
     * Verify audit chain integrity
     */
    async verifyChainIntegrity() {
        let previousHash = '0'.repeat(64);
        
        for (const entry of this.auditState.entries) {
            if (entry.previousHash !== previousHash) {
                this.auditState.integrityValid = false;
                return {
                    valid: false,
                    error: `Chain break at entry ${entry.id}`,
                    expectedHash: previousHash,
                    actualHash: entry.previousHash
                };
            }
            
            // Verify entry hash
            const entryString = JSON.stringify({
                id: entry.id,
                timestamp: entry.timestamp,
                tenantId: entry.tenantId,
                deviceId: entry.deviceId,
                eventType: entry.eventType,
                severity: entry.severity,
                payload: entry.payload,
                previousHash: entry.previousHash,
                version: entry.version
            });
            
            const computedHash = await this.sha256(entryString);
            if (computedHash !== entry.currentHash) {
                this.auditState.integrityValid = false;
                return {
                    valid: false,
                    error: `Hash mismatch at entry ${entry.id}`,
                    computedHash,
                    storedHash: entry.currentHash
                };
            }
            
            previousHash = entry.currentHash;
        }
        
        this.auditState.integrityValid = true;
        return { valid: true, entriesVerified: this.auditState.entries.length };
    }
    
    /**
     * Update desired state from cloud
     */
    updateDesiredState(updates) {
        const oldState = { ...this.desiredState };
        
        for (const key in updates) {
            if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
                this.desiredState[key] = { ...this.desiredState[key], ...updates[key] };
            } else {
                this.desiredState[key] = updates[key];
            }
        }
        
        // Increment policy version
        const versionParts = this.desiredState.policyVersion.split('.').map(Number);
        versionParts[2]++;
        this.desiredState.policyVersion = versionParts.join('.');
        
        return { oldState, newState: { ...this.desiredState } };
    }
    
    /**
     * Compute state diff for reconciliation
     */
    computeStateDiff() {
        const diffs = [];
        
        // Compare theme
        for (const key in this.desiredState.theme) {
            if (this.deviceState.theme[key] !== this.desiredState.theme[key]) {
                diffs.push({
                    path: `theme.${key}`,
                    currentValue: this.deviceState.theme[key],
                    desiredValue: this.desiredState.theme[key]
                });
            }
        }
        
        // Compare lockdown policy
        for (const key in this.desiredState.lockdownPolicy) {
            if (JSON.stringify(this.deviceState.lockdownPolicy[key]) !== 
                JSON.stringify(this.desiredState.lockdownPolicy[key])) {
                diffs.push({
                    path: `lockdownPolicy.${key}`,
                    currentValue: this.deviceState.lockdownPolicy[key],
                    desiredValue: this.desiredState.lockdownPolicy[key]
                });
            }
        }
        
        // Compare policy version
        if (this.deviceState.policyVersion !== this.desiredState.policyVersion) {
            diffs.push({
                path: 'policyVersion',
                currentValue: this.deviceState.policyVersion,
                desiredValue: this.desiredState.policyVersion
            });
        }
        
        return diffs;
    }
    
    /**
     * Apply reconciliation diffs
     */
    async applyDiffs(diffs) {
        const applied = [];
        const rejected = [];
        
        for (const diff of diffs) {
            try {
                const parts = diff.path.split('.');
                const [category, key] = parts;
                
                if (this.deviceState[category] && key in this.deviceState[category]) {
                    this.deviceState[category][key] = diff.desiredValue;
                    applied.push(diff);
                    
                    // Create audit entry
                    await this.createAuditEntry({
                        eventType: 'policy.applied',
                        severity: 'info',
                        payload: {
                            path: diff.path,
                            oldValue: diff.currentValue,
                            newValue: diff.desiredValue
                        }
                    });
                } else {
                    rejected.push({
                        ...diff,
                        reason: 'Invalid path'
                    });
                }
            } catch (error) {
                rejected.push({
                    ...diff,
                    reason: error.message
                });
            }
        }
        
        return { applied, rejected };
    }
    
    /**
     * Update fleet statistics
     */
    updateFleetStats() {
        const devices = this.fleetState.devices;
        this.fleetState.totalDevices = devices.length;
        this.fleetState.onlineCount = devices.filter(d => d.status === 'online').length;
        this.fleetState.offlineCount = devices.filter(d => d.status === 'offline').length;
        this.fleetState.pendingSyncCount = devices.filter(d => d.syncStatus === 'pending').length;
        
        // Calculate today's transactions
        const today = new Date().toDateString();
        this.fleetState.todayTransactions = devices.reduce((sum, d) => {
            const todayTxns = d.transactions?.filter(t => 
                new Date(t.timestamp).toDateString() === today
            ).length || 0;
            return sum + todayTxns;
        }, 0);
    }
    
    /**
     * Get full state snapshot
     */
    getStateSnapshot() {
        return {
            appState: { ...this.appState },
            deviceState: { ...this.deviceState },
            desiredState: { ...this.desiredState },
            auditState: {
                entryCount: this.auditState.entries.length,
                chainHead: this.auditState.chainHead,
                integrityValid: this.auditState.integrityValid
            },
            fleetState: { ...this.fleetState },
            currentTenant: this.currentTenant
        };
    }
    
    /**
     * Reset all state
     */
    reset() {
        this.appState = {
            isOnline: true,
            connectionType: 'wifi',
            demoRunning: false,
            lastSyncTime: null,
            bootProgress: 0,
            deviceScreen: 'boot'
        };
        
        this.deviceState = {
            batteryLevel: 87,
            storageUsed: 45,
            cpuUsage: 23,
            memoryUsage: 1245,
            networkLatency: 45,
            transactionRate: 12,
            queuedTransactions: [],
            queuedAuditLogs: [],
            queuedTelemetry: [],
            policyVersion: '2.4.1',
            theme: { ...this.deviceState.theme },
            lockdownPolicy: { ...this.deviceState.lockdownPolicy }
        };
        
        this.auditState = {
            entries: [],
            chainHead: null,
            previousHash: '0'.repeat(64),
            integrityValid: true,
            tenantKeys: this.auditState.tenantKeys
        };
        
        this.fleetState = {
            devices: [],
            totalDevices: 0,
            onlineCount: 0,
            offlineCount: 0,
            pendingSyncCount: 0,
            todayTransactions: 0
        };
    }
}

// Create global state manager instance
window.VajraXStateManager = new StateManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
