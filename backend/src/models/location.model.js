import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    stateShort: {
      type: String,
      trim: true,
      uppercase: true
    },
    type: { 
      type: String, 
      trim: true, 
      default: 'City' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

export const Location = mongoose.model('Location', locationSchema);
