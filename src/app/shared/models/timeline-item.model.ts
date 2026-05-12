export interface TimelineItem {
  id?: number;
  startTime: Date;
  endTime: Date;
  type: 'FORMATIVE' | 'BREAK';
  lessonBlockTitle?: string;
  trainerName?: string;
}
