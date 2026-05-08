import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters']
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [60, 'First name cannot exceed 60 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [60, 'Last name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is invalid']
    },
    passwordHash: {
      type: String,
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    status: {
      type: String,
      enum: ['pending', 'inactive', 'active', 'disabled'],
      default: 'active'
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone cannot exceed 30 characters']
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [120, 'Company name cannot exceed 120 characters']
    },
    businessAddress: {
      type: String,
      trim: true,
      maxlength: [200, 'Business address cannot exceed 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [80, 'City cannot exceed 80 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [80, 'State cannot exceed 80 characters']
    },
    zipcode: {
      type: String,
      trim: true,
      maxlength: [20, 'Zipcode cannot exceed 20 characters']
    },
    acceptedTerms: {
      type: Boolean,
      default: false
    },
    serviceAreas: [
      {
        locationId: { type: String, required: true },
        location: { type: String, required: true, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        mode: { type: String, enum: ['include', 'exclude'], required: true }
      }
    ],
    categories: [
      {
        categoryId: { type: String, required: true },
        name: { type: String, required: true, trim: true }
      }
    ]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);
