'use client';

import { CheckSquare, Plus, X } from 'lucide-react';
import { EditorLabel } from './EditorLabel';
import { cn } from '@/utils/ui/cn';

interface ChecklistItem {
  text: string;
  completed: boolean;
}

interface ItemEditorChecklistProps {
  checklist: ChecklistItem[];
  isAdmin: boolean;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, field: 'text' | 'completed', val: any) => void;
}

export function ItemEditorChecklist({
  checklist,
  isAdmin,
  onAdd,
  onRemove,
  onUpdate
}: ItemEditorChecklistProps) {
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <EditorLabel icon={<CheckSquare size={16} />} text="Checklist" />
        {isAdmin && (
          <button
            onClick={onAdd}
            className="text-xs font-bold text-primary hover:underline flex items-center"
          >
            <Plus size={14} className="mr-1" /> Adicionar
          </button>
        )}
      </div>
      <div className="space-y-2 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-2xl border border-border">
        {checklist.map((item, index) => (
          <div key={index} className="flex items-center space-x-3 group animate-in fade-in slide-in-from-left-2">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(e) => onUpdate(index, 'completed', e.target.checked)}
              className="rounded-lg text-primary focus:ring-primary/20 h-5 w-5 border-border bg-white dark:bg-gray-800"
              disabled={!isAdmin}
            />
            <input
              type="text"
              value={item.text}
              onChange={(e) => onUpdate(index, 'text', e.target.value)}
              placeholder="Nome da tarefa..."
              disabled={!isAdmin}
              className={cn(
                "flex-1 border-none focus:ring-0 p-0 text-sm bg-transparent text-foreground",
                item.completed && "line-through text-gray-400"
              )}
            />
            {isAdmin && (
              <button
                onClick={() => onRemove(index)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                aria-label="Remover tarefa"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        {checklist.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center py-4">Nenhuma tarefa adicionada.</p>
        )}
      </div>
    </section>
  );
}
