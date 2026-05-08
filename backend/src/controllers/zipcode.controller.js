import { asyncHandler } from '../utils/asyncHandler.js';
import { Zipcode } from '../models/zipcode.model.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getZipCodes = asyncHandler(async (req, res) => {
  const { city, state } = req.query;

  if (!city && !state) {
    const error = new Error('city or state is required');
    error.statusCode = 400;
    throw error;
  }

  const filter = {};
  let hasCityFilter = false;

  if (city) {
    const cityValue = String(city).trim();
    if (cityValue) {
      filter.$or = [
        {
          primary_city: {
            $regex: `^${escapeRegex(cityValue)}$`,
            $options: 'i'
          }
        },
        {
          acceptable_cities: {
            $regex: `(^|,\\s*)${escapeRegex(cityValue)}(\\s*,|$)`,
            $options: 'i'
          }
        }
      ];
      hasCityFilter = true;
    }
  }

  if (state) {
    const stateValue = String(state).trim().toUpperCase();
    if (stateValue) {
      filter.state = stateValue;
    }
  }
  let zipcodes = await Zipcode
    .find(filter)
    .select('zip primary_city state county')
    .sort({ zip: 1 })
    .lean();

  if (hasCityFilter && state && zipcodes.length === 0) {
    const stateOnlyFilter = { ...filter };
    delete stateOnlyFilter.$or;

    zipcodes = await Zipcode
      .find(stateOnlyFilter)
      .select('zip primary_city state county')
      .sort({ zip: 1 })
      .lean();
  }

  res.json(zipcodes);
});
