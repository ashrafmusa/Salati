// A simple, app-wide event bus for cross-component communication.

// Event bus for cart updates
const cartUpdateEvents = new EventTarget();

/**
 * Dispatches a 'cart-updated' event.
 * Components can listen for this event to react to cart changes,
 * e.g., for playing an animation.
 */
export const dispatchCartUpdate = () => cartUpdateEvents.dispatchEvent(new Event('cart-updated'));

/**
 * Adds an event listener for cart updates.
 * @param {EventListener} listener - The callback function to execute when the event occurs.
 */
export const addCartUpdateListener = (listener: EventListener) => {
    cartUpdateEvents.addEventListener('cart-updated', listener);
};

/**
 * Removes an event listener for cart updates.
 * @param {EventListener} listener - The callback function to remove.
 */
export const removeCartUpdateListener = (listener: EventListener) => {
    cartUpdateEvents.removeEventListener('cart-updated', listener);
};
