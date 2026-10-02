export interface StudentCurrentStage {
  id: number;
  name: string;
  code: string;
  status: 'ENROLLED' | 'IN_PROGRESS';
}

export interface StudentSummary {
  id: number;
  name?: string;
  surname?: string;
  email: string;
  avatarUrl?: string;
  entityName?: string;
  currentStage: StudentCurrentStage | null;
}

export interface StageCount {
  stageId: number;
  name: string;
  code: string;
  count: number;
}

export interface StudentOverview {
  students: StudentSummary[];
  stages: StageCount[];
  withoutStage: number;
}

export interface TeamMember {
  id: number;
  name?: string;
  surname?: string;
  email: string;
  avatarUrl?: string;
  entityName?: string;
  roles: string[];
}
