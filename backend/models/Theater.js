const mongoose = require('mongoose');

const seatLayoutSchema = new mongoose.Schema({
  row: { type: String, required: true }, // A, B, C, etc.
  seats: [{ 
    type: mongoose.Schema.Types.Mixed // Can be number, object, or null for gaps
  }]
});

const screenSchema = new mongoose.Schema({
  screenNumber: { type: Number, required: true },
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  screenType: { type: String, enum: ['2D', '3D', 'IMAX', '4DX', 'Dolby Atmos'], default: '2D' },
  soundSystem: { type: String, enum: ['Stereo', 'Dolby Digital', 'Dolby Atmos', 'DTS', 'IMAX Sound'], default: 'Stereo' },
  projectionType: { type: String, enum: ['Digital', 'Film', 'Laser'], default: 'Digital' },
  seatLayout: [seatLayoutSchema], // Custom grid-based layout
  isActive: { type: Boolean, default: true }
});

const theaterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  address: {
    street: { type: String, trim: true },
    area: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    landmark: { type: String, trim: true }
  },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  contactInfo: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    website: { type: String, trim: true },
    manager: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true }
    }
  },
  operatingHours: {
    weekdays: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '23:00' }
    },
    weekends: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '24:00' }
    }
  },
  screens: [screenSchema],
  totalScreens: { type: Number, default: 0 },
  totalCapacity: { type: Number, default: 0 },
  amenities: [{ type: String, trim: true }],
  facilities: {
    parking: {
      available: { type: Boolean, default: false },
      capacity: { type: Number, default: 0 },
      type: { type: String, enum: ['Free', 'Paid', 'Valet'], default: 'Free' }
    },
    foodCourt: { type: Boolean, default: false },
    restrooms: { type: Boolean, default: true },
    wheelchairAccess: { type: Boolean, default: false },
    airConditioning: { type: Boolean, default: true },
    wifi: { type: Boolean, default: false },
    atm: { type: Boolean, default: false },
    elevator: { type: Boolean, default: false }
  },
  pricing: {
    basePrice: { type: Number, default: 150 },
    premiumPrice: { type: Number, default: 200 },
    weekendSurcharge: { type: Number, default: 50 },
    holidaySurcharge: { type: Number, default: 100 }
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },
  status: {
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false }
  },
  metadata: {
    totalShows: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    lastShowDate: { type: Date }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware
theaterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-calculate total screens and capacity
  if (this.screens && this.screens.length > 0) {
    this.totalScreens = this.screens.filter(screen => screen.isActive).length;
    this.totalCapacity = this.screens
      .filter(screen => screen.isActive)
      .reduce((total, screen) => total + screen.capacity, 0);
  }
  
  next();
});

// Indexes for better performance
theaterSchema.index({ 'address.city': 1, 'status.isActive': 1 });
theaterSchema.index({ name: 'text', location: 'text' });
theaterSchema.index({ coordinates: '2dsphere' });

// Virtual for backward compatibility
theaterSchema.virtual('city').get(function() {
  return this.address?.city;
});

theaterSchema.virtual('isActive').get(function() {
  return this.status?.isActive;
});

theaterSchema.set('toJSON', { virtuals: true });
theaterSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Theater', theaterSchema);