export interface Activity {
  name: string;
  result?: string;
  completed: boolean;
}

export interface Block {
  id: string;
  name: string;
  code: string;
  status: 'Superada' | 'Pendiente' | 'En Curso';
  completionDate?: string;
  activities: Activity[];
}

export interface Module {
  name: string;
  code: string;
  blocks: Block[];
}

export interface Enrollment {
  id: number;
  stageName: string;
  completed: boolean;
  percentage: number;
  modules: Module[];
}

export interface EnrolledUser {
  name: string;
  email: string;
  paymentState: string;
}
