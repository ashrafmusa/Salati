import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import {
  Supplier,
  Item,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
} from "../types";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { logAdminAction } from "../utils/auditLogger";
import { SpinnerIcon, TrashIcon } from "../assets/icons";
import { useClickOutside } from "../hooks/useClickOutside";

const AdminPurchaseOrderFormScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const { showToast } = useToast();

  const [po, setPo] = useState<Partial<PurchaseOrder>>({
    status: PurchaseOrderStatus.Draft,
    items: [],
    totalCost: 0,
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const inputClasses =
    "w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

  useEffect(() => {
    // FIX: Refactored Firestore onSnapshot call to use v8 compat syntax.
    const unsubSuppliers = db
      .collection("suppliers")
      .onSnapshot((snap) =>
        setSuppliers(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Supplier))
        )
      );
    const unsubItems = db
      .collection("items")
      .onSnapshot((snap) =>
        setAllItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item)))
      );

    if (id) {
      // FIX: Refactored Firestore getDoc call to use v8 compat syntax.
      db.collection("purchaseOrders")
        .doc(id)
        .get()
        .then((docSnap) => {
          if (docSnap.exists) {
            setPo({ id: docSnap.id, ...docSnap.data() } as PurchaseOrder);
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      unsubSuppliers();
      unsubItems();
    };
  }, [id]);

  const handleHeaderChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "supplierId") {
      const supplier = suppliers.find((s) => s.id === value);
      setPo((prev) => ({
        ...prev,
        supplierId: value,
        supplierName: supplier?.name || "",
      }));
    } else {
      setPo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleItemChange = (
    itemId: string,
    field: "quantity" | "costPrice",
    value: number
  ) => {
    const newItems = po.items?.map((item) =>
      item.itemId === itemId ? { ...item, [field]: Math.max(0, value) } : item
    );
    setPo((prev) => ({ ...prev, items: newItems }));
  };

  const calculateTotalCost = useMemo(() => {
    return (
      po.items?.reduce(
        (total, item) => total + item.quantity * item.costPrice,
        0
      ) || 0
    );
  }, [po.items]);

  useEffect(() => {
    setPo((prev) => ({ ...prev, totalCost: calculateTotalCost }));
  }, [calculateTotalCost]);

  const handleAddItem = (item: Item) => {
    const newItem: PurchaseOrderItem = {
      itemId: item.id,
      itemName: item.arabicName,
      quantity: 1,
      costPrice: item.costPrice || 0,
    };
    setPo((prev) => ({ ...prev, items: [...(prev.items || []), newItem] }));
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setPo((prev) => ({
      ...prev,
      items: prev.items?.filter((i) => i.itemId !== itemId),
    }));
  };

  const filteredItems = useMemo(() => {
    return allItems.filter(
      (item) =>
        item.arabicName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !po.items?.some((pi) => pi.itemId === item.id)
    );
  }, [searchTerm, allItems, po.items]);

  const handleSave = async () => {
    if (!po.supplierId || !po.items || po.items.length === 0) {
      showToast("Please select a supplier and add at least one item.", "error");
      return;
    }
    setIsSaving(true);
    const dataToSave = {
      ...po,
      createdDate: po.createdDate || new Date().toISOString(),
      expectedDate:
        po.expectedDate ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    try {
      if (id) {
        // FIX: Refactored Firestore updateDoc call to use v8 compat syntax.
        await db.collection("purchaseOrders").doc(id).update(dataToSave);
        showToast("Purchase Order updated!", "success");
      } else {
        // FIX: Refactored Firestore addDoc call to use v8 compat syntax.
        const newDoc = await db.collection("purchaseOrders").add(dataToSave);
        showToast("Purchase Order created!", "success");
        navigate(`/purchase-orders/${newDoc.id}`);
      }
      logAdminAction(
        adminUser,
        id ? "Updated PO" : "Created PO",
        `ID: ${id || "new"}`
      );
    } catch (error) {
      showToast("Failed to save PO.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center p-10">
        <SpinnerIcon className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold">
          {id ? `تعديل أمر الشراء #${id.slice(0, 7)}` : "إنشاء أمر شراء جديد"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/purchase-orders")}
            className="px-4 py-2 bg-slate-200 rounded-md text-sm"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-admin-primary text-white rounded-md w-28 text-sm"
          >
            {isSaving ? (
              <SpinnerIcon className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "حفظ"
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border dark:border-slate-700 rounded-lg">
        <select
          name="supplierId"
          value={po.supplierId || ""}
          onChange={handleHeaderChange}
          className={inputClasses}
        >
          <option value="">اختر المورد</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="expectedDate"
          value={(po.expectedDate || "").split("T")[0]}
          onChange={handleHeaderChange}
          className={inputClasses}
        />
        <select
          name="status"
          value={po.status || ""}
          onChange={handleHeaderChange}
          className={inputClasses}
        >
          {Object.values(PurchaseOrderStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="border dark:border-slate-700 rounded-lg p-4">
        <h3 className="font-bold mb-2">الأصناف</h3>
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b dark:border-slate-600">
                <th className="p-2">الصنف</th>
                <th className="p-2 w-24">الكمية</th>
                <th className="p-2 w-32">سعر التكلفة</th>
                <th className="p-2 w-32">الإجمالي</th>
                <th className="p-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {po.items?.map((item) => (
                <tr
                  key={item.itemId}
                  className="border-b dark:border-slate-700"
                >
                  <td className="p-2 font-medium">{item.itemName}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          item.itemId,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      className={`${inputClasses} text-center`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.costPrice}
                      onChange={(e) =>
                        handleItemChange(
                          item.itemId,
                          "costPrice",
                          Number(e.target.value)
                        )
                      }
                      className={`${inputClasses} text-center`}
                    />
                  </td>
                  <td className="p-2">
                    {(item.quantity * item.costPrice).toLocaleString()}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleRemoveItem(item.itemId)}
                      className="text-red-500"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Cards */}
        <div className="space-y-4 md:hidden">
          {po.items?.map((item) => (
            <div
              key={item.itemId}
              className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md border dark:border-slate-700"
            >
              <div className="flex justify-between items-start">
                <p className="font-bold">{item.itemName}</p>
                <button
                  onClick={() => handleRemoveItem(item.itemId)}
                  className="text-red-500"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-xs">الكمية</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        item.itemId,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className={`${inputClasses} text-center`}
                  />
                </div>
                <div>
                  <label className="text-xs">سعر التكلفة</label>
                  <input
                    type="number"
                    value={item.costPrice}
                    onChange={(e) =>
                      handleItemChange(
                        item.itemId,
                        "costPrice",
                        Number(e.target.value)
                      )
                    }
                    className={`${inputClasses} text-center`}
                  />
                </div>
              </div>
              <p className="text-right mt-2 font-semibold">
                الإجمالي: {(item.quantity * item.costPrice).toLocaleString()}{" "}
                ج.س
              </p>
            </div>
          ))}
        </div>

        <div ref={dropdownRef} className="relative mt-4">
          <input
            type="text"
            placeholder="ابحث لإضافة صنف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full p-2 border rounded-md"
          />
          {isDropdownOpen && filteredItems.length > 0 && (
            <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
              {filteredItems.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {item.arabicName}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="text-left font-bold text-xl">
        <span>التكلفة الإجمالية: </span>
        <span>{calculateTotalCost.toLocaleString()} ج.س</span>
      </div>
    </div>
  );
};

export default AdminPurchaseOrderFormScreen;
