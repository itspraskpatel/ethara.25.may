'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Link2, Share2 } from 'lucide-react';

type ShareButtonProps = {
  boardId: string | null;
};

export function ShareButton({ boardId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => {
    if (!boardId || typeof window === 'undefined') return '';
    return `${window.location.origin}/board/${boardId}`;
  }, [boardId]);

  const copyLink = async () => {
    if (!shareUrl) return;

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_700);
  };

  return (
    <div className="pointer-events-auto fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 max-sm:right-3">
      <AnimatePresence>
        {copied && (
          <motion.div
            className="rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-xl"
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
          >
            Link copied
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className="group flex items-center gap-3 rounded-[1.5rem] border border-white/80 bg-slate-950 px-5 py-4 font-black text-white shadow-[0_20px_80px_rgba(15,23,42,0.24)] transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        whileHover={{ y: -4, scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        onClick={copyLink}
        disabled={!shareUrl}
      >
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/12 transition-transform group-hover:rotate-6">
          {copied ? <Check size={18} /> : <Share2 size={18} />}
        </span>
        <span className="hidden sm:inline">Share board</span>
        <Link2 className="sm:hidden" size={18} />
      </motion.button>
    </div>
  );
}
