import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  }
}, {
  timestamps: true
});
export default mongoose.model('Department', departmentSchema); 