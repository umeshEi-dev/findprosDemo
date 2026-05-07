import { asyncHandler } from '../utils/asyncHandler.js';
import { Zipcode } from '../models/zipcode.model.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getZipCodes = asyncHandler(async (req, res) => {
  const { city, state } = req.query;

  if (!city && !state) {
    const error = new Error('city or state is required');
    error.statusCode = 400;
    throw error;
  }

  const filter = {};

//   if (city) {
//     const cityValue = String(city).trim();
//     if (cityValue) {
//       filter.primary_city = cityValue;
//       // {
//       //   $regex: `^${escapeRegex(cityValue)}$`,
//       //   $options: 'i'
//       // };
//     }
//   }

  if (state) {
    const stateValue = String(state).trim().toUpperCase();
    if (stateValue) {
      filter.state = stateValue;
    }
  }
  console.log('filter', filter);
  const zipcodes = await Zipcode
    .find(filter)
    .select('zip primary_city state county')
    .sort({ zip: 1 })
    // .limit(200)
    .lean();

  console.log(zipcodes);
  res.json(zipcodes);
});





// TYPE: CITY, STATE , COUNTRY, STATE