# Fix: Cannot Delete Show with Bookings

## Problem
The admin was unable to delete shows that had active bookings, with the error "Cannot delete a show that has bookings".

## Root Cause
The show deletion logic was checking `show.bookedSeats` array instead of the actual `Booking` collection in the database, leading to incorrect booking detection.

## Solution Implemented

### 1. Backend Changes

#### `showController.js`
- **Fixed booking detection**: Now properly checks the `Booking` collection for active bookings
- **Enhanced error messages**: Provides booking count and clear instructions
- **Added force delete option**: Allows admins to delete shows with bookings when necessary
- **Automatic booking cancellation**: Cancels all bookings when force deleting

#### `routes/shows.js`
- **Added force delete route**: `DELETE /shows/:id/force` for force deletion
- **Imported forceDeleteShow function**: Added to controller imports

### 2. Frontend Changes

#### `AdminShows.js`
- **Enhanced delete handler**: Detects booking conflicts and offers force delete
- **Improved user experience**: Clear confirmation dialogs with booking information
- **Two-step deletion process**: Regular delete → Force delete if bookings exist

#### `showsService.js`
- **Added forceDelete method**: New API method for force deletion
- **Consistent API interface**: Maintains same pattern as other service methods

## Features Added

### 1. Smart Booking Detection
```javascript
// Now properly checks Booking collection
const activeBookings = await Booking.countDocuments({ 
  show: req.params.id, 
  status: { $in: ['confirmed', 'pending'] }
});
```

### 2. Force Delete Option
- **Regular Delete**: Fails if bookings exist, shows booking count
- **Force Delete**: Cancels all bookings and deletes the show
- **Clear Warnings**: Explains consequences before force deletion

### 3. Enhanced User Experience
- **Detailed Confirmations**: Shows movie, theater, date, time details
- **Booking Count Display**: Shows exactly how many bookings will be affected
- **Two-step Process**: Safe regular delete → Optional force delete

## API Endpoints

### Regular Delete
```
DELETE /api/shows/:id
```
- Returns 400 error if bookings exist
- Includes `canForceDelete: true` and `bookingCount` in response

### Force Delete
```
DELETE /api/shows/:id/force
```
- Cancels all bookings for the show
- Deletes the show regardless of bookings
- Returns success message with cancelled booking count

## Usage Flow

1. **Admin clicks delete** → Regular delete attempt
2. **If bookings exist** → Error with booking count and force delete option
3. **Admin confirms force delete** → All bookings cancelled, show deleted
4. **Success feedback** → Shows how many bookings were cancelled

## Error Handling

### Regular Delete with Bookings
```json
{
  "message": "Cannot delete show with 3 active booking(s). Cancel bookings first or use force delete.",
  "bookingCount": 3,
  "canForceDelete": true
}
```

### Force Delete Success
```json
{
  "message": "Show force deleted and 3 booking(s) cancelled"
}
```

## Safety Features

1. **Two-step confirmation**: Regular delete → Force delete confirmation
2. **Clear warnings**: Explains all consequences before action
3. **Booking cancellation**: Automatically handles affected bookings
4. **Detailed feedback**: Shows exactly what was affected

## Testing

To test the fix:

1. **Create a show** with bookings
2. **Try regular delete** → Should show booking conflict
3. **Confirm force delete** → Should delete show and cancel bookings
4. **Verify bookings** are marked as cancelled in database

## Benefits

✅ **Resolves blocking issue**: Admins can now delete shows with bookings
✅ **Maintains data integrity**: Properly handles related bookings
✅ **Enhanced safety**: Two-step process prevents accidental deletions
✅ **Better UX**: Clear feedback and confirmation dialogs
✅ **Flexible options**: Both safe and force delete available