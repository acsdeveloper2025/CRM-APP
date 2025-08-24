# Offline-First Mobile App with WebSocket Support

## Overview

The CaseFlow mobile app has been redesigned to work **offline-first** with selective WebSocket functionality for critical operations only: **case assignment**, **case submission**, and **sync operations**.

## Key Features

### 🔄 **Offline-First Architecture**
- **Primary Operation**: App works fully offline by default
- **Local Storage**: All case data stored locally using AsyncStorage
- **Intelligent Sync**: Periodic and triggered synchronization
- **Queue Management**: Offline operations queued for later sync

### 📡 **Selective WebSocket Connectivity** 
- **Conservative Connection**: Only connects when online and authenticated
- **Critical Events Only**: Limited to essential real-time notifications
- **Automatic Fallback**: Silent failure to offline mode when connection fails
- **Throttled Reconnection**: Max 3 retry attempts with exponential backoff

## Supported Operations

### ✅ **Fully Offline Operations**
```typescript
// These work completely offline
- View assigned cases
- Fill case forms
- Capture photos
- Save case progress
- Mark cases as completed
- Search and filter cases
- View case details
```

### 🔄 **WebSocket-Enhanced Operations** 
```typescript
// Enhanced with real-time updates when online
1. Case Assignment Notifications
   - New cases assigned to field agent
   - Immediate notification when online
   - Queued for next sync when offline

2. Case Submission
   - Real-time confirmation when online
   - Queued for sync when offline
   - Status tracking for submitted cases

3. Sync Operations
   - Triggered sync from server
   - Real-time data updates
   - Conflict resolution
```

## Technical Implementation

### 🛠 **WebSocket Service Changes**

#### Connection Strategy
```typescript
// Offline-first configuration
constructor() {
  this.config = {
    url: envConfig.api.wsUrl,
    autoConnect: false,        // Disabled by default
    reconnectAttempts: 3,      // Reduced attempts
    reconnectDelay: 10000,     // Longer delays
    timeout: 15000,            // Extended timeout
  };
  
  this.offlineMode = !navigator.onLine;
  this.MAX_RETRY_ATTEMPTS = 3;
}
```

#### Critical Event Handling
```typescript
// Only essential WebSocket events
- mobile:case:assigned     // New case notifications
- mobile:sync:trigger      // Sync requests  
- mobile:sync:completed    // Sync confirmations
- mobile:case:status:changed // Optional status updates
```

### 📱 **Mobile App Behavior**

#### Startup Process
1. **Initialize offline storage** (AsyncStorage)
2. **Load cached cases** from local storage
3. **Check connectivity** (navigator.onLine)
4. **Attempt WebSocket connection** (if online, after 5s delay)
5. **Trigger background sync** (if connection successful)

#### Case Assignment Flow
```typescript
// When Online + WebSocket Connected
1. Real-time notification via WebSocket
2. Immediate case sync from API
3. Update local storage
4. Refresh UI

// When Offline
1. Case data queued on server
2. Retrieved during next sync
3. Local notification (if any)
4. Updated in assigned cases list
```

#### Case Submission Flow
```typescript
// When Online
1. Submit to API immediately
2. WebSocket confirmation (optional)
3. Update local status to 'submitted'
4. Clear from pending queue

// When Offline  
1. Mark as 'completed' locally
2. Add to submission queue
3. Show 'pending sync' indicator
4. Submit during next sync
```

### 🔧 **Configuration Changes**

#### Environment Configuration
```typescript
// caseflow-mobile/config/environment.ts
features: {
  enableOfflineMode: true,           // Always enabled
  enableRealTimeUpdates: true,       // WebSocket features
  enableBackgroundSync: true,        // Periodic sync
  enableAutoSave: true,              // Auto-save forms
}

offline: {
  syncRetryAttempts: 3,              // Reduced attempts
  syncRetryDelay: 5000,              // 5s delay between retries
  autoSyncInterval: 300000,          // 5min periodic sync
}
```

#### WebSocket Hook Configuration
```typescript
// hooks/useWebSocket.ts
const useWebSocket = ({
  autoConnect: false,               // Disabled by default
  enableNotifications: true,        // Local notifications
  // ... selective event handlers
});
```

## User Experience

### 📊 **UI Indicators**
- **Connectivity Status**: Online/Offline indicator
- **Sync Status**: Last sync time, pending operations
- **Submission Status**: Submitted/Pending/Failed indicators
- **Case Status**: Real-time vs cached data indicators

### ⚡ **Performance Benefits**
- **Instant Load**: Cases load immediately from cache
- **Reduced Battery**: Fewer connection attempts
- **Better UX**: No loading delays for offline operations
- **Reliable**: Works in poor network conditions

### 🔄 **Sync Behavior**
```typescript
// Automatic Sync Triggers
1. App comes online (connectivity change)
2. App becomes active (foreground)
3. WebSocket sync trigger (real-time)
4. Periodic sync timer (5-minute intervals)
5. Manual refresh (pull-to-refresh)
```

## Error Handling

### 🚨 **Connection Failures**
- **Silent Failure**: No error messages for connection issues
- **Graceful Degradation**: Falls back to offline mode seamlessly
- **Retry Logic**: Limited reconnection attempts
- **User Feedback**: Shows offline mode instead of errors

### ⚠️ **Sync Conflicts**
- **Last Write Wins**: Server data takes precedence
- **Conflict Indicators**: Show when local data differs
- **Manual Resolution**: Allow user to choose version
- **Backup Local**: Keep local copy before overwriting

## Benefits

### 👥 **For Field Agents**
- ✅ Works in areas with poor connectivity
- ✅ Instant access to assigned cases
- ✅ No waiting for data to load
- ✅ Reliable case submission
- ✅ Real-time notifications when possible

### 🏢 **For Organizations**  
- ✅ Reduced server load
- ✅ Better user adoption
- ✅ Lower support costs
- ✅ Improved data collection
- ✅ Real-time coordination when needed

### 🔧 **For Developers**
- ✅ Simplified error handling
- ✅ Predictable behavior
- ✅ Easier testing
- ✅ Better performance monitoring
- ✅ Reduced complexity

## Testing

### 🧪 **Test Scenarios**
1. **Full Offline**: Disable network completely
2. **Intermittent Connectivity**: Toggle network on/off
3. **WebSocket Failures**: Block WebSocket port
4. **Server Downtime**: Stop backend server
5. **Slow Networks**: Throttle connection speed

### ✅ **Verification Points**
- Cases load instantly when offline
- Forms can be filled and saved offline
- Submissions queue properly when offline
- WebSocket connects when coming online
- Real-time notifications work when connected
- Sync operations complete successfully
- UI indicators show correct status

This offline-first implementation ensures the mobile app provides a reliable, fast user experience regardless of connectivity while still leveraging WebSocket technology for enhanced real-time features when available.