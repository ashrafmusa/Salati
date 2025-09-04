import { Product, ExtraItem, CartItem, Offer } from '../types';

// --- CLOUDINARY CONFIGURATION ---
// Credentials are loaded from environment variables for security.
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads a file to Cloudinary using an unsigned preset.
 * @param file The file to upload.
 * @returns The secure URL of the uploaded image.
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        const errorMessage = "Cloudinary configuration is missing. Please check your environment variables (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET).";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloudinary upload error:", errorData);
        const errorMessage = errorData?.error?.message || 'Failed to upload image.';
        
        if (errorMessage.includes("preset not found")) {
            throw new Error(`Upload failed: The Cloudinary upload preset '${CLOUDINARY_UPLOAD_PRESET}' was not found. Please ensure it is configured correctly.`);
        }
        
        throw new Error(`Cloudinary Error: ${errorMessage}`);
    }

    const data = await response.json();
    return data.secure_url;
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


export const calculateProductTotal = (product: Partial<Product>): number => {
  if (!product || !product.contents) {
    return 0;
  }
  return product.contents.reduce((total, item) => total + (item.price || 0), 0);
};

export const calculateItemAndExtrasTotal = (product: Product, extras: ExtraItem[]): number => {
    const productTotal = calculateProductTotal(product);
    const extrasTotal = extras.reduce((total, extra) => total + extra.price, 0);
    return productTotal + extrasTotal;
}

export interface DiscountCalculation {
    totalDiscount: number;
    appliedOfferIds: string[];
}

/**
 * Calculates the best possible discount for a shopping cart from a list of active offers.
 * @param cartItems The items currently in the user's cart.
 * @param offers The list of currently active promotional offers.
 * @returns An object containing the total discount amount and the ID(s) of the applied offer(s).
 */
export const applyDiscounts = (
    cartItems: CartItem[],
    offers: Offer[]
): DiscountCalculation => {
    const subtotal = cartItems.reduce((sum, item) => sum + calculateItemAndExtrasTotal(item, item.selectedExtras) * item.quantity, 0);
    
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
                .reduce((sum, item) => sum + calculateItemAndExtrasTotal(item, item.selectedExtras) * item.quantity, 0);
        } else if (discountInfo.appliesTo === 'product') {
            discountableAmount = cartItems
                .filter(item => item.id === discountInfo.target)
                .reduce((sum, item) => sum + calculateItemAndExtrasTotal(item, item.selectedExtras) * item.quantity, 0);
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
