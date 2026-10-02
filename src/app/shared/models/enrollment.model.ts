export interface Activity {
  name: string;
  result?: string;
  completed: boolean;
}

export interface Block {
  id: string;
  name: string;
  code: string;
  status: 'Superada' | 'Pendiente' | 'En Curso';
  completionDate?: string;
  activities: Activity[];
}

export interface Module {
  name: string;
  code: string;
  blocks: Block[];
}

export interface EnrollmentDocument {
  fileId: number;
  name: string;
  mimeType: string;
  uploadDate: string;
}

export interface EnrollmentDocuments {
  personalPlan: EnrollmentDocument | null;
  entityApproval: EnrollmentDocument | null;
}

export type EnrollmentDocumentType = 'PERSONAL_PLAN' | 'ENTITY_APPROVAL';

export interface Enrollment {
  id: number;
  stageName: string;
  completed: boolean;
  percentage: number;
  modules: Module[];
  documents: EnrollmentDocuments;
}

export interface EnrolledUser {
  name: string;
  email: string;
  paymentState: string;
}
