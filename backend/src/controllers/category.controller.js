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
        let: { categoryObjectId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$categoryId', '$$categoryObjectId'] },
                  { $in: ['$$categoryObjectId', { $ifNull: ['$categoryIds', []] }] }
                ]
              }
            }
          }
        ],
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

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, categoryId, description } = req.body;

  const category = await Category.findByIdAndUpdate(
    id,
    { name, categoryId, description },
    { new: true, runValidators: true }
  );

  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  res.json(category);
});
