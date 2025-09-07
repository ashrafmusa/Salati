import React, { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { CloseIcon } from "../assets/icons";

const AnnouncementBanner: React.FC = () => {
  const { settings, loading } = useSettings();
  const [isVisible, setIsVisible] = useState(true);

  if (
    loading ||
    !settings?.isAnnouncementActive ||
    !settings?.announcementText ||
    !isVisible
  ) {
    return null;
  }

  return (
    <div className="relative bg-primary text-white text-sm font-semibold text-center p-3 animate-fade-in">
      <p>{settings.announcementText}</p>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-1/2 -translate-y-1/2 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss announcement"
      >
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
