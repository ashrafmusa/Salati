
import React, { useState, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { User } from '../types';
import { useAuth } from '../hooks/useAuth';
import AdminScreenHeader from '../components/AdminScreenHeader';
import { useToast } from '../contexts/ToastContext';
import SortableHeader from '../components/SortableHeader';
import UserEditModal from '../components/UserEditModal';
import { usePaginatedFirestore } from '../hooks/usePaginatedFirestore';
import Pagination from '../components/Pagination';
import TableSkeleton from '../components/TableSkeleton';

type PaginatedUser = User & { id: string };

const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
    const roleConfig = {
        'super-admin': { text: 'Super Admin', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300' },
        'admin': { text: 'Admin', color: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-400' },
        'sub-admin': { text: 'Sub-Admin', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 border border-sky-300' },
        'driver': { text: 'Driver', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-300' },
        'customer': { text: 'Customer', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border border-gray-300' }
    };
    const config = roleConfig[role] || roleConfig['customer'];
    return (
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full inline-block ${config.color}`}>
            {config.text}
        </span>
    );
};

const AdminCustomersScreen: React.FC = () => {
    const { user: adminUser } = useAuth();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<PaginatedUser | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const initialSort = useMemo(() => ({ key: 'name' as const, direction: 'ascending' as const }), []);

    const {
        documents: paginatedUsers,
        loading,
        nextPage,
        prevPage,
        hasNextPage,
        hasPrevPage,
        requestSort,
        sortConfig
    } = usePaginatedFirestore<PaginatedUser>('users', initialSort);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return paginatedUsers;
        return paginatedUsers.filter((user: PaginatedUser) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.phone || '').includes(searchTerm)
        );
    }, [paginatedUsers, searchTerm]);

    const handleOpenEditModal = (user: PaginatedUser) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleSaveUser = async (updatedUser: PaginatedUser) => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            const { id, ...userData } = updatedUser;
            await updateDoc(doc(db, 'users', editingUser.uid), userData);
            showToast('User details updated successfully!', 'success');
            setIsEditModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Error updating user:", error);
            showToast("Failed to update user details.", 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleRoleChange = async (uid: string, newRole: User['role']) => {
        try {
            await updateDoc(doc(db, 'users', uid), { role: newRole });
            showToast('User role updated successfully!', 'success');
        } catch (error) {
            console.error("Error updating user role:", error);
            showToast("Failed to update user role.", 'error');
        }
    };

    const handleDeleteUser = async (uid: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the user "${name}"? This action is permanent and cannot be undone.`)) {
            try {
                await deleteDoc(doc(db, 'users', uid));
                showToast(`User "${name}" deleted successfully.`, 'success');
            } catch (error) {
                console.error("Error deleting user:", error);
                showToast("Failed to delete user.", 'error');
            }
        }
    };

    const getManagementPermissions = (targetUser: User): { canChangeRole: boolean; canDelete: boolean; canEdit: boolean } => {
        if (adminUser?.role !== 'super-admin') {
            return { canChangeRole: false, canDelete: false, canEdit: false };
        }
        const isSelf = adminUser.uid === targetUser.uid;
        return { 
            canEdit: true,
            canChangeRole: !isSelf, 
            canDelete: !isSelf && targetUser.role !== 'super-admin' 
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
            
            <div className="flex-grow overflow-y-auto">
                {loading ? <TableSkeleton /> : (
                <>
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-right">
                            <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                                <tr>
                                    <SortableHeader<PaginatedUser> label="المستخدم" sortKey="name" requestSort={requestSort} sortConfig={sortConfig} />
                                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">رقم الهاتف / الإيميل</th>
                                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user: PaginatedUser, index: number) => {
                                    const permissions = getManagementPermissions(user);
                                    return (
                                    <tr key={user.uid} className={`border-b dark:border-slate-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-sky-100/50 dark:hover:bg-sky-900/20`}>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-500">{user.name.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-slate-100">{user.name}</p>
                                                    <RoleBadge role={user.role} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300" dir="ltr">{user.phone || user.email}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-4">
                                                {permissions.canChangeRole ? (
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.uid, e.target.value as User['role'])}
                                                        className={`p-1.5 w-32 rounded text-sm border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`}
                                                    >
                                                        <option value="customer">Customer</option>
                                                        <option value="driver">Driver</option>
                                                        <option value="sub-admin">Sub-Admin</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="super-admin">Super Admin</option>
                                                    </select>
                                                ) : (
                                                    <div className="w-32">
                                                        <RoleBadge role={user.role} />
                                                    </div>
                                                )}
                                                {permissions.canEdit && (
                                                    <button onClick={() => handleOpenEditModal(user)} className="text-admin-primary hover:underline text-sm font-semibold">تعديل</button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteUser(user.uid, user.name)}
                                                    disabled={!permissions.canDelete}
                                                    className="text-red-500 hover:underline text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    حذف
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="space-y-4 md:hidden">
                        {filteredUsers.map((user: PaginatedUser) => {
                            const permissions = getManagementPermissions(user);
                            return (
                            <div key={user.uid} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700 space-y-3">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{user.name}</p>
                                        <RoleBadge role={user.role} />
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1" dir="ltr">{user.phone || user.email}</p>
                                </div>
                                <div className="pt-3 border-t dark:border-slate-700 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الدور:</label>
                                        {permissions.canChangeRole ? (
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.uid, e.target.value as User['role'])}
                                                className={`p-1 w-36 rounded text-xs border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="driver">Driver</option>
                                                <option value="sub-admin">Sub-Admin</option>
                                                <option value="admin">Admin</option>
                                                <option value="super-admin">Super Admin</option>
                                            </select>
                                        ) : (
                                            <span className="text-sm font-semibold">{user.role}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-4 pt-2">
                                        {permissions.canEdit && (
                                            <button onClick={() => handleOpenEditModal(user)} className="text-admin-primary font-semibold">تعديل</button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteUser(user.uid, user.name)}
                                            disabled={!permissions.canDelete}
                                            className="text-red-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            حذف المستخدم
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )})}
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