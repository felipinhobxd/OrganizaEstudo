'use client';

import { motion } from 'framer-motion';
import { Item } from '@/types/database';
import { useItemEditor } from '@/hooks/useItemEditor';
import { ItemEditorHeader } from './item-editor/ItemEditorHeader';
import { ItemEditorBasicInfo } from './item-editor/ItemEditorBasicInfo';
import { ItemEditorMarkdown } from './item-editor/ItemEditorMarkdown';
import { ItemEditorVideo } from './item-editor/ItemEditorVideo';
import { ItemEditorChecklist } from './item-editor/ItemEditorChecklist';
import { ItemEditorLinks } from './item-editor/ItemEditorLinks';
import { ItemEditorAttachments } from './item-editor/ItemEditorAttachments';

interface ItemEditorProps {
  classId: string;
  item: Item;
  onClose: () => void;
  isAdmin: boolean;
}

export default function ItemEditor({ classId, item, onClose, isAdmin }: ItemEditorProps) {
  const { state, refs, actions } = useItemEditor(classId, item, onClose, isAdmin);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-950 w-full max-w-4xl max-h-[90vh] shadow-2xl rounded-3xl overflow-hidden relative flex flex-col border border-border"
      >
        <ItemEditorHeader
          isAdmin={isAdmin}
          isSaving={state.isSaving}
          onSave={actions.handleSave}
          onDelete={actions.handleDelete}
          onClose={onClose}
        />

        <main className="flex-1 overflow-y-auto p-8 space-y-12">
          <ItemEditorBasicInfo
            title={state.title}
            setTitle={state.setTitle}
            description={state.description}
            setDescription={state.setDescription}
            isAdmin={isAdmin}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Coluna Esquerda */}
            <div className="space-y-10">
              <ItemEditorMarkdown
                contentMarkdown={state.contentMarkdown}
                setContentMarkdown={state.setContentMarkdown}
                isAdmin={isAdmin}
              />
              <ItemEditorVideo
                youtubeUrl={state.youtubeUrl}
                setYoutubeUrl={state.setYoutubeUrl}
                isAdmin={isAdmin}
              />
            </div>

            {/* Coluna Direita */}
            <div className="space-y-10">
              <ItemEditorChecklist
                checklist={state.checklist}
                isAdmin={isAdmin}
                onAdd={actions.addChecklistItem}
                onRemove={actions.removeChecklistItem}
                onUpdate={actions.updateChecklistItem}
              />
              <ItemEditorLinks
                links={state.links}
                isAdmin={isAdmin}
                onAdd={actions.addLink}
                onRemove={actions.removeLink}
                onUpdate={actions.updateLink}
              />
              <ItemEditorAttachments
                attachments={state.attachments}
                isAdmin={isAdmin}
                isUploading={state.isUploading}
                fileInputRef={refs.fileInputRef}
                onUpload={actions.handleFileUpload}
                onDownload={actions.downloadAttachment}
                onRemove={actions.removeAttachment}
              />
            </div>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
