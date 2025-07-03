import express from 'express';
import Deploy from '../models/Deploy.js';
import Hardware from '../models/Hardware.js';
import Department from '../models/Department.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /deployment/add - Show add deployment form
router.get('/add', async (req, res) => {
    try {
        // Get available hardware (not currently deployed)
        const deployedHardware = await Deploy.find({ status: 'active' }).select('hardware');
        const deployedHardwareIds = deployedHardware.map(d => d.hardware.toString());
        
        const availableHardware = await Hardware.find({
            _id: { $nin: deployedHardwareIds },
            status: 'Active'
        }).populate('type', 'name').populate('make', 'name').populate('originDepartment', 'name');
        
        const departments = await Department.find().sort({ name: 1 });
        
        res.render('deployment/add-deployment', { 
            title: 'Add Deployment - Hardware Management App',
            hardware: availableHardware,
            departments: departments
        });
    } catch (error) {
        console.error('Error loading deployment form:', error);
        req.flash('error', 'Failed to load deployment form');
        res.redirect('/deployment/view');
    }
});

// POST /deployment/add - Create new deployment
router.post('/add', async (req, res) => {
    try {
        const { 
            hardware_id, 
            department_id, 
            deployment_date, 
            gate_pass, 
            gate_pass_date, 
            status, 
            notes 
        } = req.body;

        // Check if hardware is already deployed
        const existingDeployment = await Deploy.findOne({ 
            hardware: hardware_id, 
            status: 'active' 
        });
        
        if (existingDeployment) {
            req.flash('error', 'This hardware is already deployed and cannot be deployed again');
            return res.redirect('/deployment/add');
        }

        const deployment = new Deploy({
            hardware: hardware_id,
            department: department_id,
            deploymentDate: new Date(deployment_date),
            gatePass: gate_pass,
            gatePassDate: gate_pass_date ? new Date(gate_pass_date) : undefined,
            status: status || 'active',
            notes: notes
        });

        await deployment.save();

        // Get department name for location
        const department = await Department.findById(department_id);
        const departmentName = department ? department.name : 'Unknown Department';

        // Update hardware status and location history
        await Hardware.findByIdAndUpdate(hardware_id, {
            lastAction: {
                typeOfAction: 'deployed',
                date: new Date(deployment_date),
                notes: notes || `Deployed to ${departmentName}`
            },
            $push: {
                locationHistory: {
                    location: departmentName,
                    date: new Date(deployment_date),
                    notes: notes || `Deployed to ${departmentName}`
                }
            }
        });

        req.flash('success', 'Deployment created successfully!');
        res.redirect('/deployment/view');
    } catch (error) {
        console.error('Error creating deployment:', error);
        req.flash('error', 'Failed to create deployment. Please try again.');
        res.redirect('/deployment/add');
    }
});

// GET /deployment/view - View all deployments
router.get('/view', async (req, res) => {
    try {
        const deployments = await Deploy.find()
            .populate('hardware', 'serialNumber gatePass')
            .populate({
                path: 'hardware',
                populate: [
                    { path: 'type', select: 'name' },
                    { path: 'make', select: 'name' },
                    { path: 'originDepartment', select: 'name' }
                ]
            })
            .populate('department', 'name')
            .sort({ deploymentDate: -1 });

        res.render('deployment/view-deployments', { 
            title: 'View Deployments - Hardware Management App',
            deployments: deployments
        });
    } catch (error) {
        console.error('Error fetching deployments:', error);
        res.status(500).render('error', { 
            title: 'Error - Hardware Management App',
            message: 'Failed to load deployments'
        });
    }
});

