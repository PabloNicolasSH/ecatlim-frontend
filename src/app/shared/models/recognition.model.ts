import {SimpleUser} from './user.model';

export type RecognitionType = 'REGULATED_TRAINING' | 'NON_REGULATED_TRAINING' | 'EXPERIENCE';

export type RecognitionStatus = 'PENDING_REVIEW' | 'AWAITING_DOCUMENTATION' | 'APPROVED' | 'REJECTED';

export type RecognitionMessageKind = 'SUBMISSION' | 'DOCUMENTATION_REQUESTED' | 'APPROVED' | 'REJECTED';

export type RecognitionDecision = 'APPROVE' | 'REJECT' | 'REQUEST_DOCUMENTATION';

export interface RecognitionSummary {
  id: number;
  type: RecognitionType;
  status: RecognitionStatus;
}

export interface RecognitionFile {
  fileId: number;
  name: string;
  mimeType: string;
}

export interface RecognitionMessage {
  id: number;
  kind: RecognitionMessageKind;
  authorName: string;
  comment: string | null;
  createdAt: string;
  files: RecognitionFile[];
}

export interface RecognitionRequest {
  id: number;
  lessonBlockId: number;
  lessonBlockCode: string;
  lessonBlockName: string;
  userId: number;
  userName: string;
  type: RecognitionType;
  status: RecognitionStatus;
  createdAt: string;
  updatedAt: string;
  commission: SimpleUser[];
  messages: RecognitionMessage[];
}

export const RECOGNITION_TYPE_OPTIONS: { value: RecognitionType; label: string; description: string; icon: string }[] = [
  {
    value: 'REGULATED_TRAINING',
    label: 'Formación Reglada',
    description: 'Estudios oficiales: ciclos formativos, grados, másteres...',
    icon: 'pi-building-columns'
  },
  {
    value: 'NON_REGULATED_TRAINING',
    label: 'Formación No Reglada',
    description: 'Cursos, talleres o titulaciones no oficiales.',
    icon: 'pi-book'
  },
  {
    value: 'EXPERIENCE',
    label: 'Experiencia',
    description: 'Experiencia profesional o de voluntariado acreditable.',
    icon: 'pi-briefcase'
  }
];

export const RECOGNITION_STATUS_LABELS: Record<RecognitionStatus, string> = {
  PENDING_REVIEW: 'Convalidación en revisión',
  AWAITING_DOCUMENTATION: 'Falta documentación',
  APPROVED: 'Convalidado',
  REJECTED: 'Convalidación rechazada'
};
