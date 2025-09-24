import React from "react";
import AdminScreenHeader from "../components/AdminScreenHeader";
import AdminEmptyState from "../components/AdminEmptyState";
import { BuildingLibraryIcon } from "../assets/adminIcons";
import { useToast } from "../contexts/ToastContext";

const AdminPropertiesScreen: React.FC = () => {
  const { showToast } = useToast();

  const handleComingSoon = () => {
    showToast("This feature is coming soon!", "info");
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <AdminScreenHeader
        title="إدارة العقارات"
        buttonText="إضافة عقار جديد"
        onButtonClick={handleComingSoon}
      />
      <div className="flex-grow">
        <AdminEmptyState
          icon={BuildingLibraryIcon}
          title="لا توجد عقارات بعد"
          message="ابدأ بإضافة العقارات المتاحة لديك لإدارتها من هنا."
          buttonText="إضافة العقار الأول"
          onButtonClick={handleComingSoon}
        />
      </div>
    </div>
  );
};

export default AdminPropertiesScreen;
