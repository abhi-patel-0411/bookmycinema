# Seat Selection System - Usage Guide

## Backend Changes Made

### 1. Simplified Seat Locking
- **Lock Duration**: 30 seconds (reduced from 60s)
- **No Complex Types**: Only one lock type for selections
- **Auto-cleanup**: Expired locks are automatically removed
- **User Disconnect**: All locks cleared when user disconnects

### 2. API Endpoints

#### Select Seats
```
POST /api/bookings/select-seats
Body: { showId, seats: ["A1", "A2"] }
Response: { success: true, seats: ["A1", "A2"], expiresIn: 30 }
```

#### Release Seats
```
POST /api/bookings/release-seats  
Body: { showId, seats: ["A1", "A2"] }
Response: { success: true, released: true }
```

#### Get Seat Status
```
GET /api/bookings/locked-seats/:showId
Response: {
  showId,
  bookedSeats: ["B1", "B2"],
  lockedByOthers: ["A3", "A4"], 
  lockedByMe: ["A1", "A2"]
}
```

### 3. Socket Events

#### Listen for these events:
- `seats-selected`: When another user selects seats
- `seats-released`: When seats become available
- `seat-conflict`: When selection conflicts occur

## Frontend Implementation Example

```javascript
// 1. Connect to socket
const socket = io('your-backend-url');
socket.emit('register-user', userId);

// 2. Listen for seat updates
socket.on('seats-selected', (data) => {
  // Mark seats as locked by others
  markSeatsAsLocked(data.seats);
});

socket.on('seats-released', (data) => {
  // Mark seats as available
  markSeatsAsAvailable(data.seats);
});

// 3. Select seats function
async function selectSeats(showId, seats) {
  try {
    const response = await fetch('/api/bookings/select-seats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showId, seats })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Update UI - seats selected successfully
      updateSelectedSeats(seats);
    } else {
      // Handle conflicts
      showConflictMessage(result.message);
    }
  } catch (error) {
    console.error('Selection failed:', error);
  }
}

// 4. Release seats function  
async function releaseSeats(showId, seats) {
  try {
    await fetch('/api/bookings/release-seats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showId, seats })
    });
    
    // Update UI - seats released
    clearSelectedSeats(seats);
  } catch (error) {
    console.error('Release failed:', error);
  }
}

// 5. Get current seat status
async function getSeatStatus(showId) {
  try {
    const response = await fetch(`/api/bookings/locked-seats/${showId}`);
    const status = await response.json();
    
    // Update UI with current seat status
    updateSeatDisplay(status);
  } catch (error) {
    console.error('Status fetch failed:', error);
  }
}
```

## Key Improvements

1. **No False Conflicts**: Users won't see conflicts for seats they don't actually compete for
2. **Automatic Cleanup**: Disconnected users' locks are immediately cleared
3. **Shorter Lock Time**: 30-second locks prevent seats being held too long
4. **Simplified Logic**: Easier to debug and maintain
5. **Real-time Updates**: Immediate feedback via socket events

## Testing

The system now properly handles:
- ✅ Multiple users selecting different seats
- ✅ Same user re-selecting their own seats  
- ✅ User disconnection clearing their locks
- ✅ Automatic lock expiry after 30 seconds
- ✅ Real-time updates to all connected users