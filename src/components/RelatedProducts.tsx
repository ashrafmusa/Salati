import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase/config";
import firebase from "firebase/compat/app";
import { StoreProduct, Item } from "../types";
import SectionHeader from "./SectionHeader";
import StoreProductCard from "./ProductCard";
import { calculateBundlePrice } from "../utils/helpers";

interface RelatedProductsProps {
  category: string;
  currentProductId: string;
  allItems: Item[];
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  category,
  currentProductId,
  allItems,
}) => {
  const [related, setRelated] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const itemsQuery = db
          .collection("items")
          .where("category", "==", category)
          .where(
            firebase.firestore.FieldPath.documentId(),
            "!=",
            currentProductId
          )
          .limit(4);
        const bundlesQuery = db
          .collection("bundles")
          .where("category", "==", category)
          .where(
            firebase.firestore.FieldPath.documentId(),
            "!=",
            currentProductId
          )
          .limit(4);

        const [itemsSnap, bundlesSnap] = await Promise.all([
          itemsQuery.get(),
          bundlesQuery.get(),
        ]);

        const relatedItems = itemsSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data(), type: "item" } as Item)
        );
        const relatedBundles = bundlesSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data(), type: "bundle" } as any)
        );

        const allRelated = [...relatedItems, ...relatedBundles]
          .sort(() => 0.5 - Math.random())
          .slice(0, 4);

        setRelated(allRelated);
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRelated();
  }, [category, currentProductId]);

  const productPrices = useMemo(() => {
    const priceMap = new Map<string, number>();
    related.forEach((p) => {
      if (p.type === "item") {
        priceMap.set(p.id, p.price);
      } else {
        priceMap.set(p.id, calculateBundlePrice(p, allItems));
      }
    });
    return priceMap;
  }, [related, allItems]);

  if (loading || related.length === 0 || allItems.length === 0) {
    return null;
  }

  return (
    <div className="p-4 mt-8">
      <SectionHeader title="قد يعجبك أيضاً" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map((product) => (
          <StoreProductCard
            key={product.id}
            product={product}
            price={productPrices.get(product.id) || 0}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
