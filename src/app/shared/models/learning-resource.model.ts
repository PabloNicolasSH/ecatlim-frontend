export type LearningResourceType = 'PDF' | 'IMAGE' | 'TEMPLATE' | 'VIDEO_LINK' | 'LINK';

export interface LearningResource {
  id: number;
  name: string;
  description: string | null;
  type: LearningResourceType;
  blobPath: string;
  mimeType: string;
  tags: LRTag[];
  createdAt: string | null;
  uploadedBy: string | null;
  downloadCount: number;
  canManage: boolean;
}

export interface LRTag {
  id: number;
  name: string;
}
