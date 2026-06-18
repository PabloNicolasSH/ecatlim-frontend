export interface Activity {
  name: string;
  result?: string;
  completed: boolean;
}

export interface Block {
  id: string;
  name: string;
  status: 'Superada' | 'Pendiente' | 'En Curso';
  date?: string;
  activities: Activity[];
}

export interface Enrollment {
  id: number;
  stageName: string;
  completed: boolean;
  percentage: number;
  blocks: Block[];
}

export interface EnrolledUser {
  name: string;
  email: string;
  paymentState: string;
}
