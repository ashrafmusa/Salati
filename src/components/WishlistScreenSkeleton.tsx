import React from 'react';
import ProductCardSkeleton from './ProductCardSkeleton';

const WishlistScreenSkeleton: React.FC = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export default WishlistScreenSkeleton;
