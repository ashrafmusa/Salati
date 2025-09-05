import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { Offer } from "../types";
import { ChevronLeftIcon, ChevronRightIcon, TagIcon } from "../assets/icons";
import { useCountdown } from "../hooks/useCountdown";
import { getOptimizedImageUrl } from "../utils/helpers";
import { collection, onSnapshot } from "firebase/firestore";

const CountdownTimer: React.FC<{ expiryDate: string }> = ({ expiryDate }) => {
  const { days, hours, minutes, seconds } = useCountdown(expiryDate);
  const isUrgent = days < 1;

  const timeParts = [
    { label: "أيام", value: days },
    { label: "ساعات", value: hours },
    { label: "دقائق", value: minutes },
    { label: "ثواني", value: seconds },
  ];

  if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
    return null;
  }

  return (
    <div
      dir="ltr"
      className={`flex items-center justify-center space-x-2 md:space-x-4 text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg mt-4 backdrop-blur-sm ${
        isUrgent ? "animate-pulse-urgent" : ""
      }`}
      style={{ textShadow: "0 1px 5px rgba(0,0,0,0.7)" }}
    >
      {timeParts.map((part, index) => (
        <div key={part.label} className="flex items-center">
          <div className="text-center">
            <span className="text-xl md:text-3xl font-bold font-display tracking-wider">
              {String(part.value).padStart(2, "0")}
            </span>
            <span className="block text-xs uppercase opacity-75">
              {part.label}
            </span>
          </div>
          {index < timeParts.length - 1 && (
            <span className="text-xl md:text-3xl font-bold mx-1 opacity-50">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

const PromotionalBanner: React.FC = () => {
  const [banners, setBanners] = useState<Offer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "offers"), (snapshot) => {
      const bannersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Offer[];

      const activeBanners = bannersData.filter(
        (b) => new Date(b.expiryDate) > new Date()
      );
      setBanners(activeBanners);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const nextBanner = useCallback(() => {
    if (banners.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }
  }, [banners.length]);

  const prevBanner = useCallback(() => {
    if (banners.length > 0) {
      setCurrentIndex(
        (prevIndex) => (prevIndex - 1 + banners.length) % banners.length
      );
    }
  }, [banners.length]);

  useEffect(() => {
    if (isPaused || banners.length <= 1) {
      return;
    }
    const timerId = setTimeout(() => {
      nextBanner();
    }, 5000);
    return () => clearTimeout(timerId);
  }, [currentIndex, isPaused, banners.length, nextBanner]);

  const handleBannerClick = (link?: string) => {
    if (link) {
      navigate(link.startsWith("#") ? link.substring(1) : link);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      // Swipe left
      nextBanner();
    } else if (diff < -50) {
      // Swipe right
      prevBanner();
    }

    setTimeout(() => setIsPaused(false), 2000);
  };

  if (loading) {
    return (
      <div className="relative w-full h-56 md:h-64 rounded-2xl overflow-hidden shadow-xl my-6 bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div
      className="relative w-full h-56 md:h-64 rounded-2xl overflow-hidden shadow-xl my-6 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          onClick={() => handleBannerClick(banner.link)}
          className={`absolute w-full h-full transition-transform duration-700 ease-in-out ${
            banner.link ? "cursor-pointer" : "cursor-default"
          }`}
          style={{ transform: `translateX(${(index - currentIndex) * 100}%)` }}
          role={banner.link ? "button" : "figure"}
          aria-label={banner.title}
        >
          <img
            src={getOptimizedImageUrl(banner.imageUrl, 800)}
            alt={banner.title}
            className="w-full h-full object-cover animate-ken-burns"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end items-start p-6 text-right">
            {banner.discount && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-fade-in">
                <TagIcon className="w-4 h-4" />
                <span>
                  {banner.discount.type === "percentage"
                    ? `خصم ${banner.discount.value}%`
                    : `خصم ${banner.discount.value.toLocaleString()} ج.س`}
                </span>
              </div>
            )}
            <div
              className="animate-banner-content-in opacity-0"
              style={{
                animationDelay: `${index === currentIndex ? "0.3s" : "0s"}`,
              }}
            >
              <h2
                className="text-white text-lg sm:text-2xl md:text-3xl font-bold"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
              >
                {banner.title}
              </h2>
              <CountdownTimer expiryDate={banner.expiryDate} />
              {banner.callToAction && (
                <div className="mt-4">
                  <div className="bg-accent text-white font-bold py-2 px-4 sm:py-2.5 sm:px-6 text-sm sm:text-base rounded-full transition-all duration-300 transform group-hover:scale-105 group-hover:bg-accent-hover shadow-lg">
                    {banner.callToAction}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={prevBanner}
            aria-label="Previous Banner"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/60 dark:bg-black/60 text-slate-800 dark:text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-10"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={nextBanner}
            aria-label="Next Banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/60 dark:bg-black/60 text-slate-800 dark:text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-10"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
                  index === currentIndex
                    ? "w-5 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to banner ${index + 1}`}
              ></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PromotionalBanner;
