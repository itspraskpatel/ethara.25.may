export type WhiteboardTool = 'marker' | 'eraser' | 'line' | 'rectangle' | 'ellipse' | 'pan';
export type ShapeMode = 'solid' | 'wireframe';

export type DrawingPoint = {
  x: number;
  y: number;
};

export type DrawingStyle = {
  color: string;
  thickness: number;
  opacity: number;
  shapeMode: ShapeMode;
};

export type DrawingElement = DrawingStyle & {
  id: string;
  tool: Exclude<WhiteboardTool, 'pan'>;
  points: DrawingPoint[];
  createdBy: string;
  createdAt: number;
};

export type WhiteboardProfile = {
  browserId: string;
  displayName: string;
  email?: string;
};

export type RemoteCursor = {
  browserId: string;
  displayName: string;
  x: number;
  y: number;
  color: string;
  lastSeenAt: number;
};

export type ViewportTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};
