import React from 'react';
import { Button } from '@/components/ui/button';
import { openWhatsApp, generateOrderCode } from '@/lib/whatsapp';

export default function Checkout() {
    const phone = '254724779523';

    const openForOrder = () => {
        const message = 'If interested in this app or one closer to this kindly message or click send';
        openWhatsApp(phone, message);
    };

    return (
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
            <h1 className="font-serif text-3xl mb-6">Checkout / Payment</h1>
            <p className="text-neutral-600 mb-6">This storefront uses WhatsApp for order confirmations and payment follow-up. Click the button below to open WhatsApp with a prefilled message to our team.</p>
            <Button onClick={openForOrder} className="bg-green-600 text-white px-6 py-3">Contact on WhatsApp</Button>
        </div>
    );
}