import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { TaskLocation } from '../models/task-location.model.js';

// Save karo — user ne prices fill karke submit kiya
export const createTaskLocation = asyncHandler(async (req, res) => {
  const {
    category_id,
    location,
    city,
    state,
    country,
    zipcode,
    type,
    prices,
    service_area_zipcodes
  } = req.body;

  // Validate
  if (!category_id || !mongoose.Types.ObjectId.isValid(category_id)) {
    const error = new Error('Valid category_id is required');
    error.statusCode = 400;
    throw error;
  }

  if (!location) {
    const error = new Error('Location is required');
    error.statusCode = 400;
    throw error;
  }

  const taskLocation = await TaskLocation.create({
    category_id,
    location,
    city,
    state,
    country: country || null,
    zipcode: zipcode || '',
    type,
    prices: {
      leads:          prices?.leads          || 0,
      warm_transfers: prices?.warm_transfers || 0,
      inbounds:       prices?.inbounds       || 0
    },
    service_area_zipcodes: (service_area_zipcodes || []).map(z => ({
      zipcode:   z.zipcode,
      isChecked: z.isChecked || false,
      prices: {
        leads:          z.prices?.leads          || 0,
        warm_transfers: z.prices?.warm_transfers || 0,
        inbounds:       z.prices?.inbounds       || 0
      }
    }))
  });

  res.status(201).json(taskLocation);
});

// Ek category ke saare task-locations lao
export const getTaskLocationsByCategory = asyncHandler(async (req, res) => {
  const { category_id } = req.query;

  if (!category_id || !mongoose.Types.ObjectId.isValid(category_id)) {
    const error = new Error('Valid category_id is required');
    error.statusCode = 400;
    throw error;
  }

  const taskLocations = await TaskLocation
    .find({ category_id })
    .sort({ createdAt: -1 });

  res.json(taskLocations);
});