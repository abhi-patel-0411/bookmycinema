# Cross-Environment Seat Sync Test

## Problem Fixed
- ✅ 30-second lock duration (was 2 seconds)
- ✅ Automatic socket broadcasting on seat selection
- ✅ Periodic sync every 5 seconds
- ✅ Manual sync endpoints for testing

## Test Steps

### 1. Deploy Changes
```bash
git add .
git commit -m "Fix cross-environment seat sync"
git push origin main
```

### 2. Test Localhost → Deployed Sync
1. Start localhost backend: `npm start`
2. Open localhost frontend
3. Select seats (e.g., A1, A2)
4. Open deployed frontend
5. **Expected**: Seats A1, A2 should show as selected/locked

### 3. Test Deployed → Localhost Sync  
1. Open deployed frontend
2. Select different seats (e.g., B1, B2)
3. Check localhost frontend
4. **Expected**: Seats B1, B2 should show as selected/locked

### 4. Manual Sync Test
If automatic sync doesn't work, test manual sync:

```bash
# Sync specific show
curl https://your-app.onrender.com/api/sync/seats/SHOW_ID

# Sync all shows
curl https://your-app.onrender.com/api/sync/seats
```

### 5. Socket Event Test
Your frontend should listen for:
```javascript
socket.on('seat-status-sync', (data) => {
  console.log('Seat sync received:', data);
  // Update UI with data.locks
});

socket.on('seats-selected', (data) => {
  console.log('Seats selected:', data);
  // Mark seats as locked
});

socket.on('seats-released', (data) => {
  console.log('Seats released:', data);
  // Mark seats as available
});
```

## Debug Endpoints

### Check Backend Status
```
GET /api/test
Response: {
  "message": "Backend is working!",
  "environment": "production",
  "database": "connected",
  "seatLocks": 5
}
```

### Check Seat Locks
```
GET /api/sync/seats
Response: {
  "message": "All seat statuses synced",
  "activeShows": 2,
  "totalLocks": 4,
  "shows": {
    "show123": [
      {"seatId": "A1", "userId": "user1"},
      {"seatId": "A2", "userId": "user1"}
    ]
  }
}
```

## Expected Behavior

### ✅ Working:
- Seat selection on localhost shows on deployed
- Seat selection on deployed shows on localhost  
- Automatic sync every 5 seconds
- 30-second auto-release
- Real-time socket updates

### 🔧 If Not Working:
1. Check both backends are using same MongoDB URI
2. Verify socket connections are established
3. Use manual sync endpoints to force sync
4. Check browser console for socket events

## Troubleshooting

### No Sync Between Environments:
```bash
# Check if both use same database
curl localhost:10000/api/test
curl https://your-app.onrender.com/api/test

# Force manual sync
curl https://your-app.onrender.com/api/sync/seats
```

### Socket Not Working:
```javascript
// Check socket connection
socket.on('connect', () => {
  console.log('✅ Socket connected');
});

socket.on('disconnect', () => {
  console.log('❌ Socket disconnected');
});
```