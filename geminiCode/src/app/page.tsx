'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, AlertCircle, Users } from 'lucide-react';
import io from 'socket.io-client';
import LandingModal from '@/components/LandingModal';
import Toolbar from '@/components/Toolbar';
import SidePanel from '@/components/SidePanel';
import CanvasBoard from '@/components/CanvasBoard';

let socket: any;

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUsers, setActiveUsers] = useState(1);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [thickness, setThickness] = useState(2);
  const [style, setStyle] = useState<'solid' | 'wireframe'>('wireframe');
  const boardId = 'public-room'; 

  useEffect(() => {
    const hasJoined = localStorage.getItem('stranger-draw-auth');
    if (hasJoined) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    socket = io();
    socket.on('userCount', (count: number) => {
      setActiveUsers(count);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [isAuthenticated]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Board link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <LandingModal 
        onComplete={() => {
          localStorage.setItem('stranger-draw-auth', 'true');
          setIsAuthenticated(true);
        }} 
      />
    );
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white text-gray-900">
      <Toolbar activeTool={tool} setTool={setTool} />
      
      <SidePanel 
        color={color} setColor={setColor}
        thickness={thickness} setThickness={setThickness}
        style={style} setStyle={setStyle}
      />

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-4 right-4 bg-white px-4 py-2 rounded-xl shadow-md border border-gray-100 flex items-center gap-2 z-40"
      >
        <Users size={16} className="text-blue-500" />
        <span className="font-semibold text-sm">{activeUsers} Active</span>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleShare}
        className="absolute bottom-4 right-4 bg-black text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 z-40"
      >
        <Share2 size={18} />
        <span>Share Board</span>
      </motion.button>

      <motion.a
        href="mailto:Prashant.patel@ethara.ai?subject=Bug Report"
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        className="absolute bottom-4 left-4 bg-red-50 text-red-600 p-3 rounded-full shadow-lg border border-red-100 z-40 flex items-center justify-center"
        title="Report a bug"
      >
        <AlertCircle size={24} />
      </motion.a>

      <CanvasBoard 
        tool={tool} 
        color={color} 
        thickness={thickness} 
        fillStyle={style} 
        boardId={boardId}
      />
    </main>
  );
}