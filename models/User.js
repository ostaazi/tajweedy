import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['trainee', 'teacher', 'admin'], 
    default: 'trainee' 
  },
  progress: {
    totalVerses: { type: Number, default: 0 },
    completedQuizzes: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
