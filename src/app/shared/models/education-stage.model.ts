import {ModuleModel} from './module.model';

export interface EducationStage {
  id?: number;
  name: string;
  code: string;
  description: string;
  onlineHours: number;
  contactHours: number;
  practicalHours: number;
  previousStageRequired?: boolean;
  previousStageId?: number;
  allocatedOnlineHours?: number;
  allocatedContactHours?: number;
  allocatedPracticalHours?: number;
  modules?: ModuleModel[];
}

export interface EducationStageCard {
  id: number;
  name: string;
  description: string;
  type: string;
  status: 'LOCKED' | 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'AVAILABLE';
  isEnabled: boolean;
  progress?: number;
}
