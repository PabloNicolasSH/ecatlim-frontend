import {FormControl, FormGroup} from '@angular/forms';

export class FormUtils {
  public static markAllAsDirtyAndTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsDirty({onlySelf: true});
        control.markAsTouched({onlySelf: true});
      } else if (control instanceof FormGroup) {
        this.markAllAsDirtyAndTouched(control);
      }
    });
  }
}
