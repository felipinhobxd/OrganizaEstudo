'use client';

import { Video } from 'lucide-react';
import { EditorLabel } from './EditorLabel';

interface ItemEditorVideoProps {
  youtubeUrl: string;
  setYoutubeUrl: (val: string) => void;
  isAdmin: boolean;
}

export function ItemEditorVideo({
  youtubeUrl,
  setYoutubeUrl,
  isAdmin
}: ItemEditorVideoProps) {
  return (
    <section className="space-y-4">
      <EditorLabel icon={<Video size={16} />} text="Vídeo do YouTube" />
      <div className="relative">
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={!isAdmin}
          className="w-full bg-gray-50 dark:bg-gray-900 border border-border rounded-xl p-3 pl-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-foreground"
        />
      </div>
    </section>
  );
}
