import mongoose from 'mongoose';
import { Category } from '../models/category.model.js';
import { Task } from '../models/task.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createTask = asyncHandler(async (req, res) => {
  const { name, categoryId, description, price } = req.body;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error('A valid category is required');
    error.statusCode = 400;
    throw error;
  }

  const categoryExists = await Category.exists({ _id: categoryId });

  if (!categoryExists) {
    const error = new Error('Selected category was not found');
    error.statusCode = 404;
    throw error;
  }

  const task = await Task.create({
    name,
    categoryId,
    description,
    price: {
      lead: price?.lead || '',
      call: price?.call || '',
      appointment: price?.appointment || ''
    }
  });

  const populatedTask = await task.populate('categoryId', 'name description');

  res.status(201).json(populatedTask);
});

export const getTasks = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;
  const filter = {};

  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    filter.categoryId = categoryId;
  }

  const tasks = await Task.find(filter)
    .populate('categoryId', 'name description')
    .sort({ createdAt: -1 });

  res.json(tasks);
});
