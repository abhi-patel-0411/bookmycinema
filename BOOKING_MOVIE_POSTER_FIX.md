# Fix: Admin Bookings Movie Poster Storage for Past Movies

## Problem
Admin side bookings were showing movie details but movie posters were not displaying for past/inactive movies because the system was only looking at the populated show.movie data, which might be null or missing for inactive movies.

## Root Cause
The frontend components were prioritizing `booking.show?.movie?.poster` over the stored `booking.moviePoster` field, causing images to not display when movies were deactivated or deleted.

## Solution Implemented

### Backend (Already Correct)
The booking controller was already correctly storing movie details directly in the booking document:

```javascript
// Store movie and theater details directly for persistence
movieTitle: show.movie?.title || 'Unknown Movie',
moviePoster: show.movie?.poster || '',
theaterName: show.theater?.name || 'Unknown Theater',
movieIsActive: show.movie?.isActive !== false,
```

The Booking model already had the required fields:
```javascript
movieTitle: { type: String },
moviePoster: { type: String },
theaterName: { type: String },
```

### Frontend Changes

#### 1. AdminBookings.js
**Before:**
```javascript
src={
  selectedBooking.show?.movie?.poster ||
  selectedBooking.moviePoster ||
  // fallback
}
```

**After:**
```javascript
src={
  selectedBooking.moviePoster ||
  selectedBooking.show?.movie?.poster ||
  // fallback
}
```

#### 2. AdminBookingsTable.js
**Before:**
```javascript
src={
  booking.show?.movie?.poster ||
  booking.moviePoster ||
  // fallback
}
```

**After:**
```javascript
src={
  booking.moviePoster ||
  booking.show?.movie?.poster ||
  // fallback
}
```

## Key Changes Made

### 1. Priority Order Fix
- **Old Priority**: `show.movie.poster` → `moviePoster` → fallback
- **New Priority**: `moviePoster` → `show.movie.poster` → fallback

### 2. Movie Title Display
- **Old**: `show.movie.title || movieTitle`
- **New**: `movieTitle || show.movie.title`

### 3. Theater Name Display
- **Old**: `show.theater.name || theaterName`
- **New**: `theaterName || show.theater.name`

### 4. Inactive Movie Badge Logic
- **Old**: Only showed when `show.movie.isActive === false`
- **New**: Shows when `show.movie.isActive === false` OR `!show.movie` (missing)

## Benefits

✅ **Persistent Movie Posters**: Images now display even after movies are deactivated
✅ **Data Integrity**: Stored booking data takes priority over potentially missing populated data
✅ **Better User Experience**: Admin can see complete booking history with images
✅ **Fallback Safety**: Still works if stored data is missing (falls back to populated data)

## How It Works

1. **During Booking Creation**: Movie poster URL is stored directly in booking document
2. **During Display**: Frontend prioritizes stored poster over populated movie data
3. **For Inactive Movies**: Stored poster is used since populated movie might be null
4. **Fallback**: If both are missing, placeholder image is generated

## Testing

To verify the fix:

1. **Create bookings** for active movies
2. **Deactivate/delete** those movies
3. **Check admin bookings** - posters should still display
4. **Verify fallback** - placeholder shows if no poster stored

## Data Flow

```
Booking Creation:
Movie (active) → Store poster URL → Booking document

Display (later):
Booking.moviePoster → Display image
↓ (if missing)
Show.movie.poster → Display image  
↓ (if missing)
Placeholder → Display fallback
```

This ensures movie posters are always available in admin booking history, regardless of the current status of the movie.