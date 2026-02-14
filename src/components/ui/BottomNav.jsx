import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Users, Receipt, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav({ currentPage }) {
  const navItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'My Group', icon: Users, page: 'MyGroups' },
    { name: 'Transactions', icon: Receipt, page: 'Transactions' },
    { name: 'Reports', icon: FileText, page: 'Reports' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 px-2 py-3 z-50" style={{ backgroundColor: '#1a2332', borderTop: '1px solid #2a3f55' }}>
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className="flex flex-col items-center gap-1 px-4 py-1"
            >
              <item.icon 
                className={cn(
                  "w-6 h-6 transition-all",
                  isActive ? "text-cyan-400" : "text-gray-500"
                )} 
              />
              <span className={cn(
                "text-xs font-medium",
                isActive ? "text-cyan-400" : "text-gray-500"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}