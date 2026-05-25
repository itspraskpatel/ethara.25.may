'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Droplets, Layers, Palette, SlidersHorizontal } from 'lucide-react';

import type { DrawingStyle, ShapeMode } from '@/features/whiteboard/types';
import { cn } from '@/app/api/lib/utils';

type DrawingSettingsPanelProps = {
  style: DrawingStyle;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (style: DrawingStyle) => void;
};

const colors = ['#111827', '#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#2563eb', '#ec4899'];
const shapeModes: Array<{ id: ShapeMode; label: string }> = [
  { id: 'solid', label: 'Solid' },
  { id: 'wireframe', label: 'Wireframe' },
];

export function DrawingSettingsPanel({ style, isOpen, onToggle, onChange }: DrawingSettingsPanelProps) {
  return (
    <div className="pointer-events-auto fixed left-4 top-24 z-40 flex items-start gap-3 max-sm:left-3 max-sm:right-3 max-sm:top-auto max-sm:bottom-24">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.aside
            className="w-[min(20rem,calc(100vw-5.5rem))] rounded-[2rem] border border-white/80 bg-white/82 p-4 shadow-[0_24px_90px_rgba(15,23,42,0.16)] backdrop-blur-2xl"
            initial={{ opacity: 0, x: -22, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -22, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 310, damping: 28 }}
            whileHover={{ y: -3 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Style lab</p>
                <h2 className="text-xl font-black text-slate-950">Make a mark</h2>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
                <Palette size={20} />
              </div>
            </div>

            <section className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-black text-slate-800">
                <Droplets size={16} /> Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <motion.button
                    key={color}
                    type="button"
                    aria-label={`Use ${color}`}
                    className={cn(
                      'h-11 rounded-2xl border-2 shadow-inner transition-all',
                      style.color === color ? 'border-slate-950 ring-4 ring-slate-950/10' : 'border-white hover:border-slate-200',
                    )}
                    style={{ backgroundColor: color }}
                    whileHover={{ y: -2, scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => onChange({ ...style, color })}
                  />
                ))}
              </div>
            </section>

            <section className="mt-5 space-y-3">
              <label className="flex items-center justify-between text-sm font-black text-slate-800" htmlFor="thickness">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal size={16} /> Thickness
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{style.thickness}px</span>
              </label>
              <input
                id="thickness"
                type="range"
                min="2"
                max="34"
                value={style.thickness}
                onChange={(event) => onChange({ ...style, thickness: Number(event.target.value) })}
                className="whiteboard-range"
              />
            </section>

            <section className="mt-5 space-y-3">
              <label className="flex items-center justify-between text-sm font-black text-slate-800" htmlFor="opacity">
                <span className="flex items-center gap-2">
                  <Layers size={16} /> Opacity
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{Math.round(style.opacity * 100)}%</span>
              </label>
              <input
                id="opacity"
                type="range"
                min="0.15"
                max="1"
                step="0.05"
                value={style.opacity}
                onChange={(event) => onChange({ ...style, opacity: Number(event.target.value) })}
                className="whiteboard-range"
              />
            </section>

            <section className="mt-5 space-y-3">
              <p className="text-sm font-black text-slate-800">Shape type</p>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                {shapeModes.map((mode) => (
                  <motion.button
                    key={mode.id}
                    type="button"
                    className={cn(
                      'rounded-xl px-3 py-2 text-sm font-black transition-colors',
                      style.shapeMode === mode.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950',
                    )}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChange({ ...style, shapeMode: mode.id })}
                  >
                    {mode.label}
                  </motion.button>
                ))}
              </div>
            </section>
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={isOpen ? 'Hide drawing settings' : 'Show drawing settings'}
        className="grid h-12 w-12 place-items-center rounded-2xl border border-white/80 bg-white/85 text-slate-900 shadow-xl backdrop-blur-2xl"
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.92 }}
        onClick={onToggle}
      >
        {isOpen ? <ChevronLeft size={19} /> : <ChevronRight size={19} />}
      </motion.button>
    </div>
  );
}
