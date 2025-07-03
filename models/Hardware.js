import mongoose from 'mongoose';

const locationHistorySchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const hardwareSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true
  },
  gatePass: {
    type: String,
    trim: true
  },
  gatePassDate: {
    type: Date
  },
  hardwareDate: {
    type: Date,
    required: [true, 'Hardware date is required']
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HardwareType',
    required: true
  },
  make: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HardwareMake',
    required: true
  },
  originDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  lastAction: {
    typeOfAction: {
        type: String,
        enum: ['deployed', 'received', 'disposed', 'updated'],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    notes: {
        type: String,
        trim: true
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Lost', 'Damaged', 'Maintenance'],
    default: 'Active'
  },
  locationHistory: [locationHistorySchema]
}, {
});

export default mongoose.model('Hardware', hardwareSchema); 