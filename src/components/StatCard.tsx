import React from 'react';
// FIX: The `react-router-dom` component `Link` was not found on the namespace import. Changed to a direct import to resolve the error.
import { Link } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<{ className?: string }>;
  textColor: string;
  to: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, textColor, to }) => {
  return (
    <Link 
      to={to}
      className="group block bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
    >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 transition-transform duration-300 group-hover:scale-105`}>
            {React.cloneElement(icon, { className: `w-7 h-7 transition-colors ${textColor}` })}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        </div>
    </Link>
  );
};

export default StatCard;