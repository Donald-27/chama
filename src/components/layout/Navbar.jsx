import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CartButton from '../shop/CartButton';

const NAV_LINKS = [
    { label: 'Home', page: 'Home' },
    { label: 'Shop', page: 'Shop' },
    { label: 'Services', page: 'Services' },
    { label: 'The Edit', page: 'TheEdit' },
    { label: 'Bookings', page: 'Bookings' },
    { label: 'Gift Vouchers', page: 'GiftVouchers' },
];

export default function Navbar({ currentPageName }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Top banner */}
            <div className="bg-[#1a1a1a] text-white text-center py-2 px-4">
                <p className="text-[11px] tracking-[0.25em] uppercase font-light">
                    $15 Flat Rate Shipping US-Wide
                </p>
            </div>

            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 -ml-2"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        {/* Logo */}
                        <Link
                            to={createPageUrl('Home')}
                            className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
                        >
                            <h1 className="font-serif text-lg md:text-xl tracking-[0.15em] uppercase text-neutral-900">
                                The Salon Edit
                            </h1>
                        </Link>

                        {/* Desktop nav */}
                        <div className="hidden md:flex items-center gap-8">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.page}
                                    to={createPageUrl(link.page)}
                                    className={`text-[11px] tracking-[0.2em] uppercase transition-colors duration-300 ${currentPageName === link.page
                                            ? 'text-neutral-900 font-medium'
                                            : 'text-neutral-500 hover:text-neutral-900'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Cart icon */}
                        <CartButton />
                    </div>
                </div>

                {/* Mobile nav */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="md:hidden overflow-hidden bg-white border-t border-neutral-100"
                        >
                            <div className="py-4 px-6 space-y-1">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.page}
                                        to={createPageUrl(link.page)}
                                        onClick={() => setMobileOpen(false)}
                                        className={`block py-3 text-[12px] tracking-[0.2em] uppercase transition-colors ${currentPageName === link.page
                                                ? 'text-neutral-900 font-medium'
                                                : 'text-neutral-500'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
}