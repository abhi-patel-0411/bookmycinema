const Theater = require('../models/Theater');
const { emitToUsers } = require('../middleware/realtime');

// Get all theaters with advanced filtering
const getAllTheaters = async (req, res) => {
  try {
    const { 
      city, 
      search, 
      page = 1, 
      limit = 10, 
      sortBy = 'name', 
      sortOrder = 'asc',
      isActive = true,
      screenType,
      minCapacity,
      maxCapacity,
      amenities,
      verified
    } = req.query;
    
    // Build query
    const query = {};
    
    if (isActive !== undefined && isActive !== 'undefined') {
      const activeValue = isActive === 'true' || isActive === true;
      query.$or = [
        { 'status.isActive': activeValue },
        { 'isActive': activeValue }
      ];
    }
    
    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { 'address.area': new RegExp(search, 'i') },
        { 'address.landmark': new RegExp(search, 'i') }
      ];
    }
    
    if (screenType) {
      query['screens.screenType'] = screenType;
    }
    
    if (minCapacity || maxCapacity) {
      query.totalCapacity = {};
      if (minCapacity) query.totalCapacity.$gte = parseInt(minCapacity);
      if (maxCapacity) query.totalCapacity.$lte = parseInt(maxCapacity);
    }
    
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      query.amenities = { $in: amenityList.map(a => new RegExp(a, 'i')) };
    }
    
    if (verified !== undefined) {
      query['status.isVerified'] = verified === 'true';
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [theaters, total] = await Promise.all([
      Theater.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Theater.countDocuments(query)
    ]);
    
    // For backward compatibility, also return theaters directly
    const response = {
      theaters,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    };
    
    // If no pagination requested, return theaters directly
    // If the query parameter limit is set to 1000, the API treats this as a special value meaning "return all theaters (skip pagination)".
    if (limit === '1000' || !page) {
      return res.json(theaters);
    }
    
    res.json(response);
  } catch (error) {
    console.error('Get theaters error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get theater by ID
const getTheaterById = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    res.json(theater);
  } catch (error) {
    console.error('Get theater by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create theater
const createTheater = async (req, res) => {
  try {
    const theaterData = { ...req.body };
    
    // Handle amenities
    if (theaterData.amenities && typeof theaterData.amenities === 'string') {
      theaterData.amenities = theaterData.amenities.split(',').map(a => a.trim());
    }
    
    const theater = new Theater(theaterData);
    await theater.save();
    
    emitToUsers('theater-added', theater);
    res.status(201).json({ message: 'Theater created successfully', theater });
  } catch (error) {
    console.error('Create theater error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update theater
const updateTheater = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle amenities
    if (updateData.amenities && typeof updateData.amenities === 'string') {
      updateData.amenities = updateData.amenities.split(',').map(a => a.trim());
    }
    
    const theater = await Theater.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    
    emitToUsers('theater-updated', theater);
    res.json({ message: 'Theater updated successfully', theater });
  } catch (error) {
    console.error('Update theater error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete theater (hard delete)
const deleteTheater = async (req, res) => {
  try {
    const theater = await Theater.findByIdAndDelete(req.params.id);
    
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    
    emitToUsers('theater-deleted', { id: req.params.id });
    res.json({ message: 'Theater deleted successfully' });
  } catch (error) {
    console.error('Delete theater error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add screen with custom seat layout
const addScreen = async (req, res) => {
  try {
    console.log('Adding screen to theater:', req.params.id);
    console.log('Screen data:', req.body);
    
    const theater = await Theater.findById(req.params.id);
    if (!theater) {
      console.log('Theater not found:', req.params.id);
      return res.status(404).json({ message: 'Theater not found' });
    }
    
    const { name, capacity, screenType, soundSystem, projectionType, seatLayout } = req.body;
    
    // Calculate capacity from seat layout if provided
    let actualCapacity = capacity || 50;
    let finalSeatLayout = [];
    
    if (seatLayout && seatLayout.length > 0) {
      finalSeatLayout = seatLayout;
      actualCapacity = seatLayout.reduce((total, row) => 
        total + row.seats.filter(seat => seat !== null).length, 0
      );
    } else {
      // Generate default layout with gaps
      const rows = ['A', 'B', 'C', 'D', 'E'];
      finalSeatLayout = rows.map(row => ({
        row,
        seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10]
      }));
      actualCapacity = finalSeatLayout.reduce((total, row) => 
        total + row.seats.filter(seat => seat !== null).length, 0
      );
    }
    
    const screenData = {
      screenNumber: theater.screens.length + 1,
      name: name || `Screen ${theater.screens.length + 1}`,
      capacity: actualCapacity,
      screenType: screenType || '2D',
      soundSystem: soundSystem || 'Stereo',
      projectionType: projectionType || 'Digital',
      seatLayout: finalSeatLayout,
      isActive: true
    };
    
    console.log('Final screen data:', screenData);
    
    theater.screens.push(screenData);
    await theater.save();
    
    console.log('Screen added successfully');
    emitToUsers('screen-added', { theaterId: req.params.id, screen: screenData });
    res.status(201).json({ message: 'Screen added successfully', theater, screen: screenData });
  } catch (error) {
    console.error('Add screen error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update screen
const updateScreen = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.theaterId);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    
    const screen = theater.screens.id(req.params.screenId);
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found' });
    }
    //target,source
    Object.assign(screen, req.body);
    await theater.save();
    
    emitToUsers('screen-updated', { theaterId: req.params.theaterId, screen });
    res.json({ message: 'Screen updated successfully', theater });
  } catch (error) {
    console.error('Update screen error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete screen
const deleteScreen = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.theaterId);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    
    const screen = theater.screens.id(req.params.screenId);
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found' });
    }
    
    theater.screens.pull(req.params.screenId);
    await theater.save();
    
    emitToUsers('screen-deleted', { theaterId: req.params.theaterId, screenId: req.params.screenId });
    res.json({ message: 'Screen deleted successfully' });
  } catch (error) {
    console.error('Delete screen error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get theaters with shows
const getTheatersWithShows = async (req, res) => {
  try {
    const Show = require('../models/Show');
    const { city, search } = req.query;
    
    const theaterQuery = {
      $or: [
        { 'status.isActive': { $ne: false } },
        { 'isActive': { $ne: false } }
      ]
    };
    if (city) theaterQuery['address.city'] = { $regex: city, $options: 'i' };
    if (search) {
      theaterQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }
    
    const theaters = await Theater.find(theaterQuery).lean();
    
    const currentTime = new Date();
    const theatersWithShows = await Promise.all(
      theaters.map(async (theater) => {
        const shows = await Show.find({
          theater: theater._id,
          showDate: { $gte: currentTime.toISOString().split('T')[0] }
        })
        .populate('movie', 'title poster genre duration')
        .lean();
        
        const movieMap = {};
        shows.forEach(show => {
          if (show.movie) {
            const movieId = show.movie._id.toString();
            if (!movieMap[movieId]) {
              movieMap[movieId] = {
                ...show.movie,
                shows: []
              };
            }
            movieMap[movieId].shows.push({
              _id: show._id,
              showTime: show.showTime,
              showDate: show.showDate,
              price: show.price,
              screenNumber: show.screenNumber
            });
          }
        });
        
        return {
          ...theater,
          movies: Object.values(movieMap)
        };
      })
    );
    
    res.json(theatersWithShows);
  } catch (error) {
    console.error('Get theaters with shows error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get theater analytics
const getTheaterAnalytics = async (req, res) => {
  try {
    const analytics = await Theater.aggregate([
      { 
        $match: { 
          $or: [
            { 'status.isActive': true },
            { 'isActive': true }
          ]
        } 
      },
      {
        $group: {
          _id: null,
          totalTheaters: { $sum: 1 },
          totalScreens: { $sum: '$totalScreens' },
          totalCapacity: { $sum: '$totalCapacity' },
          avgRating: { $avg: '$ratings.average' },
          totalRevenue: { $sum: '$metadata.revenue' },
          totalBookings: { $sum: '$metadata.totalBookings' }
        }
      }
    ]);
    
    const cityStats = await Theater.aggregate([
      { 
        $match: { 
          $or: [
            { 'status.isActive': true },
            { 'isActive': true }
          ]
        } 
      },
      {
        $group: {
          _id: '$address.city',
          count: { $sum: 1 },
          totalCapacity: { $sum: '$totalCapacity' },
          avgRating: { $avg: '$ratings.average' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      overview: analytics[0] || {},
      cityStats
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Bulk update theaters
const bulkUpdateTheaters = async (req, res) => {
  try {
    const { theaterIds, updateData } = req.body;
    
    const result = await Theater.updateMany(
      { _id: { $in: theaterIds } },
      updateData
    );
    
    emitToUsers('theaters-bulk-updated', { theaterIds, updateData });
    res.json({ message: `${result.modifiedCount} theaters updated successfully` });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get nearby theaters
const getNearbyTheaters = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    const theaters = await Theater.find({
      $or: [
        { 'status.isActive': true },
        { 'isActive': true }
      ],
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000
        }
      }
    });
    
    res.json(theaters);
  } catch (error) {
    console.error('Get nearby theaters error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get screen details
const getScreen = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.theaterId);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    
    const screen = theater.screens.id(req.params.screenId);
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found' });
    }
    
    res.json(screen);
  } catch (error) {
    console.error('Get screen error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update seat layout for a screen
const updateSeatLayout = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.theaterId);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    
    const screen = theater.screens.id(req.params.screenId);
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found' });
    }
    
    const { seatLayout } = req.body;
    
    if (!seatLayout || !Array.isArray(seatLayout)) {
      return res.status(400).json({ message: 'Valid seat layout is required' });
    }
    
    // Calculate new capacity
    const newCapacity = seatLayout.reduce((total, row) => 
      total + row.seats.filter(seat => seat !== null).length, 0
    );
    
    screen.seatLayout = seatLayout;
    screen.capacity = newCapacity;
    
    await theater.save();
    
    emitToUsers('seat-layout-updated', { 
      theaterId: req.params.theaterId, 
      screenId: req.params.screenId, 
      seatLayout 
    });
    
    res.json({ message: 'Seat layout updated successfully', screen });
  } catch (error) {
    console.error('Update seat layout error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTheaters,
  getTheaterById,
  createTheater,
  updateTheater,
  deleteTheater,
  addScreen,
  updateScreen,
  deleteScreen,
  getScreen,
  updateSeatLayout,
  getTheatersWithShows,
  getTheaterAnalytics,
  bulkUpdateTheaters,
  getNearbyTheaters
};