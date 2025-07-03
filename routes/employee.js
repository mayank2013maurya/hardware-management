import express from 'express';
import Employee from '../models/Employee.js';
import Hardware from '../models/Hardware.js';
import Department from '../models/Department.js';
import Deploy from '../models/Deploy.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /employee/add - Show add employee form
router.get('/add', async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        
        res.render('employee/add-employee', { 
            title: 'Add Employee - Hardware Management App',
            departments: departments
        });
    } catch (error) {
        console.error('Error loading employee form:', error);
        req.flash('error', 'Failed to load employee form');
        res.redirect('/employee/view');
    }
});

// POST /employee/add - Create new employee
router.post('/add', async (req, res) => {
    try {
        const { 
            name, 
            employee_id, 
            email, 
            phone, 
            department_id, 
            position 
        } = req.body;

        const employee = new Employee({
            name,
            employeeId: employee_id,
            email,
            phone,
            department: department_id,
            position
        });

        await employee.save();
        req.flash('success', 'Employee added successfully!');
        res.redirect('/employee/view');
    } catch (error) {
        console.error('Error creating employee:', error);
        req.flash('error', 'Failed to create employee. Please try again.');
        res.redirect('/employee/add');
    }
});

// GET /employee/view - View all employees
router.get('/view', async (req, res) => {
    try {
        const employees = await Employee.find()
            .populate('department', 'name')
            .sort({ name: 1 });

        res.render('employee/view-employees', { 
            title: 'View Employees - Hardware Management App',
            employees: employees
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).render('error', { 
            title: 'Error - Hardware Management App',
            message: 'Failed to load employees'
        });
    }
});

// GET /employee/assign/:id - Show assign hardware form
router.get('/assign/:id', async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id).populate('department', 'name');
        if (!employee) {
            req.flash('error', 'Employee not found');
            return res.redirect('/employee/view');
        }

        // Get available hardware (deployed to employee's department and not assigned to any employee)
        const deployedHardware = await Deploy.find({ 
            department: employee.department._id, 
            status: 'active' 
        }).populate('hardware');
        
        const assignedHardwareIds = employee.assignments
            .filter(assignment => assignment.status === 'active')
            .map(assignment => assignment.hardware.toString());
        
        const availableHardware = deployedHardware
            .filter(deployment => !assignedHardwareIds.includes(deployment.hardware._id.toString()))
            .map(deployment => deployment.hardware);

        res.render('employee/assign-hardware', { 
            title: 'Assign Hardware - Hardware Management App',
            employee: employee,
            hardware: availableHardware
        });
    } catch (error) {
        console.error('Error loading assignment form:', error);
        req.flash('error', 'Failed to load assignment form');
        res.redirect('/employee/view');
    }
});

// POST /employee/assign/:id - Assign hardware to employee
router.post('/assign/:id', async (req, res) => {
    try {
        const { hardware_id, assignment_date, expected_return_date, notes } = req.body;
        
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            req.flash('error', 'Employee not found');
            return res.redirect('/employee/view');
        }

        // Find the deployment for this hardware
        const deployment = await Deploy.findOne({ 
            hardware: hardware_id, 
            status: 'active' 
        });
        
        if (!deployment) {
            req.flash('error', 'Hardware is not deployed');
            return res.redirect('/employee/assign/' + req.params.id);
        }

        // Check if hardware is already assigned to this employee
        const existingAssignment = employee.assignments.find(
            assignment => assignment.hardware.toString() === hardware_id && assignment.status === 'active'
        );
        
        if (existingAssignment) {
            req.flash('error', 'This hardware is already assigned to this employee');
            return res.redirect('/employee/assign/' + req.params.id);
        }

        // Add assignment to employee
        employee.assignments.push({
            hardware: hardware_id,
            deployment: deployment._id,
            assignmentDate: new Date(assignment_date),
            expectedReturnDate: expected_return_date ? new Date(expected_return_date) : undefined,
            status: 'active',
            notes: notes
        });

        await employee.save();

        req.flash('success', 'Hardware assigned successfully!');
        res.redirect('/employee/view/' + req.params.id);
    } catch (error) {
        console.error('Error assigning hardware:', error);
        req.flash('error', 'Failed to assign hardware. Please try again.');
        res.redirect('/employee/assign/' + req.params.id);
    }
});

// GET /employee/view/:id - View single employee details
router.get('/view/:id', async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate('department', 'name')
            .populate({
                path: 'assignments.hardware',
                populate: [
                    { path: 'type', select: 'name' },
                    { path: 'make', select: 'name' }
                ]
            });
            
        if (!employee) {
            req.flash('error', 'Employee not found');
            return res.redirect('/employee/view');
        }
        
        res.render('employee/view-employee', { 
            title: 'Employee Details - Hardware Management App',
            employee: employee
        });
    } catch (error) {
        console.error('Error fetching employee:', error);
        req.flash('error', 'Failed to load employee');
        res.redirect('/employee/view');
    }
});

// GET /employee/return/:employeeId/:assignmentIndex - Show return confirmation
router.get('/return/:employeeId/:assignmentIndex', async (req, res) => {
    try {
        const { employeeId, assignmentIndex } = req.params;
        
        const employee = await Employee.findById(employeeId)
            .populate('department', 'name')
            .populate({
                path: 'assignments.hardware',
                populate: [
                    { path: 'type', select: 'name' },
                    { path: 'make', select: 'name' }
                ]
            });
            
        if (!employee) {
            req.flash('error', 'Employee not found');
            return res.redirect('/employee/view');
        }
        
        const assignment = employee.assignments[assignmentIndex];
        if (!assignment || assignment.status === 'returned') {
            req.flash('error', 'Assignment not found or already returned');
            return res.redirect('/employee/view/' + employeeId);
        }
        
        res.render('employee/return-hardware', { 
            title: 'Return Hardware - Hardware Management App',
            employee: employee,
            assignment: assignment,
            assignmentIndex: assignmentIndex
        });
    } catch (error) {
        console.error('Error fetching assignment:', error);
        req.flash('error', 'Failed to load assignment');
        res.redirect('/employee/view');
    }
});

// POST /employee/return/:employeeId/:assignmentIndex - Process return
router.post('/return/:employeeId/:assignmentIndex', async (req, res) => {
    try {
        const { employeeId, assignmentIndex } = req.params;
        const { return_notes } = req.body;
        
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            req.flash('error', 'Employee not found');
            return res.redirect('/employee/view');
        }
        
        const assignment = employee.assignments[assignmentIndex];
        if (!assignment || assignment.status === 'returned') {
            req.flash('error', 'Assignment not found or already returned');
            return res.redirect('/employee/view/' + employeeId);
        }

        // Update assignment status
        assignment.status = 'returned';
        assignment.actualReturnDate = new Date();
        assignment.notes = assignment.notes ? `${assignment.notes}\n\nReturned: ${return_notes || 'Hardware returned'}` : 
                          `Returned: ${return_notes || 'Hardware returned'}`;
        
        await employee.save();

        req.flash('success', 'Hardware returned successfully!');
        res.redirect('/employee/view/' + employeeId);
    } catch (error) {
        console.error('Error returning hardware:', error);
        req.flash('error', 'Failed to return hardware. Please try again.');
        res.redirect('/employee/view');
    }
});

export default router; 