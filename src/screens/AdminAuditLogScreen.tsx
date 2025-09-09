import React, { useMemo } from 'react';
import { AuditLog } from '../types';
import { usePaginatedFirestore } from '../hooks/usePaginatedFirestore';
import Pagination from '../components/Pagination';
import TableSkeleton from '../components/TableSkeleton';

const AdminAuditLogScreen: React.FC = () => {
  const initialSort = useMemo(() => ({ key: 'timestamp' as const, direction: 'descending' as const }), []);
  
  const {
    documents: logs,
    loading,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedFirestore<AuditLog>('auditLogs', initialSort, [], 20);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">سجل تدقيق الإجراءات الإدارية</h2>
      
      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">الوقت والتاريخ</th>
                  <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">المسؤول</th>
                  <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">الإجراء</th>
                  <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{log.adminName}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{log.action}</td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        onNext={nextPage}
        onPrev={prevPage}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
      />
    </div>
  );
};

export default AdminAuditLogScreen;
