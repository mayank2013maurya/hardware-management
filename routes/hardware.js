import express from 'express';
import HardwareType from '../models/HardwareType.js';
import HardwareMake from '../models/HardwareMake.js';
import Hardware from '../models/Hardware.js';
import Department from '../models/Department.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /hardware/type/add - Show add hardware type form
router.get('/type/add', (req, res) => {
    res.render('hardware/add-hardware-type', { 
        title: 'Add Hardware Type - Hardware Management App'
    });
});

// POST /hardware/type/add - Create new hardware type
router.post('/type/add', async (req, res) => {
    try {
        const { name } = req.body;
        
        const hardwareType = new HardwareType({
            name,
        });

        await hardwareType.save();
        req.flash('success', 'Hardware type created successfully!');
        res.redirect('/hardware/type/view');
    } catch (error) {
        console.error('Error creating hardware type:', error);
        req.flash('error', 'Failed to create hardware type. Please try again.');
        res.redirect('/hardware/type/add');
    }
});

// GET /hardware/type/view - View all hardware types
router.get('/type/view', async (req, res) => {
    try {
        const hardwareTypes = await HardwareType.find().sort({ createdAt: -1 });
        res.render('hardware/view-hardware-types', { 
            title: 'View Hardware Types - Hardware Management App',
            hardwareTypes: hardwareTypes
        });
    } catch (error) {
        console.error('Error fetching hardware types:', error);
        res.status(500).render('error', { 
            title: 'Error - Hardware Management App',
            message: 'Failed to load hardware types'
        });
    }
});

// GET /hardware/type/edit/:id - Show edit hardware type form
router.get('/type/edit/:id', async (req, res) => {
    try {
        const hardwareType = await HardwareType.findById(req.params.id);
        if (!hardwareType) {
            req.flash('error', 'Hardware type not found');
            return res.redirect('/hardware/type/view');
        }
        
        res.render('hardware/edit-hardware-type', { 
            title: 'Edit Hardware Type - Hardware Management App',
            hardwareType: hardwareType
        });
    } catch (error) {
        console.error('Error fetching hardware type:', error);
        req.flash('error', 'Failed to load hardware type');
        res.redirect('/hardware/type/view');
    }
});

// POST /hardware/type/edit/:id - Update hardware type
router.post('/type/edit/:id', async (req, res) => {
    try {
        const { name } = req.body;
        
        const hardwareType = await HardwareType.findByIdAndUpdate(
            req.params.id,
            {
                name,
            },
            { new: true, runValidators: true }
        );

        if (!hardwareType) {
            req.flash('error', 'Hardware type not found');
            return res.redirect('/hardware/type/view');
        }

        req.flash('success', 'Hardware type updated successfully!');
        res.redirect('/hardware/type/view');
    } catch (error) {
        console.error('Error updating hardware type:', error);
        req.flash('error', 'Failed to update hardware type. Please try again.');
        res.redirect(`/hardware/type/edit/${req.params.id}`);
    }
});

// GET /hardware/type/delete/:id - Show delete confirmation
router.get('/type/delete/:id', async (req, res) => {
    try {
        const hardwareType = await HardwareType.findById(req.params.id);
        if (!hardwareType) {
            req.flash('error', 'Hardware type not found');
            return res.redirect('/hardware/type/view');
        }
        
        res.render('hardware/delete-hardware-type', { 
            title: 'Delete Hardware Type - Hardware Management App',
            hardwareType: hardwareType
        });
    } catch (error) {
        console.error('Error fetching hardware type:', error);
        req.flash('error', 'Failed to load hardware type');
        res.redirect('/hardware/type/view');
    }
});

// POST /hardware/type/delete/:id - Delete hardware type
router.post('/type/delete/:id', async (req, res) => {
    try {
        const hardwareType = await HardwareType.findByIdAndDelete(req.params.id);
        
        if (!hardwareType) {
            req.flash('error', 'Hardware type not found');
            return res.redirect('/hardware/type/view');
        }

        req.flash('success', 'Hardware type deleted successfully!');
        res.redirect('/hardware/type/view');
    } catch (error) {
        console.error('Error deleting hardware type:', error);
        req.flash('error', 'Failed to delete hardware type. Please try again.');
        res.redirect('/hardware/type/view');
    }
});

