import React from 'react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<{ className?: string }>;
  colorClass: string;
  to: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, to }) => {
  return (
    <Link 
      to={to}
      className="block bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:scale-[1.02]"
    >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
            {React.cloneElement(icon, { className: "w-7 h-7 text-white" })}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        </div>
    </Link>
  );
};

export default StatCard;
