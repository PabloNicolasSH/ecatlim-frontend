import {Routes} from '@angular/router';
import {LoginComponent} from './features/login/login.component';
import {RegisterRequestComponent} from './features/register-request/register-request.component';
import {MainComponent} from './core/main/main.component';
import {authGuard} from './core/auth/guards/auth-guard';
import {HomeComponent} from './features/home/home.component';
import {noAuthGuard} from './core/auth/guards/no-auth-guard';
import {UserProfileComponent} from './features/profile/user-profile/user-profile.component';
import {UserListComponent} from './features/user-list/user-list.component';
import {ResetPasswordComponent} from './features/reset-password/reset-password.component';
import {PrivacyPolicyComponent} from './info-pages/privacy-policy/privacy-policy.component';
import {InformationFormPagesComponent} from './core/information-form-pages/information-form-pages.component';
import {GeneralInfoComponent} from './info-pages/general-info/general-info.component';
import {AdminEducationalHomeComponent} from './features/admin-educational-home/admin-educational-home.component';
import {EntityListComponent} from './features/entity-list/entity-list.component';
import {AdminEducationOfferComponent} from './features/admin-education-offer/admin-education-offer.component';
import {
  AdminCreateEducationStageComponent
} from './features/admin-create-education-stage/admin-create-education-stage.component';
import {EducationStageDetailComponent} from './features/education-stage-detail/education-stage-detail.component';
import {EducationOfferComponent} from './features/education-offer/education-offer.component';
import {
  UserEducationStagesProgressComponent
} from './features/user-education-stages-progress/user-education-stages-progress.component';
import {
  AdminEditCreateEventComponent
} from './features/event-creator/admin-create-event/admin-edit-create-event.component';
import {UserEventCalendarComponent} from './features/user-event-calendar/user-event-calendar.component';
import {AdminEventCalendarComponent} from './features/admin-event-calendar/admin-event-calendar.component';
import {AdminCreateActivityComponent} from './features/admin-create-activity/admin-create-activity.component';
import {UserActivityViewComponent} from './features/user-activity-view/user-activity-view.component';
import {ResourceLibraryComponent} from './features/resource-library/resource-library.component';
import {
  HeadEducationPendingUsersListComponent
} from './features/head-education-pending-users-list/head-education-pending-users-list.component';
import {Role} from './shared/models/role.model';
import {baseRedirect} from './core/auth/redirect-function';

export const routes: Routes = [
  {
    path: "",
    component: InformationFormPagesComponent,
    children: [
      {
        path: "",
        pathMatch: "full",
        redirectTo: "login"
      },
      {
        path: "login",
        component: LoginComponent,
        canActivate: [noAuthGuard]
      },
      {
        path: "solicitud-registro",
        component: RegisterRequestComponent,
        canActivate: [noAuthGuard]
      },
      {
        path: "resetear-contraseña",
        component: ResetPasswordComponent,
        canActivate: [noAuthGuard]
      },
      {
        path: "cambiar-contraseña",
        component: ResetPasswordComponent,
        data: {
          changePassword: true
        },
        canActivate: [authGuard]
      },
      {
        path: "politica-privacidad",
        component: PrivacyPolicyComponent
      }
    ]
  },
  {
    path: "app",
    component: MainComponent,
    canActivateChild: [authGuard],
    children: [
      {
        path: "home",
        component: HomeComponent,
      },
      {
        path: "informacion-general",
        component: GeneralInfoComponent
      },
      {
        path: "perfil",
        component: UserProfileComponent
      },
      {
        path: "calendario",
        component: UserEventCalendarComponent
      },
      {
        path: "oferta-educativa",
        component: EducationOfferComponent
      },
      {
        path: "biblioteca",
        component: ResourceLibraryComponent
      },
      {
        path: ":eventId/actividades",
        component: UserActivityViewComponent,
        data: {roles: [Role.STUDENT]}
      },
      {
        path: "mi-progreso",
        component: UserEducationStagesProgressComponent,
        data: {roles: [Role.STUDENT]}
      },
      {
        path: "responsable-formacion/solicitudes-alta",
        component: HeadEducationPendingUsersListComponent,
        data: {roles: [Role.HEAD_OF_EDUCATION]}
      },
      {
        path: "admin", //todo for subroutes with common roles do this, everything here is protected under the admin role
        data: {roles: [Role.ADMIN]},
        children: [
          {
            path: "usuarios",
            component: UserListComponent
          },
          {
            path: "entidades",
            component: EntityListComponent
          },
          {
            path: "formacion",
            component: AdminEducationalHomeComponent
          },
          {
            path: "eventos-formativos",
            component: AdminEventCalendarComponent
          },
          {
            path: "eventos-formativos/crear-evento",
            component: AdminEditCreateEventComponent
          },
          {
            path: "eventos-formativos/editar/:id",
            component: AdminEditCreateEventComponent
          },
          {
            path: "eventos-formativos/:eventId/actividades/crear-nueva",
            component: AdminCreateActivityComponent
          },
          {
            path: "oferta-educativa",
            component: AdminEducationOfferComponent
          },
          {
            path: "oferta-educativa/detalle-etapa/:id",
            component: EducationStageDetailComponent
          },
          {
            path: "oferta-educativa/crear-etapa-educativa",
            component: AdminCreateEducationStageComponent
          },
          {
            path: "**",
            redirectTo: "usuarios"
          }
        ]
      },
      {
        path: "**",
        redirectTo: baseRedirect
      }
    ]
  },
  {
    path: "**",
    redirectTo: baseRedirect
  }
];
