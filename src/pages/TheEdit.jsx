import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import localPosts from '../../entities/blog-posts-data.json';
import { Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORY_LABELS = {
    hair_tips: 'Hair Tips',
    trends: 'Trends',
    products: 'Products',
    wellness: 'Wellness',
    news: 'News',
};

export default function TheEdit() {
    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['blog-posts'],
        // Local fallback: try remote then local import
        queryFn: async () => {
            try {
                if (base44 && base44.entities && base44.entities.BlogPost) {
                    const remote = await base44.entities.BlogPost.filter({ published: true }, '-created_date');
                    if (remote && remote.length) return remote;
                }
            } catch (e) {
                // ignore and fallback to local
            }
            return localPosts || [];
        },
    });

    const [selectedPost, setSelectedPost] = useState(null);
    const [loadedImages, setLoadedImages] = useState({});

    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape') setSelectedPost(null);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    function openPost(post) {
        setSelectedPost(post);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Preload images for posts and track which ones actually load successfully.
    useEffect(() => {
        posts.forEach((p) => {
            if (!p.image_url) return;
            const url = p.image_url;
            // Skip if already attempted
            if (loadedImages[url] !== undefined) return;
            const img = new Image();
            img.onload = () => setLoadedImages((s) => ({ ...s, [url]: true }));
            img.onerror = () => setLoadedImages((s) => ({ ...s, [url]: false }));
            img.src = url;
        });
    }, [posts]);

    return (
        <div>
            {/* Hero */}
            <section className="relative py-20 md:py-28 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="/images/edit.png"
                        alt="The Edit"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </div>
                <div className="relative z-10 text-center text-white px-6">
                    <p className="text-[11px] tracking-[0.3em] uppercase text-white/60 mb-4">
                        Our Journal
                    </p>
                    <h1 className="font-serif text-5xl md:text-6xl">The Edit</h1>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
                {isLoading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-24">
                        <h2 className="font-serif text-3xl text-neutral-900 mb-3">Coming Soon</h2>
                        <p className="text-neutral-500">We're working on exciting content for you. Stay tuned!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post, index) => (
                            <motion.article
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group cursor-pointer"
                                onClick={() => openPost(post)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="aspect-[4/3] overflow-hidden mb-5 bg-[#f5f4f2]">
                                    {post.image_url && loadedImages[post.image_url] ? (
                                        <img
                                            src={post.image_url}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="font-serif text-4xl text-neutral-200">TSE</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    {post.category && (
                                        <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400">
                                            {CATEGORY_LABELS[post.category] || post.category}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-neutral-300">
                                        {format(new Date(post.created_date), 'MMM d, yyyy')}
                                    </span>
                                </div>
                                <h2 className="font-serif text-xl text-neutral-900 mb-2 group-hover:underline underline-offset-4 decoration-1">
                                    {post.title}
                                </h2>
                                {post.excerpt && (
                                    <p className="text-sm text-neutral-500 leading-relaxed mb-3">{post.excerpt}</p>
                                )}
                                <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-neutral-900 font-medium">
                                    Read More <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal for full post */}
            {selectedPost && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-6 md:p-12">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setSelectedPost(null)}
                    />
                    <article className="relative z-10 max-w-3xl w-full bg-white rounded shadow-lg overflow-auto max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-serif text-xl">{selectedPost.title}</h3>
                            <button
                                aria-label="Close"
                                className="text-neutral-600 hover:text-neutral-900"
                                onClick={() => setSelectedPost(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 prose prose-neutral">
                            {selectedPost.image_url && loadedImages[selectedPost.image_url] && (
                                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                                <img
                                    src={selectedPost.image_url}
                                    alt={selectedPost.title}
                                    className="w-full h-auto mb-4 object-cover"
                                />
                            )}
                            <div dangerouslySetInnerHTML={{ __html: selectedPost.content || '' }} />
                        </div>
                    </article>
                </div>
            )}
        </div>
    );
}