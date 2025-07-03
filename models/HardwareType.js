import mongoose from 'mongoose';

const hardwareTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hardware type name is required'],
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('HardwareType', hardwareTypeSchema); 