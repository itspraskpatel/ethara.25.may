'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { BugReportButton } from '@/features/whiteboard/components/BugReportButton';
import { DrawingSettingsPanel } from '@/features/whiteboard/components/DrawingSettingsPanel';
import { InfiniteCanvas } from '@/features/whiteboard/components/InfiniteCanvas';
import { OnboardingDialog } from '@/features/whiteboard/components/OnboardingDialog';
import { PresenceBadge } from '@/features/whiteboard/components/PresenceBadge';
import { ShareButton } from '@/features/whiteboard/components/ShareButton';
import { Toolbar } from '@/features/whiteboard/components/Toolbar';
import { useBrowserProfile } from '@/features/whiteboard/hooks/useBrowserProfile';
import { useWhiteboardSocket } from '@/features/whiteboard/hooks/useWhiteboardSocket';
import type { DrawingElement, DrawingStyle, WhiteboardProfile, WhiteboardTool } from '@/features/whiteboard/types';
import type { ProfileFormPayload } from '@/features/whiteboard/schema';
import { createBoardSlug } from '@/features/whiteboard/utils/identity';

type WhiteboardAppProps = {
  initialBoardId?: string | null;
};

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

const initialStyle: DrawingStyle = {
  color: '#111827',
  thickness: 7,
  opacity: 0.92,
  shapeMode: 'wireframe',
};

async function registerVisitor(boardSlug: string, profile: WhiteboardProfile) {
  const response = await fetch('/api/whiteboard/visitors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      boardSlug,
      browserId: profile.browserId,
      displayName: profile.displayName,
      email: profile.email,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new Error(payload?.error?.message || 'Could not save your board profile.');
  }
}

export function WhiteboardApp({ initialBoardId = null }: WhiteboardAppProps) {
  const router = useRouter();
  const { isReady, profile, saveProfile } = useBrowserProfile();
  const [boardId, setBoardId] = useState<string | null>(initialBoardId);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<WhiteboardTool>('marker');
  const [style, setStyle] = useState<DrawingStyle>(initialStyle);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const registeredBoardRef = useRef<string | null>(null);

  const handleRemoteElementAdd = useCallback((element: DrawingElement) => {
    setElements((current) => {
      if (current.some((existing) => existing.id === element.id)) return current;
      return [...current, element];
    });
  }, []);

  const handleRemoteElementRemove = useCallback((id: string) => {
    setElements((current) => current.filter((element) => element.id !== id));
  }, []);

  const handleRemoteClear = useCallback(() => {
    setElements([]);
  }, []);

  const {
    activeUsers,
    emitClear,
    emitCursor,
    emitElement,
    emitElementRemove,
    isConnected,
    remoteCursors,
  } = useWhiteboardSocket({
    boardId,
    profile,
    onElementAdd: handleRemoteElementAdd,
    onElementRemove: handleRemoteElementRemove,
    onClear: handleRemoteClear,
  });

  const persistVisitor = useCallback(async (targetBoardId: string, nextProfile: WhiteboardProfile) => {
    const registrationKey = `${targetBoardId}:${nextProfile.browserId}`;
    if (registeredBoardRef.current === registrationKey) return;

    registeredBoardRef.current = registrationKey;
    await registerVisitor(targetBoardId, nextProfile);
  }, []);

  useEffect(() => {
    if (!boardId || !profile?.displayName) return;

    persistVisitor(boardId, profile).catch((error) => {
      registeredBoardRef.current = null;
      setServerError(error instanceof Error ? error.message : 'Could not save your board profile.');
    });
  }, [boardId, persistVisitor, profile]);

  const handleProfileSubmit = useCallback(async (payload: ProfileFormPayload) => {
    const targetBoardId = boardId || createBoardSlug();
    const nextProfile = saveProfile({
      browserId: profile?.browserId,
      displayName: payload.displayName,
      email: payload.email,
    });

    setIsSubmitting(true);
    setServerError(null);

    try {
      await persistVisitor(targetBoardId, nextProfile);
      setBoardId(targetBoardId);

      if (!initialBoardId) {
        router.push(`/board/${targetBoardId}`);
      }
    } catch (error) {
      registeredBoardRef.current = null;
      setServerError(error instanceof Error ? error.message : 'Could not save your board profile.');
    } finally {
      setIsSubmitting(false);
    }
  }, [boardId, initialBoardId, persistVisitor, profile?.browserId, router, saveProfile]);

  const handleCommitElement = useCallback((element: DrawingElement) => {
    setElements((current) => [...current, element]);
    emitElement(element);
  }, [emitElement]);

  const handleUndo = useCallback(() => {
    if (!profile?.browserId) return;

    setElements((current) => {
      let removeIndex = -1;

      for (let index = current.length - 1; index >= 0; index -= 1) {
        if (current[index].createdBy === profile.browserId) {
          removeIndex = index;
          break;
        }
      }

      if (removeIndex === -1) return current;

      const next = [...current];
      const [removed] = next.splice(removeIndex, 1);
      emitElementRemove(removed.id);
      return next;
    });
  }, [emitElementRemove, profile]);

  const handleClear = useCallback(() => {
    setElements([]);
    emitClear();
  }, [emitClear]);

  const canUndo = profile?.browserId ? elements.some((element) => element.createdBy === profile.browserId) : false;

  const shouldShowOnboarding = isReady && (!profile?.displayName || !boardId);

  return (
    <main className="whiteboard-shell min-h-screen overflow-hidden bg-[#fff8eb] text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[8%] top-[14%] h-44 w-44 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute right-[8%] top-[18%] h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute bottom-[8%] left-[28%] h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <InfiniteCanvas
        boardId={boardId}
        elements={elements}
        profile={profile}
        remoteCursors={remoteCursors}
        selectedTool={selectedTool}
        style={style}
        onCommitElement={handleCommitElement}
        onCursorMove={emitCursor}
      />

      <Toolbar
        selectedTool={selectedTool}
        canUndo={canUndo}
        onSelectTool={setSelectedTool}
        onUndo={handleUndo}
        onClear={handleClear}
      />

      <PresenceBadge activeUsers={activeUsers} isConnected={isConnected} />

      <DrawingSettingsPanel
        style={style}
        isOpen={isSettingsOpen}
        onToggle={() => setIsSettingsOpen((current) => !current)}
        onChange={setStyle}
      />

      <ShareButton boardId={boardId} />
      <BugReportButton />

      <OnboardingDialog
        isOpen={shouldShowOnboarding}
        mode={boardId ? 'join' : 'create'}
        profile={profile}
        isSubmitting={isSubmitting}
        serverError={serverError}
        onSubmit={handleProfileSubmit}
      />

      {serverError && !shouldShowOnboarding && (
        <div className="pointer-events-auto fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-xl">
          {serverError}
        </div>
      )}
    </main>
  );
}
