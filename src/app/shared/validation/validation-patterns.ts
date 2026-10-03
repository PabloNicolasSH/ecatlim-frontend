import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';


export const PHONE_PATTERN = /^\+?[0-9 ]{9,20}$/;
export const URL_PATTERN = /^https?:\/\/\S+$/;
export const PASSWORD_SPECIAL_CHARS = /[!-\/:-@\[-`{-~¡-¿×÷]/;

export const MAX_TEXT = 255;
export const MAX_LONG_TEXT = 1000;
export const MAX_RICH_TEXT = 10000;
export const MAX_UPLOAD_MB = 8;

export function optionalPattern(pattern: RegExp, errorKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return pattern.test(String(value)) ? null : {[errorKey]: true};
  };
}


const DNI_CHECK_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export const idDocumentValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const raw = control.value;
  if (raw === null || raw === undefined || String(raw).trim() === '') return null;
  const document = String(raw).trim().toUpperCase();

  const checkLetter = (digits: string, letter: string) =>
    DNI_CHECK_LETTERS[Number(digits) % 23] === letter ? null : {idDocumentLetter: true};

  if (/^\d{8}[A-Z]$/.test(document)) return checkLetter(document.slice(0, 8), document[8]);
  if (/^[XYZ]\d{7}[A-Z]$/.test(document)) return checkLetter('XYZ'.indexOf(document[0]) + document.slice(1, 8), document[8]);
  if (/^\d{8}$/.test(document)) return {idDocument: true};
  return /^(?=.*\d)[A-Z0-9]{6,9}$/.test(document) ? null : {idDocument: true};
};
export const phoneValidator = optionalPattern(PHONE_PATTERN, 'phone');
export const urlValidator = optionalPattern(URL_PATTERN, 'url');

export const notBlankValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0 ? {required: true} : null;
};

export const passwordPolicyValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value: string = control.value ?? '';
  if (!value) return null;
  const valid = value.length >= 8 && value.length <= 256
    && /[A-Z]/.test(value)
    && /[a-z]/.test(value)
    && /[0-9]/.test(value)
    && PASSWORD_SPECIAL_CHARS.test(value)
    && !/\s/.test(value);
  return valid ? null : {passwordPolicy: true};
};

export function dateOrderValidator(startKey: string, endKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startKey);
    const end = group.get(endKey);
    if (!start || !end) return null;

    const startTime = toTime(start.value);
    const endTime = toTime(end.value);
    const wrongOrder = startTime !== null && endTime !== null && endTime <= startTime;

    setOrClearError(end, 'dateOrder', wrongOrder);
    return wrongOrder ? {dateOrder: true} : null;
  };
}

export function matchValidator(sourceKey: string, repeatKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const source = group.get(sourceKey);
    const repeat = group.get(repeatKey);
    if (!source || !repeat) return null;

    const mismatch = !!repeat.value && source.value !== repeat.value;
    setOrClearError(repeat, 'mismatch', mismatch);
    return mismatch ? {mismatch: true} : null;
  };
}

function toTime(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const time = value instanceof Date ? value.getTime() : new Date(value as string).getTime();
  return Number.isNaN(time) ? null : time;
}

function setOrClearError(control: AbstractControl, key: string, hasError: boolean): void {
  const errors = {...(control.errors ?? {})};
  if (hasError) {
    errors[key] = true;
  } else {
    delete errors[key];
  }
  control.setErrors(Object.keys(errors).length ? errors : null);
}
