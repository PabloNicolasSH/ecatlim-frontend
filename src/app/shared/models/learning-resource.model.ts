export type LearningResourceType = 'BOOK' | 'DOCUMENT' | 'PRESENTATION' | 'IMAGE' | 'VIDEO_LINK' | 'TEACHING_GUIDE' | 'LINK' | 'TEMPLATE';

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
