'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import rough from 'roughjs';

import type {
  DrawingElement,
  DrawingPoint,
  DrawingStyle,
  RemoteCursor,
  ViewportTransform,
  WhiteboardProfile,
  WhiteboardTool,
} from '@/features/whiteboard/types';

const MIN_SCALE = 0.24;
const MAX_SCALE = 3.6;
const GRID_SIZE = 64;

type InfiniteCanvasProps = {
  boardId: string | null;
  elements: DrawingElement[];
  profile: WhiteboardProfile | null;
  remoteCursors: RemoteCursor[];
  selectedTool: WhiteboardTool;
  style: DrawingStyle;
  onCommitElement: (element: DrawingElement) => void;
  onCursorMove: (cursor: { x: number; y: number; color: string }) => void;
};

type DragState =
  | {
      mode: 'draw';
      pointerId: number;
      element: DrawingElement;
    }
  | {
      mode: 'pan';
      pointerId: number;
      lastX: number;
      lastY: number;
    };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: DrawingPoint, b: DrawingPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function screenToWorld(point: DrawingPoint, transform: ViewportTransform) {
  return {
    x: (point.x - transform.offsetX) / transform.scale,
    y: (point.y - transform.offsetY) / transform.scale,
  };
}

function worldToScreen(point: DrawingPoint, transform: ViewportTransform) {
  return {
    x: point.x * transform.scale + transform.offsetX,
    y: point.y * transform.scale + transform.offsetY,
  };
}

function drawMarker(ctx: CanvasRenderingContext2D, element: DrawingElement) {
  const points = element.points;
  if (points.length === 0) return;

  ctx.save();
  ctx.globalAlpha = element.opacity;
  ctx.strokeStyle = element.color;
  ctx.fillStyle = element.color;
  ctx.lineWidth = element.thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, element.thickness / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length - 1; index += 1) {
    const midpoint = {
      x: (points[index].x + points[index + 1].x) / 2,
      y: (points[index].y + points[index + 1].y) / 2,
    };

    ctx.quadraticCurveTo(points[index].x, points[index].y, midpoint.x, midpoint.y);
  }

  const lastPoint = points[points.length - 1];
  ctx.lineTo(lastPoint.x, lastPoint.y);
  ctx.stroke();
  ctx.restore();
}

