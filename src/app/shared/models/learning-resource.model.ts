export interface LearningResource {
  id: number;
  name: string;
  description: string;
  type: 'PDF' | 'IMAGE' | 'TEMPLATE' | 'VIDEO_LINK' | 'LINK';
  blobPath: string;
  tags: LRTag[];
}

export interface LRTag {
  id: number;
  name: string;
}
