import { z } from 'zod';

export const sectionSchema = z.object({
  title: z.string().min(1, "O título é obrigatório").max(100, "Título muito longo"),
  order: z.number().int().nonnegative(),
});

export const itemSchema = z.object({
  title: z.string().min(1, "O título é obrigatório").max(200, "Título muito longo"),
  order: z.number().int().nonnegative(),
  description: z.string().max(1000, "Descrição muito longa").optional().nullable(),
  content_markdown: z.string().max(50000, "Conteúdo muito longo").optional().nullable(),
  youtube_url: z.string().url("URL do YouTube inválida").or(z.literal('')).optional().nullable(),
  links: z.array(z.object({
    label: z.string().min(1),
    url: z.string().url(),
  })).optional(),
  checklist: z.array(z.object({
    text: z.string().min(1),
    completed: z.boolean(),
  })).optional(),
  attachments: z.array(z.object({
    path: z.string().min(1),
    name: z.string().min(1),
    size: z.number().positive(),
    type: z.string(),
  })).optional(),
});

export const classSchema = z.object({
  name: z.string().min(3, "Nome da turma deve ter pelo menos 3 caracteres").max(100),
  description: z.string().max(500).optional(),
});

export const authSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  fullName: z.string().min(2, "Nome muito curto").optional(),
});

export const profileSchema = z.object({
  full_name: z.string().min(2, "Nome muito curto").max(100, "Nome muito longo"),
  avatar_url: z.string().url().or(z.literal('')).optional().nullable(),
});
