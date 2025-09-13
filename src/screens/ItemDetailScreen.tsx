import React, { useState, useEffect } from 'react';
// FIX: The `react-router-dom` components `useParams` and `Link` were not found on the namespace import. Changed to a direct import to resolve the errors.
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import SubPageHeader from '../components/SubPageHeader';
import { Item, Review } from '../types';
import { CheckCircleIcon, HeartIcon, SpinnerIcon, StarIcon, PencilIcon } from '../assets/icons';
import { useAuth } from '../hooks/useAuth';
import SectionHeader from '../components/SectionHeader';
import ReviewSummary from '../components/ReviewSummary';
import ReviewCard from '../components/ReviewCard';
import MetaTagManager from '../components/MetaTagManager';
import ProductImageGallery from '../components/ProductImageGallery';
import RelatedProducts from '../components/RelatedProducts';


const StarRating: React.FC<{ rating: number; reviewCount: number }> = ({ rating, reviewCount }) => (
    <div className="flex items-center">
        <div className="flex">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} filled={i < Math.round(rating)} className={`w-5 h-5 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-slate-300'}`}