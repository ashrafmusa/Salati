import firebase from 'firebase/compat/app';
import { db } from './config';

const COLLECTIONS_TO_DELETE = [
  'items', 'bundles', 'extras', 'offers', 'drivers', 
  'notifications', 'categories', 'suppliers', 
  'purchaseOrders', 'auditLogs', 'reviews'
];

/**
 * Deletes all documents in a collection in batches.
 * This is efficient for collections that do not have subcollections.
 * @param collectionPath The path of the collection to delete.
 */
async function deleteSimpleCollection(collectionPath: string) {
  const collectionRef = db.collection(collectionPath);
  const batchSize = 200;
  
  while (true) {
    const querySnapshot = await collectionRef.limit(batchSize).get();
    if (querySnapshot.size === 0) {
      break; // No more documents to delete
    }

    const batch = db.batch();
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}

/**
 * Deletes all orders and their nested 'activityLog' subcollections.
 * This process is slower due to nested reads but ensures a complete cleanup.
 */
async function deleteOrdersAndSubcollections() {
  const ordersSnapshot = await db.collection('orders').get();
  
  // This is a slow, iterative process necessary for client-side subcollection deletion.
  for (const orderDoc of ordersSnapshot.docs) {
    const activityLogSnapshot = await orderDoc.ref.collection('activityLog').get();
    
    if (!activityLogSnapshot.empty) {
      const subBatch = db.batch();
      activityLogSnapshot.docs.forEach(logDoc => {
        subBatch.delete(logDoc.ref);
      });
      await subBatch.commit();
    }
  }
  
  // After all subcollections are gone, perform a batched delete on the top-level orders.
  await deleteSimpleCollection('orders');
}

/**
 * Empties all operational data from the store's Firestore database.
 * This function is highly destructive and intentionally does NOT delete the 
 * 'users' or 'settings' collections to preserve user accounts and store configuration.
 */
export async function emptyStoreData() {
  // First, delete simple collections without nested data dependencies.
  for (const collectionName of COLLECTIONS_TO_DELETE) {
    await deleteSimpleCollection(collectionName);
  }
  
  // Finally, handle the complex orders collection with its subcollections.
  await deleteOrdersAndSubcollections();
}
