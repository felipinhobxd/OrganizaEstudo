'use client';

import { FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sanitizeHtml } from '@/lib/security/markdown';
import { EditorLabel } from './EditorLabel';

interface ItemEditorMarkdownProps {
  contentMarkdown: string;
  setContentMarkdown: (val: string) => void;
  isAdmin: boolean;
}

export function ItemEditorMarkdown({
  contentMarkdown,
  setContentMarkdown,
  isAdmin
}: ItemEditorMarkdownProps) {
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <EditorLabel icon={<FileText size={16} />} text="Conteúdo (Markdown)" />
        {isAdmin && contentMarkdown && (
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Visualização Ativa</span>
        )}
      </div>

      {isAdmin ? (
        <textarea
          value={contentMarkdown}
          onChange={(e) => setContentMarkdown(e.target.value)}
          placeholder="Utilize Markdown para formatar seu texto..."
          className="w-full bg-gray-50 dark:bg-gray-900 border border-border rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[300px] text-foreground font-mono text-sm leading-relaxed"
        />
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 border border-border rounded-2xl p-4 min-h-[100px]">
          {contentMarkdown ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {sanitizeHtml(contentMarkdown)}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic text-center py-4">Nenhum conteúdo textual fornecido.</p>
          )}
        </div>
      )}
    </section>
  );
}
