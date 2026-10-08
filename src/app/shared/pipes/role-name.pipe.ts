import {Pipe, PipeTransform} from '@angular/core';
import {Role} from '../models/role.model';
import {ROLE_LABELS} from '../models/role-labels';

@Pipe({
  standalone: true,
  name: 'roleName'
})
export class RoleNamePipe implements PipeTransform {

  transform(value: Role | string | (Role | string)[] | null | undefined, separator = ', '): string {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.map(role => this.label(role)).join(separator) : 'Sin Rol';
    }
    return value ? this.label(value) : 'Sin Rol';
  }

  private label(role: Role | string): string {
    return ROLE_LABELS[role.toUpperCase() as Role] ?? role;
  }
}
