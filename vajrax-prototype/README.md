# VajraX OS Cloud Console and Device Simulator

## Hackathon Prototype

A browser-based prototype demonstrating the core value proposition of VajraX OS: cloud management console, simulated enterprise device, declarative policy reconciliation, offline-first transaction queuing, cryptographic audit chaining, and a 90-second automated demo sequence.

## Quick Start

1. **Open in Browser**: Simply open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
2. **No Build Required**: The prototype runs entirely with vanilla HTML, CSS, and JavaScript
3. **No Dependencies**: All code is self-contained with no external libraries

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     VajraX OS Prototype                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │  Cloud Console   │              │ Device Simulator │     │
│  │  (Control Plane) │              │  (Data Plane)    │     │
│  │                  │              │                  │     │
│  │  - Fleet Dashboard          │  - Launcher UI       │     │
│  │  - Policy Editor            │  - Transaction Flow  │     │
│  │  - Telemetry Panel          │  - Offline Queue     │     │
│  └──────────────────┘              └──────────────────┘     │
│           │                                    │             │
│           │         Event Bus                  │             │
│           └────────────────────────────────────┘             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Core Services                            │   │
│  │  - State Manager (Desired vs Current State)          │   │
│  │  - Audit Chain (Cryptographic Hash Linking)          │   │
│  │  - Network Manager (Online/Offline Simulation)       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Features Demonstrated

### 1. **Offline-First Architecture**
- Device remains fully functional without network connectivity
- Transactions queue locally with idempotency keys
- Automatic sync upon reconnection

### 2. **Declarative Policy Management**
- Cloud publishes desired state (YAML policies)
- Device autonomously reconciles against desired state
- No imperative commands - only state differences applied

### 3. **Cryptographic Audit Chain**
- Every action generates a signed audit entry
- Forward-secure hash chain (each entry references previous hash)
- Tamper detection with visual alerts

### 4. **Multi-Tenant Isolation**
- Tenant-scoped data operations
- Separate policy assignments per tenant
- Isolated audit logs

### 5. **Bandwidth Discipline**
- Small heartbeat messages (~50 bytes)
- Batched telemetry uploads
- Prioritized transaction sync

## File Structure

```
vajrax-prototype/
├── index.html                 # Single-page application entry
├── styles.css                 # Enterprise dark theme styling
├── app.js                     # Main application coordinator
├── data/
│   ├── tenants.json          # Mock tenant records
│   ├── devices.json          # Simulated device inventory
│   └── policies.yaml         # YAML policy templates
├── src/
│   ├── core/
│   │   ├── event-bus.js      # Pub-sub message router
│   │   ├── state-manager.js  # Desired/current state management
│   │   └── crypto-utils.js   # Hashing and signatures
│   ├── cloud/
│   │   └── (console modules)
│   ├── device/
│   │   └── (simulator modules)
│   ├── audit/
│   │   └── chain-manager.js  # Cryptographic audit chain
│   └── network/
│       └── (sync modules)
├── scripts/
│   └── run-demo.js           # 90-second demo orchestrator
└── README.md                 # This file
```

## 90-Second Demo Script

### Automated Demo Sequence

Press **"Start 90s Demo"** to run the full sequence:

| Time | Step | What Happens |
|------|------|--------------|
| 0-5s | Boot Sequence | Device shows branded boot screen with progress animation |
| 5-8s | Launcher Ready | Custom launcher appears with role-based app icons |
| 8-12s | First Transaction | Online UPI payment (₹250) - instant sync |
| 12-15s | Network Off | Network toggle switches off - device goes offline |
| 15-19s | Offline Transaction | Card payment (₹175) - queued locally |
| 19-22s | Network On | Network restored - connection indicator turns green |
| 22-26s | Transaction Sync | Queued transaction uploads to cloud |
| 26-30s | Policy Push | Admin changes theme color and company name |
| 30-33s | Reconfiguration | Device applies new branding automatically |
| 33-38s | Audit Verification | Chain integrity verified - all entries linked |
| 38-40s | Demo Complete | Summary displayed - ready for judge interaction |

### Manual Demo Talking Points

