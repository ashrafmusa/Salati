import { Item, Bundle, StoreSettings } from "../types";

export interface DataValidationIssue {
  message: string;
  link: string;
  linkText: string;
}

/**
 * Scans the database for common data integrity issues.
 * @param items - A list of all individual items.
 * @param bundles - A list of all product bundles.
 * @param settings - The current store settings.
 * @returns An array of validation issue objects.
 */
export const validateData = (
  items: Item[],
  bundles: Bundle[],
  settings: StoreSettings | null
): DataValidationIssue[] => {
  const issues: DataValidationIssue[] = [];
  const allItemIds = new Set(items.map((item) => item.id));

  // 1. Check for broken links in bundles (items that were deleted but still referenced)
  bundles.forEach((bundle) => {
    bundle.contents.forEach((contentItem) => {
      if (!allItemIds.has(contentItem.itemId)) {
        issues.push({
          message: `الحزمة "${bundle.arabicName}" تحتوي على صنف محذوف.`,
          link: "/bundles",
          linkText: "إصلاح الحزم",
        });
      }
    });
  });

  // 2. Check for unconfigured store settings
  if (
    !settings?.storeAddress ||
    settings.storeAddress.includes("Please configure")
  ) {
    issues.push({
      message: "عنوان استلام المتجر غير مهيأ.",
      link: "/settings",
      linkText: "تحديث الإعدادات",
    });
  }

  // Return a unique list of issues to avoid duplicate messages for the same problem type
  const uniqueMessages = new Set(issues.map((issue) => issue.message));
  return Array.from(uniqueMessages).map(
    (message) => issues.find((issue) => issue.message === message)!
  );
};
