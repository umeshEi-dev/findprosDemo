import mongoose from 'mongoose';

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/findpros';

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
};
