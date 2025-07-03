import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import csv from 'csv-parser';
import fs from 'fs';
import { Parser } from 'json2csv';
import Hardware from '../models/Hardware.js';
import Deploy from '../models/Deploy.js';
import HardwareType from '../models/HardwareType.js';
import HardwareMake from '../models/HardwareMake.js';
import Department from '../models/Department.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// GET /import-export - Show import/export dashboard
router.get('/', (req, res) => {
    res.render('import-export/dashboard', {
        title: 'Import/Export - Hardware Management App'
    });
});

// GET /import-export/hardware/import - Show hardware import form
router.get('/hardware/import', (req, res) => {
    res.render('import-export/import-hardware', {
        title: 'Import Hardware - Hardware Management App'
    });
});

// POST /import-export/hardware/import - Import hardware from file
router.post('/hardware/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error', 'Please select a file to upload');
            return res.redirect('/import-export/hardware/import');
        }

        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        let data = [];

        // Read file based on extension
        if (fileExtension === 'csv') {
            data = await readCSVFile(filePath);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            data = await readExcelFile(filePath);
        } else {
            req.flash('error', 'Unsupported file format. Please use CSV or Excel files.');
            return res.redirect('/import-export/hardware/import');
        }

        if (data.length === 0) {
            req.flash('error', 'No data found in the file');
            return res.redirect('/import-export/hardware/import');
        }

        // Validate and process data
        const results = await processHardwareImport(data);
        
        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.render('import-export/import-results', {
            title: 'Import Results - Hardware Management App',
            results: results,
            type: 'hardware'
        });

    } catch (error) {
        console.error('Error importing hardware:', error);
        req.flash('error', 'Failed to import hardware: ' + error.message);
        res.redirect('/import-export/hardware/import');
    }
});

// GET /import-export/deployment/import - Show deployment import form
router.get('/deployment/import', async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.render('import-export/import-deployment', {
            title: 'Import Deployment - Hardware Management App',
            departments: departments
        });
    } catch (error) {
        console.error('Error loading deployment import form:', error);
        req.flash('error', 'Failed to load import form');
        res.redirect('/import-export');
    }
});

// POST /import-export/deployment/import - Import deployment from file
router.post('/deployment/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error', 'Please select a file to upload');
            return res.redirect('/import-export/deployment/import');
        }

        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        let data = [];

        // Read file based on extension
        if (fileExtension === 'csv') {
            data = await readCSVFile(filePath);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            data = await readExcelFile(filePath);
        } else {
            req.flash('error', 'Unsupported file format. Please use CSV or Excel files.');
            return res.redirect('/import-export/deployment/import');
        }

        if (data.length === 0) {
            req.flash('error', 'No data found in the file');
            return res.redirect('/import-export/deployment/import');
        }

        // Validate and process data
        const results = await processDeploymentImport(data);
        
        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.render('import-export/import-results', {
            title: 'Import Results - Hardware Management App',
            results: results,
            type: 'deployment'
        });

    } catch (error) {
        console.error('Error importing deployment:', error);
        req.flash('error', 'Failed to import deployment: ' + error.message);
        res.redirect('/import-export/deployment/import');
    }
});

// GET /import-export/hardware/export - Export hardware data
router.get('/hardware/export', async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const hardware = await Hardware.find()
            .populate('type', 'name')
            .populate('make', 'name')
            .populate('originDepartment', 'name')
            .sort({ createdAt: -1 });

        const exportData = hardware.map(h => ({
            'Serial Number': h.serialNumber,
            'Gate Pass': h.gatePass || '',
            'Gate Pass Date': h.gatePassDate ? h.gatePassDate.toISOString().split('T')[0] : '',
            'Hardware Date': h.hardwareDate ? h.hardwareDate.toISOString().split('T')[0] : '',
            'Type': h.type ? h.type.name : '',
            'Make': h.make ? h.make.name : '',
            'Origin Department': h.originDepartment ? h.originDepartment.name : '',
            'Status': h.status,
            'Notes': h.notes || '',
            'Last Action': h.lastAction ? h.lastAction.typeOfAction : '',
            'Last Action Date': h.lastAction && h.lastAction.date ? h.lastAction.date.toISOString().split('T')[0] : '',
            'Created At': h.createdAt ? h.createdAt.toISOString().split('T')[0] : ''
        }));

        if (format === 'excel') {
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(exportData);
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Hardware');
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=hardware-export.xlsx');
            
            const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            res.send(buffer);
        } else {
            const parser = new Parser();
            const csv = parser.parse(exportData);
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=hardware-export.csv');
            res.send(csv);
        }

    } catch (error) {
        console.error('Error exporting hardware:', error);
        req.flash('error', 'Failed to export hardware data');
        res.redirect('/import-export');
    }
});

