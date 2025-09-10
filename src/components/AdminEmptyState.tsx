import React from "react";

interface AdminEmptyStateProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  message: string;
  buttonText: string;
  onButtonClick: () => void;
}

const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  buttonText,
  onButtonClick,
}) => (
  <div className="text-center py-16 flex flex-col items-center">
    <Icon className="w-24 h-24 text-slate-300 dark:text-slate-600 mx-auto" />
    <h3 className="mt-4 text-xl font-bold text-slate-700 dark:text-slate-200">
      {title}
    </h3>
    <p className="mt-2 text-slate-500 dark:text-slate-400">{message}</p>
    <button
      onClick={onButtonClick}
      className="mt-6 flex items-center mx-auto bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-admin-primary-hover transition-colors shadow-sm"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 ml-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      {buttonText}
    </button>
  </div>
);

export default AdminEmptyState;
