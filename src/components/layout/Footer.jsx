import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Footer() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email) {
            setSubscribed(true);
            setEmail('');
        }
    };

    return (
        <footer className="bg-[#1a1a1a] text-white">
            {/* Newsletter */}
            <div className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-16 text-center">
                    <p className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-3">
                        Subscribe to The Edit
                    </p>
                    <h3 className="font-serif text-2xl md:text-3xl mb-2">Stay in the Loop</h3>
                    <p className="text-neutral-400 text-sm mb-8 max-w-md mx-auto">
                        Earn a 10% discount on your first online retail order. $15 flat rate shipping.*
                    </p>
                    {subscribed ? (
                        <p className="text-sm text-emerald-400">Thank you for subscribing!</p>
                    ) : (
                        <form onSubmit={handleSubscribe} className="flex max-w-md mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                className="flex-1 bg-transparent border border-white/20 px-5 py-3 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/50 transition-colors"
                                required
                            />
                            <button
                                type="submit"
                                className="bg-white text-neutral-900 px-8 py-3 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-neutral-200 transition-colors"
                            >
                                Subscribe
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Footer grid */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <h4 className="font-serif text-lg tracking-[0.15em] uppercase mb-4">
                            The Salon Edit
                        </h4>
                        <p className="text-neutral-400 text-sm leading-relaxed">
                            {/* Contact details removed */}
                        </p>
                    </div>

                    {/* Hours */}
                    <div>
                        <h5 className="text-[11px] tracking-[0.25em] uppercase text-neutral-400 mb-6">Hours</h5>
                        <div className="space-y-2 text-sm">
                            {[
                                ['Tuesday', '9:00am – 5:30pm'],
                                ['Wednesday', '11:30am – 9:00pm'],
                                ['Thursday', '10:00am – 5:30pm'],
                                ['Friday', '9:00am – 5:30pm'],
                                ['Saturday', '8:00am – 2:00pm'],
                            ].map(([day, hours]) => (
                                <div key={day} className="flex justify-between gap-4">
                                    <span className="text-neutral-300">{day}</span>
                                    <span className="text-neutral-500">{hours}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h5 className="text-[11px] tracking-[0.25em] uppercase text-neutral-400 mb-6">Quick Links</h5>
                        <div className="space-y-3">
                            {[
                                { label: 'Home', page: 'Home' },
                                { label: 'Shop', page: 'Shop' },
                                { label: 'Services', page: 'Services' },
                                { label: 'Book Appointment', page: 'Bookings' },
                                { label: 'The Edit', page: 'TheEdit' },
                                { label: 'Gift Vouchers', page: 'GiftVouchers' },
                            ].map((link) => (
                                <Link
                                    key={link.page}
                                    to={createPageUrl(link.page)}
                                    className="block text-sm text-neutral-400 hover:text-white transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Social */}
                    <div>
                        <h5 className="text-[11px] tracking-[0.25em] uppercase text-neutral-400 mb-6">Follow Us</h5>
                        <div className="space-y-3">
                            {['Facebook', 'Instagram', 'TikTok'].map((platform) => (
                                <a
                                    key={platform}
                                    href="#"
                                    className="block text-sm text-neutral-400 hover:text-white transition-colors"
                                >
                                    {platform}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-neutral-500 text-xs">
                        © The Salon Edit, 2026
                    </p>
                    <div className="flex gap-6 text-xs text-neutral-500">
                        <a href="#" className="hover:text-white transition-colors">Privacy & Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Shipping & Returns</a>
                        <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}