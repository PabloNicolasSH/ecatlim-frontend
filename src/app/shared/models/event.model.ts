import {TimelineItem} from './timeline-item.model';

export interface Event {
  id?: number;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  organizer: string;
  attendeesCount?: number;
  timelineItems: TimelineItem[];
}

export interface EventForm extends Event{
  directorId: number;
  lessonBlockIds: number[];
}
