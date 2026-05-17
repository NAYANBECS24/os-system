// VajraX OS Pro Max - Event Bus Module
// Lightweight publish-subscribe pattern for decoupled communication

class EventBus {
    constructor() {
        this.events = new Map();
        this.wildcardListeners = [];
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @param {Object} context - Optional context (this binding)
     * @returns {Function} Unsubscribe function
     */
    on(event, callback, context = null) {
        if (event === '*') {
            this.wildcardListeners.push({ callback, context });
            return () => this.offWildcard(callback);
        }

        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push({ callback, context });

        return () => this.off(event, callback);
    }

    /**
     * Subscribe once to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @param {Object} context - Optional context
     * @returns {Function} Unsubscribe function
     */
    once(event, callback, context = null) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback.call(context, ...args);
        };
        return this.on(event, wrapper, context);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (!this.events.has(event)) return;

        const listeners = this.events.get(event);
        const index = listeners.findIndex(l => l.callback === callback);
        if (index !== -1) {
            listeners.splice(index, 1);
        }

        if (listeners.length === 0) {
            this.events.delete(event);
        }
    }

    /**
     * Unsubscribe wildcard listener
     * @param {Function} callback - Callback function to remove
     */
    offWildcard(callback) {
        const index = this.wildcardListeners.findIndex(l => l.callback === callback);
        if (index !== -1) {
            this.wildcardListeners.splice(index, 1);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} payload - Event payload
     * @returns {Promise} Resolves when all listeners complete
     */
    async emit(event, payload = null) {
        const timestamp = Date.now();
        const eventRecord = { event, payload, timestamp };

        // Notify wildcard listeners first
        for (const { callback, context } of this.wildcardListeners) {
            try {
                await callback.call(context, eventRecord);
            } catch (error) {
                console.error(`[EventBus] Wildcard listener error for ${event}:`, error);
            }
        }

        // Notify specific event listeners
        if (this.events.has(event)) {
            const listeners = [...this.events.get(event)];
            for (const { callback, context } of listeners) {
                try {
                    await callback.call(context, payload);
                } catch (error) {
                    console.error(`[EventBus] Listener error for ${event}:`, error);
                }
            }
        }

        return eventRecord;
    }

    /**
     * Emit with priority (synchronous)
     * @param {string} event - Event name
     * @param {*} payload - Event payload
     */
    emitSync(event, payload = null) {
        const timestamp = Date.now();
        const eventRecord = { event, payload, timestamp };

        for (const { callback, context } of this.wildcardListeners) {
            try {
                callback.call(context, eventRecord);
            } catch (error) {
                console.error(`[EventBus] Wildcard listener error for ${event}:`, error);
            }
        }

        if (this.events.has(event)) {
            const listeners = [...this.events.get(event)];
            for (const { callback, context } of listeners) {
                try {
                    callback.call(context, payload);
                } catch (error) {
                    console.error(`[EventBus] Listener error for ${event}:`, error);
                }
            }
        }
    }

    /**
     * Get listener count for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        if (!this.events.has(event)) return 0;
        return this.events.get(event).length;
    }

    /**
     * Clear all events
     */
    clear() {
        this.events.clear();
        this.wildcardListeners = [];
    }

    /**
     * Get all registered events
     * @returns {Array<string>} Event names
     */
    getEvents() {
        return Array.from(this.events.keys());
    }
}

// Create global event bus instance
window.VajraXEventBus = new EventBus();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
}
