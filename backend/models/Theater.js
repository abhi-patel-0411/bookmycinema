const mongoose = require("mongoose");

const seatLayoutSchema = new mongoose.Schema({
  row: { type: String, required: true }, // A, B, C, etc.
  seats: [
    {
      type: mongoose.Schema.Types.Mixed, // Can be number, object, or null for gaps
    },
  ],
});

const screenSchema = new mongoose.Schema({
  screenNumber: { type: Number, required: true },
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  screenType: {
    type: String,
    enum: ["2D", "3D", "IMAX", "4DX", "Dolby Atmos"],
    default: "2D",
  },
  soundSystem: {
    type: String,
    enum: ["Stereo", "Dolby Digital", "Dolby Atmos", "DTS", "IMAX Sound"],
    default: "Stereo",
  },
  projectionType: {
    type: String,
    enum: ["Digital", "Film", "Laser"],
    default: "Digital",
  },
  seatLayout: [seatLayoutSchema], // Custom grid-based layout
  isActive: { type: Boolean, default: true },
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
    landmark: { type: String, trim: true },
  },

  contactInfo: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
  },

  screens: [screenSchema],
  totalScreens: { type: Number, default: 0 },
  totalCapacity: { type: Number, default: 0 },
  amenities: [{ type: String, trim: true }],
  basePrice: { type: Number, default: 150 },
  
  status: {
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
  },
  
  // Backward compatibility
  isActive: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware
theaterSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  
  // Sync status.isActive with isActive for backward compatibility
  if (this.status && this.status.isActive !== undefined) {
    this.isActive = this.status.isActive;
  } else if (this.isActive !== undefined) {
    if (!this.status) this.status = {};
    this.status.isActive = this.isActive;
  }

  // Auto-calculate total screens and capacity
  if (this.screens && this.screens.length > 0) {
    const activeScreens = this.screens.filter((screen) => screen.isActive);
    this.totalScreens = activeScreens.length;
    this.totalCapacity = activeScreens.reduce(
      (total, screen) => total + screen.capacity,
      0
    );
  }

  next();
});

// Indexes for better performance
theaterSchema.index({ "address.city": 1, "status.isActive": 1 });
theaterSchema.index({ "address.city": 1, isActive: 1 }); // Backward compatibility
theaterSchema.index({ name: "text", location: "text" });

// Virtual for backward compatibility
theaterSchema.virtual("city").get(function () {
  return this.address?.city;
});

theaterSchema.set("toJSON", { virtuals: true });
theaterSchema.set("toObject", { virtuals: true });
// Ensures virtual fields (like city) appear when you call:

// doc.toJSON() (e.g., when sending API responses)

// doc.toObject() (e.g., before manual serialization)

// Without this, virtuals don’t show up in JSON by default.
module.exports = mongoose.model("Theater", theaterSchema);
