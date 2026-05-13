import {TimelineItem} from './timeline-item.model';

export interface Event {
  id?: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  organizer: string;
  attendeesCount?: number;
  timelineItems: TimelineItem[];
}

export interface EventForm extends Event {
  directorId: number;
  lessonBlockIds: number[];
}

export interface EventCalendar {
  id?: string | undefined;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  organizer: string;
  lessonBlockCodes?: string[];
  attendeesCount?: number;
  educationStageCode?: string;
  isCurrentUserAttending?: boolean;
  canParticipate?: boolean;
}

export interface EventDashboard {
  id?: number | undefined;
  title: string;
  startDate: Date;
  location: string;
  educationStageCode?: string;
  isCurrentUserAttending?: boolean;
  canParticipate?: boolean;
}
