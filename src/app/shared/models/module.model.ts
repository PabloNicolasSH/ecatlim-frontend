import {LessonBlock} from './lesson-block.model';

export interface ModuleModel {
  id?: number;
  name: string;
  description: string;
  onlineHours: number;
  contactHours: number;
  type: string;
  educationStage: number;
  allocatedOnlineHours?: number;
  allocatedContactHours?: number;
  lessonBlocks ?: LessonBlock[];
}
