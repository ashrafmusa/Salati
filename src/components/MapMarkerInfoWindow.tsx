import React from 'react';
import { FullListing } from './ListingCard';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../utils/helpers';
import { CloseIcon } from '../assets/icons';

interface MapMarkerInfoWindowProps {
    listing: FullListing;
    onClose: () => void;
    position: { top: string; left: string };
}

const MapMarkerInfoWindow: React.FC<MapMarkerInfoWindowProps> = ({ listing, onClose, position }) => {
    
    const getPriceLabel = () => {
        let label = `${listing.price.toLocaleString()} ج.س`;
        if (listing.listingType === 'rent') {
            label += ` / ${listing.pricePeriod === 'annually' ? 'سنوياً' : 'شهرياً'}`;
        }
        return label;
    };
    
    // Position the info window smartly
    const topNum = parseFloat(position.top);
    const leftNum = parseFloat(position.left);
    
    let transformClasses = 'transform -translate-x-1/2 -translate-y-[calc(100%+2.5rem)]'; // Default: above marker
    
    if(topNum < 25) { // If too high, position below
        transformClasses = 'transform -translate-x-1/2 translate-y-4';
    }
    if(leftNum < 15) { // If too far left, shift right
        transformClasses = transformClasses.replace('-translate-x-1/2', 'translate-x-0');
    }
    if(leftNum > 85) { // If too far right, shift left
        transformClasses = transformClasses.replace('-translate-x-1/2', '-translate-x-full');
    }

    return (
        <div 
            style={{ top: position.top, left: position.left }}
            className={`absolute z-30 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-2xl overflow-hidden animate-fade-in ${transformClasses}`}
        >
            <div className="relative">
                <img src={getOptimizedImageUrl(listing.imageUrl, 200)} alt={listing.propertyTitle} className="w-full h-32 object-cover"/>
                <button onClick={onClose} className="absolute top-1 right-1 p-1 bg-black/40 text-white rounded-full hover:bg-black/70">
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
            <div className="p-3">
                <h3 className="font-bold truncate text-slate-800 dark:text-slate-100">{listing.propertyTitle}</h3>
                <p className="text-secondary font-bold text-lg">{getPriceLabel()}</p>
                <Link to={`/property/${listing.property.id}`} className="mt-2 block w-full text-center bg-primary text-white font-semibold py-1.5 rounded-md hover:bg-secondary text-sm">
                    عرض التفاصيل
                </Link>
            </div>
        </div>
    );
};

export default MapMarkerInfoWindow;
