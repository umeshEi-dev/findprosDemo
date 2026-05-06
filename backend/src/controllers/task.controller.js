import mongoose from 'mongoose';
import { Category } from '../models/category.model.js';
import { Task } from '../models/task.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const normalizeCategoryIds = (payload = {}) => {
  const fromArray = Array.isArray(payload.categoryIds) ? payload.categoryIds : [];
  const fromSingle = payload.categoryId ? [payload.categoryId] : [];
  const merged = [...fromArray, ...fromSingle]
    .map((id) => String(id || '').trim())
    .filter(Boolean);

  return [...new Set(merged)];
};

export const createTask = asyncHandler(async (req, res) => {
  const { name, description, price } = req.body;
  const categoryIds = normalizeCategoryIds(req.body);

  if (categoryIds.length === 0) {
    const error = new Error('At least one valid category is required');
    error.statusCode = 400;
    throw error;
  }

  const hasInvalidCategory = categoryIds.some((id) => !mongoose.Types.ObjectId.isValid(id));
  if (hasInvalidCategory) {
    const error = new Error('A valid category is required');
    error.statusCode = 400;
    throw error;
  }

  const matchedCategories = await Category.countDocuments({ _id: { $in: categoryIds } });

  if (matchedCategories !== categoryIds.length) {
    const error = new Error('One or more selected categories were not found');
    error.statusCode = 404;
    throw error;
  }

  const task = await Task.create({
    name,
    categoryId: categoryIds[0],
    categoryIds,
    description,
    price: {
      lead: price?.lead || '',
      call: price?.call || '',
      appointment: price?.appointment || ''
    }
  });

  const populatedTask = await task.populate([
    { path: 'categoryId', select: 'name description' },
    { path: 'categoryIds', select: 'name description' }
  ]);

  res.status(201).json(populatedTask);
});

export const getTasks = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;
  const filter = {};

  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    filter.$or = [{ categoryId }, { categoryIds: categoryId }];
  }

  const tasks = await Task.find(filter)
    .populate('categoryId', 'name description')
    .populate('categoryIds', 'name description')
    .sort({ createdAt: -1 });

  res.json(tasks);
});

export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  const categoryIds = normalizeCategoryIds(req.body);

  if (categoryIds.length === 0) {
    const error = new Error('At least one valid category is required');
    error.statusCode = 400;
    throw error;
  }

  const hasInvalidCategory = categoryIds.some((categoryId) => !mongoose.Types.ObjectId.isValid(categoryId));
  if (hasInvalidCategory) {
    const error = new Error('A valid category is required');
    error.statusCode = 400;
    throw error;
  }

  const matchedCategories = await Category.countDocuments({ _id: { $in: categoryIds } });
  if (matchedCategories !== categoryIds.length) {
    const error = new Error('One or more selected categories were not found');
    error.statusCode = 404;
    throw error;
  }

  const task = await Task.findByIdAndUpdate(
    id,
    {
      name,
      categoryId: categoryIds[0],
      categoryIds,
      description,
      price: {
        lead: price?.lead || '',
        call: price?.call || '',
        appointment: price?.appointment || ''
      }
    },
    { new: true, runValidators: true }
  ).populate([
    { path: 'categoryId', select: 'name description' },
    { path: 'categoryIds', select: 'name description' }
  ]);

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  res.json(task);
});
