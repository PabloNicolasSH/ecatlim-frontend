import { Component } from '@angular/core';
import {Divider} from 'primeng/divider';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {Button} from 'primeng/button';
import {Carousel} from 'primeng/carousel';
import {TableModule} from 'primeng/table';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-admin-educational-home',
  imports: [
    Divider,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Carousel,
    Button,
    TableModule,
    RouterLink
  ],
  templateUrl: './admin-educational-home.component.html',
  styleUrl: './admin-educational-home.component.scss'
})
export class AdminEducationalHomeComponent {
  teachers = [
    { nombre: 'Laura Méndez', rol: 'Formadora Senior', imagen: 'assets/formadores/laura.jpg' },
    { nombre: 'Carlos Ruiz', rol: 'Especialista en Liderazgo', imagen: 'assets/formadores/carlos.jpg' },
    { nombre: 'Marta Jiménez', rol: 'Coach Comunicacional', imagen: 'assets/formadores/marta.jpg' },
    { nombre: 'Javier Ortega', rol: 'Formador Técnico', imagen: 'assets/formadores/javier.jpg' },
  ];

  carouselItems = [
    {
      title: 'Nivel de Satisfacción',
      content: 'Promedio actual: <strong>8.7 / 10</strong><br/>Última encuesta: Abril 2025'
    },
    {
      title: 'Tasa de Finalización',
      content: 'Cursos iniciados: <strong>23</strong><br/>Cursos completados: <strong>20</strong> (<strong>87%</strong>)'
    },
    {
      title: 'Top Cursos Valorados',
      content: `
      <ol class="list-decimal ml-5 space-y-1">
        <li>Curso de Comunicación Efectiva (9.4)</li>
        <li>Liderazgo y Gestión (9.2)</li>
        <li>Trabajo en Equipo (9.1)</li>
      </ol>
    `
    }
  ];

  educationStages: any[] = [];
}
