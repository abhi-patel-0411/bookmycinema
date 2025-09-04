const Booking = require("../models/Booking");
const Show = require("../models/Show");
const User = require("../models/User");
const {
  emitToAdmin,
  emitToUsers,
  emitToUser,
} = require("../middleware/realtime");
const { sendBookingConfirmation } = require("../services/emailService");

const getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    ``;
    const search = req.query.search || "";

    // Build search query
    let query = {};
    if (search) {
      query = {
        $or: [
          { "userDetails.email": { $regex: search, $options: "i" } },
          { bookingId: { $regex: search, $options: "i" } },
          { ticketId: { $regex: search, $options: "i" } },
        ],
      };
    }

    const totalBookings = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate({
        path: "show",
        populate: [
          {
            path: "movie",
            select: "title poster isActive duration genre rating",
            match: null, // Don't filter out any movies
          },
          { path: "theater", select: "name location city screens" },
        ],
      })
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit);

    const bookingsWithUsers = bookings.map((booking) => {
      const customerName =
        booking.userDetails?.email?.split("@")[0] || "Guest User";
      const customerEmail = booking.userDetails?.email || "N/A";

      return {
        ...booking.toObject(),
        user: {
          name: customerName,
          email: customerEmail,
        },
        customerName,
        customerEmail,
      };
    });

    res.json({
      bookings: bookingsWithUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalBookings / limit),
        totalBookings,
        hasNext: page < Math.ceil(totalBookings / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "show",
      populate: [
        { path: "movie", select: "title poster duration" },
        { path: "theater", select: "name location city screens" },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({
      ...booking.toObject(),
      customerName: booking.userDetails?.email?.split("@")[0] || "Customer",
      customerEmail: booking.userDetails?.email || "N/A",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Database-based seat locking for cross-environment sync
const mongoose = require("mongoose");
const LOCK_DURATION = 30 * 1000;

const seatLockSchema = new mongoose.Schema({
  showId: { type: String, required: true },
  seatId: { type: String, required: true },
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + LOCK_DURATION),
    expires: 0,
  },
});
seatLockSchema.index({ showId: 1, seatId: 1 }, { unique: true });
const SeatLock =
  mongoose.models.SeatLock || mongoose.model("SeatLock", seatLockSchema);

const lockSeats = async (showId, seats, userId) => {
  try {
    await SeatLock.deleteMany({ expiresAt: { $lt: new Date() } });

    const existingLocks = await SeatLock.find({
      showId,
      seatId: { $in: seats },
      userId: { $ne: userId },
    });

    if (existingLocks.length > 0) {
      return {
        success: false,
        conflicts: existingLocks.map((lock) => lock.seatId),
      };
    }

    await SeatLock.deleteMany({ showId, seatId: { $in: seats }, userId });

    const locks = seats.map((seatId) => ({
      showId,
      seatId,
      userId,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + LOCK_DURATION),
    }));

    await SeatLock.insertMany(locks);
    return { success: true };
  } catch (error) {
    console.error("Lock seats error:", error);
    return { success: false, conflicts: [] };
  }
};

const unlockSeats = async (showId, seats, userId) => {
  try {
    const result = await SeatLock.deleteMany({
      showId,
      seatId: { $in: seats },
      userId,
    });

    if (result.deletedCount > 0) {
      emitToUsers("seats-released", { showId, seats, userId });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Unlock seats error:", error);
    return false;
  }
};

const clearUserLocks = async (userId) => {
  try {
    const userLocks = await SeatLock.find({ userId });
    await SeatLock.deleteMany({ userId });

    const locksByShow = {};
    userLocks.forEach((lock) => {
      if (!locksByShow[lock.showId]) locksByShow[lock.showId] = [];
      locksByShow[lock.showId].push(lock.seatId);
    });

    Object.entries(locksByShow).forEach(([showId, seats]) => {
      emitToUsers("seats-released", { showId, seats, userId });
    });

    return userLocks;
  } catch (error) {
    console.error("Clear user locks error:", error);
    return [];
  }
};

const getLockedSeatsData = async (showId, userId) => {
  try {
    await SeatLock.deleteMany({ expiresAt: { $lt: new Date() } });

    const locks = await SeatLock.find({ showId });
    const lockedByOthers = [];
    const lockedByMe = [];

    locks.forEach((lock) => {
      if (lock.userId === userId) {
        lockedByMe.push(lock.seatId);
      } else {
        lockedByOthers.push(lock.seatId);
      }
    });

    return { lockedByOthers, lockedByMe };
  } catch (error) {
    console.error("Get locked seats error:", error);
    return { lockedByOthers: [], lockedByMe: [] };
  }
};

const createBooking = async (req, res) => {
  try {
    const { showId, seats, totalAmount, seatDetails } = req.body;

    // Get user details from auth middleware
    const userId = req.user?.id || req.user?._id || `guest_${Date.now()}`;
    const userEmail =
      req.user?.email ||
      req.user?.emailAddresses?.[0]?.emailAddress ||
      "guest@example.com";

    console.log("Creating booking for user:", {
      userId,
      userEmail,
      fullUser: req.user,
    });

    // Validate show exists
    const show = await Show.findById(showId)
      .populate("movie", "title")
      .populate("theater", "name");

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    // Check if seats are available in the database first
    const unavailableSeats = seats.filter((seat) =>
      show.bookedSeats.includes(seat)
    );
    if (unavailableSeats.length > 0) {
      return res.status(409).json({
        message: `Seats ${unavailableSeats.join(", ")} are already booked`,
        conflicts: unavailableSeats,
        type: "booked",
      });
    }

    // Check seat locks
    const lockResult = await lockSeats(showId, seats, userId);
    if (!lockResult.success) {
      return res.status(409).json({
        message: `Seats ${lockResult.conflicts.join(
          ", "
        )} are currently selected by another user`,
        conflicts: lockResult.conflicts,
        type: "locked",
      });
    }

    // We already checked for unavailable seats above

    // Check if enough seats are available
    if (show.availableSeats < seats.length) {
      unlockSeats(showId, seats, userId);
      return res.status(400).json({
        message: "Not enough seats available",
      });
    }

    // Generate unique booking ID and ticket ID
    const bookingId = `BK${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;

    const ticketId = `TKT-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;

    // Create booking with movie and theater details for persistence
    const booking = new Booking({
      user: userId,
      userDetails: {
        clerkId: userId,
        email: userEmail,
      },
      show: showId,
      // Store movie and theater details directly for persistence
      movieTitle: show.movie?.title || "Unknown Movie",
      moviePoster: show.movie?.poster || "",
      theaterName: show.theater?.name || "Unknown Theater",
      movieIsActive: show.movie?.isActive !== false, // Store movie active status
      showDate: show.showDate,
      showTime: show.showTime,
      seats: seats,
      totalAmount: totalAmount,
      seatDetails:
        seatDetails ||
        seats.map((seat) => ({ seatId: seat, price: show.price })),
      bookingDate: new Date(),
      status: "confirmed",
      paymentStatus: "completed",
      bookingId: bookingId,
      ticketId: ticketId,
    });

    await booking.save();
    console.log("Booking created:", booking._id);

    // Update show with booked seats
    show.bookedSeats.push(...seats);
    show.availableSeats -= seats.length;
    await show.save();

    // Populate the booking for response
    const populatedBooking = await Booking.findById(booking._id).populate({
      path: "show",
      populate: [
        { path: "movie", select: "title poster" },
        { path: "theater", select: "name location" },
      ],
    });

    // Clear locks after successful booking
    await unlockSeats(showId, seats, userId);

    // Send booking confirmation email
    try {
      await sendBookingConfirmation({
        _id: booking._id,
        user: { name: userEmail.split("@")[0], email: userEmail },
        show: populatedBooking.show,
        seats: seats,
        totalAmount: totalAmount,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    // Emit real-time updates
    emitToAdmin("new-booking", populatedBooking);
    emitToUsers("booking-created", { bookingId: booking._id, showId });
    emitToUsers("seats-booked", { showId, bookedSeats: seats });

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ message: error.message });
  }
};

const selectSeats = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userId = req.user?.id || req.user?._id || `guest_${Date.now()}`;

    if (!showId || !seats?.length) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    // Check booked seats
    const alreadyBooked = seats.filter((seat) =>
      show.bookedSeats.includes(seat)
    );
    if (alreadyBooked.length > 0) {
      return res.status(409).json({
        message: `Seats ${alreadyBooked.join(", ")} are already booked`,
        conflicts: alreadyBooked,
        type: "booked",
      });
    }

    // Try to lock seats
    const lockResult = await lockSeats(showId, seats, userId);
    if (!lockResult.success) {
      return res.status(409).json({
        message: `Seats ${lockResult.conflicts.join(
          ", "
        )} are currently selected`,
        conflicts: lockResult.conflicts,
        type: "locked",
      });
    }

    emitToUsers("seats-selected", { showId, seats, userId });
    res.json({ success: true, seats, expiresIn: 30 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const releaseSeats = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userId = req.user?.id || req.user?._id || `guest_${Date.now()}`;

    if (!showId || !seats?.length) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const released = await unlockSeats(showId, seats, userId);
    res.json({ success: true, released });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail =
      req.user?.email || req.user?.emailAddresses?.[0]?.emailAddress;

    if (!userId) {
      console.log("No user ID found in request");
      return res.status(401).json({ message: "Authentication required" });
    }

    console.log("Fetching bookings for user:", {
      userId,
      userEmail,
      fullUser: req.user,
    });

    // First, let's see all bookings to debug
    const allBookings = await Booking.find({}).limit(5);
    console.log(
      "Sample bookings in DB:",
      allBookings.map((b) => ({
        id: b._id,
        user: b.user,
        userDetails: b.userDetails,
        bookingId: b.bookingId,
      }))
    );

    const query = {
      $or: [
        { "userDetails.clerkId": userId },
        { "userDetails.email": userEmail },
        { user: userId },
      ],
    };

    console.log("Query:", JSON.stringify(query, null, 2));

    const bookings = await Booking.find(query)
      .populate({
        path: "show",
        populate: [
          {
            path: "movie",
            select: "title poster duration isActive genre rating",
            match: null, // Show all movies regardless of active status
          },
          { path: "theater", select: "name location city" },
        ],
      })
      .sort({ bookingDate: -1 });

    console.log("Found bookings:", bookings.length);
    console.log(
      "Booking details:",
      bookings.map((b) => ({
        id: b._id,
        user: b.user,
        userDetails: b.userDetails,
        movieTitle: b.show?.movie?.title,
      }))
    );

    res.json(bookings);
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate("user", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    emitToUsers("booking-status-updated", { bookingId: booking._id, status });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("show");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user owns this booking or is admin
    const userId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === "admin" || req.user?.isAdmin;

    if (userId && booking.user.toString() !== userId.toString() && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this booking" });
    }

    // Check if show is in the past
    const showDateTime = new Date(booking.show?.showDate || booking.showDate);
    const showTime = booking.show?.showTime || booking.showTime;
    if (showTime) {
      const [hours, minutes] = showTime.split(":");
      showDateTime.setHours(parseInt(hours), parseInt(minutes));
    }

    const now = new Date();
    const isPastShow = showDateTime.getTime() < now.getTime();

    if (isPastShow) {
      return res.status(400).json({
        message:
          "Cannot cancel booking for past shows. You can only view details.",
        isPastShow: true,
      });
    }

    const timeDiff = showDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    if (hoursDiff < 2) {
      return res.status(400).json({
        message: "Cannot cancel booking less than 2 hours before show time",
      });
    }

    // Free up the seats only if show exists and is not past
    if (booking.show) {
      const show = await Show.findById(booking.show._id);
      if (show) {
        show.bookedSeats = show.bookedSeats.filter(
          (seat) => !booking.seats.includes(seat)
        );
        show.availableSeats += booking.seats.length;
        await show.save();
      }
    }

    // Update booking status instead of deleting
    booking.status = "cancelled";
    booking.updatedAt = new Date();
    await booking.save();

    emitToUsers("booking-cancelled", { bookingId: req.params.id });
    res.json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("show");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Free up the seats
    const show = await Show.findById(booking.show._id);
    show.bookedSeats = show.bookedSeats.filter(
      (seat) => !booking.seats.includes(seat)
    );
    show.availableSeats += booking.seats.length;
    await show.save();

    await Booking.findByIdAndDelete(req.params.id);

    emitToUsers("booking-deleted", { bookingId: req.params.id });
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to check if a show is in the past
const isPastShow = (showDate, showTime) => {
  const showDateTime = new Date(showDate);
  if (showTime) {
    const [hours, minutes] = showTime.split(":");
    showDateTime.setHours(parseInt(hours), parseInt(minutes));
  }
  return showDateTime.getTime() < new Date().getTime();
};

// New endpoint to delete past show bookings in bulk
const deletePastShowBookings = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const pastBookings = await Booking.find({
      $or: [{ showDate: { $lt: cutoffDate } }, { show: { $exists: true } }],
    }).populate("show");

    const bookingsToDelete = pastBookings.filter((booking) => {
      const showDate = booking.show?.showDate || booking.showDate;
      const showTime = booking.show?.showTime || booking.showTime;
      return isPastShow(showDate, showTime);
    });

    const deletedIds = bookingsToDelete.map((b) => b._id);
    await Booking.deleteMany({ _id: { $in: deletedIds } });

    res.json({
      message: `Deleted ${deletedIds.length} past show bookings`,
      deletedCount: deletedIds.length,
      cutoffDate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLockedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const userId = req.user?.id || req.user?._id;

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    const { lockedByOthers, lockedByMe } = await getLockedSeatsData(
      showId,
      userId
    );

    res.json({
      showId,
      bookedSeats: show.bookedSeats || [],
      lockedByOthers,
      lockedByMe,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  getUserBookings,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  deletePastShowBookings,
  selectSeats,
  releaseSeats,
  getLockedSeats,
  clearUserLocks,
  isPastShow,
};
