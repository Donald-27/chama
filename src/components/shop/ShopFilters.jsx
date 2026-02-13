import React from 'react';

const CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'shampoo', label: 'Shampoo' },
  { value: 'conditioner', label: 'Conditioner' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'styling', label: 'Styling' },
  { value: 'colour', label: 'Colour' },
  { value: 'tools', label: 'Tools' },
  { value: 'skincare', label: 'Skincare' },
  { value: 'supplements', label: 'Supplements' },
  { value: 'sets', label: 'Sets' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Alphabetically, A–Z' },
  { value: 'name_desc', label: 'Alphabetically, Z–A' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'newest', label: 'Newest' },
];

export default function ShopFilters({
  activeCategory,
  setActiveCategory,
  sortBy,
  setSortBy,
  productCount
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-4 py-2 text-[11px] tracking-[0.15em] uppercase transition-all duration-200 ${
              activeCategory === cat.value
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-neutral-400">{productCount} products</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-xs text-neutral-600 bg-transparent border border-neutral-200 px-3 py-2 focus:outline-none focus:border-neutral-400"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}