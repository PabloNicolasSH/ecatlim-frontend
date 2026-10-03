import {FormControl, Validators} from '@angular/forms';
import {FieldErrorComponent} from './field-error.component';

describe('FieldErrorComponent', () => {

  function withControl(control: FormControl, messages: Record<string, string> = {}): FieldErrorComponent {
    const component = new FieldErrorComponent();
    component.control = control;
    component.messages = messages;
    return component;
  }

  it('shows nothing until the control is touched or dirty', () => {
    const control = new FormControl('', Validators.required);
    expect(withControl(control).message).toBeNull();

    control.markAsTouched();
    expect(withControl(control).message).toBe('Este campo es obligatorio');
  });

  it('includes the limit in length messages', () => {
    const control = new FormControl('abcdef', Validators.maxLength(5));
    control.markAsDirty();
    expect(withControl(control).message).toBe('No puede superar los 5 caracteres');
  });

  it('allows overriding a message', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    expect(withControl(control, {required: 'Pon un título'}).message).toBe('Pon un título');
  });

  it('shows nothing for valid controls', () => {
    const control = new FormControl('ok', Validators.required);
    control.markAsTouched();
    expect(withControl(control).message).toBeNull();
  });
});
