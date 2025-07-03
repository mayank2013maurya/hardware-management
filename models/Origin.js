import mongoose from 'mongoose';

const originSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Origin name is required'],
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  }
}, {
});

export default mongoose.model('Origin', originSchema); 