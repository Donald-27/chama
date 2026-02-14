import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listServices } from '@/lib/data-loader';
import { openWhatsApp, generateOrderCode } from '@/lib/whatsapp';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Loader2, Clock } from 'lucide-react';

const CATEGORY_LABELS = {
    cut: 'Cuts',
    colour: 'Colour',
    styling: 'Styling',
    treatment: 'Treatments',
    package: 'Packages',
};

export default function Services() {
    const [activeTab, setActiveTab] = useState('all');

    const { data: services = [], isLoading } = useQuery({
        queryKey: ['services'],
        queryFn: () => listServices(),
    });

    const phone = '254724779523';

    const bookService = () => {
        const message = 'If interested in this app or one closer to this kindly message or click send';
        openWhatsApp(phone, message);
    };

    const filtered = activeTab === 'all'
        ? services
        : services.filter((s) => s.category === activeTab);

    return (
        <div>
            {/* Hero */}
            <section className="relative py-24 md:py-32 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1800&q=80"
                        alt="Services"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </div>
                <div className="relative z-10 text-center text-white px-6">
                    <p className="text-[11px] tracking-[0.3em] uppercase text-white/60 mb-4">
                        What We Do
                    </p>
                    <h1 className="font-serif text-5xl md:text-6xl mb-4">Our Services</h1>
                    <p className="text-white/70 max-w-lg mx-auto">
                        From precision cuts to transformative colour — every service is tailored to you.
                    </p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-12 justify-center">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase transition-all ${activeTab === 'all'
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                            }`}
                    >
                        All
                    </button>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase transition-all ${activeTab === key
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-neutral-400">No services added yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filtered.map((service, index) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="group bg-white border border-neutral-100 hover:border-neutral-200 p-8 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-serif text-xl text-neutral-900 mb-1">{service.name}</h3>
                                        {service.category && (
                                            <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400">
                                                {CATEGORY_LABELS[service.category] || service.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-light text-neutral-900">
                                            from ${service.price_from?.toFixed(0)}
                                            {service.price_to && ` – $${service.price_to.toFixed(0)}`}
                                        </p>
                                    </div>
                                </div>

                                {service.description && (
                                    <p className="text-sm text-neutral-500 leading-relaxed mb-4">{service.description}</p>
                                )}

                                <div className="flex items-center gap-4">
                                    {service.duration_minutes && (
                                        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{service.duration_minutes} mins</span>
                                        </div>
                                    )}
                                    <Link
                                        to={createPageUrl('Bookings')}
                                        className="ml-auto text-[11px] tracking-[0.15em] uppercase text-neutral-900 font-medium hover:underline underline-offset-4 transition-all"
                                    >
                                        Book Now →
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}