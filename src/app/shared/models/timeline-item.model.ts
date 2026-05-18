import {EducationSessionForm} from './education-session.model';

export interface TimelineItem {
  id?: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  itemType: 'FORMATIVE' | 'LOGISTIC';
  educationSession?: EducationSessionForm;
}
