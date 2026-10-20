export type OnboardingModuleId = 'BASICS' | 'STUDENT' | 'HEAD_OF_EDUCATION' | 'EDUCATION_TEAM' | 'ADMIN';

export interface OnboardingTaskProgress {
  key: string;
  done: boolean;
  manual: boolean;
}

export interface OnboardingModuleProgress {
  module: OnboardingModuleId;
  tourCompleted: boolean;
  tasks: OnboardingTaskProgress[];
  badgeAwarded: boolean;
  newlyAwarded: boolean;
}
