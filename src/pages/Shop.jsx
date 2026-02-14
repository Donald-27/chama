import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listProducts } from '@/lib/data-loader';
import { openWhatsApp, generateOrderCode } from '@/lib/whatsapp';
import ProductCard from '../components/shop/ProductCard';
import ShopFilters from '../components/shop/ShopFilters';
import { Loader2 } from 'lucide-react';

export default function Shop() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name_asc');

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => listProducts(),
    });

    const [cart, setCart] = React.useState([]);

    const addToCart = (product) => {
        setCart((c) => {
            const existing = c.find((i) => i.id === product.id);
            if (existing) {
                return c.map((i) => i.id === product.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i);
            }
            return [...c, { ...product, quantity: 1 }];
        });
    };

    const phone = '254724779523'; // WhatsApp recipient (no +)

    const checkoutWhatsApp = () => {
        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }
        const message = 'If interested in this app or one closer to this kindly message or click send';
        openWhatsApp(phone, message);
    };

    const filtered = products.filter(
        (p) => activeCategory === 'all' || p.category === activeCategory
    );

    const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
            case 'name_asc': return (a.name || '').localeCompare(b.name || '');
            case 'name_desc': return (b.name || '').localeCompare(a.name || '');
            case 'price_asc': return (a.price || 0) - (b.price || 0);
            case 'price_desc': return (b.price || 0) - (a.price || 0);
            case 'newest': return new Date(b.created_date) - new Date(a.created_date);
            default: return 0;
        }
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="text-center mb-16">
                <p className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-3">
                    The Salon Edit
                </p>
                <h1 className="font-serif text-4xl md:text-5xl text-neutral-900 mb-4">Shop</h1>
                <p className="text-neutral-500 max-w-lg mx-auto">
                    Low-tox, high-performance hair care. $15 flat rate shipping US-wide.
                </p>
            </div>

            <ShopFilters
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
                productCount={sorted.length}
            />

            {/* Cart summary / checkout */}
            <div className="max-w-7xl mx-auto px-6 mt-6 mb-6">
                <div className="flex justify-end items-center gap-4">
                    <div className="text-sm text-neutral-700">Items in cart: {cart.length}</div>
                    <button onClick={checkoutWhatsApp} className="bg-green-600 text-white px-4 py-2 rounded">Checkout via WhatsApp</button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
            ) : sorted.length === 0 ? (
                <div className="text-center py-24">
                    <p className="text-neutral-400">No products found in this category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {sorted.map((product) => (
                        <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                    ))}
                </div>
            )}
        </div>
    );
}