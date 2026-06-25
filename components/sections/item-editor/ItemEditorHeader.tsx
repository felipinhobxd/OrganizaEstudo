'use client';

import { X, Save, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface ItemEditorHeaderProps {
  isAdmin: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ItemEditorHeader({
  isAdmin,
  isSaving,
  onSave,
  onDelete,
  onClose
}: ItemEditorHeaderProps) {
  return (
    <header className="px-8 py-6 border-b border-border flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
      <div className="flex items-center space-x-3 text-primary">
        <div className="p-2 bg-primary/10 rounded-xl">
          <FileText size={20} />
        </div>
        <span className="font-bold text-lg">Detalhes do Item</span>
      </div>
      <div className="flex items-center space-x-3">
        {isAdmin && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              title="Excluir item"
            >
              <Trash2 size={20} />
            </Button>
            <Button
              onClick={onSave}
              isLoading={isSaving}
              leftIcon={<Save size={18} />}
            >
              Salvar
            </Button>
          </>
        )}
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-foreground transition focus:outline-none"
          aria-label="Fechar"
        >
          <X size={24} />
        </button>
      </div>
    </header>
  );
}
