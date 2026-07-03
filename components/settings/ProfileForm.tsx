'use client';

import { useState, useRef } from 'react';
import { Camera, User, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { uploadAvatar } from '@/utils/supabase/storage';
import { updateProfile } from '@/app/dashboard/settings/actions';
import { toast } from 'sonner';
import { Profile } from '@/types/database';

interface ProfileFormProps {
  profile: Profile;
  userId: string;
}

export function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadAvatar(userId, file);
      setAvatarUrl(publicUrl);
      toast.success('Foto carregada! Clique em salvar para confirmar.');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Erro ao enviar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('avatar_url', avatarUrl);

      await updateProfile(formData);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <Card className="space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={64} />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 size={32} className="text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
              <Camera size={18} />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">Foto de Perfil</h2>
            <p className="text-sm text-gray-500">Clique para alterar seu avatar</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Nome Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              required
              className="w-full bg-gray-50 dark:bg-gray-800 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            isLoading={isSaving}
            disabled={isUploading}
            leftIcon={<Save size={18} />}
          >
            Salvar Alterações
          </Button>
        </div>
      </Card>
    </form>
  );
}