// GET /hardware/type/view/:id - View single hardware type details
router.get('/type/view/:id', async (req, res) => {
    try {
        const hardwareType = await HardwareType.findById(req.params.id);
        if (!hardwareType) {
            req.flash('error', 'Hardware type not found');
            return res.redirect('/hardware/type/view');
        }
        
        res.render('hardware/view-hardware-type', { 
            title: 'Hardware Type Details - Hardware Management App',
            hardwareType: hardwareType
        });
    } catch (error) {
        console.error('Error fetching hardware type:', error);
        req.flash('error', 'Failed to load hardware type');
        res.redirect('/hardware/type/view');
    }
});

// GET /hardware/make/add - Show add hardware make form
router.get('/make/add', (req, res) => {
    res.render('hardware/add-hardware-make', { 
        title: 'Add Hardware Make - Hardware Management App'
    });
});

// POST /hardware/make/add - Create new hardware make
router.post('/make/add', async (req, res) => {
    try {
        const { name } = req.body;
        
        const hardwareMake = new HardwareMake({
            name,
        });

        await hardwareMake.save();
        req.flash('success', 'Hardware make created successfully!');
        res.redirect('/hardware/make/view');
    } catch (error) {
        console.error('Error creating hardware make:', error);
        req.flash('error', 'Failed to create hardware make. Please try again.');
        res.redirect('/hardware/make/add');
    }
});

// GET /hardware/make/view - View all hardware makes
router.get('/make/view', async (req, res) => {
    try {
        const hardwareMakes = await HardwareMake.find().sort({ createdAt: -1 });
        res.render('hardware/view-hardware-makes', { 
            title: 'View Hardware Makes - Hardware Management App',
            hardwareMakes: hardwareMakes
        });
    } catch (error) {
        console.error('Error fetching hardware makes:', error);
        res.status(500).render('error', { 
            title: 'Error - Hardware Management App',
            message: 'Failed to load hardware makes'
        });
    }
});

// GET /hardware/make/edit/:id - Show edit hardware make form
router.get('/make/edit/:id', async (req, res) => {
    try {
        const hardwareMake = await HardwareMake.findById(req.params.id);
        if (!hardwareMake) {
            req.flash('error', 'Hardware make not found');
            return res.redirect('/hardware/make/view');
        }
        
        res.render('hardware/edit-hardware-make', { 
            title: 'Edit Hardware Make - Hardware Management App',
            hardwareMake: hardwareMake
        });
    } catch (error) {
        console.error('Error fetching hardware make:', error);
        req.flash('error', 'Failed to load hardware make');
        res.redirect('/hardware/make/view');
    }
});

// POST /hardware/make/edit/:id - Update hardware make
router.post('/make/edit/:id', async (req, res) => {
    try {
        const { name } = req.body;
        
        const hardwareMake = await HardwareMake.findByIdAndUpdate(
            req.params.id,
            {
                name,
            },
            { new: true, runValidators: true }
        );

        if (!hardwareMake) {
            req.flash('error', 'Hardware make not found');
            return res.redirect('/hardware/make/view');
        }

        req.flash('success', 'Hardware make updated successfully!');
        res.redirect('/hardware/make/view');
    } catch (error) {
        console.error('Error updating hardware make:', error);
        req.flash('error', 'Failed to update hardware make. Please try again.');
        res.redirect(`/hardware/make/edit/${req.params.id}`);
    }
});

// GET /hardware/make/delete/:id - Show delete confirmation
router.get('/make/delete/:id', async (req, res) => {
    try {
        const hardwareMake = await HardwareMake.findById(req.params.id);
        if (!hardwareMake) {
            req.flash('error', 'Hardware make not found');
            return res.redirect('/hardware/make/view');
        }
        
        res.render('hardware/delete-hardware-make', { 
            title: 'Delete Hardware Make - Hardware Management App',
            hardwareMake: hardwareMake
        });
    } catch (error) {
        console.error('Error fetching hardware make:', error);
        req.flash('error', 'Failed to load hardware make');
        res.redirect('/hardware/make/view');
    }
});

// POST /hardware/make/delete/:id - Delete hardware make
router.post('/make/delete/:id', async (req, res) => {
    try {
        const hardwareMake = await HardwareMake.findByIdAndDelete(req.params.id);
        
        if (!hardwareMake) {
            req.flash('error', 'Hardware make not found');
            return res.redirect('/hardware/make/view');
        }

        req.flash('success', 'Hardware make deleted successfully!');
        res.redirect('/hardware/make/view');
    } catch (error) {
        console.error('Error deleting hardware make:', error);
        req.flash('error', 'Failed to delete hardware make. Please try again.');
        res.redirect('/hardware/make/view');
    }
});

