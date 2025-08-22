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

// Seat locking mechanism
const seatLocks = new Map(); // showId -> { seatId: { userId, timestamp, type } }

// Function to clean expired locks for a show
const cleanExpiredLocks = (showId) => {
  const showLocks = seatLocks.get(showId) || {};
  const now = Date.now();
  let cleaned = false;

  Object.keys(showLocks).forEach((seatId) => {
    const lock = showLocks[seatId];
    // Different lock durations based on lock type
    const lockDuration =
      lock.type === "payment_cancelled"
        ? 2 * 60 * 1000 // 2 minutes for payment cancellations
        : lock.type === "booking"
        ? 5 * 60 * 1000 // 5 minutes for actual bookings
        : 1 * 60 * 1000; // 1 minute for regular selections
    
    console.log(`⏰ Checking lock expiry: seat ${seatId}, type: ${lock.type}, duration: ${lockDuration/1000}s, age: ${(now - lock.timestamp)/1000}s`);

    if (now - lock.timestamp > lockDuration) {
      delete showLocks[seatId];
      cleaned = true;
      console.log(`Auto-expired lock for seat ${seatId} in show ${showId}`);
    }
  });

  if (cleaned) {
    seatLocks.set(showId, showLocks);
    // Instead of notifying all users, we'll notify specific users about their released seats
    // This is handled in the auto-release timeout for each lock
  }

  return showLocks;
};

const lockSeats = (showId, seats, userId, lockType = "selection") => {
  // First clean any expired locks
  const showLocks = cleanExpiredLocks(showId);
  const now = Date.now();

  // Check for conflicts with existing locks
  const conflicts = [];
  const alreadyBooked = [];

  seats.forEach((seatId) => {
    // Check if seat is locked by another user
    if (showLocks[seatId] && showLocks[seatId].userId !== userId) {
      conflicts.push(seatId);
    }
  });

  if (conflicts.length > 0) {
    return { success: false, conflicts };
  }

  // Check if any seats are already booked in the database
  // This would be done in the createBooking function

  // Lock seats
  seats.forEach((seatId) => {
    showLocks[seatId] = { userId, timestamp: now, type: lockType };
  });

  seatLocks.set(showId, showLocks);

  // Set a timeout to automatically release these locks
  const timeoutDuration = lockType === "booking" ? 5 * 60 * 1000 : 60 * 1000; // 5 minutes for bookings, 1 minute for selections
  
  // Debug logging
  console.log(`🔒 Locking seats with type: ${lockType}, timeout: ${timeoutDuration/1000}s, userId: ${userId}, seats: ${seats.join(', ')}`);

  setTimeout(() => {
    const currentLocks = seatLocks.get(showId) || {};
    const expiredSeats = [];

    seats.forEach((seatId) => {
      if (
        currentLocks[seatId] &&
        currentLocks[seatId].userId === userId &&
        currentLocks[seatId].timestamp === now
      ) {
        delete currentLocks[seatId];
        expiredSeats.push(seatId);
      }
    });

    if (expiredSeats.length > 0) {
      seatLocks.set(showId, currentLocks);
      console.log(
        `Auto-released seats for user ${userId} in show ${showId}: ${expiredSeats.join(
          ", "
        )}`
      );
      // Notify only the specific user about their expired seats
      emitToUser(userId, "seats-auto-released", {
        showId,
        seats: expiredSeats,
        userId,
        message: `Your seat selection has expired. Please select seats again.`,
      });

      // Notify all users that these seats are now available
      emitToUsers("seats-available", {
        showId,
        seats: expiredSeats,
      });
    }
  }, timeoutDuration);

  return { success: true };
};

