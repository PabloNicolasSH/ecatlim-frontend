import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'moduleType'
})
export class ModuleTypePipe implements PipeTransform {

  transform(value: string): string {
    switch (value){
      case 'THEORETICAL':
        return "Teórico";
      case 'PRACTICAL':
        return 'Práctico';
      default:
        return value;
    }
  }

}
