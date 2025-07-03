import mongoose from 'mongoose';

const deploySchema = new mongoose.Schema({
  hardware: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hardware',
    required: [true, 'Hardware is required']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  deploymentDate: {
    type: Date,
    required: [true, 'Deployment date is required'],
    default: Date.now
  },
  gatePass: {
    type: String,
    trim: true
  },
  gatePassDate: {
    type: Date
  },
  actualReturnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'pending'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Deploy', deploySchema); 