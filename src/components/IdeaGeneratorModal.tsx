import React, { useState, useEffect, useCallback } from "react";
import { Item } from "../types";
import { generateBundleIdeas, BundleIdea } from "../utils/gemini";
import { SpinnerIcon, CloseIcon } from "../assets/icons";
import { BeakerIcon, PlusIcon } from "../assets/adminIcons";

const IdeaGeneratorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  allItems: Item[];
  onCreateBundle: (idea: BundleIdea) => void;
}> = ({ isOpen, onClose, allItems, onCreateBundle }) => {
  const [ideas, setIdeas] = useState<BundleIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIdeas([]);
    try {
      const generatedIdeas = await generateBundleIdeas(allItems);
      setIdeas(generatedIdeas);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, [allItems]);

  useEffect(() => {
    if (isOpen) {
      fetchIdeas();
    }
  }, [isOpen, fetchIdeas]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BeakerIcon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              AI Bundle Idea Generator
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-grow p-6 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <SpinnerIcon className="w-12 h-12 text-primary animate-spin" />
              <p className="mt-4 font-semibold text-slate-600 dark:text-slate-300">
                Generating creative ideas...
              </p>
              <p className="text-sm text-slate-500">
                This might take a moment.
              </p>
            </div>
          )}
          {error && (
            <div className="text-center text-red-500 bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
              <p className="font-bold">Failed to generate ideas</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ideas.map((idea, index) => (
                <div
                  key={index}
                  className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-700 flex flex-col justify-between animate-stagger-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div>
                    <h3 className="font-bold text-lg text-primary">
                      {idea.bundleName}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {idea.description}
                    </p>
                    <div className="mt-2">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-2">
                        Suggested Items:
                      </h4>
                      <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                        {idea.itemNames.map((itemName, i) => (
                          <li key={i}>{itemName}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => onCreateBundle(idea)}
                    className="mt-4 w-full bg-primary/10 text-primary font-semibold py-2 rounded-md hover:bg-primary/20 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    إنشاء حزمة من هذه الفكرة
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="p-4 border-t dark:border-slate-700 flex justify-end">
          <button
            onClick={fetchIdeas}
            disabled={loading}
            className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-secondary transition-colors disabled:bg-slate-400"
          >
            {loading ? "...جاري التوليد" : "توليد أفكار جديدة"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default IdeaGeneratorModal;