// GET /import-export/deployment/export - Export deployment data
router.get('/deployment/export', async (req, res) => {
    try {
        const format = req.query.format || 'csv';
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

        const exportData = deployments.map(d => ({
            'Hardware Serial Number': d.hardware ? d.hardware.serialNumber : '',
            'Hardware Type': d.hardware && d.hardware.type ? d.hardware.type.name : '',
            'Hardware Make': d.hardware && d.hardware.make ? d.hardware.make.name : '',
            'Department': d.department ? d.department.name : '',
            'Deployment Date': d.deploymentDate ? d.deploymentDate.toISOString().split('T')[0] : '',
            'Gate Pass': d.gatePass || '',
            'Gate Pass Date': d.gatePassDate ? d.gatePassDate.toISOString().split('T')[0] : '',
            'Return Date': d.actualReturnDate ? d.actualReturnDate.toISOString().split('T')[0] : '',
            'Status': d.status,
            'Notes': d.notes || '',
            'Created At': d.createdAt ? d.createdAt.toISOString().split('T')[0] : ''
        }));

        if (format === 'excel') {
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(exportData);
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Deployments');
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=deployment-export.xlsx');
            
            const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            res.send(buffer);
        } else {
            const parser = new Parser();
            const csv = parser.parse(exportData);
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=deployment-export.csv');
            res.send(csv);
        }

    } catch (error) {
        console.error('Error exporting deployment:', error);
        req.flash('error', 'Failed to export deployment data');
        res.redirect('/import-export');
    }
});

// GET /import-export/inventory/export - Export inventory data
router.get('/inventory/export', async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        
        // Get all hardware with their current deployment status
        const hardware = await Hardware.find()
            .populate('type', 'name')
            .populate('make', 'name')
            .populate('originDepartment', 'name')
            .sort({ createdAt: -1 });

        const inventoryData = [];

        for (const h of hardware) {
            // Check if hardware is currently deployed
            const currentDeployment = await Deploy.findOne({ 
                hardware: h._id, 
                status: 'active' 
            }).populate('department', 'name');

            inventoryData.push({
                'Serial Number': h.serialNumber,
                'Type': h.type ? h.type.name : '',
                'Make': h.make ? h.make.name : '',
                'Origin Department': h.originDepartment ? h.originDepartment.name : '',
                'Status': h.status,
                'Current Location': currentDeployment ? currentDeployment.department.name : 'Inventory',
                'Deployment Status': currentDeployment ? 'Deployed' : 'Available',
                'Deployment Date': currentDeployment && currentDeployment.deploymentDate ? currentDeployment.deploymentDate.toISOString().split('T')[0] : '',
                'Hardware Date': h.hardwareDate ? h.hardwareDate.toISOString().split('T')[0] : '',
                'Gate Pass': h.gatePass || '',
                'Notes': h.notes || '',
                'Last Action': h.lastAction ? h.lastAction.typeOfAction : '',
                'Last Action Date': h.lastAction && h.lastAction.date ? h.lastAction.date.toISOString().split('T')[0] : ''
            });
        }

        if (format === 'excel') {
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(inventoryData);
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Inventory');
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=inventory-export.xlsx');
            
            const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            res.send(buffer);
        } else {
            const parser = new Parser();
            const csv = parser.parse(inventoryData);
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=inventory-export.csv');
            res.send(csv);
        }

    } catch (error) {
        console.error('Error exporting inventory:', error);
        req.flash('error', 'Failed to export inventory data');
        res.redirect('/import-export');
    }
});

// Helper function to read CSV file
function readCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

// Helper function to read Excel file
function readExcelFile(filePath) {
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(worksheet);
    } catch (error) {
        throw new Error('Failed to read Excel file: ' + error.message);
    }
}

