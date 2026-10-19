import {AttendedEvent} from './event.model';
import {LessonBlockCalendarSummary} from './lesson-block.model';
import {Enrollment} from './enrollment.model';
import {StudentCurrentStage} from './training-people.model';

export interface HeadEducationMember {
  id: number;
  name?: string;
  surname?: string;
  email: string;
  avatarUrl?: string;
  enabled: boolean;
  currentStage: StudentCurrentStage | null;
}

export interface HeadEducationMemberHistory {
  member: HeadEducationMember;
  stages: Enrollment[];
  attendedEvents: StageAttendedEvents[];
}

export interface StageAttendedEvents {
  stageName: string;
  events: AttendedEvent[];
}

export interface HeadEducationEventAttendee {
  userId: number;
  name?: string;
  surname?: string;
  email: string;
  avatarUrl?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  lessonBlocks: LessonBlockCalendarSummary[];
}

export interface HeadEducationEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  inscriptionCloseDate: string | null;
  inscriptionClosed: boolean;
  transferBankNumber: string | null;
  transferCode: string | null;
  costPerPerson: number | null;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  attendees: HeadEducationEventAttendee[];
}
