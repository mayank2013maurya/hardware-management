import mongoose from 'mongoose';

const hardwareMakeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hardware make name is required'],
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('HardwareMake', hardwareMakeSchema); 