1. **Boot Sequence**: "Notice the branded boot experience with vernacular language support"
2. **Launcher**: "Role-based app visibility - camera and settings disabled by policy"
3. **Transaction**: "Instant payment processing with success confirmation"
4. **Offline Mode**: "Network disconnected - device continues working seamlessly"
5. **Queue Management**: "Transactions stored locally with idempotency keys"
6. **Sync**: "Automatic upload on reconnect - zero data loss"
7. **Policy Update**: "Cloud pushes desired state - device reconciles autonomously"
8. **Audit Chain**: "Every action cryptographically signed and chained - tamper evident"

## Interactive Controls

### Network Toggle (📡 / 📴)
- Switch between online and offline modes
- Observe connection indicator change
- Test offline transaction queuing

### Policy Editor
- **Lockdown Tab**: Enable/disable camera, USB, settings
- **Network Tab**: Configure WiFi requirements, proxy settings
- **Branding Tab**: Change theme color, company name, language

### Sync Controls
- **Push Policy**: Send updated desired state to device
- **Force Sync**: Manually trigger upload of queued items

### Demo Controls
- **Start 90s Demo**: Run automated sequence
- **Reset**: Reload application to initial state

## Technical Implementation Details

### State Management
```javascript
// Cloud maintains desired state
desiredState = { version, policy, branding, lastUpdated }

// Device maintains current state
currentState = { version, batteryLevel, storageUsed, isOnline, appliedPolicyVersion }

// Reconciliation computes diff
diff = computeDiff(desiredState, currentState)
if (diff.hasChanges) apply(diff)
```

### Audit Chain Construction
```javascript
// Genesis block
previousHash = '0x' + '0'.repeat(64)

// Each entry
entry = { type, payload, timestamp, previousHash }
entry.hash = SHA256(entry)
entry.signature = Ed25519_sign(entry.hash)

// Chain verification
for each entry in chain:
    assert(entry.previousHash == previousHash)
    assert(verify_signature(entry))
    previousHash = entry.hash
```

### Offline Queue
```javascript
// Transaction queuing
queueTransaction(txn) {
    item = {
        id: generateId(),
        payload: txn,
        idempotencyKey: generateIdempotencyKey(),
        status: 'pending',
        retryCount: 0
    }
    localQueue.push(item)
}

// Sync on reconnect
sync() {
    queuedItems.forEach(item => upload(item))
    clearSynced(ids)
}
```

## Production Migration Path

### Phase 1: Backend Services
- Replace in-memory state with PostgreSQL + Redis
- Implement Go control service with WebSocket API
- Deploy NATS JetStream for event routing

### Phase 2: Security Hardening
- Real Ed25519 key generation in TEE
- TLS 1.3 with mutual authentication
- 30-day forward-secure key rotation

### Phase 3: Infrastructure
- Containerize with Docker
- Deploy via ArgoCD on EKS
- SPIFFE workload identities for mTLS

### Phase 4: Integrations
- UPI payment gateway integration
- Aadhaar/ABHA verification services
- ClickHouse for telemetry analytics

## Success Criteria ✓

- [x] Loads in any modern browser without build tools
- [x] Renders cloud console and device simulator side-by-side
- [x] Simulates offline-first behavior flawlessly
- [x] Demonstrates declarative reconciliation (no imperative commands)
- [x] Maintains visible tamper-evident audit chain
- [x] Completes 90-second demo sequence automatically
- [x] Aligns with VajraX OS architecture principles

## Troubleshooting

**Issue**: Demo button doesn't work  
**Fix**: Ensure all script tags are loaded - check browser console for errors

**Issue**: Audit chain shows tamper alert  
**Fix**: Refresh page to reset - don't manually edit DOM elements

**Issue**: Network toggle unresponsive  
**Fix**: Check that event listeners are initialized (see console logs)

## Credits

Built for the VajraX OS Hackathon  
Demonstrates: Offline-first • Declarative State • Multi-tenant • Cryptographic Audit

---

**Note**: This is a prototype for demonstration purposes. Production implementation requires real backend services, proper cryptographic libraries, and secure device attestation.
