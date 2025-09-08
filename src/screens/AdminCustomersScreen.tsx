import React, { useState, useMemo, useEffect } from "react";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { User, Order } from "../types";
import { useAuth } from "../hooks/useAuth";
import AdminScreenHeader from "../components/AdminScreenHeader";
import { useToast } from "../contexts/ToastContext";
import SortableHeader from "../components/SortableHeader";
import UserEditModal from "../components/UserEditModal";
import { usePaginatedFirestore } from "../hooks/usePaginatedFirestore";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/TableSkeleton";
import { logAdminAction } from "../utils/auditLogger";

type PaginatedUser = User & {
  id: string;
  totalOrders?: number;
  totalSpent?: number;
};

const RoleBadge: React.FC<{ role: User["role"] }> = ({ role }) => {
  const roleConfig = {
    "super-admin": {
      text: "Super Admin",
      color:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300",
    },
    admin: {
      text: "Admin",
      color:
        "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-400",
    },
    "sub-admin": {
      text: "Sub-Admin",
      color:
        "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 border border-sky-300",
    },
    driver: {
      text: "Driver",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-300",
    },
    customer: {
      text: "Customer",
      color:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border border-gray-300",
    },
  };
  const config = roleConfig[role] || roleConfig["customer"];
  return (
    <span
      className={`px-2.5 py-1 text-xs font-bold rounded-full inline-block ${config.color}`}
    >
      {config.text}
    </span>
  );
};

