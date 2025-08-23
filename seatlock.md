# Seat Lock Mechanism Flow Documentation

## Overview
The seat lock mechanism prevents multiple users from booking the same seats simultaneously using real-time WebSocket communication and in-memory locks.

## Backend Components

### 1. Core Lock System (`bookingController.js`)

#### Data Structure
```javascript
const seatLocks = new Map(); // showId -> { seatId: { userId, timestamp, type } }
```

#### Lock Types & Durations
- **selection**: 1 minute (regular seat selection)
- **booking**: 5 minutes (during payment process)
- **payment_cancelled**: 2 minutes (after payment cancellation)

#### Key Functions

##### `cleanExpiredLocks(showId)`
- Removes expired locks based on lock type duration
- Called before any lock operation
- Auto-cleanup mechanism

##### `lockSeats(showId, seats, userId, lockType)`
- Locks seats for specific user
- Checks for conflicts with existing locks
- Sets auto-release timeout
- Returns success/conflict status

##### `unlockSeats(showId, seats, userId)`
- Releases seats locked by specific user
- Notifies other users about availability
- Called on user disconnect or manual release

### 2. Real-time Communication (`middleware/realtime.js`)

#### Socket Events Emitted
- `seats-locked`: Seat successfully locked
- `seats-released`: Seats manually released
- `seats-auto-released`: Seats expired automatically
- `seats-available`: Seats now available for booking
- `seat-conflict`: Conflict detected during booking

## Frontend Components

### 1. Seat Selection Component (`components/SeatSelection.js`)

#### State Management
```javascript
const [selectedSeats, setSelectedSeats] = useState([]);
const [lockedSeats, setLockedSeats] = useState([]);
const [conflictSeats, setConflictSeats] = useState([]);
```

#### Socket Event Listeners
```javascript
socket.on('seats-locked', handleSeatsLocked);
socket.on('seats-released', handleSeatsReleased);
socket.on('seats-auto-released', handleAutoReleased);
socket.on('seat-conflict', handleSeatConflict);
```

### 2. Booking Flow Components

#### Payment Component (`components/Payment.js`)
- Maintains seat locks during payment
- Extends lock duration to 5 minutes
- Handles payment success/failure

#### Booking Confirmation (`components/BookingConfirmation.js`)
- Finalizes booking and releases locks
- Updates show's booked seats in database

## Complete Flow Diagram

### 1. Seat Selection Flow
```
Frontend (User A)          Backend                    Frontend (User B)
     |                        |                           |
1. Click seat               |                           |
     |---> POST /lock-seats--->|                           |
     |                     Lock seat                      |
     |<--- seats-locked -------|                           |
2. Update UI               |                           |
     |                     |-----> seats-locked -------->|
     |                     |                        Update UI
```

### 2. Conflict Detection Flow
```
Frontend (User B)          Backend                    Frontend (User A)
     |                        |                           |
1. Click locked seat        |                           |
     |---> POST /lock-seats--->|                           |
     |                   Check conflicts                  |
     |<--- 409 conflict -------|                           |
2. Show error              |                           |
     |                     |-----> seat-conflict ------->|
     |                     |                      Show notification
```

### 3. Auto-Release Flow
```
Frontend (User A)          Backend                    All Users
     |                        |                           |
1. Select seats            |                           |
     |---> POST /lock-seats--->|                           |
     |<--- seats-locked -------|                           |
     |                   Start timer                      |
     |                        |                           |
2. Timer expires (1 min)   |                           |
     |                   Auto-unlock                     |
     |<--- seats-auto-released-|                           |
3. Show expiry message     |                           |
     |                     |-----> seats-available ----->|
     |                     |                      Update availability
```

### 4. Payment Flow
```
Frontend                   Backend                    Database
     |                        |                           |
1. Proceed to payment       |                           |
     |---> POST /create-booking->|                           |
     |                   Lock with 'booking' type         |
     |<--- booking-created -----|                           |
2. Payment process (5 min)  |                           |
     |                        |                           |
3. Payment success          |                           |
     |---> POST /confirm ------>|                           |
     |                     |-----> UPDATE booked_seats --->|
     |<--- confirmed -------|<----- success --------------|
4. Release locks           |                           |
```

## File Structure & Connections

### Backend Files
```
backend/
├── controllers/
│   └── bookingController.js     # Main lock logic
├── middleware/
│   └── realtime.js             # Socket communication
├── models/
│   └── Show.js                 # Show schema with bookedSeats
└── routes/
    └── bookingRoutes.js        # API endpoints
```

### Frontend Files
```
frontend/src/
├── components/
│   ├── SeatSelection.js        # Seat selection UI
│   ├── Payment.js              # Payment processing
│   └── BookingConfirmation.js  # Final confirmation
├── hooks/
│   └── useSocket.js            # Socket connection hook
└── pages/
    └── BookingPage.js          # Main booking page
```

## API Endpoints

### Lock Management
- `POST /api/bookings/lock-seats` - Lock seats for user
- `POST /api/bookings/unlock-seats` - Release seats
- `GET /api/bookings/seat-status/:showId` - Get current seat status

### Booking Process
- `POST /api/bookings/create` - Create booking (with extended lock)
- `POST /api/bookings/confirm` - Confirm payment and finalize
- `DELETE /api/bookings/cancel` - Cancel booking and release seats

## Socket Events Reference

### Backend → Frontend
| Event | Purpose | Data |
|-------|---------|------|
| `seats-locked` | Seats successfully locked | `{showId, seats, userId}` |
| `seats-released` | Seats manually released | `{showId, seats, userId}` |
| `seats-auto-released` | Seats expired | `{showId, seats, userId, message}` |
| `seats-available` | Seats now available | `{showId, seats}` |
| `seat-conflict` | Booking conflict detected | `{showId, conflicts, userId, message}` |

### Frontend → Backend
| Event | Purpose | Data |
|-------|---------|------|
| `join-show` | Join show room | `{showId, userId}` |
| `leave-show` | Leave show room | `{showId, userId}` |
| `select-seats` | Request seat lock | `{showId, seats, userId}` |
| `release-seats` | Release seat lock | `{showId, seats, userId}` |

## Error Handling

### Conflict Resolution
1. **Immediate Conflicts**: Return 409 status with conflict details
2. **Race Conditions**: First-come-first-served based on timestamp
3. **Network Issues**: Auto-release on disconnect
4. **Payment Failures**: Extended lock for retry opportunity

### Recovery Mechanisms
1. **Auto-cleanup**: Expired locks removed automatically
2. **Reconnection**: Re-sync seat status on socket reconnect
3. **Fallback**: Database validation as final check
4. **User Notification**: Clear messages for all conflict scenarios

## Performance Considerations

### Memory Management
- In-memory locks for fast access
- Periodic cleanup of expired locks
- Garbage collection on show completion

### Scalability
- Per-show lock isolation
- Efficient conflict detection
- Minimal database queries during selection

### Real-time Updates
- Targeted notifications (user-specific vs broadcast)
- Debounced UI updates
- Connection state management