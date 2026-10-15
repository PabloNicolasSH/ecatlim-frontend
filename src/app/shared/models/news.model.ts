export interface NewsAttachment {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export interface News {
  id: number;
  title: string;
  content: string;
  hasImage: boolean;
  author?: string;
  createdAt: string;
  updatedAt?: string;
  attachments: NewsAttachment[];
}

export interface NewsForm {
  title: string;
  content: string;
  removeImage: boolean;
}
