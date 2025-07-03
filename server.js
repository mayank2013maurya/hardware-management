import express from "express";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "./utils/dbconnect.js";
import { createDefaultUser } from "./utils/createDefaultUser.js";
import cors from "cors";
import session from "express-session";
import flash from "connect-flash";

// Import routes
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import departmentRoutes from "./routes/department.js";
import hardwareRoutes from "./routes/hardware.js";
import deploymentRoutes from "./routes/deployment.js";
import employeeRoutes from "./routes/employee.js";
import importExportRoutes from './routes/import-export.js';

dotenv.config();    

const app = express();

// Connect to database and create default user
connectDB().then(() => {
    createDefaultUser();
});

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
  });

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Flash messages middleware
app.use(flash());

// Global variables for flash messages and user session
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    res.locals.user = req.session.userId ? { 
        id: req.session.userId, 
        username: req.session.username 
    } : null;
    next();
});

// Public routes (no authentication required)
app.use('/login', authRoutes);

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

// Protected routes (authentication required)
app.use('/', dashboardRoutes);
app.use('/department', departmentRoutes);
app.use('/hardware', hardwareRoutes);
app.use('/deployment', deploymentRoutes);
app.use('/employee', employeeRoutes);
app.use('/import-export', importExportRoutes);

// 404 handler - must be the last route
app.use((req, res) => {
    res.status(404).render('404', { 
        title: '404 - Page Not Found',
        user: req.session.userId ? { 
            id: req.session.userId, 
            username: req.session.username 
        } : null
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});