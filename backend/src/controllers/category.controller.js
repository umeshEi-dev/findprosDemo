import { Category } from '../models/category.model.js';
import { Task } from '../models/task.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createCategory = asyncHandler(async (req, res) => {
  const { name, categoryId, description } = req.body;

  const category = await Category.create({
    name,
    categoryId,
    description
  });

  res.status(201).json(category);
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: Task.collection.name,
        localField: '_id',
        foreignField: 'categoryId',
        as: 'tasks'
      }
    },
    {
      $addFields: {
        taskCount: { $size: '$tasks' }
      }
    }
  ]);

  res.json(categories);
});
