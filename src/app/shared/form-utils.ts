import {AbstractControl, FormArray, FormGroup} from '@angular/forms';

export class FormUtils {
  public static markAllAsDirtyAndTouched(control: AbstractControl): void {
    control.markAsDirty({onlySelf: true});
    control.markAsTouched({onlySelf: true});
    if (control instanceof FormGroup || control instanceof FormArray) {
      Object.values(control.controls).forEach(child => this.markAllAsDirtyAndTouched(child));
    }
  }
}
