import {Component, inject, ViewChild} from '@angular/core';
import {SplitButton} from 'primeng/splitbutton';
import {MenuItem} from 'primeng/api';
import {AuthService} from '../auth/auth.service';
import {Button} from 'primeng/button';
import {OverlayBadge} from 'primeng/overlaybadge';
import {Router, RouterLink} from '@angular/router';
import {Drawer} from 'primeng/drawer';
import {Popover} from 'primeng/popover';
import {Avatar} from 'primeng/avatar';
import {Profile} from '../../shared/models/profile.model';
import {PanelMenu} from 'primeng/panelmenu';
import {Divider} from 'primeng/divider';

@Component({
  selector: 'app-header',
  imports: [
    SplitButton,
    Button,
    OverlayBadge,
    RouterLink,
    Drawer,
    Popover,
    Avatar,
    PanelMenu,
    Divider
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);

  @ViewChild('op') op!: Popover;
  @ViewChild('drawerRef') drawerRef!: Drawer;

  userOptions!: MenuItem[];
  user!: Profile;
  sidebarVisible: boolean = false;

  messages: string[] = ["Parche la chupa de locos"];
  notifies: string[] = [];
  sidebarMenu!: MenuItem[];

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
        command: () => {this.router.navigateByUrl('/app/perfil')}
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
        label: 'Administración',
        items: [
          {label: 'Usuarios', icon: "pi pi-users", command: () => {
            this.router.navigateByUrl('/app/usuarios');
            this.sidebarVisible = false;
          }},
          {label: 'Entidades', route:'/app/entities'}
        ]
      }
    ];
  }

  userFirstLetter() {
    return this.user.name.at(0);
  }
}
