// VajraX OS - Main Application Entry Point
// Initializes all modules and coordinates the prototype

class VajraXApp {
    constructor() {
        this.isOnline = true;
        this.demoRunning = false;
        this.initialized = false;
        
        console.log('[VajraX] Application starting...');
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Wait for DOM to be ready
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    window.addEventListener('load', resolve);
                });
            }

            console.log('[VajraX] Initializing modules...');

            // Load mock data
            await this.loadMockData();

            // Initialize state manager with tenant and device
            const tenantData = this.mockData.tenants[0];
            const deviceData = this.mockData.devices[0];
            window.stateManager.initialize(tenantData, deviceData);

            // Setup event listeners
            this.setupEventListeners();

            // Initialize UI components
            this.initializeUI();

            // Start reconciliation loop
            this.startReconciliationLoop();

            // Mark as initialized
            this.initialized = true;

            // Log initial audit entry
            window.chainManager.addEntry('system.boot', {
                message: 'VajraX OS Prototype initialized',
                version: '2.4.0'
            });

            console.log('[VajraX] Initialization complete');

            // Show boot animation
            this.showBootAnimation();

        } catch (error) {
            console.error('[VajraX] Initialization failed:', error);
        }
    }

    /**
     * Load mock data
     */
    async loadMockData() {
        // Simulated data - in production would fetch from files
        this.mockData = {
            tenants: [
                {
                    id: 'acme-corp',
                    name: 'ACME Corporation',
                    slug: 'acme-corp',
                    plan: 'enterprise',
                    region: 'us-east-1',
                    status: 'active'
                },
                {
                    id: 'retail-plus',
                    name: 'Retail Plus Inc',
                    slug: 'retail-plus',
                    plan: 'professional',
                    region: 'eu-west-1',
                    status: 'active'
                },
                {
                    id: 'fintech-solutions',
                    name: 'FinTech Solutions',
                    slug: 'fintech-solutions',
                    plan: 'enterprise',
                    region: 'ap-south-1',
                    status: 'active'
                }
            ],
            devices: [
                {
                    id: 'vx-2024-001',
                    serialNumber: 'VX2024001ACME',
                    tenantId: 'acme-corp',
                    model: 'VajraX Tablet Pro',
                    osVersion: '2.4.0',
                    status: 'online',
                    batteryLevel: 85,
                    storageUsed: 45,
                    storageTotal: 128,
                    lastSeen: new Date().toISOString(),
                    policyVersion: '1.0.0',
                    stateHash: 'a3f5b8c2d1e4f6789abc',
                    group: 'store-front',
                    location: 'Mumbai Store #001',
                    assignedTo: 'Rajesh Kumar',
                    queuedItems: 0,
                    heartbeatInterval: 60,
                    networkType: 'wifi',
                    ipAddress: '192.168.1.101'
                },
                {
                    id: 'vx-2024-002',
                    serialNumber: 'VX2024002ACME',
                    tenantId: 'acme-corp',
                    model: 'VajraX Tablet Pro',
                    osVersion: '2.4.0',
                    status: 'online',
                    batteryLevel: 72,
                    storageUsed: 38,
                    storageTotal: 128,
                    lastSeen: new Date().toISOString(),
                    policyVersion: '1.0.0',
                    stateHash: 'b4g6c9d3e2f5g7890bcd',
                    group: 'store-front',
                    location: 'Delhi Store #002',
                    assignedTo: 'Priya Sharma',
                    queuedItems: 0,
                    heartbeatInterval: 60,
                    networkType: 'wifi',
                    ipAddress: '192.168.2.102'
                },
                {
                    id: 'vx-2024-003',
                    serialNumber: 'VX2024003ACME',
                    tenantId: 'acme-corp',
                    model: 'VajraX Tablet Lite',
                    osVersion: '2.3.5',
                    status: 'offline',
                    batteryLevel: 23,
                    storageUsed: 67,
                    storageTotal: 64,
                    lastSeen: new Date().toISOString(),
                    policyVersion: '0.9.8',
                    stateHash: 'c5h7d0e4f3g6h8901cde',
                    group: 'warehouse',
                    location: 'Bangalore Warehouse',
                    assignedTo: 'Amit Patel',
                    queuedItems: 12,
                    heartbeatInterval: 60,
                    networkType: 'cellular',
                    ipAddress: '10.0.0.50'
                },
                {
                    id: 'vx-2024-004',
                    serialNumber: 'VX2024004ACME',
                    tenantId: 'acme-corp',
                    model: 'VajraX Tablet Pro',
                    osVersion: '2.4.0',
                    status: 'online',
                    batteryLevel: 91,
                    storageUsed: 29,
                    storageTotal: 128,
                    lastSeen: new Date().toISOString(),
                    policyVersion: '1.0.0',
                    stateHash: 'd6i8e1f5g4h7i9012def',
                    group: 'store-front',
                    location: 'Pune Store #003',
                    assignedTo: 'Sneha Desai',
                    queuedItems: 0,
                    heartbeatInterval: 60,
                    networkType: 'wifi',
                    ipAddress: '192.168.3.103'
                },
                {
                    id: 'vx-2024-005',
                    serialNumber: 'VX2024005ACME',
                    tenantId: 'acme-corp',
                    model: 'VajraX Tablet Pro',
                    osVersion: '2.4.0',
                    status: 'syncing',
                    batteryLevel: 56,
                    storageUsed: 52,
                    storageTotal: 128,
                    lastSeen: new Date().toISOString(),
                    policyVersion: '1.0.0',
                    stateHash: 'e7j9f2g6h5i8j0123efg',
                    group: 'store-front',
                    location: 'Chennai Store #004',
                    assignedTo: 'Karthik Iyer',
                    queuedItems: 3,
                    heartbeatInterval: 60,
                    networkType: 'wifi',
                    ipAddress: '192.168.4.104'
                }
            ]
        };

        console.log('[VajraX] Mock data loaded');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Network toggle
        document.getElementById('networkToggle').addEventListener('click', () => this.toggleNetwork());

        // Demo controls
        document.getElementById('startDemo').addEventListener('click', () => this.startDemo());
        document.getElementById('resetDemo').addEventListener('click', () => this.resetDemo());

        // Sync controls
        document.getElementById('pushPolicy').addEventListener('click', () => this.pushPolicy());
        document.getElementById('forceSync').addEventListener('click', () => this.forceSync());

        // POS button
        document.getElementById('posButton').addEventListener('click', () => this.initiateTransaction());

        // Transaction modal
        document.getElementById('cancelTransaction').addEventListener('click', () => {
            document.getElementById('transactionModal').classList.add('hidden');
        });

        document.getElementById('confirmTransaction').addEventListener('click', () => this.processTransaction());

        // Policy tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchPolicyTab(e));
        });

        // Tenant selector
        document.getElementById('tenantSelect').addEventListener('change', (e) => {
            this.switchTenant(e.target.value);
        });

        // Listen for audit entries
        window.eventBus.subscribe(window.EventTypes.AUDIT_ENTRY, (payload) => {
            this.renderAuditEntry(payload.data.entry);
        });

        // Listen for chain verification
        window.eventBus.subscribe(window.EventTypes.AUDIT_CHAIN_VALID, () => {
            this.updateChainStatus(true);
        });

        window.eventBus.subscribe(window.EventTypes.AUDIT_TAMPER_DETECTED, (payload) => {
            this.showTamperAlert(payload.data);
        });

        console.log('[VajraX] Event listeners setup complete');
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Render fleet dashboard
        this.renderFleetDashboard();

        // Update stats
        this.updateStats();

        // Set initial time
        this.updateDeviceTime();
        setInterval(() => this.updateDeviceTime(), 1000);

        // Initial chain status
        this.updateChainStatus(true);

        console.log('[VajraX] UI initialized');
    }

    /**
     * Render fleet dashboard table
     */
    renderFleetDashboard() {
        const tbody = document.getElementById('fleetTableBody');
        tbody.innerHTML = '';

        this.mockData.devices.forEach(device => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div>${device.id}</div>
                    <small style="color: var(--text-muted)">${device.location}</small>
                </td>
                <td><span class="status-badge ${device.status}">${device.status}</span></td>
                <td>
                    <div class="progress-bar" style="width: 100px;">
                        <div class="progress-fill" style="width: ${device.batteryLevel}%; background: ${this.getBatteryColor(device.batteryLevel)}"></div>
                    </div>
                    <small>${device.batteryLevel}%</small>
                </td>
                <td>${device.storageUsed}/${device.storageTotal} GB</td>
                <td>${this.formatTime(device.lastSeen)}</td>
                <td>v${device.policyVersion}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Update statistics
     */
    updateStats() {
        const devices = this.mockData.devices;
        document.getElementById('totalDevices').textContent = devices.length;
        document.getElementById('onlineDevices').textContent = devices.filter(d => d.status === 'online').length;
        document.getElementById('offlineDevices').textContent = devices.filter(d => d.status === 'offline').length;
        document.getElementById('pendingSync').textContent = devices.reduce((sum, d) => sum + d.queuedItems, 0);
    }

    /**
     * Toggle network
     */
    toggleNetwork() {
        this.isOnline = !this.isOnline;
        
        const btn = document.getElementById('networkToggle');
        const status = document.getElementById('networkStatus');
        const indicator = document.querySelector('#connectionIndicator .pulse');
        const deviceSignal = document.getElementById('deviceSignal');

        if (this.isOnline) {
            btn.innerHTML = '<span class="icon">📡</span><span id="networkStatus">Network: Online</span>';
            status.textContent = 'Network: Online';
            indicator.className = 'pulse online';
            deviceSignal.textContent = '📶';
            
            window.eventBus.publish(window.EventTypes.NETWORK_ONLINE, {});
            window.chainManager.addEntry('network.online', { message: 'Network connection restored' });
        } else {
            btn.innerHTML = '<span class="icon">📴</span><span id="networkStatus">Network: Offline</span>';
            status.textContent = 'Network: Offline';
            indicator.className = 'pulse offline';
            deviceSignal.textContent = '❌';
            
            window.eventBus.publish(window.EventTypes.NETWORK_OFFLINE, {});
            window.chainManager.addEntry('network.offline', { message: 'Network connection lost' });
        }

        // Update device status
        window.stateManager.updateCurrentState({ isOnline: this.isOnline });
    }

    /**
     * Initiate transaction
     */
    initiateTransaction() {
        document.getElementById('transactionModal').classList.remove('hidden');
        document.getElementById('transactionAmount').value = Math.floor(Math.random() * 500) + 50;
    }

    /**
     * Process transaction
     */
    processTransaction() {
        const amount = parseInt(document.getElementById('transactionAmount').value);
        const method = document.getElementById('paymentMethod').value;

        // Hide modal
        document.getElementById('transactionModal').classList.add('hidden');

        // Show success animation
        const successAnim = document.getElementById('successAnimation');
        document.getElementById('successAmount').textContent = `₹${amount}`;
        successAnim.classList.remove('hidden');

        setTimeout(() => {
            successAnim.classList.add('hidden');
        }, 2000);

        // Queue transaction
        const transaction = {
            amount,
            method,
            deviceId: 'vx-2024-001',
            timestamp: new Date().toISOString()
        };

        window.stateManager.queueTransaction(transaction);

        // Add audit entry
        window.chainManager.addEntry('transaction.created', {
            amount,
            method,
            status: this.isOnline ? 'synced' : 'queued'
        });

        // Update UI
        this.updateTransactionStats(amount);
        this.updateQueueDisplay();

        // If online, sync immediately
        if (this.isOnline) {
            window.chainManager.addEntry('transaction.synced', { amount, method });
        } else {
            window.chainManager.addEntry('transaction.queued', { amount, method });
        }

        console.log('[VajraX] Transaction processed:', amount, method);
    }

    /**
     * Update transaction stats
     */
    updateTransactionStats(amount) {
        const salesEl = document.getElementById('todaySales');
        const txnEl = document.getElementById('todayTransactions');

        const currentSales = parseInt(salesEl.textContent.replace('₹', '')) || 0;
        const currentTxn = parseInt(txnEl.textContent) || 0;

        salesEl.textContent = `₹${currentSales + amount}`;
        txnEl.textContent = currentTxn + 1;
    }

    /**
     * Update queue display
     */
    updateQueueDisplay() {
        const counts = window.stateManager.getQueueCounts();
        document.getElementById('deviceQueue').textContent = `${counts.transactions} pending`;
    }

    /**
     * Push policy update
     */
    pushPolicy() {
        const themeColor = document.getElementById('themeColor').value;
        const companyName = document.getElementById('companyName').value;
        const disableCamera = document.getElementById('disableCamera').checked;
        const disableSettings = document.getElementById('disableSettings').checked;

        // Update desired state
        window.stateManager.updateDesiredState({
            branding: {
                themeColor,
                companyName
            },
            policy: {
                lockdown: {
                    disableCamera,
                    disableSettings
                }
            },
            version: this.incrementVersion()
        });

        // Apply to device
        this.applyPolicyToDevice();

        // Audit entry
        window.chainManager.addEntry('policy.pushed', {
            version: window.stateManager.desiredState.version,
            changes: { themeColor, companyName, disableCamera, disableSettings }
        });

        console.log('[VajraX] Policy pushed');
    }

    /**
     * Apply policy to device
     */
    applyPolicyToDevice() {
        const branding = window.stateManager.desiredState.branding;
        const policy = window.stateManager.desiredState.policy;

        // Update launcher title
        document.getElementById('launcherTitle').textContent = branding.companyName;

        // Update theme color
        document.documentElement.style.setProperty('--accent-primary', branding.themeColor);

        // Update app icons based on policy
        const cameraApp = document.getElementById('cameraApp');
        const settingsApp = document.getElementById('settingsApp');

        if (policy.lockdown.disableCamera) {
            cameraApp.classList.add('disabled');
        } else {
            cameraApp.classList.remove('disabled');
        }

        if (policy.lockdown.disableSettings) {
            settingsApp.classList.add('disabled');
        } else {
            settingsApp.classList.remove('disabled');
        }

        // Update device policy version
        document.getElementById('devicePolicyVersion').textContent = `v${window.stateManager.desiredState.version}`;

        // Audit entry
        window.chainManager.addEntry('policy.applied', {
            version: window.stateManager.desiredState.version
        });
    }

    /**
     * Force sync
     */
    forceSync() {
        if (!this.isOnline) {
            alert('Cannot sync while offline. Please restore network connection.');
            return;
        }

        window.eventBus.publish(window.EventTypes.SYNC_STARTED, {});

        // Get queued items
        const transactions = window.stateManager.getQueuedTransactions();
        
        if (transactions.length > 0) {
            // Simulate sync delay
            setTimeout(() => {
                const ids = transactions.map(t => t.id);
                window.stateManager.clearSyncedTransactions(ids);
                
                window.eventBus.publish(window.EventTypes.SYNC_COMPLETED, { synced: ids.length });
                window.chainManager.addEntry('sync.completed', { syncedCount: ids.length });
                
                this.updateQueueDisplay();
                console.log('[VajraX] Sync completed:', ids.length, 'items');
            }, 1000);
        } else {
            window.eventBus.publish(window.EventTypes.SYNC_COMPLETED, { synced: 0 });
            console.log('[VajraX] Nothing to sync');
        }
    }

    /**
     * Start reconciliation loop
     */
    startReconciliationLoop() {
        setInterval(() => {
            if (this.isOnline) {
                const diff = window.stateManager.computeDiff();
                if (diff.hasChanges) {
                    console.log('[VajraX] Reconciliation: Changes detected');
                    this.applyPolicyToDevice();
                }
            }
        }, 60000); // Every 60 seconds
    }

    /**
     * Switch policy tab
     */
    switchPolicyTab(e) {
        const tabName = e.target.dataset.tab;

        // Update tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        // Update panels
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`${tabName}Panel`).classList.add('active');
    }

    /**
     * Switch tenant
     */
    switchTenant(tenantId) {
        const tenant = this.mockData.tenants.find(t => t.id === tenantId);
        if (tenant) {
            window.stateManager.tenantContext = tenant;
            console.log('[VajraX] Switched to tenant:', tenant.name);
        }
    }

    /**
     * Render audit entry
     */
    renderAuditEntry(entry) {
        const container = document.getElementById('timelineEntries');
        const entryEl = document.createElement('div');
        entryEl.className = 'audit-entry success';
        entryEl.innerHTML = `
            <span class="audit-timestamp">${this.formatTimestamp(entry.timestamp)}</span>
            <span class="audit-event">${entry.type}</span>
            <span class="audit-hash">${entry.hash.substring(0, 32)}...</span>
        `;
        
        container.appendChild(entryEl);
        container.scrollTop = container.scrollHeight;

        // Update chain head display
        const head = window.chainManager.getHead();
        document.getElementById('chainHead').textContent = `Head: ${head.hash.substring(0, 16)}...`;
    }

    /**
     * Update chain status
     */
    updateChainStatus(isValid) {
        const statusEl = document.getElementById('chainStatus');
        if (isValid) {
            statusEl.textContent = '✓ Chain Intact';
            statusEl.style.background = 'var(--accent-success)';
        } else {
            statusEl.textContent = '⚠ Chain Broken';
            statusEl.style.background = 'var(--accent-danger)';
        }
    }

    /**
     * Show tamper alert
     */
    showTamperAlert(details) {
        const alert = document.getElementById('tamperAlert');
        document.getElementById('tamperDetails').textContent = details.message;
        alert.classList.remove('hidden');

        document.getElementById('acknowledgeTamper').onclick = () => {
            alert.classList.add('hidden');
        };
    }

    /**
     * Show boot animation
     */
    showBootAnimation() {
        const bootScreen = document.getElementById('bootScreen');
        const progressBar = document.getElementById('bootProgress');
        
        bootScreen.classList.remove('hidden');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    bootScreen.classList.add('hidden');
                    window.eventBus.publish(window.EventTypes.DEVICE_READY, {});
                }, 500);
            }
        }, 100);
    }

    /**
     * Start demo
     */
    startDemo() {
        if (window.demoRunner) {
            window.demoRunner.run();
        } else {
            alert('Demo runner not loaded. Please ensure run-demo.js is included.');
        }
    }

    /**
     * Reset demo
     */
    resetDemo() {
        location.reload();
    }

    /**
     * Increment version
     */
    incrementVersion() {
        const parts = window.stateManager.desiredState.version.split('.');
        parts[2] = parseInt(parts[2]) + 1;
        return parts.join('.');
    }

    /**
     * Utility: Format time
     */
    formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Utility: Format timestamp
     */
    formatTimestamp(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    /**
     * Utility: Get battery color
     */
    getBatteryColor(level) {
        if (level > 50) return 'var(--accent-success)';
        if (level > 20) return 'var(--accent-warning)';
        return 'var(--accent-danger)';
    }

    /**
     * Update device time
     */
    updateDeviceTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('deviceTime').textContent = `${hours}:${minutes}`;
    }
}

// Initialize application
const app = new VajraXApp();
window.app = app;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    app.initialize();
}
