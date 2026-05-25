'use client';

import { motion } from 'framer-motion';
import { Pencil, Square, Circle, Minus, Eraser } from 'lucide-react';

interface ToolbarProps {
  activeTool: string;
  setTool: (tool: string) => void;
}

export default function Toolbar({ activeTool, setTool }: ToolbarProps) {
  const tools = [
    { id: 'pencil', icon: Pencil },
    { id: 'line', icon: Minus },
    { id: 'rectangle', icon: Square },
    { id: 'circle', icon: Circle },
    { id: 'eraser', icon: Eraser },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-2xl shadow-lg border border-gray-100 flex gap-2 z-40">
      {tools.map((t) => (
        <motion.button
          key={t.id}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setTool(t.id)}
          className={`p-3 rounded-xl transition-colors ${
            activeTool === t.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'
          }`}
        >
          <t.icon size={20} />
        </motion.button>
      ))}
    </div>
  );
}