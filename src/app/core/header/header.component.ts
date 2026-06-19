import {Component, HostListener, inject, OnInit, signal, ViewChild, WritableSignal} from '@angular/core';
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
import {Notification} from '../../shared/models/notification.model';
import {FileService} from '../../shared/services/file.service';

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
export class HeaderComponent implements OnInit {

  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly fileService = inject(FileService);

  @ViewChild('op') op!: Popover;

  user!: Profile;
  avatarUrl: any = null;
  sidebarVisible: boolean = false;

  windowWidth = signal(window.innerWidth);

  messages = signal(["¿Vienes al curso de Agosto?"]);
  notifies: WritableSignal<Notification[]> = signal([]);
  sidebarMenu!: MenuItem[];

  ngOnInit() {
    const savedMe = localStorage.getItem('me');
    if (savedMe) {
      this.user = JSON.parse(savedMe);
    }
    this.fileService.avatarUrl$.subscribe(url => this.avatarUrl = url);
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
    if (this.user?.role == "ADMIN"){
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

  protected logout() {
    this.authService.logout()
  }
}
