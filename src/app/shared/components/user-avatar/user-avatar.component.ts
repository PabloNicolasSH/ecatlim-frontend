import {Component, inject, Input, OnChanges, OnDestroy} from '@angular/core';
import {Avatar} from 'primeng/avatar';
import {Subscription} from 'rxjs';
import {UserAvatarService} from '../../services/user-avatar.service';

@Component({
  selector: 'app-user-avatar',
  imports: [Avatar],
  template: `
    @if (localImage || imageSrc) {
      <p-avatar [image]="localImage || imageSrc!" [size]="size" shape="circle" styleClass="shadow-sm" [style]="avatarStyle"></p-avatar>
    } @else if (label) {
      <p-avatar [label]="label" [size]="size" shape="circle" styleClass="shadow-sm" [style]="avatarStyle"></p-avatar>
    } @else {
      <p-avatar [icon]="icon" [size]="size" shape="circle" styleClass="shadow-sm" [style]="avatarStyle"></p-avatar>
    }
  `
})
export class UserAvatarComponent implements OnChanges, OnDestroy {
  @Input() avatarUrl?: string | null;
  @Input() localImage?: string | null;
  @Input() label?: string;
  @Input() icon = 'pi pi-user';
  @Input() size: 'normal' | 'large' | 'xlarge' = 'normal';
  @Input() customSize?: string;

  get avatarStyle(): Record<string, string> | null {
    return this.customSize
      ? {width: this.customSize, height: this.customSize, fontSize: `calc(${this.customSize} / 2.4)`}
      : null;
  }

  private readonly avatarService = inject(UserAvatarService);
  private sub?: Subscription;

  imageSrc: string | null = null;

  ngOnChanges(): void {
    this.sub?.unsubscribe();
    this.imageSrc = null;

    if (this.avatarUrl) {
      this.sub = this.avatarService.getAvatar(this.avatarUrl).subscribe(src => this.imageSrc = src);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
