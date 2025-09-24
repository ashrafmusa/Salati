import React from "react";
import SubPageHeader from "../components/SubPageHeader";
import { BuildingOfficeIcon } from "../assets/icons";
import MetaTagManager from "../components/MetaTagManager";

const RealEstateScreen: React.FC = () => {
  return (
    <div>
      <MetaTagManager
        title="العقارات - سـلـتـي"
        description="تصفح أفضل العقارات والشقق للإيجار والبيع في السودان عبر منصة سـلـتـي."
      />
      <SubPageHeader title="العقارات" backPath="/" />
      <div className="text-center py-16 flex flex-col items-center p-4">
        <div className="bg-primary/10 dark:bg-primary/20 p-6 sm:p-8 rounded-full mb-6">
          <BuildingOfficeIcon className="w-16 h-16 sm:w-24 sm:h-24 text-primary" />
        </div>
        <h2 className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">
          قريباً... منصة العقارات!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
          نعمل حالياً على تجهيز قسم العقارات والإيجارات ليكون بوابتك الأولى في
          السودان. ترقبوا إطلاق هذه الميزة الجديدة قريباً.
        </p>
      </div>
    </div>
  );
};

export default RealEstateScreen;
