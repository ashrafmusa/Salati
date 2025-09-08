import React from "react";
import { WarningIcon } from "../assets/icons";

interface ConfigurationErrorScreenProps {
  error: string | null;
}

const ConfigurationErrorScreen: React.FC<ConfigurationErrorScreenProps> = ({
  error,
}) => {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg border border-red-200 dark:border-red-900 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
          <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          خطأ في الإعدادات
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          لم يتمكن التطبيق من الاتصال بالخلفية. هذا يحدث عادةً بسبب عدم وجود أو
          عدم صحة إعدادات Firebase.
        </p>
        <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-md text-left text-sm text-red-700 dark:text-red-300 font-mono">
          <p className="font-bold">تفاصيل الخطأ:</p>
          <p>{error || "An unknown error occurred."}</p>
        </div>
        <div className="mt-6 text-slate-500 dark:text-slate-400">
          <p>
            لحل هذه المشكلة، يرجى التأكد من أنك قمت بإنشاء ملف `.env` في جذر
            المشروع واتبعت التعليمات الموجودة في ملف `README.md` بعناية.
          </p>
          <a
            href="https://github.com/your-repo/salati-app#readme" // Replace with your actual repo link if available
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-secondary transition-colors"
          >
            عرض تعليمات الإعداد
          </a>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationErrorScreen;
