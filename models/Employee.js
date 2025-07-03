import mongoose from 'mongoose';

const employeeAssignmentSchema = new mongoose.Schema({
  hardware: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hardware',
    required: [true, 'Hardware is required']
  },
  deployment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deploy',
    required: [true, 'Deployment is required']
  },
  assignmentDate: {
    type: Date,
    required: [true, 'Assignment date is required'],
    default: Date.now
  },
  expectedReturnDate: {
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
}, { _id: false });

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  position: {
    type: String,
    trim: true
  },
  assignments: [employeeAssignmentSchema]
}, {
  timestamps: true
});

export default mongoose.model('Employee', employeeSchema); 