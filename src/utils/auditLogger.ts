import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User } from '../types';

/**
 * Logs a significant action performed by an administrator to the 'auditLogs' collection.
 * This creates a security and accountability trail for Super Admins.
 * @param adminUser - The user object of the administrator performing the action.
 * @param action - A concise description of the action (e.g., "Order Status Changed").
 * @param details - Optional additional details about the action (e.g., "Order #12345 -> Delivered").
 */
export const logAdminAction = async (
    adminUser: User | null,
    action: string,
    details?: string
) => {
    if (!adminUser || adminUser.role === 'customer' || adminUser.role === 'driver') {
        // Only log actions for admin-level users
        return;
    }
    try {
        await addDoc(collection(db, 'auditLogs'), {
            timestamp: new Date().toISOString(),
            adminId: adminUser.uid,
            adminName: adminUser.name,
            action,
            details: details || '',
        });
    } catch (error) {
        console.error("Failed to write to audit log:", error);
    }
};
