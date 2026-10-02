import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'educationStageStatus'
})
export class EducationStageStatusPipe implements PipeTransform {

  transform(value: string | undefined): string {
    const translations: { [key: string]: string } = {
      'AVAILABLE': 'Disponible',
      'ENROLLED': 'Inscrito',
      'IN_PROGRESS': 'En curso',
      'COMPLETED': 'Completado',
      'DROPPED': 'Cancelado',
      'LOCKED': 'Bloqueado'
    };

    return value ? (translations[value] || value) : 'No inscrito';
  }
}
