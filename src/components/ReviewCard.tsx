import React from 'react';
import { Review } from '../types';
import { StarIcon } from '../assets/icons';

interface ReviewCardProps {
  review: Review;
}

const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} filled={i < rating} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} />
        ))}
    </div>
);

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-500">
            {review.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{review.author}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(review.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <StarRatingDisplay rating={review.rating} />
      </div>
      <p className="text-slate-600 dark:text-slate-300 mt-3">{review.comment}</p>
    </div>
  );
};

export default ReviewCard;