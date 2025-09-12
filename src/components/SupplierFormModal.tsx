import React, { useState, useEffect, useMemo } from "react";
import { Supplier, User } from "../types";
import { SpinnerIcon } from "../assets/icons";

interface SupplierFormModalProps {
  supplier?: Supplier | null;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  isSaving: boolean;
  users: User[];
  allSuppliers: Supplier[];
}

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  supplier,
  onClose,
  onSave,
  isSaving,
  users,
  allSuppliers,
}) => {
  const [formData, setFormData] = useState<Partial<Supplier>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (supplier) {
      setFormData(supplier);
    } else {
      setFormData({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        paymentTerms: "",
        bankDetails: "",
      });
    }
  }, [supplier]);

  const availableUsersForLinking = useMemo(() => {
    const linkedUserIds = new Set(
      allSuppliers.map((s) => s.userId).filter(Boolean)
    );
    const currentUserForThisSupplier = supplier?.userId
      ? users.find((u) => u.uid === supplier.userId)
      : null;

    // This supplier's currently linked user should not be considered "linked" by another supplier in this context
    if (supplier?.userId) {
      linkedUserIds.delete(supplier.userId);
    }

    const unlinkedCustomers = users.filter(
      (u) => u.role === "customer" && !linkedUserIds.has(u.uid)
    );

    if (
      currentUserForThisSupplier &&
      !unlinkedCustomers.some((u) => u.uid === currentUserForThisSupplier.uid)
    ) {
      return [currentUserForThisSupplier, ...unlinkedCustomers];
    }

    return unlinkedCustomers;
  }, [users, allSuppliers, supplier]);

  const validate = (field?: keyof Supplier) => {
    const newErrors = { ...errors };
    const currentData = formData;

    const checkField = (fieldName: keyof Supplier, message: string) => {
      if (!currentData[fieldName]?.trim()) newErrors[fieldName] = message;
      else delete newErrors[fieldName];
    };

    if (field === "name" || !field) checkField("name", "اسم المورد مطلوب");
    if (field === "phone" || !field) checkField("phone", "رقم الهاتف مطلوب");

    setErrors(newErrors);
    return Object.keys(newErrors).filter((key) => newErrors[key]).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    validate(e.target.name as keyof Supplier);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData as Supplier);
    }
  };

  const inputClasses = (name: keyof Supplier | "userId") =>
    `w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
      errors[name] ? "border-red-500" : "border-slate-300 dark:border-slate-600"
    } focus:ring-admin-primary focus:border-admin-primary`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
          {supplier ? "تعديل مورد" : "إضافة مورد جديد"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                اسم المورد
              </label>
              <input
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClasses("name")} mt-1`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="contactPerson"
                className="block text-sm font-medium"
              >
                اسم جهة الاتصال
              </label>
              <input
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClasses("contactPerson")} mt-1`}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                رقم الهاتف
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClasses("phone")} mt-1`}
                dir="ltr"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClasses("email")} mt-1`}
                dir="ltr"
              />
            </div>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium">
              العنوان
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${inputClasses("address")} mt-1`}
              rows={2}
            />
          </div>
          <div>
            <label htmlFor="userId" className="block text-sm font-medium">
              ربط حساب مستخدم (للوصول للبوابة)
            </label>
            <select
              id="userId"
              name="userId"
              value={formData.userId || ""}
              onChange={handleChange}
              className={`${inputClasses("userId")} mt-1`}
            >
              <option value="">-- غير مربوط --</option>
              {availableUsersForLinking.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="paymentTerms" className="block text-sm font-medium">
              شروط الدفع
            </label>
            <input
              id="paymentTerms"
              name="paymentTerms"
              value={formData.paymentTerms || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${inputClasses("paymentTerms")} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="bankDetails" className="block text-sm font-medium">
              التفاصيل البنكية
            </label>
            <textarea
              id="bankDetails"
              name="bankDetails"
              value={formData.bankDetails || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${inputClasses("bankDetails")} mt-1`}
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2">
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-admin-primary text-white rounded-md w-28 flex justify-center"
              disabled={isSaving}
            >
              {isSaving ? (
                <SpinnerIcon className="w-5 h-5 animate-spin" />
              ) : (
                "حفظ"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierFormModal;
