import { Routes } from '@angular/router';
import {LoginComponent} from './features/login/login.component';
import {RegisterRequestComponent} from './features/register-request/register-request.component';
import {MainComponent} from './core/main/main.component';
import {authGuard} from './core/auth/auth.guard';
import {HomeComponent} from './features/home/home.component';
import {redirect} from './core/auth/redirect.guard';
import {UserProfileComponent} from './features/profile/user-profile/user-profile.component';
import {UserListComponent} from './features/user-list/user-list.component';
import {ResetPasswordComponent} from './features/reset-password/reset-password.component';
import {PrivacyPolicyComponent} from './info-pages/privacy-policy/privacy-policy.component';
import {InformationFormPagesComponent} from './core/information-form-pages/information-form-pages.component';
import {GeneralInfoComponent} from './info-pages/general-info/general-info.component';
import {DashboardComponent} from './features/admin-dashboard/components/dashboard/dashboard.component';
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
import {AdminEditCreateEventComponent} from './features/event-creator/admin-create-event/admin-edit-create-event.component';
import {UserEventCalendarComponent} from './features/user-event-calendar/user-event-calendar.component';
import {AdminEventCalendarComponent} from './features/admin-event-calendar/admin-event-calendar.component';
import {AdminCreateActivityComponent} from './features/admin-create-activity/admin-create-activity.component';
import {UserActivityViewComponent} from './features/user-activity-view/user-activity-view.component';
import {ResourceLibraryComponent} from './features/resource-library/resource-library.component';

export const routes: Routes = [
  {
    path:"",
    component: InformationFormPagesComponent,
    children: [
      {
        path: "",
        pathMatch: "full",
        redirectTo: "login"
      },
      {
        path: "login",
        component: LoginComponent
      },
      {
        path: "solicitud-registro",
        component: RegisterRequestComponent
      },
      {
        path: "resetear-contraseña",
        component: ResetPasswordComponent
      },
      {
        path: "cambiar-contraseña",
        component: ResetPasswordComponent,
        data: {
          changePassword: true
        }
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
    canActivate: [authGuard],
    children: [
      {
        path: "home",
        component: HomeComponent
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
        component: UserActivityViewComponent
      },
      {
        path: "mi-progreso",
        component: UserEducationStagesProgressComponent
      },
      {
        path: "admin/usuarios",
        component: UserListComponent
      },
      {
        path: "admin/entidades",
        component: EntityListComponent
      },
      {
        path: "admin/formacion",
        component: DashboardComponent
      },
      {
        path: "admin/eventos-formativos",
        component: AdminEventCalendarComponent
      },
      {
        path: "admin/eventos-formativos/crear-evento",
        component: AdminEditCreateEventComponent
      },
      {
        path: "admin/eventos-formativos/editar/:id",
        component: AdminEditCreateEventComponent
      },
      {
        path: "admin/eventos-formativos/:eventId/actividades/crear-nueva",
        component: AdminCreateActivityComponent
      },
      {
        path: "admin/oferta-educativa",
        component: AdminEducationOfferComponent
      },
      {
        path: "admin/oferta-educativa/detalle-etapa/:id",
        component: EducationStageDetailComponent
      },
      {
        path: "admin/oferta-educativa/crear-etapa-educativa",
        component: AdminCreateEducationStageComponent
      }
    ]
  },
  {
    path: "**",
    redirectTo: redirect
  }
];
