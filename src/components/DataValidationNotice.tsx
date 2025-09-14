import React from 'react';
// FIX: Changed react-router-dom import to fix module export error.
import { Link } from 'react-router-dom';
import { DataValidationIssue } from '../utils/dataValidation';
import { ExclamationTriangleIcon, CloseIcon } from '../assets/adminIcons';

interface DataValidationNoticeProps {
  issues: DataValidationIssue[];
  onDismiss: () => void;
}

const DataValidationNotice: React.FC<DataValidationNoticeProps> = ({ issues, onDismiss }) => {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-6 shadow-md animate-fade-in">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
        </div>
        <div className="ml-3 flex-grow">
          <p className="text-lg font-bold text-amber-800 dark:text-amber-200">تنبيهات سلامة البيانات</p>
          <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            <ul className="list-disc list-inside space-y-1">
              {issues.map((issue, index) => (
                <li key={index}>
                  <span>{issue.message}</span>
                  <Link to={issue.link} className="font-bold underline hover:text-amber-800 dark:hover:text-amber-100 mr-2">
                    {issue.linkText} &rarr;
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="ml-auto pl-3">
            <button
                onClick={onDismiss}
                className="-mx-1.5 -my-1.5 p-1.5 rounded-lg text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 dark:focus:ring-offset-amber-900/50 focus:ring-amber-600"
            >
                <span className="sr-only">إغلاق</span>
                <CloseIcon className="h-5 w-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default DataValidationNotice;