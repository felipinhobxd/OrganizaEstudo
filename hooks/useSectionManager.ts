'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createSection, reorderSections } from '@/app/dashboard/classes/[id]/section-actions';
import { reorderItems, moveItem } from '@/app/dashboard/classes/[id]/item-actions';
import { Section } from '@/types/database';
import { DropResult } from '@hello-pangea/dnd';

export function useSectionManager(classId: string, initialSections: Section[]) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSection = async () => {
    setIsAdding(true);
    try {
      await createSection(classId, 'Nova Seção', sections.length);
      toast.success('Seção criada com sucesso!');
    } catch {
      toast.error('Falha ao criar seção.');
    } finally {
      setIsAdding(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'SECTION') {
      const newSections = Array.from(sections);
      const [removed] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, removed);

      setSections(newSections);
      try {
        await reorderSections(classId, newSections.map(s => s.id));
      } catch {
        toast.error('Falha ao salvar ordem das seções.');
      }
      return;
    }

    if (type === 'ITEM') {
      const sourceSection = sections.find(s => s.id === source.droppableId);
      const destSection = sections.find(s => s.id === destination.droppableId);

      if (!sourceSection || !destSection) return;

      if (source.droppableId === destination.droppableId) {
        const newItems = Array.from(sourceSection.items || []);
        const [removed] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, removed);

        const newSections = sections.map(s => s.id === source.droppableId ? { ...s, items: newItems } : s);
        setSections(newSections);
        await reorderItems(classId, sourceSection.id, newItems.map((item) => item.id));
      } else {
        const sourceItems = Array.from(sourceSection.items || []);
        const [removed] = sourceItems.splice(source.index, 1);

        const destItems = Array.from(destSection.items || []);
        destItems.splice(destination.index, 0, removed);

        const newSections = sections.map(s => {
          if (s.id === source.droppableId) return { ...s, items: sourceItems };
          if (s.id === destination.droppableId) return { ...s, items: destItems };
          return s;
        });

        setSections(newSections);
        await moveItem(classId, draggableId, destSection.id, destination.index);
      }
    }
  };

  return {
    sections,
    setSections,
    isAdding,
    handleAddSection,
    onDragEnd,
  };
}
