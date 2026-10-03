import {Component, Input} from '@angular/core';
import {AbstractControl} from '@angular/forms';

const DEFAULT_MESSAGES: Record<string, (error: any) => string> = {
  required: () => 'Este campo es obligatorio',
  requiredTrue: () => 'Debes aceptar esta condición',
  email: () => 'El email no tiene un formato válido',
  minlength: e => `Debe tener al menos ${e.requiredLength} caracteres`,
  maxlength: e => `No puede superar los ${e.requiredLength} caracteres`,
  min: e => `El valor mínimo es ${e.min}`,
  max: e => `El valor máximo es ${e.max}`,
  idDocument: () => 'Introduce un DNI, NIE o pasaporte válido (ej.: 12345678Z, X1234567L o PAA123456)',
  idDocumentLetter: () => 'La letra del DNI/NIE no es correcta',
  phone: () => 'El teléfono no tiene un formato válido',
  url: () => 'Debe ser una URL que empiece por http:// o https://',
  passwordPolicy: () => 'Entre 8 y 256 caracteres, con mayúscula, minúscula, número y carácter especial, sin espacios',
  mismatch: () => 'Las contraseñas no coinciden',
  dateOrder: () => 'Debe ser posterior a la fecha de inicio',
  pattern: () => 'El formato no es válido',
};

@Component({
  selector: 'app-field-error',
  template: `
    @if (message) {
      <small class="block text-xs text-red-600 mt-1" role="alert">{{ message }}</small>
    }
  `
})
export class FieldErrorComponent {
  @Input() control: AbstractControl | null | undefined;
  @Input() messages: Record<string, string> = {};

  get message(): string | null {
    const control = this.control;
    if (!control || !control.errors || !(control.touched || control.dirty)) return null;

    const [key, value] = Object.entries(control.errors)[0];
    return this.messages[key] ?? DEFAULT_MESSAGES[key]?.(value) ?? 'El valor no es válido';
  }
}
