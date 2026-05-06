import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Task name is required'],
      trim: true,
      maxlength: [160, 'Task name cannot exceed 160 characters']
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false
    },
    categoryIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category'
        }
      ],
      default: []
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      lead: {
        type: String,
        trim: true,
        default: ''
      },
      call: {
        type: String,
        trim: true,
        default: ''
      },
      appointment: {
        type: String,
        trim: true,
        default: ''
      }
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

export const Task = mongoose.model('Task', taskSchema);
