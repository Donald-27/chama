import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Heart, Sparkles } from 'lucide-react';

const pillars = [
  {
    icon: Leaf,
    title: 'Low Toxicity',
    description: 'All of our products are free of harsh chemicals and damaging ingredients. Our low-tox approach keeps your hair healthy.'
  },
  {
    icon: Heart,
    title: 'Hair Health',
    description: 'Good hair is healthy hair. We believe in nurturing your hair\'s vitality, not just enhancing its appearance.'
  },
  {
    icon: Sparkles,
    title: 'Personalised Care',
    description: 'Every visit is tailored to your individual preferences. We collaborate closely to bring your unique hair vision to life.'
  }
];

export default function PhilosophySection() {
  return (
    <section className="py-24 md:py-32 bg-[#f8f7f5]">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-4">
            Our Philosophy
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-neutral-900 mb-6">
            The Salon Edit Philosophy
          </h2>
          <p className="text-neutral-500 max-w-2xl mx-auto mb-16 leading-relaxed">
            To keep your strands looking and feeling their best, we use the best. We want to raise the bar for salon services.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                <pillar.icon className="w-6 h-6 text-neutral-700" />
              </div>
              <h3 className="font-serif text-xl mb-3 text-neutral-900">{pillar.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{pillar.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}