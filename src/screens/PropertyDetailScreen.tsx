import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { Property, Listing, ListingStatus } from '../types';
import SubPageHeader from '../components/SubPageHeader';
import MetaTagManager from '../components/MetaTagManager';
import { SpinnerIcon, WhatsAppIcon, BedIcon, UsersIcon, Squares2x2Icon, LocationMarkerIcon, CheckCircleIcon } from '../assets/icons';
import ProductImageGallery from '../components/ProductImageGallery';

const PropertyDetailScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [property, setProperty] = useState<Property | null>(null);
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);

    const phoneNumber = (import.meta as any).env.VITE_WHATSAPP_PHONE_NUMBER;

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const propRef = db.collection('properties').doc(id);
                const propDoc = await propRef.get();

                if (propDoc.exists) {
                    const propData = { id: propDoc.id, ...propDoc.data() } as Property;
                    setProperty(propData);

                    const listingQuery = db.collection('listings').where('propertyId', '==', id).limit(1);
                    const listingSnap = await listingQuery.get();
                    if (!listingSnap.empty) {
                        setListing({ id: listingSnap.docs[0].id, ...listingSnap.docs[0].data() } as Listing);
                    }
                }
            } catch (error) {
                console.error("Error fetching property details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><SpinnerIcon className="w-12 h-12 text-primary animate-spin" /></div>;
    }

    if (!property || !listing) {
        return (
            <div>
                <MetaTagManager title="العقار غير موجود - سـلـتـي" />
                <SubPageHeader title="خطأ" />
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold mb-4">العقار غير موجود</h2>
                    <Link to="/real-estate" className="text-primary hover:underline">العودة إلى قائمة العقارات</Link>
                </div>
            </div>
        );
    }
    
    const whatsappMessage = encodeURIComponent(`مرحباً، أنا مهتم بالعقار "${property.title}" الموجود على منصة سـلـتـي. هل يمكنني الحصول على مزيد من المعلومات؟`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;

    const getPriceLabel = () => {
        let label = `${listing.price.toLocaleString()} ج.س`;
        if (listing.listingType === 'rent') {
            label += ` / ${listing.pricePeriod === 'annually' ? 'سنوياً' : 'شهرياً'}`;
        }
        return label;
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
            <MetaTagManager title={`${property.title} - سـلـتـي`} description={property.description.substring(0, 160)} />
            <SubPageHeader title={property.title} backPath="/real-estate" />

            <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Image & Contact) */}
                    <div className="lg:col-span-2">
                        <ProductImageGallery mainImage={property.imageUrls[0]} otherImages={property.imageUrls.slice(1)} altText={property.title} />
                    </div>
                    {/* Right Column (Details) */}
                    <div className="space-y-6">
                        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                             <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full mb-2 ${listing.listingType === 'rent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                {listing.listingType === 'rent' ? 'للإيجار' : 'للبيع'}
                            </span>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{property.title}</h1>
                            <p className="text-secondary text-4xl font-bold mt-4">{getPriceLabel()}</p>
                             <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-2">
                                <LocationMarkerIcon className="w-5 h-5" />
                                {property.location.city}, {property.location.address}
                            </p>
                        </div>

                         <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                            <h2 className="text-xl font-bold mb-4">المواصفات</h2>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                                    <BedIcon className="w-8 h-8 mx-auto text-primary"/>
                                    <p className="mt-1 font-semibold">{property.bedrooms}</p>
                                    <p className="text-xs text-slate-500">غرف نوم</p>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                                    <UsersIcon className="w-8 h-8 mx-auto text-primary"/>
                                    <p className="mt-1 font-semibold">{property.bathrooms}</p>
                                    <p className="text-xs text-slate-500">حمامات</p>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                                    <Squares2x2Icon className="w-8 h-8 mx-auto text-primary"/>
                                    <p className="mt-1 font-semibold">{property.area} <span className="text-xs">م²</span></p>
                                    <p className="text-xs text-slate-500">المساحة</p>
                                </div>
                            </div>
                        </div>
                         
                         {phoneNumber && (
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-green-500 text-white font-bold rounded-lg text-lg hover:bg-green-600 transition-transform transform active:scale-95 shadow-lg">
                                <WhatsAppIcon className="w-6 h-6" />
                                تواصل للاستفسار
                            </a>
                        )}
                    </div>
                </div>
                {/* Description & Amenities below */}
                <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-4">الوصف</h2>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{property.description}</p>
                </div>
                 {property.amenities.length > 0 && (
                    <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4">المرافق والمميزات</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {property.amenities.map(amenity => (
                                <div key={amenity} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    <span className="font-semibold text-sm">{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default PropertyDetailScreen;
