'use client';

interface EditorLabelProps {
  icon: React.ReactNode;
  text: string;
}

export function EditorLabel({ icon, text }: EditorLabelProps) {
  return (
    <div className="flex items-center space-x-2 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
      <span className="text-primary">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
