const Movie = require("../models/Movie");
const { emitToUsers } = require("../middleware/realtime");

// Get all movies
const getAllMovies = async (req, res) => {
  try {
    // Include showExpired query parameter to optionally show expired movies
    const { showExpired, isAdmin } = req.query;
    // Only show expired movies if explicitly requested by admin
    const query =
      showExpired === "true" || isAdmin === "true" ? {} : { isActive: true };
    const movies = await Movie.find(query).sort({ createdAt: -1 });

    // Get theaters for each movie from shows
    const Show = require("../models/Show");
    const Theater = require("../models/Theater");

    // Get all shows with populated theaters
    const shows = await Show.find({
      movie: { $in: movies.map((movie) => movie._id) },
    }).populate("theater");

    // Group theaters by movie
    const movieTheaters = {};
    shows.forEach((show) => {
      if (show.theater && show.movie) {
        const movieId = show.movie.toString();
        if (!movieTheaters[movieId]) {
          movieTheaters[movieId] = [];
        }
        // Add theater if not already in the array
        const theaterExists = movieTheaters[movieId].some(
          (t) => t._id.toString() === show.theater._id.toString()
        );
        if (!theaterExists) {
          movieTheaters[movieId].push(show.theater);
        }
      }
    });

    // Add theaters to each movie
    const moviesWithTheaters = movies.map((movie) => {
      const movieObj = movie.toObject();
      movieObj.theaters = movieTheaters[movie._id.toString()] || [];
      return movieObj;
    });

    res.json(moviesWithTheaters);
  } catch (error) {
    console.error("Error fetching movies with theaters:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get movie by ID
const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findOne({ _id: req.params.id, isActive: true });
    if (!movie) {
      return res
        .status(404)
        .json({ message: "Movie not found or no longer available" });
    }

    // Get theaters for this movie from shows
    const Show = require("../models/Show");
    const shows = await Show.find({ movie: movie._id }).populate("theater");

    // Extract unique theaters
    const theaters = [];
    const theaterIds = new Set();
    shows.forEach((show) => {
      if (show.theater && !theaterIds.has(show.theater._id.toString())) {
        theaters.push(show.theater);
        theaterIds.add(show.theater._id.toString());
      }
    });

    // Add theaters to movie object
    const movieWithTheaters = movie.toObject();
    movieWithTheaters.theaters = theaters;

    res.json(movieWithTheaters);
  } catch (error) {
    console.error("Error fetching movie with theaters:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create movie
const createMovie = async (req, res) => {
  try {
    const movieData = { ...req.body };
    if (req.file) {
      movieData.poster = `/uploads/${req.file.filename}`;
      console.log('File uploaded:', req.file.filename);
    } else if (movieData.poster && (movieData.poster.startsWith('http://') || movieData.poster.startsWith('https://'))) {
      // Keep the URL as is if it's a full URL
      console.log('Using URL:', movieData.poster);
    } else {
      // Clear poster if no valid input
      delete movieData.poster;
    }

    if (movieData.genre && typeof movieData.genre === "string") {
      movieData.genre = movieData.genre.split(",").map((g) => g.trim());
    }

    // Handle cast data
    if (movieData.cast) {
      // If cast is a string, try to parse it
      if (typeof movieData.cast === "string") {
        try {
          movieData.cast = JSON.parse(movieData.cast);
        } catch (e) {
          console.error("Error parsing cast data:", e);
          throw new Error("Invalid cast data format");
        }
      }

      // Handle cast images properly
      if (Array.isArray(movieData.cast)) {
        movieData.cast = movieData.cast.map((castMember) => ({
          name: castMember.name,
          image: castMember.image || null,
          role: castMember.role || "",
        }));
      }
    }

    // Handle isUpcoming flag
    if (movieData.isUpcoming === "true" || movieData.isUpcoming === true) {
      movieData.isUpcoming = true;
    } else {
      movieData.isUpcoming = false;
    }

    console.log("Creating movie with data:", {
      title: movieData.title,
      poster: movieData.poster,
      hasFile: !!req.file,
      isUpcoming: movieData.isUpcoming,
      startDate: movieData.startDate,
      endDate: movieData.endDate,
    });

    const movie = new Movie(movieData);
    await movie.save();
    emitToUsers("movie-added", movie);
    res.status(201).json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update movie
const updateMovie = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.poster = `/uploads/${req.file.filename}`;
      console.log('File uploaded for update:', req.file.filename);
    } else if (updateData.poster && (updateData.poster.startsWith('http://') || updateData.poster.startsWith('https://'))) {
      // Keep the URL as is if it's a full URL
      console.log('Using URL for update:', updateData.poster);
    }

    if (updateData.genre && typeof updateData.genre === "string") {
      updateData.genre = updateData.genre.split(",").map((g) => g.trim());
    }

    // Handle cast data
    if (updateData.cast) {
      // If cast is a string, try to parse it
      if (typeof updateData.cast === "string") {
        try {
          updateData.cast = JSON.parse(updateData.cast);
        } catch (e) {
          console.error("Error parsing cast data:", e);
          throw new Error("Invalid cast data format");
        }
      }

      // Handle cast images properly
      if (Array.isArray(updateData.cast)) {
        updateData.cast = updateData.cast.map((castMember) => ({
          name: castMember.name || "",
          image: castMember.image || null,
          role: castMember.role || "",
        }));
      }
    }

    // Handle isUpcoming flag
    if (updateData.isUpcoming === "true" || updateData.isUpcoming === true) {
      updateData.isUpcoming = true;
    } else {
      updateData.isUpcoming = false;
    }

    console.log("Updating movie with data:", {
      id: req.params.id,
      isUpcoming: updateData.isUpcoming,
      startDate: updateData.startDate,
      endDate: updateData.endDate,
      isActive: updateData.isActive,
      isActiveType: typeof updateData.isActive,
    });

    // Check if movie is being marked as inactive
    const isBeingDeactivated =
      updateData.isActive === false || updateData.isActive === "false";

    const movie = await Movie.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // If movie is being marked as inactive, delete all related shows
    if (isBeingDeactivated) {
      const Show = require("../models/Show");
      console.log(
        `Attempting to delete shows for movie ${req.params.id} (isActive=${updateData.isActive})`
      );
      try {
        // First check how many shows exist for this movie
        const showCount = await Show.countDocuments({ movie: req.params.id });
        console.log(
          `Found ${showCount} shows for movie ${req.params.id} before deletion`
        );

        // Delete the shows
        const result = await Show.deleteMany({ movie: req.params.id });
        console.log(
          `Deleted ${result.deletedCount} shows for expired movie ${req.params.id}`
        );

        // Verify deletion
        const remainingShows = await Show.countDocuments({
          movie: req.params.id,
        });
        console.log(`Remaining shows after deletion: ${remainingShows}`);
      } catch (deleteError) {
        console.error(
          `Error deleting shows for movie ${req.params.id}:`,
          deleteError
        );
      }
    }

    emitToUsers("movie-updated", movie);
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete movie
const deleteMovie = async (req, res) => {
  try {
    // Check if movie exists first
    const existingMovie = await Movie.findById(req.params.id);
    if (!existingMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Delete all related shows first
    const Show = require("../models/Show");
    const Booking = require("../models/Booking");
    
    console.log(`Attempting to delete movie ${req.params.id} and all related data`);
    
    try {
      // First, cancel all bookings for shows of this movie
      const shows = await Show.find({ movie: req.params.id });
      const showIds = shows.map(show => show._id);
      
      if (showIds.length > 0) {
        // Update bookings to cancelled status
        const bookingUpdateResult = await Booking.updateMany(
          { show: { $in: showIds } },
          { status: 'cancelled' }
        );
        console.log(`Updated ${bookingUpdateResult.modifiedCount} bookings to cancelled status`);
      }
      
      // Delete all shows for this movie
      const showDeleteResult = await Show.deleteMany({ movie: req.params.id });
      console.log(`Deleted ${showDeleteResult.deletedCount} shows for movie ${req.params.id}`);
      
    } catch (deleteError) {
      console.error(`Error deleting related data for movie ${req.params.id}:`, deleteError);
      return res.status(500).json({ 
        message: "Error deleting related data", 
        error: deleteError.message 
      });
    }

    // Now delete the movie itself (hard delete)
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
    
    if (!deletedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    console.log(`Successfully deleted movie ${req.params.id}`);
    emitToUsers("movie-deleted", { id: req.params.id });
    res.json({ 
      message: "Movie and all related data deleted successfully",
      deletedMovie: deletedMovie.title
    });
  } catch (error) {
    console.error(`Error deleting movie ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
};

// Soft delete movie (mark as inactive)
const softDeleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Delete all related shows
    const Show = require("../models/Show");
    console.log(`Soft deleting movie ${req.params.id} - marking as inactive`);
    
    try {
      const showDeleteResult = await Show.deleteMany({ movie: req.params.id });
      console.log(`Deleted ${showDeleteResult.deletedCount} shows for inactive movie ${req.params.id}`);
    } catch (deleteError) {
      console.error(`Error deleting shows for movie ${req.params.id}:`, deleteError);
    }

    emitToUsers("movie-updated", movie);
    res.json({ message: "Movie marked as inactive successfully", movie });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check movie status based on shows - but don't automatically deactivate
const checkMovieStatus = async (movieId) => {
  try {
    const Show = require("../models/Show");

    // Count remaining shows for this movie
    const remainingShowsCount = await Show.countDocuments({ movie: movieId });

    // Just log the status but don't deactivate automatically
    if (remainingShowsCount === 0) {
      console.log(
        `Movie ${movieId} has no remaining shows but will remain active`
      );
    }

    return false; // Always return false to indicate movie was not deactivated
  } catch (error) {
    console.error(`Error checking movie status for ${movieId}:`, error);
    return false;
  }
};

// Upload cast image
const uploadCastImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    
    // Return the path to the uploaded image
    const imagePath = `/uploads/${req.file.filename}`;
    res.json({ success: true, imagePath });
  } catch (error) {
    console.error('Error uploading cast image:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  softDeleteMovie,
  checkMovieStatus,
  uploadCastImage
};
