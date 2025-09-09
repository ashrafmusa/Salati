import React, { useState } from 'react';
import { getOptimizedImageUrl } from '../utils/helpers';
import { CloseIcon } from '../assets/icons';

interface ProductImageGalleryProps {
  mainImage: string;
  otherImages?: string[];
  altText: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ mainImage, otherImages = [], altText }) => {
  const allImages = [mainImage, ...otherImages];
  const [selectedImage, setSelectedImage] = useState(mainImage);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openLightbox = (image: string) => {
    setSelectedImage(image);
    setIsLightboxOpen(true);
  };

  return (
    <div>
      <div className="relative group">
        <img
          src={getOptimizedImageUrl(selectedImage, 800)}
          alt={altText}
          className="w-full h-auto rounded-2xl shadow-lg object-cover cursor-pointer"
          onClick={() => openLightbox(selectedImage)}
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
            <p className="text-white font-bold text-lg">عرض أكبر</p>
        </div>
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 mt-4">
          {allImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(img)}
              className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedImage === img ? 'border-primary shadow-md' : 'border-transparent hover:border-primary/50'}`}
            >
              <img
                src={getOptimizedImageUrl(img, 200)}
                alt={`${altText} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in" onClick={() => setIsLightboxOpen(false)}>
            <button className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/20" onClick={() => setIsLightboxOpen(false)}>
                <CloseIcon className="w-8 h-8"/>
            </button>
            <img 
                src={getOptimizedImageUrl(selectedImage, 1200)} 
                alt={altText} 
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={e => e.stopPropagation()}
            />
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;