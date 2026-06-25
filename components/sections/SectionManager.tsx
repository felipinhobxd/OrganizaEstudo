'use client';

import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import SectionComponent from './Section';
import { Plus, LayoutGrid, Sparkles } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '@/types/database';
import { useSectionManager } from '@/hooks/useSectionManager';

interface SectionManagerProps {
  classId: string;
  initialSections: Section[];
  isAdmin: boolean;
}

export default function SectionManager({ classId, initialSections, isAdmin }: SectionManagerProps) {
  const {
    sections,
    isAdding,
    handleAddSection,
    onDragEnd
  } = useSectionManager(classId, initialSections);

  return (
    <div className="space-y-6">
      <SectionManagerHeader
        sectionsCount={sections.length}
        itemsCount={sections.reduce((acc, s) => acc + (s.items?.length || 0), 0)}
        isAdmin={isAdmin}
        isAdding={isAdding}
        onAdd={handleAddSection}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-sections" type="SECTION">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
              <AnimatePresence>
                {sections.length === 0 ? (
                  <EmptyState isAdmin={isAdmin} onAdd={handleAddSection} />
                ) : (
                  sections.map((section, index) => (
                    <SectionComponent
                      key={section.id}
                      classId={classId}
                      section={section}
                      index={index}
                      isAdmin={isAdmin}
                    />
                  ))
                )}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

function SectionManagerHeader({
  sectionsCount,
  itemsCount,
  isAdmin,
  isAdding,
  onAdd
}: {
  sectionsCount: number;
  itemsCount: number;
  isAdmin: boolean;
  isAdding: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-2xl border border-border">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <LayoutGrid size={20} />
        </div>
        <div>
          <h2 className="font-bold text-foreground">Conteúdo da Turma</h2>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            {sectionsCount} Seções • {itemsCount} Itens
          </p>
        </div>
      </div>
      {isAdmin && (
        <Button
          onClick={onAdd}
          isLoading={isAdding}
          size="sm"
          leftIcon={<Plus size={18} />}
        >
          Nova Seção
        </Button>
      )}
    </div>
  );
}

function EmptyState({ isAdmin, onAdd }: { isAdmin: boolean; onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-950 rounded-3xl border-2 border-dashed border-border"
    >
      <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
        <Sparkles size={32} />
      </div>
      <h3 className="text-xl font-bold text-foreground">Sua jornada começa aqui</h3>
      <p className="text-gray-500 max-w-xs mx-auto mt-2">
        Organize seu material em seções e facilite o aprendizado de todos.
      </p>
      {isAdmin && (
        <Button
          variant="outline"
          onClick={onAdd}
          className="mt-8"
          leftIcon={<Plus size={18} />}
        >
          Criar primeira seção
        </Button>
      )}
    </motion.div>
  );
}
