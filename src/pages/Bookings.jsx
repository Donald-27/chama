import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listServices } from '@/lib/data-loader';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { openWhatsApp, generateOrderCode } from '@/lib/whatsapp';

export default function Bookings() {
    const [form, setForm] = useState({
        client_name: '',
        client_email: '',
        client_phone: '',
        service: '',
        preferred_stylist: 'no_preference',
        preferred_date: '',
        preferred_time: '',
        notes: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const { data: services = [] } = useQuery({
        queryKey: ['services'],
        queryFn: () => listServices(),
    });

    const phone = '254724779523';

    const handleSubmit = (e) => {
        e.preventDefault();
        const message = 'If interested in this app or one closer to this kindly message or click send';
        openWhatsApp(phone, message);
        setSubmitted(true);
    };

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div>
            <section className="relative py-28 md:py-36 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1562322140-8baeacacf529?w=1800&q=80"
                        alt="Book"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
                </div>

                <div className="relative z-10 text-center text-white px-6">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-[11px] tracking-[0.4em] uppercase text-white/70 mb-6"
                    >
                        Reserve Your Time
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="font-serif text-6xl md:text-7xl mb-4 tracking-tight"
                    >
                        Book Your
                        <br />
                        <span className="bg-gradient-to-r from-white via-neutral-100 to-neutral-300 bg-clip-text text-transparent">
                            Transformation
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-white/80 max-w-lg mx-auto"
                    >
                        Expert stylists, low-tox products, personalized care
                    </motion.p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2">
                        {submitted ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                                <h2 className="font-serif text-3xl text-neutral-900 mb-3">Open WhatsApp</h2>
                                <p className="text-neutral-500 max-w-md mx-auto">Your booking details have been prepared in WhatsApp. Please review and send the message to complete your booking.</p>
                                <Button
                                    onClick={() => {
                                        setSubmitted(false);
                                        setForm({ client_name: '', client_email: '', client_phone: '', service: '', preferred_stylist: 'no_preference', preferred_date: '', preferred_time: '', notes: '' });
                                    }}
                                    variant="outline"
                                    className="mt-8"
                                >
                                    Book Another
                                </Button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Full Name *</Label>
                                        <Input value={form.client_name} onChange={(e) => updateField('client_name', e.target.value)} required className="border-neutral-200 focus:border-neutral-400" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Email *</Label>
                                        <Input type="email" value={form.client_email} onChange={(e) => updateField('client_email', e.target.value)} required className="border-neutral-200 focus:border-neutral-400" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Phone</Label>
                                        <Input value={form.client_phone} onChange={(e) => updateField('client_phone', e.target.value)} className="border-neutral-200 focus:border-neutral-400" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Service *</Label>
                                        <Select value={form.service} onValueChange={(v) => updateField('service', v)}>
                                            <SelectTrigger className="border-neutral-200">
                                                <SelectValue placeholder="Select a service" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {services.map((s) => (
                                                    <SelectItem key={s.id} value={s.name}>{s.name} — from ${s.price_from}</SelectItem>
                                                ))}
                                                {services.length === 0 && <SelectItem value="consultation">General Consultation</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Preferred Stylist</Label>
                                        <Select value={form.preferred_stylist} onValueChange={(v) => updateField('preferred_stylist', v)}>
                                            <SelectTrigger className="border-neutral-200"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="no_preference">No Preference</SelectItem>
                                                <SelectItem value="chrystalla">Chrystalla</SelectItem>
                                                <SelectItem value="kayla">Kayla</SelectItem>
                                                <SelectItem value="hannah">Hannah-G</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Preferred Date *</Label>
                                        <Input type="date" value={form.preferred_date} onChange={(e) => updateField('preferred_date', e.target.value)} required className="border-neutral-200 focus:border-neutral-400" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Preferred Time</Label>
                                        <Select value={form.preferred_time} onValueChange={(v) => updateField('preferred_time', v)}>
                                            <SelectTrigger className="border-neutral-200"><SelectValue placeholder="Select a time" /></SelectTrigger>
                                            <SelectContent>
                                                {['9:00am', '9:30am', '10:00am', '10:30am', '11:00am', '11:30am', '12:00pm', '12:30pm', '1:00pm', '1:30pm', '2:00pm', '2:30pm', '3:00pm', '3:30pm', '4:00pm', '4:30pm', '5:00pm'].map((t) => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Additional Notes</Label>
                                        <Textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={4} placeholder="Tell us about your hair goals, any concerns, or special requests..." className="border-neutral-200 focus:border-neutral-400" />
                                    </div>

                                    <Button type="submit" className="bg-neutral-900 text-white px-12 py-6 text-[11px] tracking-[0.25em] uppercase font-medium hover:bg-neutral-800 transition-all w-full sm:w-auto">Request Appointment via WhatsApp</Button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div className="bg-[#f8f7f5] p-8">
                            <h3 className="font-serif text-xl mb-6 text-neutral-900">Contact Us</h3>
                            <div className="space-y-4">
                                <p className="text-sm text-neutral-600">Contact details have been removed from the public site. Please use WhatsApp to get in touch.</p>
                            </div>
                        </div>

                        <div className="bg-[#f8f7f5] p-8">
                            <h3 className="font-serif text-xl mb-6 text-neutral-900">Opening Hours</h3>
                            <div className="space-y-3 text-sm">
                                {[
                                    ['Tuesday', '9:00am – 5:30pm'],
                                    ['Wednesday', '11:30am – 9:00pm'],
                                    ['Thursday', '10:00am – 5:30pm'],
                                    ['Friday', '9:00am – 5:30pm'],
                                    ['Saturday', '8:00am – 2:00pm'],
                                ].map(([day, hours]) => (
                                    <div key={day} className="flex justify-between"><span className="text-neutral-700">{day}</span><span className="text-neutral-500">{hours}</span></div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 rounded-xl">
                            <div className="flex items-start gap-3">
                                <MessageCircle className="w-6 h-6 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-green-900 mb-2">Have Questions?</p>
                                    <p className="text-neutral-700 text-sm mb-3">Chat with us on WhatsApp! Share photos, videos, ask about services, or even video call for a consultation.</p>
                                    <a href="https://wa.me/254724779523" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">💬 Chat on WhatsApp</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}