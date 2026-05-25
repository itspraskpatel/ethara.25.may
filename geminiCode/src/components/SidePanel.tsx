'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface SidePanelProps {
  color: string;
  setColor: (c: string) => void;
  thickness: number;
  setThickness: (t: number) => void;
  style: 'solid' | 'wireframe';
  setStyle: (s: 'solid' | 'wireframe') => void;
}

export default function SidePanel({ color, setColor, thickness, setThickness, style, setStyle }: SidePanelProps) {
  const colors = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="absolute left-4 top-1/4 bg-white p-4 rounded-2xl shadow-lg border border-gray-100 w-16 md:w-48 z-40"
      >
        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-500 mb-2 block hidden md:block">Colors</label>
          <div className="flex flex-col md:flex-row flex-wrap gap-2">
            {colors.map((c) => (
              <motion.button
                key={c}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-gray-400' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="mb-6 hidden md:block">
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Thickness ({thickness}px)</label>
          <input
            type="range"
            min="1"
            max="20"
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="hidden md:block">
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Style</label>
          <div className="flex gap-2">
            {['solid', 'wireframe'].map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s as any)}
                className={`text-xs px-2 py-1 rounded-md capitalize ${style === s ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}