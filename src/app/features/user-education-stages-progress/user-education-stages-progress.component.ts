import {Component, computed, signal} from '@angular/core';

interface Activity {
  name: string;
  result?: string;
  completed: boolean;
}

interface Block {
  id: string;
  name: string;
  status: 'Superada' | 'Pendiente' | 'En Curso';
  date?: string;
  activities?: Activity[];
}

interface Enrollment {
  id: number;
  stageName: string;
  completed: boolean;
  percentage: number;
  blocks: Block[];
}

@Component({
  selector: 'app-user-education-stages-progress',
  imports: [],
  templateUrl: './user-education-stages-progress.component.html',
  styleUrl: './user-education-stages-progress.component.scss'
})
export class UserEducationStagesProgressComponent {

  activeTabIndex = signal<number>(0);
  expandedBlockId = signal<string | null>(null);
  enrollments = signal<Enrollment[]>([
    {
      id: 1,
      stageName: 'Acogida al Scouter',
      completed: true,
      percentage: 100,
      blocks: [
        {
          id: 'AS-1',
          name: 'Fase teórica - presencial',
          status: 'Superada',
          date: '12/03/2026',
          activities: [
            { name: 'Dinámica: Valores Scout', result: 'Apto', completed: true },
            { name: 'Test de Metodología', result: '9.5', completed: true }
          ]
        },
        {
          id: 'AS-2',
          name: 'Fase práctica',
          status: 'Superada',
          date: '20/04/2026',
          activities: [{ name: 'Planificación de actividad', completed: true }]
        }
      ]
    },
    {
      id: 2,
      stageName: 'Educador Scout',
      completed: false,
      percentage: 35,
      blocks: [
        {
          id: 'ES-1',
          name: 'Metodología Educativa',
          status: 'Superada',
          date: '04/05/2026',
          activities: [{ name: 'Análisis de sección', completed: true }]
        },
        {
          id: 'ES-2',
          name: 'Psicopedagogía del tiempo libre',
          status: 'En Curso',
          activities: [{ name: 'Test de desarrollo infantil', completed: false }]
        },
        { id: 'ES-3', name: 'Diseño de actividades', status: 'Pendiente' },
        { id: 'ES-4', name: 'Gestión de riesgos', status: 'Pendiente' }
      ]
    }
  ]);

  activeEnrollment = computed(() => this.enrollments()[this.activeTabIndex()]);

  ngOnInit(): void {}

  toggleBlock(id: string) {
    this.expandedBlockId.set(this.expandedBlockId() === id ? null : id);
  }
}
