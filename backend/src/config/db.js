import mongoose from 'mongoose';

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb+srv://umeshexactink_db_user:a5HN5pIdCPaH8N3t@cluster1.fwy4ozw.mongodb.net/FindProsSample?retryWrites=true&w=majority';

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
};
