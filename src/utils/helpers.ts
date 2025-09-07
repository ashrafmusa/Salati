import { StoreProduct, ExtraItem, CartItem, Offer, Bundle, Item } from '../types';

// --- CLOUDINARY CONFIGURATION ---
// The cloud name is public and can remain on the client. All secret keys and presets are handled server-side.
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

/**
 * Securely uploads a file by sending it to a serverless function.
 * The server-side function will then upload the file to Cloudinary using a secure API key.
 * @param file The file to upload.
 * @returns The secure URL of the uploaded image.
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        // The API call is now made to our own backend endpoint.
        // This endpoint should be a serverless function (e.g., on Netlify or Vercel).
        const response = await fetch('/api/uploadImage', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown server error occurred during image upload.' }));
            throw new Error(errorData.message || `Server responded with status ${response.status}`);
        }

        const data = await response.json();
        // The serverless function is expected to return the secure URL.
        if (!data.secure_url) {
            throw new Error("Server did not return a valid image URL.");
        }
        return data.secure_url;

    } catch (error) {
        console.error("Error uploading image via serverless function:", error);
        throw new Error("Failed to upload image. Please ensure the backend service is running correctly.");
    }
};


/**
 * Optimizes a Cloudinary image URL for different device widths and formats.
 * @param url The original Cloudinary image URL.
 * @param width The target width for the image.
 * @returns A new URL with Cloudinary transformation parameters.
 */
export const getOptimizedImageUrl = (url: string, width: number): string => {
    if (!url || !url.includes('res.cloudinary.com')) {
        return url; // Return original if not a Cloudinary URL or is null/undefined
    }
    const transformation = `w_${width},q_auto:good,f_auto`;
    return url.replace('/upload/', `/upload/${transformation}/`);
};

/**
 * Calculates the base price of a bundle by summing the prices of its constituent items.
 * @param bundle The bundle product.
 * @param allItems A list of all available individual items to resolve prices.
 * @returns The total base price of the bundle.
 */
export const calculateBundlePrice = (bundle: Bundle, allItems: Item[]): number => {
    if (!bundle || !bundle.contents) {
        return 0;
    }
    const itemMap = new Map(allItems.map(item => [item.id, item.price]));
    return bundle.contents.reduce((total, contentItem) => {
        const itemPrice = itemMap.get(contentItem.itemId) || 0;
        return total + (itemPrice * contentItem.quantity);
    }, 0);
};

export const calculateStoreProductPrice = (product: StoreProduct, allItems: Item[]): number => {
    if (product.type === 'item') {
        return product.price;
    }
    return calculateBundlePrice(product, allItems);
}

export const calculateItemAndExtrasTotal = (item: CartItem): number => {
    const extrasTotal = item.selectedExtras.reduce((total, extra) => total + extra.price, 0);
    return item.unitPrice + extrasTotal;
};


export interface DiscountCalculation {
    totalDiscount: number;
    appliedOfferIds: string[];
}

/**
 * Calculates the best possible discount for a shopping cart from a list of active offers.
 * @param cartItems The items currently in the user's cart.
 * @param offers The list of currently active promotional offers.
 * @param calculateTotal A function to calculate the total for a given item.
 * @returns An object containing the total discount amount and the ID(s) of the applied offer(s).
 */
export const applyDiscounts = (
    cartItems: CartItem[],
    offers: Offer[],
    calculateTotal: (item: CartItem) => number
): DiscountCalculation => {
    const subtotal = cartItems.reduce((sum, item) => sum + calculateTotal(item), 0);

    const activeOffers = offers.filter(o => new Date(o.expiryDate) > new Date() && o.discount);

    if (activeOffers.length === 0 || cartItems.length === 0) {
        return { totalDiscount: 0, appliedOfferIds: [] };
    }

    const calculatedDiscounts = activeOffers.map(offer => {
        const discountInfo = offer.discount!;
        let discountableAmount = 0;

        if (discountInfo.appliesTo === 'all') {
            discountableAmount = subtotal;
        } else if (discountInfo.appliesTo === 'category') {
            discountableAmount = cartItems
                .filter(item => item.category === discountInfo.target)
                .reduce((sum, item) => sum + calculateTotal(item), 0);
        } else if (discountInfo.appliesTo === 'product') {
            discountableAmount = cartItems
                .filter(item => item.productId === discountInfo.target)
                .reduce((sum, item) => sum + calculateTotal(item), 0);
        }

        if (discountableAmount > 0) {
            if (discountInfo.type === 'percentage') {
                return { id: offer.id, discountValue: discountableAmount * (discountInfo.value / 100) };
            } else { // fixed
                return { id: offer.id, discountValue: Math.min(discountInfo.value, discountableAmount) };
            }
        }
        return { id: offer.id, discountValue: 0 };
    }).filter(d => d.discountValue > 0);

    if (calculatedDiscounts.length === 0) {
        return { totalDiscount: 0, appliedOfferIds: [] };
    }

    // Find the single best offer for the entire cart
    const bestOffer = calculatedDiscounts.reduce((max, current) => current.discountValue > max.discountValue ? current : max);

    return {
        totalDiscount: bestOffer.discountValue,
        appliedOfferIds: [bestOffer.id]
    };
};

/**
 * Converts an array of objects to a CSV string and triggers a download.
 * @param data The array of data to convert.
 * @param filename The desired filename for the downloaded file.
 */
export const exportToCsv = <T extends object>(data: T[], filename: string): void => {
    if (data.length === 0) {
        alert("No data to export.");
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')]; // Header row

    // Data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = (row as any)[header];
            // Handle complex data types (like objects or arrays) by JSON stringifying them
            if (typeof value === 'object' && value !== null) {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            // Escape commas and quotes in string values
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility

    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
