import {Component, EventEmitter, inject, Output, ViewChild} from '@angular/core';
import {SplitButton} from 'primeng/splitbutton';
import {MenuItem, PrimeTemplate, TreeNode} from 'primeng/api';
import {AuthService} from '../auth/auth.service';
import {Button} from 'primeng/button';
import {OverlayBadge} from 'primeng/overlaybadge';
import {Router, RouterLink} from '@angular/router';
import {Drawer} from 'primeng/drawer';
import {Ripple} from 'primeng/ripple';
import {StyleClass} from 'primeng/styleclass';
import {Tree} from 'primeng/tree';
import {Popover} from 'primeng/popover';
import {Avatar} from 'primeng/avatar';
import {User} from '../../shared/models/user.model';
import {Profile} from '../../shared/models/profile.model';

@Component({
  selector: 'app-header',
  imports: [
    SplitButton,
    Button,
    OverlayBadge,
    RouterLink,
    Drawer,
    Tree,
    PrimeTemplate,
    Popover,
    Avatar
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);

  @ViewChild('op') op!: Popover;

  userOptions!: MenuItem[];
  user!: Profile;
  sidebarVisible: boolean = false;

  messages: string[] = ["Parche la chupa de locos"];
  notifies: string[] = [];
  sidebarMenu!: TreeNode[];

  constructor() {
    this.createUserOptions();
    this.createSidebarMenu();
  }

  toggle(event: any){
    this.op.toggle(event)
  }

  onMenuClick() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  private createUserOptions() {
    this.user = this.authService.getProfile();
    this.userOptions = [
      {
        label: 'Mi Perfil',
        command: () => {this.router.navigateByUrl('/app/profile')}
      },
      {separator: true},
      {
        label: 'Cerrar Sesión',
        icon: 'pi pi-fw pi-power-off',
        command: () => {this.authService.logout()}
      }
    ];
  }

  private createSidebarMenu() {
    this.sidebarMenu = [
      {
        key: '0',
        label: 'Administración',
        children: [
          {key: '0-0', label: 'Usuarios', data: {route:'/app/users', icon: "pi pi-users"}, type: 'route'},
          {key: '0-1', label: 'Entidades', data: {route:'/app/entities', icon: ''}, type: 'route'}
        ]
      }
    ];
  }

  userFirstLetter() {
    return this.user.name.at(0);
  }
}
