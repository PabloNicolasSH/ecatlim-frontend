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
  enrolledBlockCodes?: string[];
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

export interface AttendedEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  lessonBlocks: LessonBlockCalendarSummary[];
}

export interface EventSuggestions {
  locations: string[];
  transferBankNumbers: string[];
  transferCodes: string[];
}

export interface EventDetailParticipantBlock {
  code: string;
  name: string;
  attended: boolean;
}

export interface EventDetailParticipant {
  userId: number;
  name?: string;
  surname?: string;
  email: string;
  avatarUrl?: string;
  entityName?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  blocks: EventDetailParticipantBlock[];
}

export interface EventDetailTimelineEntry {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'FORMATIVE' | 'LOGISTIC';
}

export interface EventDetailActivity {
  id: number;
  title: string;
  description: string;
  activityType: 'FORUM' | 'GLOSSARY' | 'SURVEY' | 'FILE_UPLOAD';
  evaluationMethod: string;
  availableAt: string;
  dueDate: string;
  isOptional: boolean;
  progressStatus?: 'PENDING' | 'COMPLETED';
  responsible?: SimpleUser;
}

export interface EventDetail {
  id: number;
  title: string;
  shortName: string;
  description: string;
  contents: string;
  startDate: string;
  endDate: string;
  location: string;
  organizer: string;
  status: 'PUBLISHED' | 'PENDING' | 'DRAFT';
  theoreticalHours?: number;
  practicalHours?: number;
  onlineHours?: number;
  educationStage?: { id: number; name: string; code: string };
  director?: SimpleUser;
  facilitators: SimpleUser[];
  staff: SimpleUser[];
  lessonBlocks: LessonBlockCalendarSummary[];
  config?: {
    minParticipants: number;
    dateOpenInscription: string;
    dateCloseInscription: string;
    cost: number;
    transferBankNumber: string;
    transferCode: string;
    notificationTargets: string[];
  };
  participants: EventDetailParticipant[];
  timeline: EventDetailTimelineEntry[];
  activities: EventDetailActivity[];
}