const AdminCustomersScreen: React.FC = () => {
  const { user: adminUser } = useAuth();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PaginatedUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  // Fetch all orders once to calculate customer stats
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      setAllOrders(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order))
      );
    });
    return () => unsub();
  }, []);

  const customerStats = useMemo(() => {
    const stats = new Map<
      string,
      { totalOrders: number; totalSpent: number }
    >();
    allOrders.forEach((order) => {
      const current = stats.get(order.userId) || {
        totalOrders: 0,
        totalSpent: 0,
      };
      current.totalOrders += 1;
      current.totalSpent += order.total;
      stats.set(order.userId, current);
    });
    return stats;
  }, [allOrders]);

  const initialSort = useMemo(
    () => ({ key: "name" as const, direction: "ascending" as const }),
    []
  );

  const {
    documents: paginatedUsers,
    loading,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    requestSort,
    sortConfig,
  } = usePaginatedFirestore<PaginatedUser>("users", initialSort);

  const augmentedUsers = useMemo(() => {
    return paginatedUsers.map((user) => ({
      ...user,
      totalOrders: customerStats.get(user.uid)?.totalOrders || 0,
      totalSpent: customerStats.get(user.uid)?.totalSpent || 0,
    }));
  }, [paginatedUsers, customerStats]);

  const locallySortedUsers = useMemo(() => {
    const sorted = [...augmentedUsers];
    if (sortConfig.key === "totalOrders" || sortConfig.key === "totalSpent") {
      sorted.sort((a, b) => {
        const valA = a[sortConfig.key as "totalOrders" | "totalSpent"] || 0;
        const valB = b[sortConfig.key as "totalOrders" | "totalSpent"] || 0;
        if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [augmentedUsers, sortConfig]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return locallySortedUsers;
    return locallySortedUsers.filter(
      (user: PaginatedUser) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone || "").includes(searchTerm)
    );
  }, [locallySortedUsers, searchTerm]);

  const handleOpenEditModal = (user: PaginatedUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (updatedUser: PaginatedUser) => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const { id, totalOrders, totalSpent, ...userData } = updatedUser;
      await updateDoc(doc(db, "users", editingUser.uid), userData);
      logAdminAction(
        adminUser,
        "Updated User Details",
        `User: ${userData.name}`
      );
      showToast("User details updated successfully!", "success");
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      showToast("Failed to update user details.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: User["role"]) => {
    try {
      await updateDoc(doc(db, "users", uid), { role: newRole });
      logAdminAction(
        adminUser,
        "Changed User Role",
        `User ID: ${uid.slice(0, 5)}, New Role: ${newRole}`
      );
      showToast("User role updated successfully!", "success");
    } catch (error) {
      console.error("Error updating user role:", error);
      showToast("Failed to update user role.", "error");
    }
  };

  const handleBulkRoleChange = async (newRole: User["role"]) => {
    if (selectedUserIds.size === 0) {
      showToast("Please select users to update.", "info");
      return;
    }
    const batch = writeBatch(db);
    selectedUserIds.forEach((userId) => {
      const userRef = doc(db, "users", userId);
      batch.update(userRef, { role: newRole });
    });
    try {
      await batch.commit();
      logAdminAction(
        adminUser,
        "Bulk Changed User Roles",
        `${selectedUserIds.size} users -> ${newRole}`
      );
      showToast(
        `Updated ${selectedUserIds.size} users to role "${newRole}".`,
        "success"
      );
      setSelectedUserIds(new Set());
    } catch (error) {
      console.error("Error updating users in bulk:", error);
      showToast("Failed to update user roles.", "error");
    }
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the user "${name}"? This action is permanent and cannot be undone.`
      )
    ) {
      try {
        await deleteDoc(doc(db, "users", uid));
        logAdminAction(adminUser, "Deleted User", `Name: ${name}`);
        showToast(`User "${name}" deleted successfully.`, "success");
      } catch (error) {
        console.error("Error deleting user:", error);
        showToast("Failed to delete user.", "error");
      }
    }
  };

  const handleSelectUser = (userId: string, isSelected: boolean) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (isSelected) newSet.add(userId);
      else newSet.delete(userId);
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.uid)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const getManagementPermissions = (
    targetUser: User
  ): { canChangeRole: boolean; canDelete: boolean; canEdit: boolean } => {
    if (adminUser?.role !== "super-admin") {
      return { canChangeRole: false, canDelete: false, canEdit: false };
    }
    const isSelf = adminUser.uid === targetUser.uid;
    return {
      canEdit: true,
      canChangeRole: !isSelf,
      canDelete: !isSelf && targetUser.role !== "super-admin",
    };
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
      <AdminScreenHeader
        title="إدارة المستخدمين"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="ابحث بالاسم، الإيميل، أو الهاتف..."
      />

      <div className="flex justify-end items-center mb-4">
        <select
          onChange={(e) => handleBulkRoleChange(e.target.value as User["role"])}
          disabled={selectedUserIds.size === 0}
          className="p-2 border rounded-lg bg-white dark:bg-slate-700 disabled:opacity-50 text-sm"
        >
          <option>تغيير دور المحدد</option>
          <option value="customer">Customer</option>
          <option value="driver">Driver</option>
          <option value="sub-admin">Sub-Admin</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="p-3">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedUserIds.size === filteredUsers.length &&
                        filteredUsers.length > 0
                      }
                    />
                  </th>
                  <SortableHeader<PaginatedUser>
                    label="المستخدم"
                    sortKey="name"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                  />
                  <SortableHeader<PaginatedUser>
                    label="إجمالي الطلبات"
                    sortKey="totalOrders"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                  />
                  <SortableHeader<PaginatedUser>
                    label="إجمالي المدفوعات"
                    sortKey="totalSpent"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                  />
                  <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: PaginatedUser) => {
                  const permissions = getManagementPermissions(user);
                  return (
                    <tr
                      key={user.uid}
                      className={`border-b dark:border-slate-700 transition-colors ${
                        selectedUserIds.has(user.uid)
                          ? "bg-sky-100/50 dark:bg-sky-900/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.uid)}
                          onChange={(e) =>
                            handleSelectUser(user.uid, e.target.checked)
                          }
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-500">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {user.name}
                            </p>
                            <RoleBadge role={user.role} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {user.totalOrders}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {(user.totalSpent || 0).toLocaleString()} ج.س
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-4">
                          {permissions.canChangeRole ? (
                            <select
                              value={user.role}
                              onChange={(e) =>
                                handleRoleChange(
                                  user.uid,
                                  e.target.value as User["role"]
                                )
                              }
                              className={`p-1.5 w-32 rounded text-sm border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`}
                            >
                              <option value="customer">Customer</option>
                              <option value="driver">Driver</option>
                              <option value="sub-admin">Sub-Admin</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <div className="w-32">
                              <RoleBadge role={user.role} />
                            </div>
                          )}
                          {permissions.canEdit && (
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="text-admin-primary hover:underline text-sm font-semibold"
                            >
                              تعديل
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteUser(user.uid, user.name)
                            }
                            disabled={!permissions.canDelete}
                            className="text-red-500 hover:underline text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
      {isEditModalOpen && editingUser && (
        <UserEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={editingUser}
          onSave={handleSaveUser}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
export default AdminCustomersScreen;
