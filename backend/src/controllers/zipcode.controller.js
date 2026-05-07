import { asyncHandler } from "../utils/asyncHandler.js";
// import { Location } from "../models/location.model.js";

export const getZipCode = asyncHandler(async (req, res) => {
   const zipCode = [{
        city: 'Bhopal',
        state: 'MadhyaPradesh',
        country: 'India',
        ZipCode: '462001'
    },
    {
        city: 'Indore',
        state: 'MadhyaPradesh',
        country: 'India',
        ZipCode: '452001'
    },
    {
        city: 'Jabalpur',
        state: 'MadhyaPradesh',
        country: 'India',
        ZipCode: '482001'
    },
    {
        city: 'Gwalior',
        state: 'MadhyaPradesh',
        country: 'India',
        ZipCode: '474001'
    },
    {
        city: 'Ujjain',
        state: 'MadhyaPradesh',
        country: 'India',
        ZipCode: '456001'
    }
    ]
  res.json(zipCode);
});
