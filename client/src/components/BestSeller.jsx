import React from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "../context/appContext";

const BestSeller = () => {
  const { products } = useAppContext();

  // Get first 5 in-stock products
  const bestSellers = products.filter((product) => product.inStock).slice(0, 5);

  return (
    <div className="mt-16">
      <p className="text-2xl md:text-3xl font-medium mb-6">Best Sellers</p>

      {bestSellers.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id || product.name} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No best sellers available right now.</p>
      )}
    </div>
  );
};

export default BestSeller;
