import { createClient } from '@/utils/supabase/server';

export function generateInviteCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function getUniqueInviteCode(): Promise<string> {
  const supabase = await createClient();
  let code = '';
  let isUnique = false;

  while (!isUnique) {
    // Generate a random length between 8 and 10 characters
    const length = Math.floor(Math.random() * 3) + 8; // 8, 9, or 10
    code = generateInviteCode(length);

    const { data } = await supabase
      .from('classes')
      .select('id')
      .eq('invite_code', code)
      .maybeSingle();

    if (!data) {
      isUnique = true;
    }
  }

  return code;
}
