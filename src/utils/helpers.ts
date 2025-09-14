import { StoreProduct, ExtraItem, CartItem, Offer, Bundle, Item, StoreSettings } from '../types';

// --- CLOUDINARY CONFIGURATION ---
// FIX: Cast `import.meta` to `any` to resolve TypeScript error "Property 'env' does not exist on type 'ImportMeta'" when accessing environment variables in Vite.
const CLOUDINARY_CLOUD_NAME = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;
// FIX: Cast `import.meta` to `any` to resolve TypeScript error "Property 'env' does not exist on type 'ImportMeta'" when accessing environment variables in Vite.
const CLOUDINARY_UPLOAD_PRESET = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads a file directly to Cloudinary from the client-side.
 * This method uses an "unsigned" upload preset for security.
 * @param file The file to upload.
 * @returns The secure URL of the uploaded image.
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        const errorMessage = "Cloudinary configuration is missing. Please check your .env file for VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: 'An unknown Cloudinary error occurred.' } }));
            throw new Error(errorData.error.message || `Cloudinary responded with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.secure_url) {
            throw new Error("Cloudinary did not return a valid image URL.");
        }
        return data.secure_url;

    } catch (error) {
        console.error("Error uploading image directly to Cloudinary:", error);
        throw new Error("Failed to upload image.");
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
 * Calculates the final selling price of an item in SDG.
 * @param item The item object.
 * @param settings The current store settings containing the exchange rate.
 * @returns The calculated price in SDG.
 */
export const calculateSdgPrice = (item: Item, settings: StoreSettings): number => {
    if (!item || !settings) return 0;
    const priceInSdg = item.costUSD * settings.usdToSdgRate;
    const finalPrice = priceInSdg * (1 + item.markupPercentage / 100);
    // Round to a sensible value for currency
    return Math.round(finalPrice / 10) * 10;
};


/**
 * Calculates the base price of a bundle in SDG by summing the final prices of its constituent items.
 * @param bundle The bundle product.
 * @param allItems A list of all available individual items to resolve prices.
 * @param settings The current store settings containing the exchange rate.
 * @returns The total base price of the bundle in SDG.
 */
export const calculateBundleSdgPrice = (bundle: Bundle, allItems: Item[], settings: StoreSettings): number => {
    if (!bundle || !bundle.contents || !settings) {
        return 0;
    }
    const itemMap = new Map(allItems.map(item => [item.id, item]));
    return bundle.contents.reduce((total, contentItem) => {
        const item = itemMap.get(contentItem.itemId);
        if (!item) return total;
        const itemSdgPrice = calculateSdgPrice(item, settings);
        return total + (itemSdgPrice * contentItem.quantity);
    }, 0);
};

export const calculateStoreProductPrice = (product: StoreProduct, allItems: Item[], settings: StoreSettings | null): number => {
    if (!settings) return 0;
    if (product.type === 'item') {
        return calculateSdgPrice(product, settings);
    }
    return calculateBundleSdgPrice(product, allItems, settings);
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
        let discountValue = 0;

        if (discountInfo.type === 'percentage' || discountInfo.type === 'fixed') {
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
                    discountValue = discountableAmount * (discountInfo.value / 100);
                } else { // fixed
                    discountValue = Math.min(discountInfo.value, discountableAmount);
                }
            }
        } else if (discountInfo.type === 'buyXgetY') {
            const targetItem = cartItems.find(item => item.productId === discountInfo.target);
            if (targetItem && targetItem.quantity >= discountInfo.buyQuantity) {
                const numApplications = Math.floor(targetItem.quantity / discountInfo.buyQuantity);
                const freeItemsCount = numApplications * discountInfo.getQuantity;
                discountValue = freeItemsCount * targetItem.unitPrice;
            }
        }

        return { id: offer.id, discountValue };

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