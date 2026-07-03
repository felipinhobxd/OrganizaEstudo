import { createClient } from './client';

export interface UploadResult {
  path: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Uploads a file to the 'class-attachments' bucket.
 * Files are stored in folders by classId.
 */
export async function uploadFile(classId: string, file: File): Promise<UploadResult> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${classId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('class-attachments')
    .upload(filePath, file);

  if (error) throw error;

  return {
    path: data.path,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * Generates a signed URL for secure file download.
 * Expiration is set to 1 hour.
 */
export async function getDownloadUrl(path: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('class-attachments')
    .createSignedUrl(path, 3600);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Deletes a file from the 'class-attachments' bucket.
 */
export async function deleteFile(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from('class-attachments')
    .remove([path]);

  if (error) throw error;
}

/**
 * Uploads an avatar image to the 'avatars' bucket.
 * Stores files as {userId}/{uuid}-{name}
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
