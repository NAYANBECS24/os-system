// VajraX OS Pro Max - Main Application Coordinator
class VajraXApp {
    constructor() {
        this.eventBus = window.VajraXEventBus;
        this.stateManager = window.VajraXStateManager;
        this.crypto = window.VajraXCrypto;
        this.chainManager = window.VajraXChainManager;
        this.isInitialized = false;
        this.elements = {};
    }

    async initialize() {
        console.log('[VajraX] Initializing Pro Max...');
        this.cacheElements();
        this.bindEventListeners();
        await this.stateManager.initializeTenant('acme-retail');
        this.chainManager.setTenant('acme-retail');
        await this.chainManager.initializeChain('acme-retail');
        this.initializeFleetData();
        this.updateDashboardStats();
        this.renderFleetTable();
        this.renderPolicyEditor();
        this.renderAuditLog();
        await this.runBootSequence();
        this.startHeartbeat();
        this.startTelemetryUpdates();
        this.isInitialized = true;
        await this.stateManager.createAuditEntry({ eventType: 'system.boot', severity: 'info', payload: { version: '3.2.1' } });
        this.addTimelineEntry('System initialized successfully', 'success');
        console.log('[VajraX] Initialization complete');
    }

    cacheElements() {
        this.elements = {
            tenantSelect: document.getElementById('tenant-select'),
            networkToggle: document.getElementById('network-toggle'),
            startDemoBtn: document.getElementById('start-demo-btn'),
            resetBtn: document.getElementById('reset-btn'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            statTotalDevices: document.getElementById('stat-total-devices'),
            statOnline: document.getElementById('stat-online'),
            statOffline: document.getElementById('stat-offline'),
            statPendingSync: document.getElementById('stat-pending-sync'),
            statTodayTransactions: document.getElementById('stat-today-transactions'),
            fleetTableBody: document.getElementById('fleet-table-body'),
            yamlEditor: document.getElementById('yaml-editor'),
            policyConstraintsGrid: document.getElementById('policy-constraints-grid'),
            pushPolicyBtn: document.getElementById('push-policy-btn'),
            validatePolicyBtn: document.getElementById('validate-policy-btn'),
            primaryColor: document.getElementById('primary-color'),
            secondaryColor: document.getElementById('secondary-color'),
            brandNameInput: document.getElementById('brand-name-input'),
            applyThemeBtn: document.getElementById('apply-theme-btn'),
            previewBrandName: document.getElementById('preview-brand-name'),
            cpuChart: document.getElementById('cpu-chart'),
            memoryChart: document.getElementById('memory-chart'),
            latencyChart: document.getElementById('latency-chart'),
            transactionChart: document.getElementById('transaction-chart'),
            auditTotalEntries: document.getElementById('audit-total-entries'),
            auditChainHead: document.getElementById('audit-chain-head'),
            auditIntegrityStatus: document.getElementById('audit-integrity-status'),
            auditChainCanvas: document.getElementById('audit-chain-canvas'),
            auditLogTerminal: document.getElementById('audit-log-terminal'),
            bootScreen: document.getElementById('boot-screen'),
            launcherScreen: document.getElementById('launcher-screen'),
            transactionModal: document.getElementById('transaction-modal'),
            successScreen: document.getElementById('success-screen'),
            offlineBanner: document.getElementById('offline-banner'),
            deviceTime: document.getElementById('device-time'),
            signalIcon: document.getElementById('signal-icon'),
            batteryIcon: document.getElementById('battery-icon'),
            queueCount: document.getElementById('queue-count'),
            syncStatus: document.getElementById('sync-status'),
            transactionAmount: document.getElementById('transaction-amount'),
            transactionCloseBtn: document.getElementById('transaction-close-btn'),
            transactionCancelBtn: document.getElementById('transaction-cancel-btn'),
            transactionConfirmBtn: document.getElementById('transaction-confirm-btn'),
            paymentMethods: document.querySelectorAll('.payment-method'),
            timelineContent: document.getElementById('timeline-content'),
            clearTimelineBtn: document.getElementById('clear-timeline-btn'),
            exportTimelineBtn: document.getElementById('export-timeline-btn'),
            modalOverlay: document.getElementById('modal-overlay'),
            architectureCloseBtn: document.getElementById('architecture-close-btn'),
            toastContainer: document.getElementById('toast-container')
        };
    }

    bindEventListeners() {
        this.elements.networkToggle.addEventListener('click', () => this.toggleNetwork());
        this.elements.startDemoBtn.addEventListener('click', () => this.startDemo());
        this.elements.resetBtn.addEventListener('click', () => this.resetAll());
        this.elements.tenantSelect.addEventListener('change', (e) => this.switchTenant(e.target.value));
        this.elements.tabButtons.forEach(btn => btn.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab)));
        this.elements.pushPolicyBtn.addEventListener('click', () => this.pushPolicy());
        this.elements.validatePolicyBtn.addEventListener('click', () => this.validatePolicy());
        this.elements.applyThemeBtn.addEventListener('click', () => this.applyTheme());
        this.elements.primaryColor.addEventListener('input', (e) => this.updateColorPreview(e));
        this.elements.secondaryColor.addEventListener('input', (e) => this.updateColorPreview(e));
        this.elements.brandNameInput.addEventListener('input', (e) => this.updateBrandPreview(e));
        document.getElementById('quick-transaction-btn').addEventListener('click', () => this.openTransactionModal());
        document.getElementById('quick-sync-btn').addEventListener('click', () => this.manualSync());
        document.getElementById('new-transaction-btn').addEventListener('click', () => this.showLauncher());
        this.elements.transactionCloseBtn.addEventListener('click', () => this.closeTransactionModal());
        this.elements.transactionCancelBtn.addEventListener('click', () => this.closeTransactionModal());
        this.elements.transactionConfirmBtn.addEventListener('click', () => this.processTransaction());
        this.elements.paymentMethods.forEach(method => method.addEventListener('click', (e) => this.selectPaymentMethod(e.currentTarget)));
        this.elements.clearTimelineBtn.addEventListener('click', () => this.clearTimeline());
        this.elements.exportTimelineBtn.addEventListener('click', () => this.exportTimeline());
        document.getElementById('architecture-close-btn').addEventListener('click', () => this.closeArchitectureModal());
        document.querySelectorAll('.app-item').forEach(item => item.addEventListener('click', (e) => this.handleAppClick(e.currentTarget)));
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        this.eventBus.on('*', (event) => this.handleGlobalEvent(event));
    }

    async runBootSequence() {
        const bootProgressFill = document.getElementById('boot-progress-fill');
        const bootPercentage = document.getElementById('boot-percentage');
        const bootLocale = document.getElementById('boot-locale');
        const bootMessages = ['Initializing kernel...', 'Loading system modules...', 'Mounting filesystems...', 'Starting security services...', 'Initializing network stack...', 'Loading device policies...', 'Applying branding theme...', 'Starting launcher...', 'System ready!'];
        for (let i = 0; i <= 100; i += 2) {
            bootProgressFill.style.width = i + '%';
            bootPercentage.textContent = i + '%';
            const messageIndex = Math.floor((i / 100) * bootMessages.length);
            if (bootMessages[messageIndex]) bootLocale.textContent = bootMessages[messageIndex];
            await this.sleep(50);
        }
        await this.sleep(500);
        this.showLauncher();
    }

    showLauncher() {
        this.elements.bootScreen.classList.add('hidden');
        this.elements.transactionModal.classList.add('hidden');
        this.elements.successScreen.classList.add('hidden');
        this.elements.launcherScreen.classList.remove('hidden');
        this.updateDeviceTime();
        setInterval(() => this.updateDeviceTime(), 1000);
    }

    updateDeviceTime() {
        const now = new Date();
        this.elements.deviceTime.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    async toggleNetwork() {
        const isOnline = !this.stateManager.appState.isOnline;
        this.stateManager.appState.isOnline = isOnline;
        this.elements.networkToggle.classList.toggle('online', isOnline);
        this.elements.networkToggle.classList.toggle('offline', !isOnline);
        const toggleText = this.elements.networkToggle.querySelector('.toggle-text');
        const connectionType = this.elements.networkToggle.querySelector('.connection-type');
        if (isOnline) {
            toggleText.textContent = 'ONLINE';
            connectionType.textContent = 'WiFi 5GHz';
            this.elements.offlineBanner.classList.add('hidden');
            this.elements.syncStatus.querySelector('.sync-indicator').classList.remove('offline');
            this.elements.syncStatus.querySelector('.sync-text').textContent = 'Synced';
            await this.stateManager.processQueuedTransactions();
            this.updateQueueDisplay();
            this.addTimelineEntry('Network restored - WiFi connected', 'success');
            this.showToast('Network Online', 'Syncing queued transactions...', 'success');
            await this.stateManager.createAuditEntry({ eventType: 'network.status_change', severity: 'info', payload: { status: 'online', type: 'wifi' } });
        } else {
            toggleText.textContent = 'OFFLINE';
            connectionType.textContent = 'No Connection';
            this.elements.offlineBanner.classList.remove('hidden');
            this.elements.syncStatus.querySelector('.sync-indicator').classList.add('offline');
            this.elements.syncStatus.querySelector('.sync-text').textContent = 'Offline';
            this.addTimelineEntry('Network disconnected - Working offline', 'warning');
            this.showToast('Network Offline', 'Transactions will sync when online', 'warning');
            await this.stateManager.createAuditEntry({ eventType: 'network.status_change', severity: 'warning', payload: { status: 'offline' } });
        }
        this.elements.signalIcon.textContent = isOnline ? '📶' : '❌';
    }

    openTransactionModal() {
        this.elements.launcherScreen.classList.add('hidden');
        this.elements.transactionModal.classList.remove('hidden');
        this.elements.transactionAmount.focus();
    }

    closeTransactionModal() {
        this.elements.transactionModal.classList.add('hidden');
        this.elements.launcherScreen.classList.remove('hidden');
    }

    selectPaymentMethod(selectedMethod) {
        this.elements.paymentMethods.forEach(method => method.classList.toggle('active', method === selectedMethod));
    }

    async processTransaction() {
        const amount = parseFloat(this.elements.transactionAmount.value);
        const activeMethod = document.querySelector('.payment-method.active');
        const method = activeMethod?.dataset.method || 'upi';
        if (!amount || amount <= 0) { this.showToast('Invalid Amount', 'Please enter a valid amount', 'error'); return; }
        const transactionId = this.crypto.generateTransactionId();
        const transaction = { id: transactionId, amount, method, timestamp: Date.now(), deviceId: 'device-001', operator: 'Rajesh K.' };
        this.stateManager.queueTransaction(transaction);
        this.closeTransactionModal();
        this.elements.successScreen.classList.remove('hidden');
        document.getElementById('success-amount-display').textContent = amount.toFixed(2);
        document.getElementById('success-method-display').textContent = method.toUpperCase();
        document.getElementById('success-txn-id').textContent = transactionId;
        this.updateQueueDisplay();
        this.stateManager.fleetState.todayTransactions++;
        this.updateDashboardStats();
        this.addTimelineEntry('Transaction ' + transactionId + ' - Rs.' + amount + ' via ' + method, 'success');
        this.showToast('Payment Successful', 'Rs.' + amount + ' received via ' + method.toUpperCase(), 'success');
    }

    updateQueueDisplay() {
        const queueLength = this.stateManager.deviceState.queuedTransactions.length;
        this.elements.queueCount.textContent = queueLength;
        document.getElementById('queue-status').style.display = queueLength > 0 ? 'flex' : 'none';
    }

    async manualSync() {
        if (!this.stateManager.appState.isOnline) { this.showToast('Cannot Sync', 'Device is offline', 'error'); return; }
        this.addTimelineEntry('Manual sync initiated...', 'info');
        const result = await this.stateManager.processQueuedTransactions();
        this.addTimelineEntry('Sync complete: ' + result.processed.length + ' processed', result.failed.length > 0 ? 'warning' : 'success');
        this.updateQueueDisplay();
        this.renderAuditLog();
    }

    async pushPolicy() {
        const diffs = this.stateManager.computeStateDiff();
        if (diffs.length === 0) { this.showToast('No Changes', 'Device already has latest policy', 'info'); return; }
        this.addTimelineEntry('Pushing policy update to devices...', 'info');
        this.showToast('Policy Push', 'Sending updates to devices...', 'info');
        const result = await this.stateManager.applyDiffs(diffs);
        this.stateManager.updateDesiredState({});
        this.addTimelineEntry('Policy applied: ' + result.applied.length + ' changes', result.rejected.length > 0 ? 'warning' : 'success');
        this.showToast('Policy Updated', result.applied.length + ' changes applied', 'success');
        this.renderPolicyEditor();
        this.chainManager.visualizeChain('audit-chain-canvas');
    }

    validatePolicy() {
        const yamlContent = this.elements.yamlEditor.textContent;
        const isValid = yamlContent.includes('lockdown:') || yamlContent.includes('network:');
        this.showToast(isValid ? 'Policy Valid' : 'Validation Error', isValid ? 'YAML syntax is correct' : 'Invalid policy structure', isValid ? 'success' : 'error');
    }

    applyTheme() {
        const theme = { primaryColor: this.elements.primaryColor.value, secondaryColor: this.elements.secondaryColor.value, brandName: this.elements.brandNameInput.value };
        this.stateManager.updateDesiredState({ theme });
        this.updateBrandPreview({ target: { value: theme.brandName } });
        this.showToast('Theme Applied', 'Branding updated on all devices', 'success');
    }

    updateColorPreview(event) {
        const hexSpan = document.getElementById(event.target.id + '-hex');
        if (hexSpan) hexSpan.textContent = event.target.value;
    }

    updateBrandPreview(event) {
        const brandName = event.target.value;
        this.elements.previewBrandName.textContent = brandName;
        document.getElementById('launcher-brand-name').textContent = brandName;
    }

    switchTab(tabName) {
        this.elements.tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
        this.elements.tabContents.forEach(content => content.classList.toggle('active', content.id === 'tab-' + tabName));
        if (tabName === 'audit') { this.chainManager.visualizeChain('audit-chain-canvas'); this.renderAuditLog(); }
        if (tabName === 'telemetry') this.renderTelemetryCharts();
    }

    initializeFleetData() {
        this.stateManager.fleetState.devices = [
            { id: 'VJX-001', model: 'Tablet Pro X1', location: 'Store #001 - Mumbai', status: 'online', battery: 87, storage: 45, lastSeen: 'Now', policyVersion: '2.4.1' },
            { id: 'VJX-002', model: 'Tablet Pro X1', location: 'Store #002 - Delhi', status: 'online', battery: 92, storage: 38, lastSeen: 'Now', policyVersion: '2.4.1' },
            { id: 'VJX-003', model: 'Tablet Lite S', location: 'Store #003 - Bangalore', status: 'online', battery: 65, storage: 52, lastSeen: '2m ago', policyVersion: '2.4.0' },
            { id: 'VJX-004', model: 'Tablet Pro X1', location: 'Store #004 - Chennai', status: 'offline', battery: 23, storage: 67, lastSeen: '15m ago', policyVersion: '2.3.9' },
            { id: 'VJX-005', model: 'Tablet Lite S', location: 'Store #005 - Kolkata', status: 'online', battery: 78, storage: 41, lastSeen: 'Now', policyVersion: '2.4.1' }
        ];
        this.stateManager.updateFleetStats();
    }

    updateDashboardStats() {
        const stats = this.stateManager.fleetState;
        this.elements.statTotalDevices.textContent = stats.totalDevices;
        this.elements.statOnline.textContent = stats.onlineCount;
        this.elements.statOffline.textContent = stats.offlineCount;
        this.elements.statPendingSync.textContent = stats.pendingSyncCount;
        this.elements.statTodayTransactions.textContent = stats.todayTransactions;
    }

    renderFleetTable() {
        this.elements.fleetTableBody.innerHTML = this.stateManager.fleetState.devices.map(device => '<tr><td><strong>' + device.id + '</strong></td><td>' + device.model + '</td><td>' + device.location + '</td><td><span class="status-badge ' + device.status + '">' + (device.status === 'online' ? '●' : '○') + ' ' + device.status.toUpperCase() + '</span></td><td><div class="progress-bar-mini"><div class="progress-fill-mini" style="width:' + device.battery + '%"></div></div><small>' + device.battery + '%</small></td><td><div class="progress-bar-mini"><div class="progress-fill-mini" style="width:' + device.storage + '%"></div></div><small>' + device.storage + '%</small></td><td>' + device.lastSeen + '</td><td><code>v' + device.policyVersion + '</code></td><td><button class="action-btn">View</button><button class="action-btn">Update</button></td></tr>').join('');
    }

    renderPolicyEditor() {
        this.elements.yamlEditor.textContent = '# VajraX OS Policy v' + this.stateManager.desiredState.policyVersion + '\nlockdown:\n  enabled: true\n  allowed_apps: [payment, reports, inventory, customers, settings]\n  blocked_apps: [browser, camera, gallery]\n  kiosk_mode: true\nnetwork:\n  preferred: wifi\n  fallback_cellular: true\nbranding:\n  primary_color: ' + this.stateManager.desiredState.theme.primaryColor + '\n  brand_name: "' + this.stateManager.desiredState.theme.brandName + '"';
        this.elements.policyConstraintsGrid.innerHTML = [{ label: 'Kiosk Mode', value: 'Enabled' }, { label: 'Allowed Apps', value: '5 apps' }, { label: 'Blocked Apps', value: '4 apps' }, { label: 'Hardware Buttons', value: 'Disabled' }].map(c => '<div class="constraint-card"><div class="constraint-label">' + c.label + '</div><div class="constraint-value">' + c.value + '</div></div>').join('');
    }

    renderAuditLog() {
        const entries = this.stateManager.auditState.entries.slice(-20).reverse();
        this.elements.auditLogTerminal.innerHTML = entries.map(entry => '<div class="audit-entry"><span class="audit-timestamp">' + new Date(entry.timestamp).toLocaleTimeString() + '</span><span class="audit-severity severity-' + entry.severity + '">' + entry.severity.toUpperCase() + '</span><span class="audit-event">' + entry.eventType + '</span><span class="audit-hash">' + entry.hashShort + '</span></div>').join('');
        this.elements.auditTotalEntries.textContent = this.stateManager.auditState.entries.length;
        this.elements.auditChainHead.textContent = this.stateManager.auditState.chainHead || 'N/A';
        const integrityEl = this.elements.auditIntegrityStatus;
        integrityEl.textContent = this.stateManager.auditState.integrityValid ? '✓ VERIFIED' : '⚠ TAMPER DETECTED';
        integrityEl.className = 'stat-number ' + (this.stateManager.auditState.integrityValid ? 'chain-status-valid' : 'chain-status-invalid');
    }

    addTimelineEntry(message, type) {
        type = type || 'info';
        const entry = document.createElement('div');
        entry.className = 'timeline-entry';
        entry.innerHTML = '<span class="timeline-time">' + new Date().toLocaleTimeString() + '</span><span class="timeline-message ' + type + '">' + message + '</span>';
        this.elements.timelineContent.appendChild(entry);
        this.elements.timelineContent.scrollTop = this.elements.timelineContent.scrollHeight;
    }

    clearTimeline() { this.elements.timelineContent.innerHTML = ''; }

    exportTimeline() {
        const entries = Array.from(this.elements.timelineContent.children).map(el => ({ time: el.querySelector('.timeline-time').textContent, message: el.querySelector('.timeline-message').textContent }));
        const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'vajrax-timeline-' + Date.now() + '.json';
        a.click();
    }

    showToast(title, message, type) {
        type = type || 'info';
        const icons = { info: 'ℹ️', success: '✓', warning: '⚠️', error: '✕' };
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML = '<span class="toast-icon">' + icons[type] + '</span><div class="toast-content"><div class="toast-title">' + title + '</div><div class="toast-message">' + message + '</div></div><button class="toast-close">×</button>';
        toast.querySelector('.toast-close').onclick = function() { toast.remove(); };
        this.elements.toastContainer.appendChild(toast);
        setTimeout(function() { toast.style.opacity = '0'; setTimeout(function() { toast.remove(); }, 300); }, 5000);
    }

    startHeartbeat() {
        setInterval(async () => {
            if (this.stateManager.appState.isOnline) {
                await this.stateManager.createAuditEntry({ eventType: 'system.heartbeat', severity: 'info', payload: { batteryLevel: this.stateManager.deviceState.batteryLevel } });
            }
        }, 60000);
    }

    startTelemetryUpdates() {
        setInterval(() => {
            this.stateManager.deviceState.cpuUsage = Math.floor(20 + Math.random() * 30);
            this.stateManager.deviceState.memoryUsage = Math.floor(1200 + Math.random() * 200);
            this.stateManager.deviceState.networkLatency = Math.floor(30 + Math.random() * 40);
            if (document.getElementById('tab-telemetry').classList.contains('active')) this.renderTelemetryCharts();
        }, 5000);
    }

    renderTelemetryCharts() {
        const drawChart = function(canvasId, color, getValue) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const width = canvas.width, height = canvas.height;
            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = '#2d3748';
            for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, (height/5)*i); ctx.lineTo(width, (height/5)*i); ctx.stroke(); }
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 20; i++) {
                const x = (width/20)*i, y = height - (getValue(i)/100)*height;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        };
        drawChart('cpu-chart', '#00d9ff', function(i) { return this.stateManager.deviceState.cpuUsage + Math.sin(i)*10; }.bind(this));
        drawChart('memory-chart', '#7b2ff7', function(i) { return (this.stateManager.deviceState.memoryUsage/2048)*100 + Math.cos(i)*5; }.bind(this));
        drawChart('latency-chart', '#00ff88', function(i) { return (this.stateManager.deviceState.networkLatency/100)*100 + Math.sin(i*2)*10; }.bind(this));
        drawChart('transaction-chart', '#ff6b35', function() { return 10 + Math.random()*15; });
    }

    handleAppClick(appElement) {
        const appName = appElement.dataset.app;
        if (appElement.classList.contains('locked')) { this.showToast('App Locked', appName + ' is restricted', 'warning'); return; }
        if (appName === 'payment') this.openTransactionModal();
        else this.showToast('App Opening', 'Launching ' + appName + '...', 'info');
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey && e.key === 'n') { e.preventDefault(); this.openTransactionModal(); }
        if (e.ctrlKey && e.key === 's') { e.preventDefault(); this.manualSync(); }
        if (e.ctrlKey && e.key === 't') { e.preventDefault(); this.toggleNetwork(); }
        if (e.key === 'Escape') { this.closeTransactionModal(); this.closeArchitectureModal(); }
    }

    handleGlobalEvent(event) { console.log('[VajraX Event]', event.event, event.payload); }

    async switchTenant(tenantId) {
        await this.stateManager.initializeTenant(tenantId);
        this.chainManager.setTenant(tenantId);
        this.addTimelineEntry('Switched to tenant: ' + tenantId, 'info');
        this.showToast('Tenant Switched', 'Now managing ' + tenantId, 'info');
        this.initializeFleetData();
        this.updateDashboardStats();
        this.renderFleetTable();
    }

    startDemo() { if (window.VajraXDemoRunner) window.VajraXDemoRunner.run(); else this.showToast('Demo Ready', 'Demo runner not loaded', 'warning'); }

    async resetAll() {
        if (confirm('Reset all state?')) {
            this.stateManager.reset();
            await this.chainManager.resetChain('acme-retail');
            await this.initialize();
            this.showToast('System Reset', 'All state cleared', 'info');
        }
    }

    closeArchitectureModal() { this.elements.modalOverlay.classList.add('hidden'); }

    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}

document.addEventListener('DOMContentLoaded', async function() {
    window.VajraXApp = new VajraXApp();
    await window.VajraXApp.initialize();
});
