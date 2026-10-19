import {Component, inject, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {HeadEducationPendingUsersListComponent} from '../head-education-pending-users-list/head-education-pending-users-list.component';
import {HeadEducationMembersComponent} from '../head-education-members/head-education-members.component';
import {HeadEducationEventsComponent} from '../head-education-events/head-education-events.component';

type DashboardTab = 'requests' | 'members' | 'events';

@Component({
  selector: 'app-head-education-dashboard',
  imports: [
    HeadEducationPendingUsersListComponent,
    HeadEducationMembersComponent,
    HeadEducationEventsComponent
  ],
  templateUrl: './head-education-dashboard.component.html'
})
export class HeadEducationDashboardComponent {

  readonly tabs: { id: DashboardTab; label: string; icon: string }[] = [
    {id: 'requests', label: 'Solicitudes de alta', icon: 'pi pi-user-plus'},
    {id: 'members', label: 'Mi entidad', icon: 'pi pi-users'},
    {id: 'events', label: 'Eventos', icon: 'pi pi-calendar'}
  ];

  private readonly route = inject(ActivatedRoute);

  activeTab = signal<DashboardTab>(this.initialTab());

  private initialTab(): DashboardTab {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    return this.tabs.some(t => t.id === tab) ? tab as DashboardTab : 'requests';
  }
}
