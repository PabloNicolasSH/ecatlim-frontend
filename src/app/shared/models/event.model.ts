import {TimelineItem} from './timeline-item.model';
import {LessonBlockCalendarSummary} from './lesson-block.model';
import {SimpleUser} from './user.model';
import {EnrolledUser} from './enrollment.model';

export interface BaseEvent {
  id?: number;
  title: string;
  shortname?: string;
  startDate: Date;
  location: string;
}

export interface Event extends BaseEvent {
  description?: string;
  contents?: string;
  endDate: Date;
  organizer: string;
  attendeesCount?: number;
  timelineItems: TimelineItem[];
}

export interface EventConfiguration {
  minParticipants: number;
  dateOpenInscription: Date;
  dateCloseInscription: Date;
  cost: number;
  transferBankNumber: string;
  transferCode: string;
  notificationTarget?: string[];
}

export interface EventForm extends Event {
  status?: string;
  directorId: number;
  facilitatorIds: number[];
  lessonBlockIds: number[];
  eventConfiguration: EventConfiguration;
  educationStageId: number;
}

export interface BasicEventCalendar extends Omit<Event, 'timelineItems' | 'id'> {
  id?: string;
  lessonBlocks?: LessonBlockCalendarSummary[];
}

export interface UserEventCalendar extends BasicEventCalendar {
  educationStageCode?: string;
  isCurrentUserAttending?: boolean;
  canParticipate?: boolean;
  isEventClosed?: boolean;
}

export interface AdminEventCalendar extends BasicEventCalendar {
  status?: string;
  director: SimpleUser;
  students: EnrolledUser[];
  eventConfig: EventConfiguration;
}

export interface EventDashboard extends Pick<
  UserEventCalendar,
  'id' | 'title' | 'startDate' | 'location' | 'educationStageCode' | 'isCurrentUserAttending' | 'canParticipate'
> {}
