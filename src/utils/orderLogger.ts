import { db } from '../firebase/config';
import { User, ActivityLogEntry } from '../types';

/**
 * Adds a log entry to a specific order's activityLog subcollection.
 * Also updates the main order document with who last updated it and when.
 * @param orderId The ID of the order to log against.
 * @param author The user object (customer, admin, or driver) performing the action.
 * @param message The content of the log message.
 * @param type The type of log entry.
 * @param visibility Whether the log is public (customer-visible) or internal.
 * @param notification (Optional) An object to create a notification for admins.
 */
export const addOrderLog = async (
    orderId: string,
    author: User,
    message: string,
    type: ActivityLogEntry['type'],
    visibility: ActivityLogEntry['visibility'],
    notification?: { message: string; link: string }
) => {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            authorId: author.uid,
            authorName: author.name,
            message,
            type,
            visibility,
        };

        const orderRef = db.collection('orders').doc(orderId);

        // Use a batch to perform both writes atomically
        const batch = db.batch();

        const logRef = orderRef.collection('activityLog').doc();
        batch.set(logRef, logEntry);

        batch.update(orderRef, {
            lastUpdatedBy: { id: author.uid, name: author.name },
            lastUpdatedAt: new Date().toISOString(),
        });

        if (notification) {
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
                ...notification,
                timestamp: new Date().toISOString(),
                read: false,
            });
        }

        await batch.commit();

    } catch (error) {
        console.error("Failed to add order log:", error);
        // Optionally re-throw or handle the error
    }
};