'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import type { DrawingElement, RemoteCursor, WhiteboardProfile } from '@/features/whiteboard/types';

type UseWhiteboardSocketProps = {
  boardId: string | null;
  profile: WhiteboardProfile | null;
  onElementAdd: (element: DrawingElement) => void;
  onElementRemove: (id: string) => void;
  onClear: () => void;
};

export function useWhiteboardSocket({
  boardId,
  profile,
  onElementAdd,
  onElementRemove,
  onClear,
}: UseWhiteboardSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [cursorMap, setCursorMap] = useState<Record<string, RemoteCursor>>({});

  useEffect(() => {
    if (!boardId || !profile?.displayName) return;

    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: {
        boardId,
        browserId: profile.browserId,
        displayName: profile.displayName,
      },
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      timeout: 10_000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('whiteboard:user-count', ({ count }: { count: number }) => setActiveUsers(Math.max(1, count)));
    socket.on('whiteboard:element:add', onElementAdd);
    socket.on('whiteboard:element:remove', ({ id }: { id: string }) => onElementRemove(id));
    socket.on('whiteboard:clear', onClear);
    socket.on('whiteboard:cursor', (cursor: Omit<RemoteCursor, 'lastSeenAt'>) => {
      if (cursor.browserId === profile.browserId) return;

      setCursorMap((current) => ({
        ...current,
        [cursor.browserId]: {
          ...cursor,
          lastSeenAt: Date.now(),
        },
      }));
    });
    socket.on('whiteboard:user-left', ({ browserId }: { browserId: string }) => {
      setCursorMap((current) => {
        const next = { ...current };
        delete next[browserId];
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setCursorMap({});
    };
  }, [boardId, onClear, onElementAdd, onElementRemove, profile]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setCursorMap((current) => {
        const next = Object.fromEntries(
          Object.entries(current).filter(([, cursor]) => now - cursor.lastSeenAt < 4_000),
        );

        return next as Record<string, RemoteCursor>;
      });
    }, 1_500);

    return () => window.clearInterval(timer);
  }, []);

  const emitElement = useCallback((element: DrawingElement) => {
    socketRef.current?.emit('whiteboard:element:add', element);
  }, []);

  const emitElementRemove = useCallback((id: string) => {
    socketRef.current?.emit('whiteboard:element:remove', { id });
  }, []);

  const emitClear = useCallback(() => {
    socketRef.current?.emit('whiteboard:clear');
  }, []);

  const emitCursor = useCallback((cursor: { x: number; y: number; color: string }) => {
    socketRef.current?.emit('whiteboard:cursor', cursor);
  }, []);

  const remoteCursors = useMemo(() => Object.values(cursorMap), [cursorMap]);

  return {
    activeUsers,
    emitClear,
    emitCursor,
    emitElement,
    emitElementRemove,
    isConnected,
    remoteCursors,
  };
}
