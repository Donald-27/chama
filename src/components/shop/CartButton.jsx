import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CartButton() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.email],
    queryFn: () => base44.entities.Cart.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const count = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <Link to={createPageUrl('Cart')} className="relative p-2 -mr-2">
      <ShoppingBag className="w-5 h-5 text-neutral-700" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-neutral-900 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}