'use client';

import { Circle, Eraser, Hand, Minus, MousePointer2, Pencil, RotateCcw, Square, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

import type { WhiteboardTool } from '@/features/whiteboard/types';
import { cn } from '@/app/api/lib/utils';

type ToolbarProps = {
  selectedTool: WhiteboardTool;
  canUndo: boolean;
  onSelectTool: (tool: WhiteboardTool) => void;
  onUndo: () => void;
  onClear: () => void;
};

const tools: Array<{ id: WhiteboardTool; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'marker', label: 'Marker', icon: Pencil },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'rectangle', label: 'Box', icon: Square },
  { id: 'ellipse', label: 'Bubble', icon: Circle },
  { id: 'pan', label: 'Pan', icon: Hand },
];

export function Toolbar({ selectedTool, canUndo, onSelectTool, onUndo, onClear }: ToolbarProps) {
  return (
    <motion.nav
      className="pointer-events-auto fixed left-1/2 top-4 z-40 flex -translate-x-1/2 items-center gap-1 rounded-[1.7rem] border border-white/80 bg-white/80 p-2 shadow-[0_20px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:gap-2"
      initial={{ opacity: 0, y: -18, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      whileHover={{ scale: 1.015 }}
      aria-label="Drawing tools"
    >
      <div className="hidden items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-amber-900 md:flex">
        <MousePointer2 size={14} />
        Ethara Board
      </div>

      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = selectedTool === tool.id;

        return (
          <motion.button
            key={tool.id}
            type="button"
            aria-label={tool.label}
            aria-pressed={isActive}
            className={cn(
              'group relative grid h-11 w-11 place-items-center rounded-2xl text-slate-700 transition-colors sm:h-12 sm:w-12',
              isActive ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20' : 'hover:bg-white hover:text-slate-950',
            )}
            whileHover={{ y: -3, scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onSelectTool(tool.id)}
          >
            <Icon size={19} />
            <span className="pointer-events-none absolute -bottom-9 rounded-full bg-slate-950 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {tool.label}
            </span>
          </motion.button>
        );
      })}

      <div className="mx-1 h-8 w-px bg-slate-200" />

      <motion.button
        type="button"
        aria-label="Undo last stroke"
        className="grid h-11 w-11 place-items-center rounded-2xl text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 sm:h-12 sm:w-12"
        whileHover={canUndo ? { y: -3, scale: 1.08 } : undefined}
        whileTap={canUndo ? { scale: 0.92 } : undefined}
        onClick={onUndo}
        disabled={!canUndo}
      >
        <RotateCcw size={18} />
      </motion.button>

      <motion.button
        type="button"
        aria-label="Clear board"
        className="grid h-11 w-11 place-items-center rounded-2xl text-rose-600 transition-colors hover:bg-rose-50 sm:h-12 sm:w-12"
        whileHover={{ y: -3, scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onClear}
      >
        <Trash2 size={18} />
      </motion.button>
    </motion.nav>
  );
}
