export interface LessonBlock {
  id?: number;
  name: string;
  lessonBlockId: number;
  description: string;
  onlineHours: number;
  contactHours: number;
  recognizable: boolean;
  moduleId: number;
  code?: string;
  educationStageId?: number;
}

export interface LessonBlockCalendarSummary {
  id?: number;
  name: string;
  code: string;
  hours: number;
}
