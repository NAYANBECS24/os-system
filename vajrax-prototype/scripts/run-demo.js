// VajraX OS - Demo Runner
// Orchestrates the 90-second investor demo sequence

class DemoRunner {
    constructor() {
        this.steps = [
            { duration: 5000, action: 'boot', label: 'Device Boot Sequence' },
            { duration: 3000, action: 'launcher', label: 'Launcher Ready' },
            { duration: 4000, action: 'transaction1', label: 'First Transaction (Online)' },
            { duration: 3000, action: 'network_off', label: 'Network Disconnected' },
            { duration: 4000, action: 'transaction2', label: 'Offline Transaction Queued' },
            { duration: 3000, action: 'network_on', label: 'Network Restored' },
            { duration: 4000, action: 'sync', label: 'Transaction Sync' },
            { duration: 4000, action: 'policy_push', label: 'Policy Update Pushed' },
            { duration: 3000, action: 'policy_apply', label: 'Device Reconfiguration' },
            { duration: 5000, action: 'audit_verify', label: 'Audit Chain Verification' },
            { duration: 0, action: 'complete', label: 'Demo Complete' }
        ];
        
        this.currentStep = 0;
        this.isRunning = false;
        this.timer = null;
    }

    /**
     * Run the demo sequence
     */
    run() {
        if (this.isRunning) {
            console.log('[DemoRunner] Demo already running');
            return;
        }

        this.isRunning = true;
        this.currentStep = 0;
        
        // Show demo overlay
        const overlay = document.getElementById('demoOverlay');
        overlay.classList.remove('hidden');

        console.log('[DemoRunner] Starting 90-second demo');
        window.eventBus.publish(window.EventTypes.DEMO_START, {});

        // Reset state
        this.resetState();

        // Start first step
        this.executeStep();
    }

    /**
     * Execute current step
     */
    executeStep() {
        if (this.currentStep >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[this.currentStep];
        
        // Update overlay
        document.getElementById('demoStep').textContent = step.label;
        const progressPercent = ((this.currentStep + 1) / this.steps.length) * 100;
        document.getElementById('demoProgress').style.width = `${progressPercent}%`;

        console.log(`[DemoRunner] Step ${this.currentStep + 1}: ${step.label}`);
        window.eventBus.publish(window.EventTypes.DEMO_STEP, { 
            step: this.currentStep + 1, 
            total: this.steps.length,
            label: step.label 
        });

        // Execute action
        this[step.action]();

        // Schedule next step
        if (step.duration > 0) {
            this.timer = setTimeout(() => {
                this.currentStep++;
                this.executeStep();
            }, step.duration);
        } else {
            this.currentStep++;
            this.executeStep();
        }
    }

    /**
     * Boot sequence
     */
    boot() {
        const bootScreen = document.getElementById('bootScreen');
        const progressBar = document.getElementById('bootProgress');
        
        bootScreen.classList.remove('hidden');
        progressBar.style.width = '0%';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 500);
    }

    /**
     * Launcher ready
     */
    launcher() {
        document.getElementById('bootScreen').classList.add('hidden');
        window.chainManager.addEntry('demo.launcher_ready', { message: 'Launcher displayed' });
    }

    /**
     * First transaction (online)
     */
    transaction1() {
        // Simulate clicking POS button
        document.getElementById('transactionAmount').value = 250;
        document.getElementById('paymentMethod').value = 'upi';
        
        // Process transaction
        const amount = 250;
        const method = 'upi';
        
        // Show success animation
        const successAnim = document.getElementById('successAnimation');
        document.getElementById('successAmount').textContent = `₹${amount}`;
        successAnim.classList.remove('hidden');
        
        setTimeout(() => {
            successAnim.classList.add('hidden');
        }, 2000);
        
        // Queue and sync
        window.stateManager.queueTransaction({ amount, method, deviceId: 'vx-2024-001' });
        window.chainManager.addEntry('transaction.upi_completed', { amount, method, status: 'synced' });
        
        // Update UI
        app.updateTransactionStats(amount);
        app.updateQueueDisplay();
    }

    /**
     * Turn network off
     */
    network_off() {
        if (app.isOnline) {
            app.toggleNetwork();
        }
        window.chainManager.addEntry('demo.network_offline', { message: 'Simulating connectivity loss' });
    }

