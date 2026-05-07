import { asyncHandler } from "../utils/asyncHandler.js";
import { Location } from "../models/location.model.js";

export const getLocation = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const filter = {};

  if (search) {
    filter.$or = [
      { location:   { $regex: search, $options: 'i' } },
      { state:      { $regex: search, $options: 'i' } },
      { stateShort: { $regex: search, $options: 'i' } },
      { city:       { $regex: search, $options: 'i' } }
    ];
  }

  const rawLocations = await Location.find(filter).sort({ state: 1, city: 1 });

  // ✅ Har location ke saath type add karo
  const locations = rawLocations.map(loc => {
    const obj = loc.toObject();

    // Agar type DB mein nahi hai toh automatically decide karo
    if (!obj.type) {
      // city aur state same hain → State level
      // warna City level
      obj.type = obj.city === obj.state ? 'State' : 'City';
    }

    return obj;
  });

  res.json(locations);
});