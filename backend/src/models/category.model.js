import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [120, 'Category name cannot exceed 120 characters']
    },
    categoryId: {
      type: String,
      trim: true,
      required: [true, 'Category ID is required']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

export const Category = mongoose.model('Category', categorySchema);