// GET /hardware/make/view/:id - View single hardware make details
router.get('/make/view/:id', async (req, res) => {
    try {
        const hardwareMake = await HardwareMake.findById(req.params.id);
        if (!hardwareMake) {
            req.flash('error', 'Hardware make not found');
            return res.redirect('/hardware/make/view');
        }
        
        res.render('hardware/view-hardware-make', { 
            title: 'Hardware Make Details - Hardware Management App',
            hardwareMake: hardwareMake
        });
    } catch (error) {
        console.error('Error fetching hardware make:', error);
        req.flash('error', 'Failed to load hardware make');
        res.redirect('/hardware/make/view');
    }
});

// GET /hardware/add - Show add hardware form
router.get('/add', async (req, res) => {
    try {
        const hardwareTypes = await HardwareType.find().sort({ name: 1 });
        const hardwareMakes = await HardwareMake.find().sort({ name: 1 });
        const departments = await Department.find().sort({ name: 1 });
        
        res.render('hardware/add-hardware', { 
            title: 'Add Hardware - Hardware Management App',
            hardwareTypes: hardwareTypes,
            hardwareMakes: hardwareMakes,
            departments: departments
        });
    } catch (error) {
        console.error('Error loading hardware form data:', error);
        req.flash('error', 'Failed to load form data');
        res.redirect('/hardware/view');
    }
});

// POST /hardware/add - Create new hardware
router.post('/add', async (req, res) => {
    try {
        const { serialNumber, gatePass, gatePassDate, hardwareDate, type, make, status, originDepartment, notes } = req.body;
        
        // Get department name for initial location
        const department = await Department.findById(originDepartment);
        const departmentName = department ? department.name : 'Unknown Department';
        const hwDate = new Date(hardwareDate);
        
        const hardware = new Hardware({
            serialNumber,
            gatePass,
            gatePassDate: gatePassDate ? new Date(gatePassDate) : undefined,
            hardwareDate: hwDate,
            type,
            make,
            originDepartment,
            notes,
            status: status || 'Active',
            lastAction: {
                typeOfAction: 'received',
                date: hwDate,
                notes: notes || 'Hardware received and added to inventory'
            },
            locationHistory: [
                {
                    location: departmentName,
                    date: hwDate,
                    notes: notes || 'Hardware initially assigned to department'
                },
                {
                    location: 'In Inventory',
                    date: hwDate,
                    notes: notes || 'Hardware transferred to central inventory'
                }
            ]
        });

        await hardware.save();
        req.flash('success', 'Hardware added successfully!');
        res.redirect('/hardware/view');
    } catch (error) {
        console.error('Error creating hardware:', error);
        req.flash('error', 'Failed to add hardware. Please try again.');
        res.redirect('/hardware/add');
    }
});

// GET /hardware/view - View all hardware
router.get('/view', async (req, res) => {
    try {
        const hardware = await Hardware.find()
            .populate('type', 'name')
            .populate('make', 'name')
            .populate('originDepartment', 'name')
            .sort({ createdAt: -1 });
        
        res.render('hardware/view-hardware', { 
            title: 'View Hardware - Hardware Management App',
            hardware: hardware
        });
    } catch (error) {
        console.error('Error fetching hardware:', error);
        res.status(500).render('error', { 
            title: 'Error - Hardware Management App',
            message: 'Failed to load hardware'
        });
    }
});

// GET /hardware/edit/:id - Show edit hardware form
router.get('/edit/:id', async (req, res) => {
    try {
        const hardware = await Hardware.findById(req.params.id);
        const hardwareTypes = await HardwareType.find().sort({ name: 1 });
        const hardwareMakes = await HardwareMake.find().sort({ name: 1 });
        const departments = await Department.find().sort({ name: 1 });
        
        if (!hardware) {
            req.flash('error', 'Hardware not found');
            return res.redirect('/hardware/view');
        }
        
        res.render('hardware/edit-hardware', { 
            title: 'Edit Hardware - Hardware Management App',
            hardware: hardware,
            hardwareTypes: hardwareTypes,
            hardwareMakes: hardwareMakes,
            departments: departments
        });
    } catch (error) {
        console.error('Error fetching hardware:', error);
        req.flash('error', 'Failed to load hardware');
        res.redirect('/hardware/view');
    }
});

