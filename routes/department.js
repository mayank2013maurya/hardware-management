import express from 'express';
import Department from '../models/Department.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /department/view - View all departments
router.get('/view', async (req, res) => {
    try {
        const departments = await Department.find().sort({ createdAt: -1 });
        res.render('department/view-departments', { 
            title: 'View Departments - Hardware Management App',
            departments: departments
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).render('error', { 
            title: 'Error - Hardware Management App',
            message: 'Failed to load departments'
        });
    }
});

// GET /department/add - Show add department form
router.get('/add', (req, res) => {
    res.render('department/add-department', { 
        title: 'Add Department - Hardware Management App'
    });
});

// POST /department/add - Create new department
router.post('/add', async (req, res) => {
    try {
        const { name } = req.body;
        
        const department = new Department({
            name,
        });

        await department.save();
        req.flash('success', 'Department created successfully!');
        res.redirect('/department/view');
    } catch (error) {
        console.error('Error creating department:', error);
        req.flash('error', 'Failed to create department. Please try again.');
        res.redirect('/department/add');
    }
});

// GET /department/edit/:id - Show edit department form
router.get('/edit/:id', async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            req.flash('error', 'Department not found');
            return res.redirect('/department/view');
        }
        
        res.render('department/edit-department', { 
            title: 'Edit Department - Hardware Management App',
            department: department
        });
    } catch (error) {
        console.error('Error fetching department:', error);
        req.flash('error', 'Failed to load department');
        res.redirect('/department/view');
    }
});

// POST /department/edit/:id - Update department
router.post('/edit/:id', async (req, res) => {
    try {
        const { name } = req.body;
        
        const department = await Department.findByIdAndUpdate(
            req.params.id,
            {
                name,
            },
            { new: true, runValidators: true }
        );

        if (!department) {
            req.flash('error', 'Department not found');
            return res.redirect('/department/view');
        }

        req.flash('success', 'Department updated successfully!');
        res.redirect('/department/view');
    } catch (error) {
        console.error('Error updating department:', error);
        req.flash('error', 'Failed to update department. Please try again.');
        res.redirect(`/department/edit/${req.params.id}`);
    }
});

// GET /department/delete/:id - Show delete confirmation
router.get('/delete/:id', async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            req.flash('error', 'Department not found');
            return res.redirect('/department/view');
        }
        
        res.render('department/delete-department', { 
            title: 'Delete Department - Hardware Management App',
            department: department
        });
    } catch (error) {
        console.error('Error fetching department:', error);
        req.flash('error', 'Failed to load department');
        res.redirect('/department/view');
    }
});

// POST /department/delete/:id - Delete department
router.post('/delete/:id', async (req, res) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);
        
        if (!department) {
            req.flash('error', 'Department not found');
            return res.redirect('/department/view');
        }

        req.flash('success', 'Department deleted successfully!');
        res.redirect('/department/view');
    } catch (error) {
        console.error('Error deleting department:', error);
        req.flash('error', 'Failed to delete department. Please try again.');
        res.redirect('/department/view');
    }
});

// GET /department/view/:id - View single department details
router.get('/view/:id', async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            req.flash('error', 'Department not found');
            return res.redirect('/department/view');
        }
        
        res.render('department/view-department', { 
            title: 'Department Details - Hardware Management App',
            department: department
        });
    } catch (error) {
        console.error('Error fetching department:', error);
        req.flash('error', 'Failed to load department');
        res.redirect('/department/view');
    }
});

export default router; 