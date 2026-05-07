import { asyncHandler } from "../utils/asyncHandler.js";
import { Location } from "../models/location.model.js";

export const getLocation = asyncHandler(async (req, res) => {
    const { search } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { location: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ]
    }

const locations = await Location.find(filter).sort({ state: 1, city: 1 });
    res.json(locations);
});
