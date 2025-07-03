import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const createDefaultUser = async () => {
    try {
        // Check if any user exists
        const userCount = await User.countDocuments();
        
        if (userCount === 0) {
            // Create default admin user
            const hashedPassword = await bcrypt.hash('admin123', 12);
            const defaultUser = new User({
                username: 'admin',
                password: hashedPassword
            });
            
            await defaultUser.save();
            
            
        }
    } catch (error) {
        console.error('❌ Error creating default user:', error);
    }
}; 