// Helper function to process hardware import
async function processHardwareImport(data) {
    const results = {
        total: data.length,
        success: 0,
        errors: [],
        skipped: 0
    };

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
            // Validate required fields
            if (!row['Serial Number'] || !row['Type'] || !row['Make'] || !row['Origin Department']) {
                results.errors.push(`Row ${i + 1}: Missing required fields (Serial Number, Type, Make, Origin Department)`);
                continue;
            }

            // Check if hardware already exists
            const existingHardware = await Hardware.findOne({ serialNumber: row['Serial Number'] });
            if (existingHardware) {
                results.skipped++;
                continue;
            }

            // Find or create hardware type
            let hardwareType = await HardwareType.findOne({ name: row['Type'] });
            if (!hardwareType) {
                hardwareType = new HardwareType({ name: row['Type'] });
                await hardwareType.save();
            }

            // Find or create hardware make
            let hardwareMake = await HardwareMake.findOne({ name: row['Make'] });
            if (!hardwareMake) {
                hardwareMake = new HardwareMake({ name: row['Make'] });
                await hardwareMake.save();
            }

            // Find department
            const department = await Department.findOne({ name: row['Origin Department'] });
            if (!department) {
                results.errors.push(`Row ${i + 1}: Department '${row['Origin Department']}' not found`);
                continue;
            }

            // Create hardware
            const hardware = new Hardware({
                serialNumber: row['Serial Number'],
                gatePass: row['Gate Pass'] || '',
                gatePassDate: row['Gate Pass Date'] ? new Date(row['Gate Pass Date']) : undefined,
                hardwareDate: row['Hardware Date'] ? new Date(row['Hardware Date']) : new Date(),
                type: hardwareType._id,
                make: hardwareMake._id,
                originDepartment: department._id,
                notes: row['Notes'] || '',
                status: row['Status'] || 'Active',
                lastAction: {
                    typeOfAction: 'updated',
                    date: new Date(),
                    notes: 'Imported from file'
                }
            });

            await hardware.save();
            results.success++;

        } catch (error) {
            results.errors.push(`Row ${i + 1}: ${error.message}`);
        }
    }

    return results;
}

// Helper function to process deployment import
async function processDeploymentImport(data) {
    const results = {
        total: data.length,
        success: 0,
        errors: [],
        skipped: 0
    };

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
            // Validate required fields
            if (!row['Hardware Serial Number'] || !row['Department']) {
                results.errors.push(`Row ${i + 1}: Missing required fields (Hardware Serial Number, Department)`);
                continue;
            }

            // Find hardware
            const hardware = await Hardware.findOne({ serialNumber: row['Hardware Serial Number'] });
            if (!hardware) {
                results.errors.push(`Row ${i + 1}: Hardware with serial number '${row['Hardware Serial Number']}' not found`);
                continue;
            }

            // Find department
            const department = await Department.findOne({ name: row['Department'] });
            if (!department) {
                results.errors.push(`Row ${i + 1}: Department '${row['Department']}' not found`);
                continue;
            }

            // Check if hardware is already deployed
            const existingDeployment = await Deploy.findOne({ 
                hardware: hardware._id, 
                status: 'active' 
            });
            
            if (existingDeployment) {
                results.skipped++;
                continue;
            }

            // Create deployment
            const deployment = new Deploy({
                hardware: hardware._id,
                department: department._id,
                deploymentDate: row['Deployment Date'] ? new Date(row['Deployment Date']) : new Date(),
                gatePass: row['Gate Pass'] || '',
                gatePassDate: row['Gate Pass Date'] ? new Date(row['Gate Pass Date']) : undefined,
                status: 'active',
                notes: row['Notes'] || ''
            });

            await deployment.save();

            // Update hardware status and location history
            await Hardware.findByIdAndUpdate(hardware._id, {
                lastAction: {
                    typeOfAction: 'deployed',
                    date: deployment.deploymentDate,
                    notes: `Deployed to ${department.name}`
                },
                $push: {
                    locationHistory: {
                        location: department.name,
                        date: deployment.deploymentDate,
                        notes: `Deployed to ${department.name}`
                    }
                }
            });

            results.success++;

        } catch (error) {
            results.errors.push(`Row ${i + 1}: ${error.message}`);
        }
    }

    return results;
}

export default router; 