    /**
     * Second transaction (offline)
     */
    transaction2() {
        // Simulate offline transaction
        document.getElementById('transactionAmount').value = 175;
        document.getElementById('paymentMethod').value = 'card';
        
        const amount = 175;
        const method = 'card';
        
        // Show success
        const successAnim = document.getElementById('successAnimation');
        document.getElementById('successAmount').textContent = `₹${amount}`;
        successAnim.classList.remove('hidden');
        
        setTimeout(() => {
            successAnim.classList.add('hidden');
        }, 2000);
        
        // Queue only (no sync)
        window.stateManager.queueTransaction({ amount, method, deviceId: 'vx-2024-001' });
        window.chainManager.addEntry('transaction.queued', { amount, method, status: 'pending' });
        
        app.updateTransactionStats(amount);
        app.updateQueueDisplay();
    }

    /**
     * Turn network on
     */
    network_on() {
        if (!app.isOnline) {
            app.toggleNetwork();
        }
        window.chainManager.addEntry('demo.network_restored', { message: 'Connectivity restored' });
    }

    /**
     * Sync transactions
     */
    sync() {
        app.forceSync();
        window.chainManager.addEntry('demo.sync_initiated', { message: 'Uploading queued items' });
    }

    /**
     * Push policy update
     */
    policy_push() {
        // Change branding
        document.getElementById('themeColor').value = '#10b981';
        document.getElementById('companyName').value = 'ACME Retail';
        document.getElementById('disableCamera').checked = false;
        
        app.pushPolicy();
    }

    /**
     * Apply policy
     */
    policy_apply() {
        app.applyPolicyToDevice();
        window.chainManager.addEntry('demo.policy_applied', { 
            version: window.stateManager.desiredState.version,
            themeColor: '#10b981',
            companyName: 'ACME Retail'
        });
    }

    /**
     * Verify audit chain
     */
    audit_verify() {
        const result = window.chainManager.verifyIntegrity();
        
        if (result.valid) {
            console.log('[DemoRunner] Audit chain verified successfully');
            window.chainManager.addEntry('demo.audit_verified', { 
                chainLength: result.chainLength,
                headHash: result.headHash
            });
        } else {
            console.error('[DemoRunner] Audit chain verification failed');
        }
    }

    /**
     * Complete demo
     */
    complete() {
        this.isRunning = false;
        
        // Hide overlay or show completion message
        const overlay = document.getElementById('demoOverlay');
        overlay.querySelector('h2').textContent = 'Demo Complete! ✓';
        document.getElementById('demoStep').textContent = 'All systems operational. Audit chain intact.';
        
        window.eventBus.publish(window.EventTypes.DEMO_COMPLETE, {
            stepsCompleted: this.steps.length,
            auditChainLength: window.chainManager.getChain().length
        });
        
        console.log('[DemoRunner] Demo completed successfully');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.querySelector('h2').textContent = 'Demo in Progress';
        }, 5000);
    }

    /**
     * Stop demo
     */
    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.isRunning = false;
        
        document.getElementById('demoOverlay').classList.add('hidden');
        console.log('[DemoRunner] Demo stopped');
    }

    /**
     * Reset state for fresh demo
     */
    resetState() {
        // Reset transaction stats
        document.getElementById('todaySales').textContent = '₹0';
        document.getElementById('todayTransactions').textContent = '0';
        
        // Reset queue
        window.stateManager.reset();
        
        // Reset audit chain
        window.chainManager.reset();
        
        // Reset branding
        document.getElementById('themeColor').value = '#6366f1';
        document.getElementById('companyName').value = 'ACME Corp';
        document.getElementById('launcherTitle').textContent = 'ACME Corp';
        document.documentElement.style.setProperty('--accent-primary', '#6366f1');
        
        // Ensure online
        if (!app.isOnline) {
            app.toggleNetwork();
        }
        
        // Clear timeline
        document.getElementById('timelineEntries').innerHTML = '';
        
        console.log('[DemoRunner] State reset complete');
    }
}

// Export singleton instance
const demoRunner = new DemoRunner();

// Make available globally
window.DemoRunner = DemoRunner;
window.demoRunner = demoRunner;

// Setup stop button
document.addEventListener('DOMContentLoaded', () => {
    const stopBtn = document.getElementById('stopDemo');
    if (stopBtn) {
        stopBtn.addEventListener('click', () => demoRunner.stop());
    }
});
