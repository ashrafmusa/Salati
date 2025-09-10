import React, { useState } from "react";
import { SpinnerIcon, CloseIcon } from "../assets/icons";

interface DriverNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
  title: string;
}

const DriverNoteModal: React.FC<DriverNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
}) => {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!note.trim()) return;
    setIsSubmitting(true);
    await onSubmit(note);
    setIsSubmitting(false);
    setNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h2>
          <button onClick={onClose}>
            <CloseIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="اكتب ملاحظتك هنا..."
          rows={4}
          className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 mt-4"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 rounded-md"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !note.trim()}
            className="px-6 py-2 bg-admin-primary text-white rounded-md w-28 flex justify-center disabled:bg-slate-400"
          >
            {isSubmitting ? (
              <SpinnerIcon className="w-5 h-5 animate-spin" />
            ) : (
              "إرسال"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverNoteModal;
