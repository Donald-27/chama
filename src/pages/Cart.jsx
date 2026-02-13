import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ShoppingBag, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const SHIPPING_FEE = 15;

export default function Cart() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [checkoutMode, setCheckoutMode] = useState(false);
    const [form, setForm] = useState({
        name: '',
        phone: '',
        shipping_address: '',
    });

    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me(),
    });

    const { data: cartItems = [], isLoading } = useQuery({
        queryKey: ['cart', user?.email],
        queryFn: () => base44.entities.Cart.filter({ user_email: user.email }),
        enabled: !!user?.email,
    });

    const removeItem = useMutation({
        mutationFn: (id) => base44.entities.Cart.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Item removed');
        },
    });

    const updateQuantity = useMutation({
        mutationFn: ({ id, quantity }) => base44.entities.Cart.update(id, { quantity }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    });

    const createCheckout = useMutation({
        mutationFn: async (data) => {
            const checkout = await base44.entities.CheckoutRequest.create(data);

            await base44.integrations.Core.SendEmail({
                from_name: 'The Salon Edit Shop',
                to: 'hannahgilbreathe87@gmail.com',
                subject: `🛒 New Order - ${form.name} - $${(subtotal + SHIPPING_FEE).toFixed(2)}`,
                body: `
          <h2>New Order Awaiting Payment Details</h2>
          <p><strong>Customer:</strong> ${form.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Phone:</strong> ${form.phone}</p>
          <p><strong>Address:</strong> ${form.shipping_address}</p>
          <hr>
          <h3>Items:</h3>
          <ul>
            ${cartItems.map(item => `<li>${item.product_name} x${item.quantity} - $${(item.product_price * item.quantity).toFixed(2)}</li>`).join('')}
          </ul>
          <p><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>
          <p><strong>Shipping:</strong> $${SHIPPING_FEE}</p>
          <p><strong>Total:</strong> $${(subtotal + SHIPPING_FEE).toFixed(2)}</p>
          <p><strong>50% Deposit Required:</strong> $${((subtotal + SHIPPING_FEE) / 2).toFixed(2)}</p>
          <hr>
          <p><strong>Action Required:</strong> Please add payment details for checkout ID: ${checkout.id}</p>
        `
            });

            for (const item of cartItems) {
                await base44.entities.Cart.delete(item.id);
            }

            return checkout;
        },
        onSuccess: (checkout) => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            navigate(createPageUrl('Checkout') + '?id=' + checkout.id);
        },
    });

    const subtotal = cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
    const total = subtotal + SHIPPING_FEE;
    const depositAmount = total / 2;

    const handleCheckout = (e) => {
        e.preventDefault();
        createCheckout.mutate({
            customer_email: user.email,
            customer_name: form.name,
            type: 'product_order',
            items: cartItems.map(item => ({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                price: item.product_price,
            })),
            total_amount: total,
            deposit_amount: depositAmount,
            shipping_address: form.shipping_address,
            phone: form.phone,
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-24 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                <h2 className="font-serif text-2xl mb-2">Please Log In</h2>
                <p className="text-neutral-500">Log in to view your cart and checkout.</p>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-24 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                <h2 className="font-serif text-2xl mb-2">Your cart is empty</h2>
                <p className="text-neutral-500 mb-8">Add some products to get started!</p>
                <Link to={createPageUrl('Shop')}>
                    <Button className="bg-neutral-900 hover:bg-neutral-800">
                        Continue Shopping
                    </Button>
                </Link>
            </div>
        );
    }

    if (checkoutMode) {
        return (
            <div className="max-w-3xl mx-auto px-6 py-16">
                <h1 className="font-serif text-3xl mb-8">Checkout</h1>
                <form onSubmit={handleCheckout} className="space-y-6">
                    <div className="bg-neutral-50 p-6 rounded-lg mb-6">
                        <h3 className="font-medium mb-4">Order Summary</h3>
                        <div className="space-y-2 text-sm">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex justify-between">
                                    <span>{item.product_name} x{item.quantity}</span>
                                    <span>${(item.product_price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between pt-2 border-t">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>${SHIPPING_FEE.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-700 font-bold pt-2 border-t">
                                <span>50% Deposit (Pay Now)</span>
                                <span>${depositAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-neutral-500">
                                <span>Balance (Pay on Delivery)</span>
                                <span>${depositAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label>Full Name *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>Phone Number *</Label>
                            <Input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>Shipping Address *</Label>
                            <Textarea
                                value={form.shipping_address}
                                onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                                rows={3}
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
                        <p className="font-medium mb-2">💡 How Payment Works:</p>
                        <ol className="list-decimal list-inside space-y-1 text-neutral-600">
                            <li>Click "Proceed to Payment" below</li>
                            <li>Wait for payment details (bank account info will appear)</li>
                            <li>Pay 50% deposit to the provided account</li>
                            <li>Upload payment screenshot for verification</li>
                            <li>We'll confirm and ship your order</li>
                            <li>Pay remaining 50% on delivery</li>
                        </ol>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCheckoutMode(false)}
                        >
                            Back to Cart
                        </Button>
                        <Button
                            type="submit"
                            disabled={createCheckout.isPending}
                            className="flex-1 bg-neutral-900 hover:bg-neutral-800"
                        >
                            {createCheckout.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Proceed to Payment
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-16">
            <h1 className="font-serif text-3xl mb-8">Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4 bg-white border border-neutral-200 p-4">
                            <div className="w-20 h-20 bg-neutral-100 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-medium">{item.product_name}</h3>
                                <p className="text-sm text-neutral-500">${item.product_price.toFixed(2)}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => updateQuantity.mutate({ id: item.id, quantity: Math.max(1, item.quantity - 1) })}
                                        className="px-2 py-1 border border-neutral-300 text-sm"
                                    >
                                        -
                                    </button>
                                    <span className="px-3">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity + 1 })}
                                        className="px-2 py-1 border border-neutral-300 text-sm"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">${(item.product_price * item.quantity).toFixed(2)}</p>
                                <button
                                    onClick={() => removeItem.mutate(item.id)}
                                    className="text-red-500 hover:text-red-700 mt-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-neutral-50 p-6 sticky top-20">
                        <h3 className="font-serif text-xl mb-4">Order Summary</h3>
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>${SHIPPING_FEE.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-700 font-semibold pt-2 border-t">
                                <span>Pay Now (50%)</span>
                                <span>${depositAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => setCheckoutMode(true)}
                            className="w-full bg-neutral-900 hover:bg-neutral-800 mb-4"
                        >
                            Proceed to Checkout
                        </Button>

                        <div className="bg-white border border-green-200 p-4 rounded-lg text-sm">
                            <div className="flex items-start gap-2">
                                <MessageCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-green-900 mb-1">Questions?</p>
                                    <p className="text-neutral-600 text-xs mb-2">Chat with us on WhatsApp for product photos, videos, and instant support!</p>
                                    <a
                                        href="https://wa.me/61468231108"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-green-600 hover:underline font-medium"
                                    >
                                        💬 Chat on WhatsApp
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}