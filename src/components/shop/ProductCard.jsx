import React from 'react';
import { motion } from 'framer-motion';

export default function ProductCard({ product, onAddToCart }) {
    const isSoldOut = !product.in_stock;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group"
        >
            <div className="relative aspect-square overflow-hidden bg-[#f5f4f2] mb-4">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="font-serif text-2xl text-neutral-300">{product.brand?.[0] || 'TSE'}</span>
                    </div>
                )}

                {isSoldOut && (
                    <div className="absolute top-3 left-3 bg-neutral-900 text-white text-[10px] tracking-[0.15em] uppercase px-3 py-1.5">
                        Sold Out
                    </div>
                )}

                {!isSoldOut && (
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <button
                            onClick={() => onAddToCart && onAddToCart(product)}
                            className="w-full bg-neutral-900 text-white py-3 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-neutral-800 transition-colors"
                        >
                            Add to Cart
                        </button>
                    </div>
                )}
            </div>

            <div>
                {product.brand && (
                    <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 mb-1">{product.brand}</p>
                )}
                <h3 className="text-sm text-neutral-900 mb-1 leading-snug">{product.name}</h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-700">${product.price?.toFixed(2)}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-xs text-neutral-400 line-through">${product.compare_at_price.toFixed(2)}</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}