import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function FeaturedBanner() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=1800&q=80"
          alt="Seasonal"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/60 mb-4">
            Autumn / Winter
          </p>
          <h2 className="font-serif text-5xl md:text-6xl mb-4">TSE Highlight 25</h2>
          <p className="text-white/70 text-lg mb-10 max-w-lg mx-auto">
            Style · Low-Tox · Hair Rejuvenation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={createPageUrl('Shop')}
              className="bg-white text-neutral-900 px-10 py-4 text-[11px] tracking-[0.25em] uppercase font-medium hover:bg-neutral-100 transition-all duration-300"
            >
              Shop Now
            </Link>
            <Link
              to={createPageUrl('GiftVouchers')}
              className="border border-white/50 text-white px-10 py-4 text-[11px] tracking-[0.25em] uppercase font-medium hover:bg-white/10 transition-all duration-300"
            >
              Want $75 off?*
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}