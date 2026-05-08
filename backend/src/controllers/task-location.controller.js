import mongoose from 'mongoose';
import { TaskLocation } from '../models/task-location.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const normalizePrices = (prices = {}) => ({
  leads: prices?.leads || 0,
  warm_transfers: prices?.warm_transfers || 0,
  inbounds: prices?.inbounds || 0
});

const normalizeZipcodes = (zipcodes = []) => zipcodes.map((z) => ({
  zipcode: z.zipcode,
  isChecked: z.isChecked || false,
  prices: normalizePrices(z.prices)
}));

const normalizeTaskLocation = (payload, fallbackCategoryId) => {
  const categoryId = payload.category_id || fallbackCategoryId;

  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error('Valid category_id is required');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.location) {
    const error = new Error('Location is required');
    error.statusCode = 400;
    throw error;
  }

  return {
    category_id: categoryId,
    location: payload.location,
    city: payload.city,
    state: payload.state,
    country: payload.country || null,
    zipcode: payload.zipcode || '',
    type: payload.type,
    isChecked: payload.isChecked || false,
    prices: normalizePrices(payload.prices),
    service_area_zipcodes: normalizeZipcodes(payload.service_area_zipcodes || [])
  };
};

export const createTaskLocation = asyncHandler(async (req, res) => {
  const { category_id, locations } = req.body;

  if (Array.isArray(locations) && locations.length > 0) {
    const taskLocations = await TaskLocation.insertMany(
      locations.map((location) => normalizeTaskLocation(location, category_id))
    );

    res.status(201).json(taskLocations);
    return;
  }

  const taskLocation = await TaskLocation.create(normalizeTaskLocation(req.body));

  res.status(201).json(taskLocation);
});

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