function drawEraser(ctx: CanvasRenderingContext2D, element: DrawingElement) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = element.thickness * 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawMarker(ctx, { ...element, color: '#000000', opacity: 1 });
  ctx.restore();
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  roughCanvas: ReturnType<typeof rough.canvas> | null,
  element: DrawingElement,
) {
  const start = element.points[0];
  const end = element.points[element.points.length - 1];
  if (!start || !end) return;

  const width = end.x - start.x;
  const height = end.y - start.y;
  const isSolid = element.shapeMode === 'solid';

  ctx.save();
  ctx.globalAlpha = element.opacity;

  if (!roughCanvas) {
    ctx.strokeStyle = element.color;
    ctx.fillStyle = element.color;
    ctx.lineWidth = element.thickness;

    if (element.tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    if (element.tool === 'rectangle') {
      if (isSolid) ctx.fillRect(start.x, start.y, width, height);
      ctx.strokeRect(start.x, start.y, width, height);
    }

    if (element.tool === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse(start.x + width / 2, start.y + height / 2, Math.abs(width / 2), Math.abs(height / 2), 0, 0, Math.PI * 2);
      if (isSolid) ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
    return;
  }

  const options = {
    stroke: element.color,
    strokeWidth: element.thickness,
    roughness: element.shapeMode === 'wireframe' ? 1.45 : 0.7,
    fill: isSolid && element.tool !== 'line' ? element.color : undefined,
    fillStyle: 'solid' as const,
  };

  if (element.tool === 'line') {
    roughCanvas.line(start.x, start.y, end.x, end.y, options);
  }

  if (element.tool === 'rectangle') {
    roughCanvas.rectangle(start.x, start.y, width, height, options);
  }

  if (element.tool === 'ellipse') {
    roughCanvas.ellipse(start.x + width / 2, start.y + height / 2, Math.abs(width), Math.abs(height), options);
  }

  ctx.restore();
}

function drawElement(
  ctx: CanvasRenderingContext2D,
  roughCanvas: ReturnType<typeof rough.canvas> | null,
  element: DrawingElement,
) {
  if (element.tool === 'marker') drawMarker(ctx, element);
  if (element.tool === 'eraser') drawEraser(ctx, element);
  if (element.tool === 'line' || element.tool === 'rectangle' || element.tool === 'ellipse') {
    drawShape(ctx, roughCanvas, element);
  }
}

export function InfiniteCanvas({
  elements,
  profile,
  remoteCursors,
  selectedTool,
  style,
  onCommitElement,
  onCursorMove,
}: InfiniteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const roughCanvasRef = useRef<ReturnType<typeof rough.canvas> | null>(null);
  const animationRef = useRef<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const elementsRef = useRef(elements);
  const remoteCursorsRef = useRef(remoteCursors);
  const profileRef = useRef(profile);
  const styleRef = useRef(style);
  const toolRef = useRef(selectedTool);
  const lastCursorEmitRef = useRef(0);
  const dprRef = useRef(1);
  const sizeRef = useRef({ width: 0, height: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [transform, setTransform] = useState<ViewportTransform>({ scale: 1, offsetX: 0, offsetY: 0 });
  const transformRef = useRef(transform);

  const scheduleRender = useCallback(() => {
    if (animationRef.current !== null) return;

    animationRef.current = window.requestAnimationFrame(() => {
      animationRef.current = null;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const { width, height } = sizeRef.current;
      const dpr = dprRef.current;
      const currentTransform = transformRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#fffdf3');
      gradient.addColorStop(0.48, '#f5fbf8');
      gradient.addColorStop(1, '#fff5e7');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(currentTransform.offsetX, currentTransform.offsetY);
      ctx.scale(currentTransform.scale, currentTransform.scale);

      const worldLeft = -currentTransform.offsetX / currentTransform.scale;
      const worldTop = -currentTransform.offsetY / currentTransform.scale;
      const worldRight = worldLeft + width / currentTransform.scale;
      const worldBottom = worldTop + height / currentTransform.scale;
      const firstX = Math.floor(worldLeft / GRID_SIZE) * GRID_SIZE;
      const firstY = Math.floor(worldTop / GRID_SIZE) * GRID_SIZE;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(23, 37, 84, 0.07)';
      ctx.lineWidth = 1 / currentTransform.scale;

      for (let x = firstX; x < worldRight + GRID_SIZE; x += GRID_SIZE) {
        ctx.moveTo(x, worldTop - GRID_SIZE);
        ctx.lineTo(x, worldBottom + GRID_SIZE);
      }

      for (let y = firstY; y < worldBottom + GRID_SIZE; y += GRID_SIZE) {
        ctx.moveTo(worldLeft - GRID_SIZE, y);
        ctx.lineTo(worldRight + GRID_SIZE, y);
      }

      ctx.stroke();

      for (const element of elementsRef.current) {
        drawElement(ctx, roughCanvasRef.current, element);
      }

      const activeDrag = dragRef.current;
      if (activeDrag?.mode === 'draw') {
        drawElement(ctx, roughCanvasRef.current, activeDrag.element);
      }

      ctx.restore();
    });
  }, []);

  useEffect(() => {
    elementsRef.current = elements;
    scheduleRender();
  }, [elements, scheduleRender]);

  useEffect(() => {
    remoteCursorsRef.current = remoteCursors;
  }, [remoteCursors]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    styleRef.current = style;
  }, [style]);

  useEffect(() => {
    toolRef.current = selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    transformRef.current = transform;
    scheduleRender();
  }, [scheduleRender, transform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    roughCanvasRef.current = rough.canvas(canvas);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

      dprRef.current = nextDpr;
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = Math.floor(rect.width * nextDpr);
      canvas.height = Math.floor(rect.height * nextDpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      setTransform((current) => {
        if (current.offsetX !== 0 || current.offsetY !== 0) return current;

        return {
          ...current,
          offsetX: rect.width / 2,
          offsetY: rect.height / 2,
        };
      });

      scheduleRender();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [scheduleRender]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat) setIsSpacePressed(true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setIsSpacePressed(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const getCanvasPoint = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const makeElement = useCallback((tool: Exclude<WhiteboardTool, 'pan'>, point: DrawingPoint): DrawingElement => ({
    id: `${profileRef.current?.browserId || 'guest'}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tool,
    points: [point],
    createdBy: profileRef.current?.browserId || 'guest',
    createdAt: Date.now(),
    ...styleRef.current,
  }), []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!profileRef.current?.displayName) return;

    event.currentTarget.setPointerCapture(event.pointerId);

    const canvasPoint = getCanvasPoint(event);
    const shouldPan = toolRef.current === 'pan' || isSpacePressed || event.button === 1;

    if (shouldPan) {
      dragRef.current = {
        mode: 'pan',
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
      };
      return;
    }

    const tool = toolRef.current === 'pan' ? 'marker' : toolRef.current;
    const worldPoint = screenToWorld(canvasPoint, transformRef.current);
    const element = makeElement(tool, worldPoint);

    if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse') {
      element.points.push(worldPoint);
    }

    dragRef.current = {
      mode: 'draw',
      pointerId: event.pointerId,
      element,
    };

    scheduleRender();
  }, [getCanvasPoint, isSpacePressed, makeElement, scheduleRender]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvasPoint = getCanvasPoint(event);
    const worldPoint = screenToWorld(canvasPoint, transformRef.current);
    const now = Date.now();

    if (now - lastCursorEmitRef.current > 55 && profileRef.current?.displayName) {
      lastCursorEmitRef.current = now;
      onCursorMove({ x: worldPoint.x, y: worldPoint.y, color: styleRef.current.color });
    }

    const activeDrag = dragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

    if (activeDrag.mode === 'pan') {
      const deltaX = event.clientX - activeDrag.lastX;
      const deltaY = event.clientY - activeDrag.lastY;
      activeDrag.lastX = event.clientX;
      activeDrag.lastY = event.clientY;

      setTransform((current) => ({
        ...current,
        offsetX: current.offsetX + deltaX,
        offsetY: current.offsetY + deltaY,
      }));
      return;
    }

    const { element } = activeDrag;

    if (element.tool === 'marker' || element.tool === 'eraser') {
      const lastPoint = element.points[element.points.length - 1];
      if (!lastPoint || distance(lastPoint, worldPoint) > 1.8) {
        element.points.push(worldPoint);
      }
    } else {
      element.points[1] = worldPoint;
    }

    scheduleRender();
  }, [getCanvasPoint, onCursorMove, scheduleRender]);

  const finishDrawing = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const activeDrag = dragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

    if (activeDrag.mode === 'draw') {
      const { element } = activeDrag;
      const hasEnoughPoints = element.points.length > 1 || element.tool === 'marker';

      if (hasEnoughPoints) {
        onCommitElement({ ...element, points: [...element.points] });
      }
    }

    dragRef.current = null;
    scheduleRender();
  }, [onCommitElement, scheduleRender]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const screenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    setTransform((current) => {
      const zoomFactor = event.deltaY < 0 ? 1.08 : 0.92;
      const nextScale = clamp(current.scale * zoomFactor, MIN_SCALE, MAX_SCALE);
      const worldPoint = screenToWorld(screenPoint, current);

      return {
        scale: nextScale,
        offsetX: screenPoint.x - worldPoint.x * nextScale,
        offsetY: screenPoint.y - worldPoint.y * nextScale,
      };
    });
  }, []);

  const cursorClassName = selectedTool === 'pan' || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair';

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`h-full w-full touch-none ${cursorClassName}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
        onWheel={handleWheel}
        aria-label="Infinite collaborative drawing board"
      />

      {remoteCursors.map((cursor) => {
        const screenPoint = worldToScreen(cursor, transform);

        return (
          <motion.div
            key={cursor.browserId}
            className="pointer-events-none absolute z-20 flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, x: screenPoint.x, y: screenPoint.y }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.5 }}
          >
            <span
              className="block h-3 w-3 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: cursor.color }}
            />
            <span className="rounded-full bg-slate-950/85 px-2 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur">
              {cursor.displayName}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