// GET /deployment/return/:id - Show return confirmation
router.get('/return/:id', async (req, res) => {
    try {
        const deployment = await Deploy.findById(req.params.id)
            .populate('hardware', 'serialNumber gatePass')
            .populate({
                path: 'hardware',
                populate: [
                    { path: 'type', select: 'name' },
                    { path: 'make', select: 'name' },
                    { path: 'originDepartment', select: 'name' }
                ]
            })
            .populate('department', 'name');
            
        if (!deployment) {
            req.flash('error', 'Deployment not found');
            return res.redirect('/deployment/view');
        }
        
        if (deployment.status === 'returned') {
            req.flash('error', 'This deployment has already been returned');
            return res.redirect('/deployment/view');
        }
        
        res.render('deployment/return-deployment', { 
            title: 'Return Deployment - Hardware Management App',
            deployment: deployment
        });
    } catch (error) {
        console.error('Error fetching deployment:', error);
        req.flash('error', 'Failed to load deployment');
        res.redirect('/deployment/view');
    }
});

// POST /deployment/return/:id - Process return
router.post('/return/:id', async (req, res) => {
    try {
        const { return_notes } = req.body;
        
        const deployment = await Deploy.findById(req.params.id);
        if (!deployment) {
            req.flash('error', 'Deployment not found');
            return res.redirect('/deployment/view');
        }
        
        if (deployment.status === 'returned') {
            req.flash('error', 'This deployment has already been returned');
            return res.redirect('/deployment/view');
        }

        // Update deployment status
        deployment.status = 'returned';
        deployment.actualReturnDate = new Date();
        deployment.notes = deployment.notes ? `${deployment.notes}\n\nReturned: ${return_notes || 'Hardware returned to inventory'}` : 
                          `Returned: ${return_notes || 'Hardware returned to inventory'}`;
        
        await deployment.save();

        // Update hardware status and location history
        await Hardware.findByIdAndUpdate(deployment.hardware, {
            lastAction: {
                typeOfAction: 'received',
                date: new Date(),
                notes: return_notes || 'Hardware returned to inventory'
            },
            $push: {
                locationHistory: {
                    location: 'In Inventory',
                    date: new Date(),
                    notes: return_notes || 'Hardware returned to inventory'
                }
            }
        });

        req.flash('success', 'Hardware returned successfully!');
        res.redirect('/deployment/view');
    } catch (error) {
        console.error('Error returning deployment:', error);
        req.flash('error', 'Failed to return hardware. Please try again.');
        res.redirect('/deployment/view');
    }
});

// GET /deployment/view/:id - View single deployment details
router.get('/view/:id', async (req, res) => {
    try {
        const deployment = await Deploy.findById(req.params.id)
            .populate('hardware', 'serialNumber gatePass')
            .populate({
                path: 'hardware',
                populate: [
                    { path: 'type', select: 'name' },
                    { path: 'make', select: 'name' },
                    { path: 'originDepartment', select: 'name' }
                ]
            })
            .populate('department', 'name');
            
        if (!deployment) {
            req.flash('error', 'Deployment not found');
            return res.redirect('/deployment/view');
        }
        
        res.render('deployment/view-deployment', { 
            title: 'Deployment Details - Hardware Management App',
            deployment: deployment
        });
    } catch (error) {
        console.error('Error fetching deployment:', error);
        req.flash('error', 'Failed to load deployment');
        res.redirect('/deployment/view');
    }
});

// GET /deployment/edit/:id - Show edit deployment form
router.get('/edit/:id', async (req, res) => {
    try {
        const deployment = await Deploy.findById(req.params.id)
            .populate('hardware', 'serialNumber')
            .populate({
                path: 'hardware',
                populate: [
                    { path: 'type', select: 'name' },
                    { path: 'make', select: 'name' },
                    { path: 'originDepartment', select: 'name' }
                ]
            })
            .populate('department', 'name');
            
        if (!deployment) {
            req.flash('error', 'Deployment not found');
            return res.redirect('/deployment/view');
        }
        
        const departments = await Department.find().sort({ name: 1 });
        
        res.render('deployment/edit-deployment', { 
            title: 'Edit Deployment - Hardware Management App',
            deployment: deployment,
            departments: departments
        });
    } catch (error) {
        console.error('Error fetching deployment:', error);
        req.flash('error', 'Failed to load deployment');
        res.redirect('/deployment/view');
    }
});

