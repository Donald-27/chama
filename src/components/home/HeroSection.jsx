import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function HeroSection() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1800&q=80"
                    alt="Salon"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/70" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-40" />
            </div>

            <div className="relative z-10 text-center text-white px-6 max-w-3xl">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-[11px] tracking-[0.4em] uppercase mb-6 text-white/80"
                >
                    Ready to meet your dream hair?
                </motion.p>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15 }}
                    className="font-serif text-6xl md:text-8xl lg:text-9xl font-light mb-8 leading-[0.9] tracking-tight"
                >
                    The Salon<br />
                    <span className="bg-gradient-to-r from-white via-neutral-100 to-neutral-300 bg-clip-text text-transparent">
                        Edit
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-sm md:text-base text-white/80 leading-relaxed max-w-xl mx-auto mb-10"
                >
                    A truly bespoke hairstyling experience across Australia, centring on each client's unique hair vision. Your low tox salon.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.45 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link
                        to={createPageUrl('Bookings')}
                        className="bg-white text-neutral-900 px-10 py-4 text-[11px] tracking-[0.25em] uppercase font-medium hover:bg-neutral-100 transition-all duration-300"
                    >
                        Book Now
                    </Link>
                    <Link
                        to={createPageUrl('Services')}
                        className="border border-white/50 text-white px-10 py-4 text-[11px] tracking-[0.25em] uppercase font-medium hover:bg-white/10 transition-all duration-300"
                    >
                        See Services
                    </Link>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <div className="w-[1px] h-12 bg-white/30 relative overflow-hidden">
                    <motion.div
                        className="w-full h-4 bg-white/80 absolute top-0"
                        animate={{ y: [0, 48, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>
            </motion.div>
        </section>
    );
}