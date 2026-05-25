'use client';

import { motion } from 'framer-motion';
import { RadioTower, UsersRound } from 'lucide-react';

type PresenceBadgeProps = {
  activeUsers: number;
  isConnected: boolean;
};

export function PresenceBadge({ activeUsers, isConnected }: PresenceBadgeProps) {
  return (
    <motion.div
      className="pointer-events-auto fixed right-4 top-4 z-40 flex items-center gap-3 rounded-[1.4rem] border border-white/80 bg-white/85 px-4 py-3 shadow-[0_20px_70px_rgba(15,23,42,0.14)] backdrop-blur-2xl max-sm:right-3"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 290, damping: 25 }}
      whileHover={{ y: -3, scale: 1.03 }}
      aria-live="polite"
    >
      <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-lime-100 text-lime-800">
        <UsersRound size={18} />
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-lime-500" />
        </span>
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Active now</p>
        <p className="text-lg font-black text-slate-950">{activeUsers} {activeUsers === 1 ? 'stranger' : 'strangers'}</p>
      </div>
      <div className="hidden items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 md:flex">
        <RadioTower size={12} />
        {isConnected ? 'Live' : 'Offline'}
      </div>
    </motion.div>
  );
}
