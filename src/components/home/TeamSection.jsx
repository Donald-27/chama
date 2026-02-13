import React from 'react';
import { motion } from 'framer-motion';

const team = [
    {
        name: 'Chrystalla Dimarelis',
        role: 'Co-Owner & Stylist',
        bio: 'Industry famous for innovative techniques and an unwavering commitment to your hair health.',
        image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=80'
    },
    {
        name: 'Kayla Tzavellas',
        role: 'Co-Owner & Stylist',
        bio: 'Celebrated for her expertise in precision cutting, colour artistry, and transformative styling.',
        image: '/images/kayla.png'
    }
    ,
    {
        name: 'Hannah-G',
        role: 'Co-Owner & Stylist',
        bio: 'Known for warm client care, creative colour blends, and precision finishing touches.',
        image: '/images/hannah.png'
    }
];

export default function TeamSection() {
    return (
        <section className="py-24 md:py-32 px-6">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <p className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-4">
                        Our People
                    </p>
                    <h2 className="font-serif text-4xl md:text-5xl text-neutral-900 mb-6">
                        Meet the Team
                    </h2>
                    <p className="text-neutral-500 max-w-2xl mx-auto leading-relaxed">
                        These powerhouse Geminis hold over two decades of combined experience, creative expertise, and passion. Your hair is in good hands.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                    {team.map((member, index) => (
                        <motion.div
                            key={member.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            className="group"
                        >
                            <div className="aspect-[3/4] overflow-hidden mb-6">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                            <h3 className="font-serif text-2xl text-neutral-900 mb-1">{member.name}</h3>
                            <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 mb-3">
                                {member.role}
                            </p>
                            <p className="text-neutral-500 text-sm leading-relaxed">{member.bio}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}