const unlockSeats = (showId, seats, userId) => {
  const showLocks = seatLocks.get(showId) || {};
  let unlocked = false;

  seats.forEach((seatId) => {
    if (showLocks[seatId] && showLocks[seatId].userId === userId) {
      delete showLocks[seatId];
      unlocked = true;
      console.log(`Unlocked seat ${seatId} for user ${userId}`);
    }
  });

  if (unlocked) {
    seatLocks.set(showId, showLocks);
    // Notify other users about the released seats
    emitToUsers("seats-released", { showId, seats, userId });
  }

  return unlocked;
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

    // Check seat locks next
    console.log(`📝 Creating booking - calling lockSeats with 'booking' type for user: ${userId}`);
    const lockResult = lockSeats(showId, seats, userId, "booking"); // Use 'booking' type for longer lock
    if (!lockResult.success) {
      // Send notification only to this specific user
      emitToUser(userId, "seat-conflict", {
        showId,
        conflicts: lockResult.conflicts,
        userId: userId, // Include userId to ensure notification is only for this user
        message: `Seats ${lockResult.conflicts.join(
          ", "
        )} are being selected by another user`,
      });
      return res.status(409).json({
        message: `Seats ${lockResult.conflicts.join(
          ", "
        )} are currently being selected by another user. Please try different seats.`,
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

    // Don't unlock seats after successful booking - they're now actually booked in the database
    // Instead, remove them from the locks map directly
    const showLocks = seatLocks.get(showId) || {};
    seats.forEach((seat) => {
      if (showLocks[seat] && showLocks[seat].userId === userId) {
        delete showLocks[seat];
      }
    });
    seatLocks.set(showId, showLocks);

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
    // Unlock seats on error
    if (req.body?.showId && req.body?.seats) {
      const userId = req.user?.id || req.user?._id || `guest_${Date.now()}`;
      unlockSeats(req.body.showId, req.body.seats, userId);
    }
    res.status(500).json({ message: error.message });
  }
};

// New endpoint to handle seat selection (temporary lock)
const selectSeats = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userId = req.user?.id || req.user?._id || `guest_${Date.now()}`;

    // First check if these seats are already booked in the database
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    // Check for already booked seats
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

    // Try to lock the seats
    const lockResult = lockSeats(showId, seats, userId);

    if (!lockResult.success) {
      // Create a clear conflict message
      const conflictMessage = `Seats ${lockResult.conflicts.join(
        ", "
      )} are currently being selected by another user`;

      // Send notification only to this specific user via socket
      emitToUser(userId, "seat-conflict", {
        showId,
        conflicts: lockResult.conflicts,
        userId: userId, // Include userId to ensure notification is only for this user
        message: conflictMessage,
      });

      // Also return the conflict in the HTTP response for immediate feedback
      return res.status(409).json({
        message: conflictMessage,
        conflicts: lockResult.conflicts,
        type: "locked",
      });
    }

    // Emit seat selection to other users
    emitToUsers("seats-selected", { showId, seats, userId });

    res.json({
      success: true,
      message: "Seats selected successfully",
      expiresIn: 60, // Tell client seats will auto-release in 60 seconds
    });
  } catch (error) {
    console.error("Error selecting seats:", error);
    res.status(500).json({ message: error.message });
  }
};

// New endpoint to release seat selection
const releaseSeats = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userId = req.user?.id || req.user?._id || `guest_${Date.now()}`;

    console.log(`Releasing seats for user ${userId}:`, seats);

    // The unlockSeats function now handles emitting the event
    const released = unlockSeats(showId, seats, userId);

    res.json({
      success: true,
      message: released
        ? "Seats released successfully"
        : "No seats were locked by this user",
      released: released,
    });
  } catch (error) {
    console.error("Release seats error:", error);
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

// Get locked seats for a show
const getLockedSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    // Clean expired locks first
    const showLocks = cleanExpiredLocks(showId);

    // Get all locked seat IDs for this show
    const lockedSeats = Object.keys(showLocks);

    res.json({
      showId,
      lockedSeats,
      count: lockedSeats.length,
    });
  } catch (error) {
    console.error("Error getting locked seats:", error);
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
  isPastShow,
};
