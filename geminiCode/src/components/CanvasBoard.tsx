'use client';

import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import io from 'socket.io-client';

const socket = io();

interface DrawingData {
  x: number;
  y: number;
  tool: string;
  color: string;
  thickness: number;
  style: string;
  isStarting?: boolean;
}

export default function CanvasBoard({ tool, color, thickness, fillStyle, boardId }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    socket.emit('join-board', boardId);
    
    socket.on('draw-event', (data: DrawingData) => {
      drawOnCanvas(data);
    });

    return () => {
      socket.off('draw-event');
    };
  }, [boardId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rc = rough.canvas(canvas);
    }
  }, [elements]);

  const drawOnCanvas = (data: DrawingData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.lineWidth = data.thickness;
      ctx.strokeStyle = data.color;
      ctx.lineCap = 'round';

      if (data.isStarting) {
          ctx.beginPath();
          ctx.moveTo(data.x, data.y);
      } else {
          ctx.lineTo(data.x, data.y);
          ctx.stroke();
      }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDrawing(true);
    const { clientX, clientY } = e;
    const data = { x: clientX, y: clientY, tool, color, thickness, style: fillStyle, isStarting: true, boardId };
    drawOnCanvas(data);
    socket.emit('draw-event', data);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const { clientX, clientY } = e;
    const data = { x: clientX, y: clientY, tool, color, thickness, style: fillStyle, isStarting: false, boardId };
    drawOnCanvas(data);
    socket.emit('draw-event', data);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="w-full h-screen touch-none bg-white cursor-crosshair"
    />
  );
}