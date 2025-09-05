import React, { useMemo } from 'react';
import { Review } from '../types';
import { StarIcon } from '../assets/icons';

interface ReviewSummaryProps {
  reviews: Review[];
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({ reviews }) => {
  const { averageRating, totalReviews, ratingDistribution } = useMemo(() => {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avg = total / reviews.length;
    const distribution = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      averageRating: avg,
      totalReviews: reviews.length,
      ratingDistribution: {
        5: distribution[5] || 0,
        4: distribution[4] || 0,
        3: distribution[3] || 0,
        2: distribution[2] || 0,
        1: distribution[1] || 0,
      },
    };
  }, [reviews]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border dark:border-slate-700">
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">تقييمات العملاء</h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Overall Rating */}
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-5xl font-bold text-slate-800 dark:text-slate-100">{averageRating.toFixed(1)}</p>
          <div className="flex my-1">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} filled={i < Math.round(averageRating)} className={`w-6 h-6 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-slate-300'}`} />
            ))}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">من أصل {totalReviews} تقييمات</p>
        </div>
        {/* Rating Bars */}
        <div className="w-full flex-grow">
          {Object.entries(ratingDistribution).reverse().map(([star, count]) => {
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 my-1">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center">{star} <StarIcon className="w-4 h-4 text-yellow-400 ml-1" /></span>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-400 h-2.5 rounded-full animate-progress-bar-fill origin-left" 
                    style={{ width: `${percentage}%`, animationDelay: `${(5 - Number(star)) * 100}ms` }}
                  ></div>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400 w-8 text-left">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;