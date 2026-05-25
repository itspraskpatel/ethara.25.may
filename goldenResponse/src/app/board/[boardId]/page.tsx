import { notFound } from 'next/navigation';

import { boardSlugSchema } from '@/features/whiteboard/schema';
import { WhiteboardApp } from '@/features/whiteboard/components/WhiteboardApp';

type BoardPageProps = {
  params: Promise<{
    boardId: string;
  }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const parsed = boardSlugSchema.safeParse(boardId);

  if (!parsed.success) {
    notFound();
  }

  return <WhiteboardApp initialBoardId={parsed.data} />;
}
