import React from 'react';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../utils/helpers';
import { Property, Listing } from '../types';
import { BedIcon, UsersIcon, Squares2x2Icon, LocationMarkerIcon } from '../assets/icons';

// Combined type for convenience
export type FullListing = Listing & {
    property: Property;
};

const ListingCard: React.FC<{ listing: FullListing }> = ({ listing }) => {
    const { property } = listing;

    const getPriceLabel = () => {
        let label = `${listing.price.toLocaleString()} ج.س`;
        if (listing.listingType === 'rent') {
            label += ` / ${listing.pricePeriod === 'annually' ? 'سنوياً' : 'شهرياً'}`;
        }
        return label;
    };

    return (
        <Link 
            to={`/property/${property.id}`}
            className="block bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden group transition-all duration-300 transform hover:-translate-y-1.5 active:translate-y-0 hover:shadow-lg border dark:border-slate-700"
        >
            <div className="relative overflow-hidden">
                <img 
                    src={getOptimizedImageUrl(listing.imageUrl, 400)} 
                    alt={listing.propertyTitle} 
                    className="w-full h-48 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                />
                <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg capitalize">
                    {listing.listingType === 'rent' ? 'للإيجار' : 'للبيع'}
                </div>
            </div>
            <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">{listing.propertyTitle}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <LocationMarkerIcon className="w-4 h-4" />
                    {property.location.city}, {property.location.address}
                </p>
                <p className="text-xl font-bold text-secondary mt-3">{getPriceLabel()}</p>
                <div className="mt-4 pt-3 border-t dark:border-slate-700 flex justify-around text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2"><BedIcon className="w-5 h-5 text-primary" /><span>{property.bedrooms}</span></div>
                    <div className="flex items-center gap-2"><UsersIcon className="w-5 h-5 text-primary" /><span>{property.bathrooms}</span></div>
                    <div className="flex items-center gap-2"><Squares2x2Icon className="w-5 h-5 text-primary" /><span>{property.area} م²</span></div>
                </div>
            </div>
        </Link>
    );
};

export default ListingCard;
