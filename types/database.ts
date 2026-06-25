export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Class {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface ClassMember {
  class_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  profiles?: Profile;
}

export interface Section {
  id: string;
  class_id: string;
  title: string;
  order: number;
  created_at: string;
  items?: Item[];
}

export interface Item {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  content_markdown: string | null;
  links: { label: string; url: string }[];
  checklist: { text: string; completed: boolean }[];
  attachments: { path: string; name: string; size: number; type: string }[];
  youtube_url: string | null;
  order: number;
  created_at: string;
}
