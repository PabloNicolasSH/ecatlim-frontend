import {Component, HostListener, inject, OnDestroy, OnInit, signal, ViewChild, WritableSignal} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {AuthService} from '../auth/auth.service';
import {Button} from 'primeng/button';
import {OverlayBadge} from 'primeng/overlaybadge';
import {Router, RouterLink} from '@angular/router';
import {Drawer} from 'primeng/drawer';
import {Popover} from 'primeng/popover';
import {Avatar} from 'primeng/avatar';
import {PanelMenu} from 'primeng/panelmenu';
import {Divider} from 'primeng/divider';
import {LoggedUserDataService} from '../auth/logged-user-data-service';
import {ChatService} from '../../shared/services/chat.service';
import {WebsocketService} from '../../shared/services/websocket.service';
import {Subscription} from 'rxjs';
import {User} from '../../shared/models/user.model';
import {Notification} from '../../shared/models/notification.model';
import {Role} from '../../shared/models/role.model';

@Component({
  selector: 'app-header',
  imports: [
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
export class HeaderComponent implements OnInit, OnDestroy {

  protected readonly chatService = inject(ChatService);
  protected readonly websocketService = inject(WebsocketService);
  private notificationSub?: Subscription;
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly loggedUserDataService = inject(LoggedUserDataService);

  @ViewChild('op') op!: Popover;

  user!: User;
  avatarUrl: any = null;
  sidebarVisible: boolean = false;

  windowWidth = signal(window.innerWidth);
  messages = signal(["¿Vienes al curso de Agosto?"]);
  notifies: WritableSignal<Notification[]> = signal([]);

  sidebarMenu!: MenuItem[];
  unreadChats: number = 0;

  ngOnInit() {
    const savedMe = localStorage.getItem('me');
    if (savedMe) {
      this.user = JSON.parse(savedMe);
    }
    this.loggedUserDataService.avatarUrl$.subscribe(url => this.avatarUrl = url);
    this.createSidebarMenu();
    this.chatService.unreadChats$.subscribe(count => this.unreadChats = count);
    this.chatService.refreshUnreadChats();
    this.notificationSub = this.websocketService.getNotifications()
      .subscribe(notification => this.chatService.markChatUnread(notification.chatId));
  }

  ngOnDestroy() {
    this.notificationSub?.unsubscribe();
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

  userFirstLetter() {
    const name = this.user.profile?.name || this.user.email;
    return name.at(0);
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
        icon: "pi pi-bookmark",
        command: () => {
          this.router.navigateByUrl('/app/biblioteca');
          this.sidebarVisible = false;
        }
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

    if (this.user?.roles.includes(Role.HEAD_OF_EDUCATION)) {
      this.addHeadEducationOptions();
    }

    if (this.user?.roles.includes(Role.ADMIN)) {
      this.addAdminOptions();
    }
  }

  private addHeadEducationOptions() {
    this.sidebarMenu.push({
      label: 'Responsable de Formación',
      items: [
        {
          label: 'Solicitudes de Alta', icon: 'pi pi-user-plus', command: () => {
            this.router.navigateByUrl('/app/responsable-formacion/solicitudes-alta');
            this.sidebarVisible = false;
          }
        }
      ]
    });
  }

  private addAdminOptions() {
    this.sidebarMenu.push({
      label: 'Administración',
      items: [
        {
          label: 'Usuarios', icon: "pi pi-users", command: () => {
            this.router.navigateByUrl('/app/admin/usuarios');
            this.sidebarVisible = false;
          }
        },
        {
          label: 'Entidades', icon: "pi pi-building-columns", command: () => {
            this.router.navigateByUrl('/app/admin/entidades');
            this.sidebarVisible = false;
          }
        },
        {
          label: 'Formación', icon: "pi pi-graduation-cap", command: () => {
            this.router.navigateByUrl('/app/admin/formacion');
            this.sidebarVisible = false;
          }
        },
        {
          label: 'Eventos Formativos', icon: "pi pi-calendar", command: () => {
            this.router.navigateByUrl('/app/admin/eventos-formativos');
            this.sidebarVisible = false;
          }
        }
      ]
    });
  }

  protected logout() {
    this.authService.logout()
  }

  protected getUserRolesTag() {
    if (!this.user.roles || this.user.roles.length === 0) {
      return [{label: 'Sin Rol', severity: 'secondary'}];
    }

    return this.user.roles.map(role => {
      switch (role.toUpperCase()) {
        case 'ADMIN':
          return 'Administración';
        case 'EVENT_DIRECTOR':
          return 'Dirección de Eventos';
        case 'HEAD_OF_EDUCATION':
          return 'Coord. Formación';
        case 'STUDENT':
          return 'Persona en Formación';
        default:
          return role;
      }
    }).join(", ");
  }
}
