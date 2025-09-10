import React, { useMemo } from "react";
import { AuditLog } from "../types";
import { usePaginatedFirestore } from "../hooks/usePaginatedFirestore";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/TableSkeleton";

const AdminAuditLogScreen: React.FC = () => {
  const initialSort = useMemo(
    () => ({ key: "timestamp" as const, direction: "descending" as const }),
    []
  );

  const {
    documents: logs,
    loading,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedFirestore<AuditLog>("auditLogs", initialSort, [], 20);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        سجل تدقيق الإجراءات الإدارية
      </h2>

      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <TableSkeleton />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-right">
                <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      الوقت والتاريخ
                    </th>
                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      المسؤول
                    </th>
                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      الإجراء
                    </th>
                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      التفاصيل
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <td className="p-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("ar-EG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                        {log.adminName}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {log.action}
                      </td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="space-y-4 md:hidden">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">
                        {log.action}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        بواسطة: {log.adminName}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString("ar-EG", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {log.details && (
                    <div className="mt-2 pt-2 border-t dark:border-slate-600">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {log.details}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
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