// POST /hardware/edit/:id - Update hardware
router.post('/edit/:id', async (req, res) => {
    try {
        const { serialNumber, gatePass, gatePassDate, hardwareDate, type, make, status, originDepartment, notes, newLocation } = req.body;
        
        const hardware = await Hardware.findById(req.params.id);
        if (!hardware) {
            req.flash('error', 'Hardware not found');
            return res.redirect('/hardware/view');
        }

        // Check if location has changed
        let locationHistoryUpdate = {};
        if (newLocation && newLocation.trim() !== '') {
            const currentLocation = hardware.locationHistory.length > 0 
                ? hardware.locationHistory[hardware.locationHistory.length - 1].location 
                : 'Unknown';
            
            if (newLocation !== currentLocation) {
                locationHistoryUpdate = {
                    $push: {
                        locationHistory: {
                            location: newLocation,
                            date: new Date(),
                            notes: notes || 'Location updated'
                        }
                    }
                };
            }
        }

        const updateData = {
            serialNumber,
            gatePass,
            gatePassDate: gatePassDate ? new Date(gatePassDate) : undefined,
            hardwareDate: new Date(hardwareDate),
            type,
            make,
            originDepartment,
            notes,
            status,
            lastAction: {
                typeOfAction: 'updated',
                date: new Date(hardwareDate),
                notes: notes || 'Hardware information updated'
            }
        };

        // Apply updates
        await Hardware.findByIdAndUpdate(
            req.params.id,
            { ...updateData, ...locationHistoryUpdate },
            { new: true, runValidators: true }
        );

        req.flash('success', 'Hardware updated successfully!');
        res.redirect('/hardware/view');
    } catch (error) {
        console.error('Error updating hardware:', error);
        req.flash('error', 'Failed to update hardware. Please try again.');
        res.redirect(`/hardware/edit/${req.params.id}`);
    }
});

// GET /hardware/delete/:id - Show delete confirmation
router.get('/delete/:id', async (req, res) => {
    try {
        const hardware = await Hardware.findById(req.params.id)
            .populate('type', 'name')
            .populate('make', 'name')
            .populate('originDepartment', 'name');
            
        if (!hardware) {
            req.flash('error', 'Hardware not found');
            return res.redirect('/hardware/view');
        }
        
        res.render('hardware/delete-hardware', { 
            title: 'Delete Hardware - Hardware Management App',
            hardware: hardware
        });
    } catch (error) {
        console.error('Error fetching hardware:', error);
        req.flash('error', 'Failed to load hardware');
        res.redirect('/hardware/view');
    }
});

// POST /hardware/delete/:id - Delete hardware
router.post('/delete/:id', async (req, res) => {
    try {
        const hardware = await Hardware.findByIdAndDelete(req.params.id);
        
        if (!hardware) {
            req.flash('error', 'Hardware not found');
            return res.redirect('/hardware/view');
        }

        req.flash('success', 'Hardware deleted successfully!');
        res.redirect('/hardware/view');
    } catch (error) {
        console.error('Error deleting hardware:', error);
        req.flash('error', 'Failed to delete hardware. Please try again.');
        res.redirect('/hardware/view');
    }
});

// GET /hardware/view/:id - View single hardware details
router.get('/view/:id', async (req, res) => {
    try {
        const hardware = await Hardware.findById(req.params.id)
            .populate('type', 'name')
            .populate('make', 'name')
            .populate('originDepartment', 'name');
            
        if (!hardware) {
            req.flash('error', 'Hardware not found');
            return res.redirect('/hardware/view');
        }

        // Get current deployment
        const Deploy = (await import('../models/Deploy.js')).default;
        const currentDeployment = await Deploy.findOne({
            hardware: hardware._id,
            status: 'active'
        }).populate('department', 'name');

        // Get deployment history
        const deploymentHistory = await Deploy.find({
            hardware: hardware._id
        })
        .populate('department', 'name')
        .sort({ deploymentDate: -1 });
        
        res.render('hardware/view-hardware-detail', { 
            title: 'Hardware Details - Hardware Management App',
            hardware: hardware,
            currentDeployment: currentDeployment,
            deploymentHistory: deploymentHistory
        });
    } catch (error) {
        console.error('Error fetching hardware:', error);
        req.flash('error', 'Failed to load hardware');
        res.redirect('/hardware/view');
    }
});

export default router; 