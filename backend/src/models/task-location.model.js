import mongoose from 'mongoose';

// Har zipcode ke andar prices ka structure
const zipcodepriceSchema = new mongoose.Schema(
  {
    zipcode:   { type: String, trim: true },
    isChecked: { type: Boolean, default: false },
    prices: {
      leads:          { type: Number, default: 0 },
      warm_transfers: { type: Number, default: 0 },
      inbounds:       { type: Number, default: 0 }
    }
  },
  { versionKey: false }
);

// Main schema
const taskLocationSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required']
    },
    location:  { type: String, trim: true },
    city:      { type: String, trim: true },
    state:     { type: String, trim: true },
    country:   { type: String, trim: true, default: null },
    zipcode:   { type: String, trim: true, default: '' },
    type:      { type: String, trim: true }, // "city", "state", etc.
    isChecked: { type: Boolean, default: false },
    prices: {
      leads:          { type: Number, default: 0 },
      warm_transfers: { type: Number, default: 0 },
      inbounds:       { type: Number, default: 0 }
    },
    service_area_zipcodes: [zipcodepriceSchema]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const TaskLocation = mongoose.model('TaskLocation', taskLocationSchema);