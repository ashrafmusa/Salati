import React, { useState } from 'react';
import { FullListing } from './ListingCard';
import { LocationMarkerIcon } from '../assets/icons';
import MapMarkerInfoWindow from './MapMarkerInfoWindow';

// Approximate boundaries for Sudan
const MAP_BOUNDS = {
    minLat: 10.0, maxLat: 22.0,
    minLon: 22.0, maxLon: 38.5,
};

const MapView: React.FC<{ listings: FullListing[] }> = ({ listings }) => {
    const [activeListing, setActiveListing] = useState<FullListing | null>(null);

    const listingsWithCoords = listings.filter(l =>
        l.property.location.latitude && l.property.location.longitude &&
        l.property.location.latitude >= MAP_BOUNDS.minLat && l.property.location.latitude <= MAP_BOUNDS.maxLat &&
        l.property.location.longitude >= MAP_BOUNDS.minLon && l.property.location.longitude <= MAP_BOUNDS.maxLon
    );

    const getPosition = (lat: number, lon: number) => {
        const top = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
        const left = ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * 100;
        return { top: `${top}%`, left: `${left}%` };
    };

    return (
        <div className="relative w-full h-[60vh] md:h-[70vh] bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden my-6">
            {listingsWithCoords.map(listing => {
                const { top, left } = getPosition(listing.property.location.latitude!, listing.property.location.longitude!);
                const isActive = activeListing?.id === listing.id;
                return (
                    <button
                        key={listing.id}
                        onClick={() => setActiveListing(listing)}
                        style={{ top, left }}
                        className={`absolute -translate-x-1/2 -translate-y-full transition-transform transform hover:scale-125 z-10 ${isActive ? 'z-20 scale-125' : ''}`}
                        aria-label={`View property: ${listing.propertyTitle}`}
                    >
                        <LocationMarkerIcon className={`w-8 h-8 drop-shadow-lg ${isActive ? 'text-secondary' : 'text-primary'}`} />
                    </button>
                );
            })}

            {activeListing && (
                <MapMarkerInfoWindow 
                    listing={activeListing} 
                    onClose={() => setActiveListing(null)}
                    position={getPosition(activeListing.property.location.latitude!, activeListing.property.location.longitude!)}
                />
            )}

            {listingsWithCoords.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-slate-500 font-semibold p-4 bg-white/50 rounded-md">لا توجد عقارات بالإحداثيات المطلوبة لعرضها على الخريطة.</p>
                </div>
            )}
        </div>
    );
};

export default MapView;
