const Movie = require("../models/Movie");
const { emitToUsers } = require("../middleware/realtime");

// Auto-update coming soon movies to now showing based on start date
const updateComingSoonMovies = async () => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Update all movies with start dates
    const movies = await Movie.find({ 
      startDate: { $exists: true, $ne: null },
      isActive: true 
    });
    let updatedCount = 0;
    
    for (const movie of movies) {
      if (!movie.startDate) continue;
      
      const startDate = new Date(movie.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const shouldBeUpcoming = startDate > currentDate;
      
      // Also check if movie should be deactivated based on end date
      let shouldBeActive = true;
      if (movie.endDate) {
        const endDate = new Date(movie.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        shouldBeActive = currentDate <= endDate;
      }
      
      const needsUpdate = movie.isUpcoming !== shouldBeUpcoming || (movie.isActive && !shouldBeActive);
      
      if (needsUpdate) {
        const updateFields = { isUpcoming: shouldBeUpcoming };
        if (!shouldBeActive) {
          updateFields.isActive = false;
        }
        
        await Movie.updateOne({ _id: movie._id }, updateFields);
        updatedCount++;
        console.log(`Updated ${movie.title}: upcoming ${movie.isUpcoming} -> ${shouldBeUpcoming}${!shouldBeActive ? ', deactivated' : ''}`);
        
        // If movie became inactive, delete its shows
        if (!shouldBeActive && movie.isActive) {
          const Show = require('../models/Show');
          await Show.deleteMany({ movie: movie._id });
          console.log(`Deleted shows for expired movie: ${movie.title}`);
        }
      }
    }
    
    if (updatedCount > 0) {
      console.log(`Updated ${updatedCount} movies status`);
      emitToUsers("movies-updated", { type: "status-update", count: updatedCount });
    }
    
    return updatedCount;
  } catch (error) {
    console.error('Error updating movies status:', error);
    return 0;
  }
};

// Run update every hour
setInterval(updateComingSoonMovies, 60 * 60 * 1000);
// Run immediately on startup
setTimeout(updateComingSoonMovies, 5000);

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
    console.log('Create movie request body:', req.body);
    console.log('Create movie file:', req.file);
    
    const movieData = { ...req.body };
    
    // Validate dates - cannot be before current date
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    if (movieData.startDate) {
      const startDate = new Date(movieData.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate < currentDate) {
        return res.status(400).json({ 
          message: 'Start date cannot be before current date',
          field: 'startDate'
        });
      }
    }
    
    if (movieData.endDate) {
      const endDate = new Date(movieData.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < currentDate) {
        return res.status(400).json({ 
          message: 'End date cannot be before current date',
          field: 'endDate'
        });
      }
    }
    
    if (movieData.startDate && movieData.endDate) {
      const startDate = new Date(movieData.startDate);
      const endDate = new Date(movieData.endDate);
      if (endDate <= startDate) {
        return res.status(400).json({ 
          message: 'End date must be after start date',
          field: 'endDate'
        });
      }
    }
    
    // Handle poster upload/URL
    if (req.file) {
      // Convert uploaded file to base64 for cloud deployment
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      movieData.poster = base64Image;
      console.log('File uploaded and converted to base64');
    } else if (movieData.poster && (movieData.poster.startsWith('http://') || movieData.poster.startsWith('https://'))) {
      console.log('Using URL:', movieData.poster);
    } else {
      delete movieData.poster;
    }
    
    // Set defaults for required fields if missing
    if (!movieData.description) movieData.description = '';
    if (!movieData.duration) movieData.duration = 120;
    if (!movieData.language) movieData.language = 'English';
    if (!movieData.releaseDate) movieData.releaseDate = new Date();

    if (movieData.genre && typeof movieData.genre === "string") {
      movieData.genre = movieData.genre.split(",").map((g) => g.trim());
    }

    // Handle cast data with images
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
        movieData.cast = movieData.cast.map((castMember, index) => {
          let imageUrl = castMember.image;
          
          // Check if there's an uploaded file for this cast member
          const castImageFile = req.files && req.files[`castImage_${castMember.imageIndex || index}`];
          if (castImageFile) {
            // Convert uploaded cast image to base64
            imageUrl = `data:${castImageFile.mimetype};base64,${castImageFile.buffer.toString('base64')}`;
            console.log(`Converted cast image ${index} to base64`);
          }
          
          return {
            name: castMember.name,
            image: imageUrl || null,
            role: castMember.role || "",
          };
        });
      }
    }

    // Handle isUpcoming flag automatically based on showing period start date
    if (movieData.startDate) {
      const startDate = new Date(movieData.startDate);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate > currentDate) {
        movieData.isUpcoming = true;
        console.log('Movie set as upcoming - showing starts in future');
      } else {
        movieData.isUpcoming = false;
        console.log('Movie set as now showing - showing starts today or already started');
      }
    } else {
      movieData.isUpcoming = movieData.isUpcoming === "true" || movieData.isUpcoming === true;
    }

    console.log("Creating movie with data:", {
      title: movieData.title,
      poster: movieData.poster,
      hasFile: !!req.file,
      fileName: req.file?.filename,
      originalName: req.file?.originalname,
      fileSize: req.file?.size,
      isUpcoming: movieData.isUpcoming,
      startDate: movieData.startDate,
      endDate: movieData.endDate,
    });

    const movie = new Movie(movieData);
    await movie.save();
    // Trigger immediate status update for new movie
    await updateComingSoonMovies();
    
    emitToUsers("movie-added", movie);
    res.status(201).json(movie);
  } catch (error) {
    console.error('Error creating movie:', error);
    res.status(500).json({ message: error.message, details: error.errors });
  }
};

