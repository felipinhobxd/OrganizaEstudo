'use client';

import { Link as LinkIcon, Plus, X } from 'lucide-react';
import { EditorLabel } from './EditorLabel';

interface LinkItem {
  label: string;
  url: string;
}

interface ItemEditorLinksProps {
  links: LinkItem[];
  isAdmin: boolean;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, field: 'label' | 'url', val: string) => void;
}

export function ItemEditorLinks({
  links,
  isAdmin,
  onAdd,
  onRemove,
  onUpdate
}: ItemEditorLinksProps) {
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <EditorLabel icon={<LinkIcon size={16} />} text="Links Úteis" />
        {isAdmin && (
          <button
            onClick={onAdd}
            className="text-xs font-bold text-primary hover:underline flex items-center"
          >
            <Plus size={14} className="mr-1" /> Adicionar
          </button>
        )}
      </div>
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={index} className="flex items-center space-x-2 group p-2 bg-white dark:bg-gray-900 rounded-xl border border-border shadow-sm">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={link.label}
                onChange={(e) => onUpdate(index, 'label', e.target.value)}
                placeholder="Rótulo"
                disabled={!isAdmin}
                className="bg-transparent text-xs font-bold focus:outline-none text-foreground"
              />
              <input
                type="text"
                value={link.url}
                onChange={(e) => onUpdate(index, 'url', e.target.value)}
                placeholder="https://..."
                disabled={!isAdmin}
                className="bg-transparent text-xs text-primary truncate focus:outline-none"
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => onRemove(index)}
                className="p-1 text-gray-300 hover:text-red-500 transition"
                aria-label="Remover link"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        {links.length === 0 && (
          <div className="p-4 border-2 border-dashed border-border rounded-xl text-center text-xs text-gray-400">
            Nenhum link salvo.
          </div>
        )}
      </div>
    </section>
  );
}
