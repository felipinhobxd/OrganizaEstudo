'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react';
import ItemCard from './ItemCard';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { updateSection, deleteSection } from '@/app/dashboard/classes/[id]/section-actions';
import { createItem } from '@/app/dashboard/classes/[id]/item-actions';
import { Button } from '@/components/shared/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Section, Item } from '@/types/database';
import { cn } from '@/utils/ui/cn';

interface SectionProps {
  classId: string;
  section: Section;
  index: number;
  isAdmin: boolean;
}

export default function SectionComponent({ classId, section, index, isAdmin }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (!title.trim()) {
      setTitle(section.title);
      return;
    }
    if (title !== section.title) {
      try {
        await updateSection(classId, section.id, title);
        toast.success('Título atualizado');
      } catch {
        setTitle(section.title);
        toast.error('Falha ao atualizar título');
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta seção e todos os seus itens?')) return;
    setIsDeleting(true);
    try {
      await deleteSection(classId, section.id);
      toast.success('Seção removida');
    } catch {
      toast.error('Erro ao remover seção');
      setIsDeleting(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    try {
      await createItem(classId, section.id, newItemTitle, section.items?.length || 0);
      setNewItemTitle('');
      setIsCreatingItem(false);
      toast.success('Item criado!');
    } catch {
      toast.error('Erro ao criar item');
    }
  };

  return (
    <Draggable draggableId={section.id} index={index} isDragDisabled={!isAdmin}>
      {(provided, snapshot) => (
        <motion.div
          layout
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "bg-white dark:bg-gray-950 rounded-2xl border transition-all overflow-hidden",
            snapshot.isDragging
              ? "shadow-2xl ring-2 ring-primary border-transparent z-50 scale-[1.02]"
              : "border-border shadow-sm hover:shadow-md"
          )}
        >
          <header className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/30 group">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {isAdmin && (
                <div
                  {...provided.dragHandleProps}
                  className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition shrink-0"
                >
                  <GripVertical size={18} />
                </div>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-primary transition p-1 rounded-lg hover:bg-primary/10 shrink-0"
                aria-label={isExpanded ? "Recolher" : "Expandir"}
              >
                <motion.div animate={{ rotate: isExpanded ? 0 : -90 }}>
                  <ChevronDown size={20} />
                </motion.div>
              </button>

              <SectionTitle
                isAdmin={isAdmin}
                isEditing={isEditingTitle}
                title={title}
                count={section.items?.length || 0}
                onChange={setTitle}
                onBlur={handleTitleBlur}
                onClick={() => setIsEditingTitle(true)}
              />
            </div>

            {isAdmin && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsCreatingItem(true)}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition"
                  title="Novo Item"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                  title="Excluir Seção"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </header>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0">
                  <Droppable droppableId={section.id} type="ITEM">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "min-h-[10px] space-y-2 mt-4 p-2 rounded-xl transition-colors",
                          snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
                        )}
                      >
                        {section.items?.map((item: Item, idx: number) => (
                          <ItemCard
                            key={item.id}
                            classId={classId}
                            item={item}
                            index={idx}
                            isAdmin={isAdmin}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {isCreatingItem ? (
                    <CreateItemForm
                      value={newItemTitle}
                      onChange={setNewItemTitle}
                      onCancel={() => setIsCreatingItem(false)}
                      onSubmit={handleCreateItem}
                    />
                  ) : isAdmin && (
                    <AddItemButton
                      hasItems={(section.items?.length || 0) > 0}
                      onClick={() => setIsCreatingItem(true)}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </Draggable>
  );
}

function SectionTitle({
  isAdmin,
  isEditing,
  title,
  count,
  onChange,
  onBlur,
  onClick
}: {
  isAdmin: boolean;
  isEditing: boolean;
  title: string;
  count: number;
  onChange: (val: string) => void;
  onBlur: () => void;
  onClick: () => void;
}) {
  if (isEditing && isAdmin) {
    return (
      <input
        autoFocus
        value={title}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => e.key === 'Enter' && onBlur()}
        className="bg-transparent border-b border-primary focus:outline-none font-bold text-foreground text-lg w-full"
      />
    );
  }

  return (
    <div className="flex items-center space-x-2 truncate">
      <h3
        className={cn(
          "font-bold text-foreground text-lg truncate",
          isAdmin && "cursor-pointer hover:text-primary transition-colors"
        )}
        onClick={onClick}
      >
        {title}
      </h3>
      <span className="text-xs font-medium text-gray-400 bg-gray-200/50 dark:bg-gray-800 px-2 py-0.5 rounded-full shrink-0">
        {count}
      </span>
    </div>
  );
}

function CreateItemForm({
  value,
  onChange,
  onCancel,
  onSubmit
}: {
  value: string;
  onChange: (val: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={onSubmit}
      className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-primary/20"
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => !value && onCancel()}
        placeholder="Nome do novo item..."
        className="w-full bg-transparent font-medium text-foreground placeholder-gray-400 outline-none"
      />
      <div className="flex justify-end space-x-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold text-gray-400 hover:text-foreground transition"
        >
          Cancelar
        </button>
        <Button type="submit" size="sm">
          Criar Item
        </Button>
      </div>
    </motion.form>
  );
}

function AddItemButton({ hasItems, onClick }: { hasItems: boolean; onClick: () => void }) {
  if (!hasItems) {
    return (
      <button
        onClick={onClick}
        className="mt-4 w-full flex items-center justify-center space-x-2 py-4 text-sm text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all group"
      >
        <Plus size={16} className="group-hover:scale-110 transition-transform" />
        <span className="font-medium">Adicionar o primeiro item</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="mt-2 w-full flex items-center justify-center space-x-2 py-2 text-xs text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg border border-transparent hover:border-primary/20 transition-all"
    >
      <Plus size={14} />
      <span className="font-semibold">Novo Item</span>
    </button>
  );
}
