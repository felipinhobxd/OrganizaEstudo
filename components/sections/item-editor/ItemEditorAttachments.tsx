'use client';

import { Paperclip, Plus, Loader2, FileText, Download, X } from 'lucide-react';
import { EditorLabel } from './EditorLabel';

interface Attachment {
  path: string;
  name: string;
}

interface ItemEditorAttachmentsProps {
  attachments: Attachment[];
  isAdmin: boolean;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: (path: string) => void;
  onRemove: (idx: number) => void;
}

export function ItemEditorAttachments({
  attachments,
  isAdmin,
  isUploading,
  fileInputRef,
  onUpload,
  onDownload,
  onRemove
}: ItemEditorAttachmentsProps) {
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <EditorLabel icon={<Paperclip size={16} />} text="Anexos" />
        {isAdmin && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onUpload}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,video/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-xs font-bold text-primary hover:underline flex items-center disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Plus size={14} className="mr-1" />}
              {isUploading ? 'Enviando...' : 'Adicionar Anexo'}
            </button>
          </>
        )}
      </div>
      <div className="space-y-2">
        {attachments.map((att, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-xl border border-border group hover:border-primary/30 transition-all shadow-sm"
          >
            <div
              className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
              onClick={() => onDownload(att.path)}
            >
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 group-hover:text-primary transition-colors">
                <FileText size={16} />
              </div>
              <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors text-foreground">
                {att.name}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onDownload(att.path)}
                className="p-2 text-gray-400 hover:text-primary transition rounded-lg"
                title="Baixar"
              >
                <Download size={16} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => onRemove(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg md:opacity-0 group-hover:opacity-100"
                  aria-label="Remover anexo"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {attachments.length === 0 && (
          <div className="p-4 border-2 border-dashed border-border rounded-xl text-center text-xs text-gray-400">
            Nenhum arquivo anexado.
          </div>
        )}
      </div>
    </section>
  );
}
