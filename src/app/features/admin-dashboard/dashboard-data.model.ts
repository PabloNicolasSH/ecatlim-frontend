export interface EventSummary {
  title: string;
  dateRange: string;
  totalAttendees: number;
  avatarUrls: string[];
}

export interface DashboardData {
  activeStudents: number;
  studentGrowthPercentage: number;
  nextEventName: string;
  nextEventDate: Date;
  averageGrade: number;
  upcomingEvents: EventSummary[];
}