// POST /deployment/edit/:id - Update deployment
router.post('/edit/:id', async (req, res) => {
    try {
        const { 
            department_id, 
            deployment_date, 
            gate_pass, 
            gate_pass_date, 
            status, 
            notes 
        } = req.body;
        
        const deployment = await Deploy.findById(req.params.id);
        if (!deployment) {
            req.flash('error', 'Deployment not found');
            return res.redirect('/deployment/view');
        }

        // Get old department name for location history update
        const oldDepartment = await Department.findById(deployment.department);
        const oldDepartmentName = oldDepartment ? oldDepartment.name : 'Unknown Department';
        
        // Get new department name
        const newDepartment = await Department.findById(department_id);
        const newDepartmentName = newDepartment ? newDepartment.name : 'Unknown Department';

        // Update deployment
        deployment.department = department_id;
        deployment.deploymentDate = new Date(deployment_date);
        deployment.gatePass = gate_pass;
        deployment.gatePassDate = gate_pass_date ? new Date(gate_pass_date) : undefined;
        deployment.status = status;
        deployment.notes = notes;
        
        await deployment.save();

        // Update hardware location history if department changed
        if (oldDepartmentName !== newDepartmentName) {
            await Hardware.findByIdAndUpdate(deployment.hardware, {
                lastAction: {
                    typeOfAction: 'updated',
                    date: new Date(),
                    notes: `Deployment updated - moved from ${oldDepartmentName} to ${newDepartmentName}`
                },
                $push: {
                    locationHistory: {
                        location: newDepartmentName,
                        date: new Date(),
                        notes: `Deployment updated - moved from ${oldDepartmentName} to ${newDepartmentName}`
                    }
                }
            });
        }

        req.flash('success', 'Deployment updated successfully!');
        res.redirect('/deployment/view');
    } catch (error) {
        console.error('Error updating deployment:', error);
        req.flash('error', 'Failed to update deployment. Please try again.');
        res.redirect('/deployment/edit/' + req.params.id);
    }
});

// GET /deployment/delete/:id - Show delete confirmation
router.get('/delete/:id', async (req, res) => {
    try {
        const deployment = await Deploy.findById(req.params.id)
            .populate('hardware', 'serialNumber')
            .populate({
                path: 'hardware',
                populate: [
                    { path: 'type', select: 'name' },
                    { path: 'make', select: 'name' },
                    { path: 'originDepartment', select: 'name' }
                ]
            })
            .populate('department', 'name');
            
        if (!deployment) {
            req.flash('error', 'Deployment not found');
            return res.redirect('/deployment/view');
        }
        
        res.render('deployment/delete-deployment', { 
            title: 'Delete Deployment - Hardware Management App',
            deployment: deployment
        });
    } catch (error) {
        console.error('Error fetching deployment:', error);
        req.flash('error', 'Failed to load deployment');
        res.redirect('/deployment/view');
    }
});

// POST /deployment/delete/:id - Delete deployment
router.post('/delete/:id', async (req, res) => {
    try {
        const deployment = await Deploy.findById(req.params.id);
        if (!deployment) {
            req.flash('error', 'Deployment not found');
            return res.redirect('/deployment/view');
        }

        // Get department name for location history
        const department = await Department.findById(deployment.department);
        const departmentName = department ? department.name : 'Unknown Department';

        // Update hardware status and location history
        await Hardware.findByIdAndUpdate(deployment.hardware, {
            lastAction: {
                typeOfAction: 'received',
                date: new Date(),
                notes: 'Deployment deleted - hardware returned to inventory'
            },
            $push: {
                locationHistory: {
                    location: 'In Inventory',
                    date: new Date(),
                    notes: 'Deployment deleted - hardware returned to inventory'
                }
            }
        });

        // Delete the deployment
        await Deploy.findByIdAndDelete(req.params.id);

        req.flash('success', 'Deployment deleted successfully!');
        res.redirect('/deployment/view');
    } catch (error) {
        console.error('Error deleting deployment:', error);
        req.flash('error', 'Failed to delete deployment. Please try again.');
        res.redirect('/deployment/view');
    }
});

export default router; 