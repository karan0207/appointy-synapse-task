// Goal: Define extended Item types with relations
// Includes populated relations for client use

import type { Item, Content, Media, Embedding, User } from '@prisma/client';

export type ItemWithRelations = Item & {
  content?: Content | null;
  media?: Media[];
  embedding?: Embedding | null;
  user?: User;
};

export type ItemWithContent = Item & {
  content: Content;
};

export type ItemWithMedia = Item & {
  media: Media[];
};

