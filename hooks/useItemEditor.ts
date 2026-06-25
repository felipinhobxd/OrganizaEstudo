'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { updateItem, deleteItem } from '@/app/dashboard/classes/[id]/item-actions';
import { uploadFile, deleteFile, getDownloadUrl, UploadResult } from '@/utils/supabase/storage';
import { Item } from '@/types/database';

export function useItemEditor(classId: string, item: Item, onClose: () => void, isAdmin: boolean) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [contentMarkdown, setContentMarkdown] = useState(item.content_markdown || '');
  const [youtubeUrl, setYoutubeUrl] = useState(item.youtube_url || '');
  const [links, setLinks] = useState(item.links || []);
  const [checklist, setChecklist] = useState(item.checklist || []);
  const [attachments, setAttachments] = useState(item.attachments || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      await updateItem(classId, item.id, {
        title,
        description,
        content_markdown: contentMarkdown,
        youtube_url: youtubeUrl,
        links,
        checklist,
        attachments,
      });
      toast.success('Alterações salvas!');
      onClose();
    } catch {
      toast.error('Erro ao salvar item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      for (const att of attachments) {
        await deleteFile(att.path);
      }
      await deleteItem(classId, item.id);
      toast.success('Item excluído');
      onClose();
    } catch {
      toast.error('Erro ao excluir item');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedFiles: UploadResult[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await uploadFile(classId, files[i]);
        uploadedFiles.push(result);
      }
      setAttachments(prev => [...prev, ...uploadedFiles]);
      toast.success('Upload concluído!');
    } catch {
      toast.error('Erro no upload.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = async (index: number) => {
    if (!isAdmin) return;
    const att = attachments[index];
    try {
      await deleteFile(att.path);
      setAttachments(prev => prev.filter((_, i) => i !== index));
      toast.success('Anexo removido');
    } catch {
      setAttachments(prev => prev.filter((_, i) => i !== index));
    }
  };

  const downloadAttachment = async (path: string) => {
    try {
      const url = await getDownloadUrl(path);
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const addLink = () => setLinks(prev => [...prev, { label: '', url: '' }]);
  const removeLink = (index: number) => setLinks(prev => prev.filter((_, i) => i !== index));
  const updateLink = (index: number, field: 'label' | 'url', value: string) => {
    setLinks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addChecklistItem = () => setChecklist(prev => [...prev, { text: '', completed: false }]);
  const removeChecklistItem = (index: number) => setChecklist(prev => prev.filter((_, i) => i !== index));
  const updateChecklistItem = (index: number, field: 'text' | 'completed', value: string | boolean) => {
    setChecklist(prev => {
      const updated = [...prev];
      if (field === 'text' && typeof value === 'string') {
        updated[index] = { ...updated[index], text: value };
      } else if (field === 'completed' && typeof value === 'boolean') {
        updated[index] = { ...updated[index], completed: value };
      }
      return updated;
    });
  };

  return {
    state: {
      title, setTitle,
      description, setDescription,
      contentMarkdown, setContentMarkdown,
      youtubeUrl, setYoutubeUrl,
      links,
      checklist,
      attachments,
      isSaving,
      isUploading,
    },
    refs: { fileInputRef },
    actions: {
      handleSave,
      handleDelete,
      handleFileUpload,
      removeAttachment,
      downloadAttachment,
      addLink,
      removeLink,
      updateLink,
      addChecklistItem,
      removeChecklistItem,
      updateChecklistItem,
    },
  };
}
