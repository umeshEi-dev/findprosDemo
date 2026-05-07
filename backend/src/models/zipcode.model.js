import mongoose from 'mongoose';

const zipcodeSchema = new mongoose.Schema(
  {
    zip: { type: String, trim: true },
    primary_city: { type: String, trim: true },
    state: { type: String, trim: true, uppercase: true },
    county: { type: String, trim: true },
    country: { type: String, trim: true },
    timezone: { type: String, trim: true },
    approximate_latitude: { type: String, trim: true },
    approximate_longitude: { type: String, trim: true }
  },
  {
    collection: 'zipcodes',
    timestamps: true,
    versionKey: false
  }
);

export const Zipcode = mongoose.model('Zipcode', zipcodeSchema);
