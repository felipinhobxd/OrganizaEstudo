'use client';

interface ItemEditorBasicInfoProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  isAdmin: boolean;
}

export function ItemEditorBasicInfo({
  title,
  setTitle,
  description,
  setDescription,
  isAdmin
}: ItemEditorBasicInfoProps) {
  return (
    <div className="space-y-6">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título do Item"
        disabled={!isAdmin}
        className="text-4xl font-black w-full border-none focus:ring-0 bg-transparent placeholder-gray-300 dark:placeholder-gray-700 p-0 text-foreground"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Adicione uma descrição breve sobre este conteúdo..."
        disabled={!isAdmin}
        className="w-full border-none focus:ring-0 bg-transparent placeholder-gray-400 p-0 resize-none text-gray-500 font-medium text-lg leading-relaxed"
        rows={2}
      />
    </div>
  );
}
