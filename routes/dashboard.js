import express from 'express';
import Hardware from '../models/Hardware.js';
import Deploy from '../models/Deploy.js';
import Department from '../models/Department.js';
import HardwareType from '../models/HardwareType.js';
import HardwareMake from '../models/HardwareMake.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET / - Dashboard (renamed from inventory)
router.get('/', async (req, res) => {
    try {
        const { status, search, department, type, make } = req.query;
        
        // Build filter object
        let filter = {};
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        if (search) {
            filter.$or = [
                { serialNumber: { $regex: search, $options: 'i' } },
                { gatePass: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (department && department !== 'all') {
            filter.originDepartment = department;
        }
        
        if (type && type !== 'all') {
            filter.type = type;
        }
        
        if (make && make !== 'all') {
            filter.make = make;
        }

        // Get hardware with populated references
        const hardware = await Hardware.find(filter)
            .populate('type', 'name')
            .populate('make', 'name')
            .populate('originDepartment', 'name')
            .sort({ 'lastAction.date': -1 });

        // Get deployment data for each hardware
        const hardwareWithDeployment = await Promise.all(
            hardware.map(async (hw) => {
                try {
                    const currentDeployment = await Deploy.findOne({
                        hardware: hw._id,
                        status: 'active'
                    }).populate('department', 'name');

                    const deploymentHistory = await Deploy.find({
                        hardware: hw._id
                    })
                    .populate('department', 'name')
                    .sort({ deploymentDate: -1 })
                    .limit(5);

                    return {
                        ...hw.toObject(),
                        currentDeployment,
                        deploymentHistory: deploymentHistory || []
                    };
                } catch (error) {
                    console.error('Error fetching deployment data for hardware:', hw._id, error);
                    return {
                        ...hw.toObject(),
                        currentDeployment: null,
                        deploymentHistory: []
                    };
                }
            })
        );

        // Calculate stats with fallback values
        let totalHardware = 0;
        let available = 0;
        let inUse = 0;
        let underMaintenance = 0;

        try {
            totalHardware = await Hardware.countDocuments();
            available = await Hardware.countDocuments({ status: 'Active' });
            inUse = await Deploy.countDocuments({ status: 'active' });
            underMaintenance = await Hardware.countDocuments({ status: 'Maintenance' });
        } catch (error) {
            console.error('Error calculating stats:', error);
        }

        // Get recent activity with error handling
        let recentActivity = [];
        try {
            const recentDeployments = await Deploy.find()
                .populate('hardware', 'serialNumber')
                .populate('department', 'name')
                .sort({ deploymentDate: -1 })
                .limit(5);

            const recentHardwareUpdates = await Hardware.find()
                .populate('type', 'name')
                .populate('make', 'name')
                .sort({ 'lastAction.date': -1 })
                .limit(5);

            // Combine and sort recent activity
            recentActivity = [
                ...recentDeployments.map(dep => ({
                    type: 'deployment',
                    message: `Hardware ${dep.hardware?.serialNumber || 'Unknown'} deployed to ${dep.department?.name || 'Unknown Department'}`,
                    time: dep.deploymentDate,
                    color: 'blue'
                })),
                ...recentHardwareUpdates.map(hw => ({
                    type: 'hardware_update',
                    message: `Hardware ${hw.serialNumber} ${hw.lastAction?.typeOfAction || 'updated'}`,
                    time: hw.lastAction?.date || new Date(),
                    color: 'green'
                }))
            ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            recentActivity = [
                {
                    type: 'info',
                    message: 'No recent activity available',
                    time: new Date(),
                    color: 'gray'
                }
            ];
        }

        // Get filter options with fallback
        let departments = [];
        let hardwareTypes = [];
        let hardwareMakes = [];

        try {
            departments = await Department.find().sort({ name: 1 });
            hardwareTypes = await HardwareType.find().sort({ name: 1 });
            hardwareMakes = await HardwareMake.find().sort({ name: 1 });
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }

        const dashboardData = {
            hardware: hardwareWithDeployment || [],
            stats: {
                totalHardware: totalHardware || 0,
                available: available || 0,
                inUse: inUse || 0,
                underMaintenance: underMaintenance || 0
            },
            recentActivity: recentActivity || [],
            filterOptions: {
                departments: departments || [],
                hardwareTypes: hardwareTypes || [],
                hardwareMakes: hardwareMakes || []
            }
        };

        res.render('dashboard', { 
            title: 'Dashboard - Hardware Management App',
            data: dashboardData,
            filters: req.query || {}
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Provide fallback data structure
        const fallbackData = {
            hardware: [],
            stats: {
                totalHardware: 0,
                available: 0,
                inUse: 0,
                underMaintenance: 0
            },
            recentActivity: [
                {
                    type: 'error',
                    message: 'Unable to load dashboard data',
                    time: new Date(),
                    color: 'red'
                }
            ],
            filterOptions: {
                departments: [],
                hardwareTypes: [],
                hardwareMakes: []
            }
        };
        res.render('dashboard', { 
            title: 'Dashboard - Hardware Management App',
            data: fallbackData,
            filters: req.query || {}
        });
    }
});

export default router; 