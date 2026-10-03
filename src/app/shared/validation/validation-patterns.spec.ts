import {FormControl, FormGroup} from '@angular/forms';
import {
  dateOrderValidator,
  matchValidator,
  idDocumentValidator,
  notBlankValidator,
  passwordPolicyValidator,
  phoneValidator,
  urlValidator
} from './validation-patterns';

describe('validation-patterns (mirror of the backend constraints)', () => {

  it('idDocumentValidator accepts DNI, NIE and passport like IdDocuments.java', () => {
    for (const valid of ['', '12345678Z', '00000000T', 'x1234567l', 'Y0000000Z', ' 12345678z ', 'PAA123456', 'AB1234567', '123456789', 'X12345']) {
      expect(idDocumentValidator(new FormControl(valid))).withContext(valid).toBeNull();
    }
    for (const wrongLetter of ['12345678A', 'X1234567A']) {
      expect(idDocumentValidator(new FormControl(wrongLetter))).withContext(wrongLetter).toEqual({idDocumentLetter: true});
    }
    for (const invalid of ['12345678', 'ABCDEFG', '12345', '1234567890', '12-345-678', 'PAA 12345']) {
      expect(idDocumentValidator(new FormControl(invalid))).withContext(invalid).toEqual({idDocument: true});
    }
  });

  it('phoneValidator accepts 9-20 digits with optional + and spaces', () => {
    expect(phoneValidator(new FormControl(''))).toBeNull();
    expect(phoneValidator(new FormControl('+34 928 123 456'))).toBeNull();
    expect(phoneValidator(new FormControl('12345'))).toEqual({phone: true});
    expect(phoneValidator(new FormControl('abc123456789'))).toEqual({phone: true});
  });

  it('urlValidator requires http(s)', () => {
    expect(urlValidator(new FormControl('https://scouts.org/doc'))).toBeNull();
    expect(urlValidator(new FormControl('javascript:alert(1)'))).toEqual({url: true});
  });

  it('notBlankValidator rejects whitespace-only values', () => {
    expect(notBlankValidator(new FormControl('   '))).toEqual({required: true});
    expect(notBlankValidator(new FormControl(' a '))).toBeNull();
  });

  it('passwordPolicyValidator follows the passay rules of the backend', () => {
    expect(passwordPolicyValidator(new FormControl('Abcdef1!'))).toBeNull();
    expect(passwordPolicyValidator(new FormControl('Abcdef1='))).toBeNull();
    expect(passwordPolicyValidator(new FormControl('abcdef1!'))).toEqual({passwordPolicy: true});
    expect(passwordPolicyValidator(new FormControl('Abcdefg1ñ'))).toEqual({passwordPolicy: true});
    expect(passwordPolicyValidator(new FormControl('Abc def1!'))).toEqual({passwordPolicy: true});
    expect(passwordPolicyValidator(new FormControl('Ab1!'))).toEqual({passwordPolicy: true});
  });

  it('dateOrderValidator flags the end control and clears the error once fixed', () => {
    const form = new FormGroup({
      start: new FormControl<Date | null>(new Date(2026, 0, 10)),
      end: new FormControl<Date | null>(new Date(2026, 0, 9))
    }, {validators: dateOrderValidator('start', 'end')});

    expect(form.get('end')!.hasError('dateOrder')).toBeTrue();
    expect(form.valid).toBeFalse();

    form.get('end')!.setValue(new Date(2026, 0, 11));
    expect(form.get('end')!.hasError('dateOrder')).toBeFalse();
    expect(form.valid).toBeTrue();
  });

  it('matchValidator flags the repeat control', () => {
    const form = new FormGroup({
      password: new FormControl('Abcdef1!'),
      repeat: new FormControl('Abcdef1?')
    }, {validators: matchValidator('password', 'repeat')});

    expect(form.get('repeat')!.hasError('mismatch')).toBeTrue();
    form.get('repeat')!.setValue('Abcdef1!');
    expect(form.get('repeat')!.errors).toBeNull();
  });
});
