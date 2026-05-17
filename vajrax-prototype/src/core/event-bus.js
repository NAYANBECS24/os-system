// VajraX OS - Event Bus Module
// Implements publish-subscribe pattern for decoupled communication

class EventBus {
    constructor() {
        this.events = new Map();
        this.subscribers = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     * @param {string} subscriberId - Optional subscriber identifier
     */
    subscribe(event, callback, subscriberId = null) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        const subscription = {
            id: subscriberId || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            callback,
            createdAt: new Date().toISOString()
        };
        
        this.events.get(event).push(subscription);
        
        if (subscriberId) {
            if (!this.subscribers.has(subscriberId)) {
                this.subscribers.set(subscriberId, []);
            }
            this.subscribers.get(subscriberId).push(event);
        }
        
        console.log(`[EventBus] Subscribed to '${event}' (${subscription.id})`);
        return subscription.id;
    }

    /**
     * Publish an event
     * @param {string} event - Event name
     * @param {any} data - Event payload
     */
    publish(event, data = {}) {
        const timestamp = new Date().toISOString();
        const eventPayload = {
            event,
            data,
            timestamp,
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        console.log(`[EventBus] Publishing '${event}'`, data);

        if (this.events.has(event)) {
            const subscriptions = this.events.get(event);
            subscriptions.forEach(sub => {
                try {
                    sub.callback(eventPayload);
                } catch (error) {
                    console.error(`[EventBus] Error in subscriber ${sub.id}:`, error);
                }
            });
        }

        // Also trigger global event listeners
        window.dispatchEvent(new CustomEvent(`vajrax:${event}`, { detail: eventPayload }));
        
        return eventPayload;
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {string} subscriptionId - Subscription ID to remove
     */
    unsubscribe(event, subscriptionId) {
        if (!this.events.has(event)) return false;

        const subscriptions = this.events.get(event);
        const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
        
        if (index !== -1) {
            subscriptions.splice(index, 1);
            console.log(`[EventBus] Unsubscribed from '${event}' (${subscriptionId})`);
            return true;
        }
        
        return false;
    }

    /**
     * Unsubscribe all events for a subscriber
     * @param {string} subscriberId - Subscriber ID
     */
    unsubscribeAll(subscriberId) {
        if (!this.subscribers.has(subscriberId)) return;

        const events = this.subscribers.get(subscriberId);
        events.forEach(event => this.unsubscribe(event, subscriberId));
        this.subscribers.delete(subscriberId);
        
        console.log(`[EventBus] Unsubscribed all events for '${subscriberId}'`);
    }

    /**
     * Get all subscribers for an event
     * @param {string} event - Event name
     * @returns {Array} List of subscriptions
     */
    getSubscribers(event) {
        return this.events.has(event) ? this.events.get(event) : [];
    }

    /**
     * Get event count
     * @returns {number} Number of registered events
     */
    getEventCount() {
        return this.events.size;
    }

    /**
     * Clear all events
     */
    clear() {
        this.events.clear();
        this.subscribers.clear();
        console.log('[EventBus] Cleared all events');
    }

    /**
     * Once - subscribe to event only once
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     */
    once(event, callback) {
        const wrapper = (payload) => {
            callback(payload);
            this.unsubscribe(event, wrapper.id);
        };
        
        return this.subscribe(event, wrapper);
    }
}

// Export singleton instance
const eventBus = new EventBus();

// Common event types
const EventTypes = {
    // Network events
    NETWORK_ONLINE: 'network:online',
    NETWORK_OFFLINE: 'network:offline',
    NETWORK_TOGGLE: 'network:toggle',
    
    // Device events
    DEVICE_BOOT: 'device:boot',
    DEVICE_READY: 'device:ready',
    DEVICE_HEARTBEAT: 'device:heartbeat',
    DEVICE_STATE_CHANGE: 'device:state_change',
    
    // Transaction events
    TRANSACTION_INITIATED: 'transaction:initiated',
    TRANSACTION_COMPLETED: 'transaction:completed',
    TRANSACTION_QUEUED: 'transaction:queued',
    TRANSACTION_SYNCED: 'transaction:synced',
    
    // Policy events
    POLICY_UPDATED: 'policy:updated',
    POLICY_APPLIED: 'policy:applied',
    POLICY_PUSHED: 'policy:pushed',
    
    // Sync events
    SYNC_STARTED: 'sync:started',
    SYNC_COMPLETED: 'sync:completed',
    SYNC_FAILED: 'sync:failed',
    
    // Audit events
    AUDIT_ENTRY: 'audit:entry',
    AUDIT_CHAIN_VALID: 'audit:chain_valid',
    AUDIT_TAMPER_DETECTED: 'audit:tamper_detected',
    
    // UI events
    UI_UPDATE: 'ui:update',
    DEMO_START: 'demo:start',
    DEMO_STEP: 'demo:step',
    DEMO_COMPLETE: 'demo:complete'
};

// Make available globally
window.EventBus = EventBus;
window.eventBus = eventBus;
window.EventTypes = EventTypes;
