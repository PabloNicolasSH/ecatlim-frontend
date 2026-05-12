import {Component, computed, HostListener, inject, signal, ViewChild, WritableSignal} from '@angular/core';
import {SplitButton} from 'primeng/splitbutton';
import {MenuItem, MenuItemCommandEvent} from 'primeng/api';
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
import {Notification} from '../../shared/models/notification.model';

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

  baseUserOptions!: MenuItem[];
  user!: Profile;
  sidebarVisible: boolean = false;

  windowWidth = signal(window.innerWidth);

  messages = signal(["¿Vienes al curso de Agosto?"]);
  notifies: WritableSignal<Notification[]> = signal([]);
  sidebarMenu!: MenuItem[];

  userOptions = computed(() => {
    if (this.windowWidth() < 768) {
      return [
        {
          label: `Mensajes (${this.messages().length})`,
          icon: 'pi pi-comments',
          command: () => this.openMessages()
        },
        {
          label: `Notificaciones (${this.notifies().length})`,
          icon: 'pi pi-bell',
          command: (event: any) => this.toggleNotifications(event)
        },
        { separator: true },
        ...this.baseUserOptions
      ];
    }
    return this.baseUserOptions;
  });

  constructor() {
    this.createUserOptions();
    this.createSidebarMenu();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.windowWidth.set(window.innerWidth);
  }

  openMessages() {
    console.log('Abriendo chat...');
  }

  toggleNotifications(event?: any) {
    this.op.toggle(event)
  }

  handleNotifyClick(notify: Notification) {

  }

  markAllAsRead() {
    this.notifies.set([]);
  }

  onMenuClick() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  private createUserOptions() {
    this.user = this.authService.getProfile();
    this.baseUserOptions = [
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

  userFirstLetter() {
    return this.user.name.at(0);
  }

  private createSidebarMenu() {
    this.sidebarMenu = [
      {
        label: 'Inicio',
        icon: "pi pi-home",
        command: () => {
          this.router.navigateByUrl('/app/home');
          this.sidebarVisible = false;
        }
      },
      {
        label: 'Información General',
        icon: "pi pi-info-circle",
        command: () => {
          this.router.navigateByUrl('/app/informacion-general');
          this.sidebarVisible = false;
        }
      },
      {
        label: 'Calendario de la Escuela',
        icon: "pi pi-calendar",
        command: () => {
          this.router.navigateByUrl('/app/calendario');
          this.sidebarVisible = false;
        }
      },
      {
        label: 'La Biblioteca',
        icon: "pi pi-bookmark"
      },
      {
        label: 'Mi formación',
        items: [
          {
            label: 'Oferta Educativa', icon: 'pi pi-graduation-cap', command: () => {
              this.router.navigateByUrl('/app/oferta-educativa');
              this.sidebarVisible = false;
            }
          },
          {
            label: 'Mi Progreso', icon: 'pi pi-book', command: () => {
              this.router.navigateByUrl('/app/mi-progreso');
              this.sidebarVisible = false;
            }
          }
        ]
      }
    ];
    if (this.user.role == "ADMIN"){
      this.addAdminOptions();
    }
  }

  private addAdminOptions() {
    this.sidebarMenu.push({
      label: 'Administración',
      items: [
        {label: 'Usuarios', icon: "pi pi-users", command: () => {
            this.router.navigateByUrl('/app/admin/usuarios');
            this.sidebarVisible = false;
          }},
        {label: 'Entidades', icon: "pi pi-building-columns", command: () => {
            this.router.navigateByUrl('/app/admin/entidades');
            this.sidebarVisible = false;
          }},
        {label: 'Formación', icon: "pi pi-graduation-cap", command: () => {
            this.router.navigateByUrl('/app/admin/formacion');
            this.sidebarVisible = false;
          }},
        {label: 'Eventos Formativos', icon: "pi pi-calendar", command: () => {
          this.router.navigateByUrl('/app/admin/eventos-formativos');
          this.sidebarVisible = false;
        }}
      ]
    });
  }
}