// Update movie
const updateMovie = async (req, res) => {
  try {
    console.log('Update movie request body:', req.body);
    console.log('Update movie file:', req.file);
    
    const updateData = { ...req.body };
    
    // Validate dates - cannot be before current date
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    if (updateData.startDate) {
      const startDate = new Date(updateData.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate < currentDate) {
        return res.status(400).json({ 
          message: 'Start date cannot be before current date',
          field: 'startDate'
        });
      }
    }
    
    if (updateData.endDate) {
      const endDate = new Date(updateData.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < currentDate) {
        return res.status(400).json({ 
          message: 'End date cannot be before current date',
          field: 'endDate'
        });
      }
    }
    
    if (updateData.startDate && updateData.endDate) {
      const startDate = new Date(updateData.startDate);
      const endDate = new Date(updateData.endDate);
      if (endDate <= startDate) {
        return res.status(400).json({ 
          message: 'End date must be after start date',
          field: 'endDate'
        });
      }
    }
    
    // Handle poster upload/URL
    if (req.file) {
      // Convert uploaded file to base64 for cloud deployment
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      updateData.poster = base64Image;
      console.log('File uploaded and converted to base64 for update');
    } else if (updateData.poster && (updateData.poster.startsWith('http://') || updateData.poster.startsWith('https://'))) {
      console.log('Using URL for update:', updateData.poster);
    }

    if (updateData.genre && typeof updateData.genre === "string") {
      updateData.genre = updateData.genre.split(",").map((g) => g.trim());
    }

    // Handle cast data with images
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
        updateData.cast = updateData.cast.map((castMember, index) => {
          let imageUrl = castMember.image;
          
          // Check if there's an uploaded file for this cast member
          const castImageFile = req.files && req.files[`castImage_${castMember.imageIndex || index}`];
          if (castImageFile) {
            // Convert uploaded cast image to base64
            imageUrl = `data:${castImageFile.mimetype};base64,${castImageFile.buffer.toString('base64')}`;
            console.log(`Converted cast image ${index} to base64 for update`);
          }
          
          return {
            name: castMember.name || "",
            image: imageUrl || null,
            role: castMember.role || "",
          };
        });
      }
    }

    // Handle isUpcoming flag automatically based on showing period start date
    if (updateData.startDate) {
      const startDate = new Date(updateData.startDate);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate > currentDate) {
        updateData.isUpcoming = true;
        console.log('Movie updated as upcoming - showing starts in future');
      } else {
        updateData.isUpcoming = false;
        console.log('Movie updated as now showing - showing starts today or already started');
      }
    } else {
      updateData.isUpcoming = updateData.isUpcoming === "true" || updateData.isUpcoming === true;
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

    // Trigger immediate status update if dates were changed
    if (updateData.startDate || updateData.endDate) {
      // Manually calculate and set the status immediately
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      if (updateData.startDate) {
        const startDate = new Date(updateData.startDate);
        startDate.setHours(0, 0, 0, 0);
        updateData.isUpcoming = startDate > currentDate;
      }
      
      // Update the movie again with the correct status
      const finalMovie = await Movie.findByIdAndUpdate(
        req.params.id, 
        { isUpcoming: updateData.isUpcoming }, 
        { new: true }
      );
      
      console.log(`Movie ${finalMovie.title} updated: isUpcoming = ${finalMovie.isUpcoming}`);
      emitToUsers("movie-updated", finalMovie);
      return res.json(finalMovie);
    }
    
    emitToUsers("movie-updated", movie);
    res.json(movie);
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({ message: error.message, details: error.errors });
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
    
    // Convert uploaded file to base64 for cloud deployment
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    res.json({ success: true, imagePath: base64Image });
  } catch (error) {
    console.error('Error uploading cast image:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manual refresh movie status
const refreshMovieStatus = async (req, res) => {
  try {
    await updateComingSoonMovies();
    const movies = await Movie.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ message: 'Movie status refreshed', movies });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  uploadCastImage,
  updateComingSoonMovies,
  refreshMovieStatus
};
