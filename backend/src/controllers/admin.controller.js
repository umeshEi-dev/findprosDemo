import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPendingUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({ status: 'pending' })
    .select('_id name email role status firstName lastName phone companyName businessAddress city state zipcode serviceAreas categories createdAt')
    .sort({ createdAt: -1 });

  res.json(users);
});

export const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.status = 'active';
  await user.save();

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  });
});
