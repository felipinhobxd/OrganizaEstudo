'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Link as LinkIcon,
  CheckSquare,
  Video,
  GripVertical,
  Paperclip,
  ChevronRight
} from 'lucide-react';
import ItemEditor from './ItemEditor';
import { Draggable } from '@hello-pangea/dnd';
import { cn } from '@/utils/ui/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Item } from '@/types/database';
import { Badge } from '@/components/shared/Badge';

interface ItemCardProps {
  classId: string;
  item: Item;
  index: number;
  isAdmin: boolean;
}

export default function ItemCard({ classId, item, index, isAdmin }: ItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const stats = useMemo(() => {
    const completedTasks = item.checklist?.filter((t) => t.completed).length || 0;
    const totalTasks = item.checklist?.length || 0;
    return {
      hasMarkdown: !!item.content_markdown,
      linksCount: item.links?.length || 0,
      hasVideo: !!item.youtube_url,
      attachmentsCount: item.attachments?.length || 0,
      completedTasks,
      totalTasks,
      isChecklistDone: totalTasks > 0 && completedTasks === totalTasks
    };
  }, [item]);

  return (
    <>
      <Draggable draggableId={item.id} index={index} isDragDisabled={!isAdmin}>
        {(provided, snapshot) => (
          <motion.div
            layoutId={item.id}
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
              "group relative bg-white dark:bg-gray-900 border rounded-xl p-4 transition-all cursor-pointer",
              snapshot.isDragging
                ? "shadow-2xl ring-2 ring-primary border-transparent z-50 scale-[1.03]"
                : "border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 shadow-sm"
            )}
            onClick={() => setIsEditing(true)}
          >
            <div className="flex items-start space-x-3">
              {isAdmin && (
                <div
                  {...provided.dragHandleProps}
                  className="mt-1 text-gray-300 hover:text-primary transition cursor-grab active:cursor-grabbing shrink-0"
                  aria-label="Arrastar item"
                >
                  <GripVertical size={18} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {item.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {stats.hasMarkdown && (
                    <Badge icon={<FileText size={10} />} label="DOC" color="gray" />
                  )}
                  {stats.attachmentsCount > 0 && (
                    <Badge icon={<Paperclip size={10} />} label={`${stats.attachmentsCount}`} color="blue" />
                  )}
                  {stats.hasVideo && (
                    <Badge icon={<Video size={10} />} label="VIDEO" color="red" />
                  )}
                  {stats.linksCount > 0 && (
                    <Badge icon={<LinkIcon size={10} />} label={`${stats.linksCount}`} color="indigo" />
                  )}
                  {stats.totalTasks > 0 && (
                    <Badge
                      icon={<CheckSquare size={10} />}
                      label={`${stats.completedTasks}/${stats.totalTasks}`}
                      color={stats.isChecklistDone ? "green" : "amber"}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </Draggable>

      <AnimatePresence>
        {isEditing && (
          <ItemEditor
            classId={classId}
            item={item}
            onClose={() => setIsEditing(false)}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>
    </>
  );
}
