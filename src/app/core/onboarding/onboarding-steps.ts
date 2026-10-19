import {Role} from '../../shared/models/role.model';
import {OnboardingModuleId} from './onboarding.model';

export interface OnboardingStep {
  title: string;
  description: string;
  /** Route to open before showing the step. */
  route?: string;
  /** Candidate selectors, the first visible one is highlighted. No match (or none) shows a centered popover. */
  selectors?: string[];
  /** Whether the side menu must be open during this step. */
  menu?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Explains a whole page: on large screens it docks to the bottom-right corner instead of pointing at an element. */
  page?: boolean;
}

export interface OnboardingTaskDef {
  label: string;
  /** Where the user goes to do the task. */
  route: string;
  /** Route that completes a manual task when visited. */
  visitRoute?: string;
}

export interface OnboardingModuleDef {
  id: OnboardingModuleId;
  title: string;
  description: string;
  icon: string;
  appliesTo: (roles: Role[]) => boolean;
  tasks: Record<string, OnboardingTaskDef>;
  steps: (manualUrl: string) => OnboardingStep[];
}

/** The routed page component is the sibling that follows the router outlet. */
const PAGE = '.content-container > router-outlet + *';
const PAGE_TITLE_OR_PAGE = [`${PAGE} h1`, PAGE, '.content-container'];

const EDUCATION_ROLES = [Role.EVENT_DIRECTOR, Role.MANAGEMENT, Role.MANAGER_DIRECTOR, Role.TRAINER];

function pageStep(route: string, title: string, description: string): OnboardingStep {
  return {route, selectors: PAGE_TITLE_OR_PAGE, title, description, side: 'bottom', page: true};
}

function closingStep(title: string, description: string): OnboardingStep {
  return {route: '/app/home', title, description};
}

export const ONBOARDING_MODULES: OnboardingModuleDef[] = [
  {
    id: 'BASICS',
    title: 'Primeros pasos',
    description: 'Conoce la plataforma: el menú, el calendario, la biblioteca, los mensajes y tu perfil.',
    icon: 'pi pi-compass',
    appliesTo: () => true,
    tasks: {
      PROFILE_COMPLETED: {label: 'Completa todos los datos de tu perfil', route: '/app/perfil'}
    },
    steps: manualUrl => [
      {
        route: '/app/home',
        title: '¡Te damos la bienvenida a ECATLIM!',
        description: 'Este es el aula virtual de la Escuela de Tiempo Libre de Scouts de Canarias. ' +
          'Vamos a hacer un recorrido por la plataforma: iremos abriendo cada página para que veas para qué sirve.'
      },
      {
        route: '/app/home',
        selectors: ['[data-tour="menu-button"]'],
        title: 'El botón de menú',
        description: 'Desde aquí abres el menú con todas las secciones de la plataforma. Es tu punto de partida para moverte.',
        side: 'bottom'
      },
      {
        route: '/app/home',
        menu: true,
        selectors: ['p-panelmenu'],
        title: 'Las secciones',
        description: 'Estas son las secciones a las que tienes acceso según tu rol. ' +
          'Al final del menú está tu perfil y el botón para cerrar sesión.',
        side: 'right'
      },
      {
        route: '/app/calendario',
        selectors: ['.content-container full-calendar', ...PAGE_TITLE_OR_PAGE],
        page: true,
        title: 'Calendario de la Escuela',
        description: 'Todos los eventos formativos publicados. Pulsa uno para ver sus fechas y detalles ' +
          'y gestionar tu inscripción.',
        side: 'top'
      },
      pageStep('/app/biblioteca', 'La Biblioteca',
        'Recursos y materiales de apoyo. Puedes filtrarlos por tipo, buscarlos y descargarlos.'),
      pageStep('/app/informacion-general', 'Información General',
        'Qué es la Insignia de Madera y cómo funciona la escuela, con algunas cifras de ECATLIM.'),
      {
        route: '/app/chat',
        selectors: ['[data-tour="chat-button"]'],
        title: 'Mensajes',
        description: 'Este icono te lleva a tus conversaciones, que es la página que ves ahora. ' +
          'Un número sobre el icono te avisa de los mensajes sin leer.',
        side: 'bottom'
      },
      {
        route: '/app/chat',
        selectors: ['[data-tour="notifications-button"]'],
        title: 'Notificaciones',
        description: 'La campana te avisa de novedades: actividades asignadas, nuevos eventos, noticias o certificados. ' +
          'Al pulsar una notificación vas directamente a ella.',
        side: 'bottom'
      },
      pageStep('/app/perfil', 'Tu perfil',
        'Accedes pulsando tu nombre al final del menú. Aquí completas tus datos, ' +
        'cambias tu foto y cambias tu contraseña.'),
      closingStep('¡Listo! Ya conoces lo básico',
        'Si en algún momento tienes dudas, consulta el manual de usuario, donde cada funcionalidad ' +
        'está explicada con más detalle. ' +
        (manualUrl
          ? `<a href="${manualUrl}" target="_blank" rel="noopener" style="font-weight:600;text-decoration:underline">Abrir el manual de usuario</a>.<br><br>`
          : '') +
        'Al terminar verás tus módulos y sus tareas (también en Menú → «Guía de inicio y logros»): completa cada uno para ganar su insignia.')
    ]
  },
  {
    id: 'STUDENT',
    title: 'Alumnado',
    description: 'Tu ruta formativa: cómo ver tu progreso, inscribirte en una etapa y en tu primer curso.',
    icon: 'pi pi-graduation-cap',
    appliesTo: roles => roles.includes(Role.STUDENT),
    tasks: {
      STAGE_ENROLLED: {label: 'Inscríbete en una etapa formativa', route: '/app/mi-ruta-formacion'},
      FIRST_COURSE_ENROLLED: {label: 'Inscríbete en tu primer curso', route: '/app/calendario'}
    },
    steps: () => [
      pageStep('/app/mi-ruta-formacion', 'Mi Progreso',
        'Tu ruta formativa: las etapas que cursas, las horas completadas, tus actividades ' +
        'y los certificados que vayas consiguiendo. Empieza inscribiéndote en una etapa.'),
      {
        route: '/app/calendario',
        selectors: ['.content-container full-calendar', ...PAGE_TITLE_OR_PAGE],
        page: true,
        title: 'Inscríbete en un curso',
        description: 'Abre un evento del calendario para ver sus bloques y apuntarte a tu primer curso.',
        side: 'top'
      },
      closingStep('Módulo completado',
        'Para ganar la insignia de alumnado, inscríbete en una etapa formativa y en tu primer curso. ' +
        'Verás tu avance en la guía.')
    ]
  },
  {
    id: 'HEAD_OF_EDUCATION',
    title: 'Responsable de formación',
    description: 'Cómo revisar y resolver las solicitudes de alta de nuevas personas.',
    icon: 'pi pi-user-plus',
    appliesTo: roles => roles.includes(Role.HEAD_OF_EDUCATION),
    tasks: {
      OPEN_PENDING_REQUESTS: {
        label: 'Abre las solicitudes de alta',
        route: '/app/responsable-formacion/solicitudes-alta',
        visitRoute: '/app/responsable-formacion/solicitudes-alta'
      }
    },
    steps: () => [
      pageStep('/app/responsable-formacion/solicitudes-alta', 'Solicitudes de alta',
        'Aquí revisas y resuelves las solicitudes de quienes quieren unirse a la escuela. ' +
        'Recibirás una notificación cuando haya solicitudes pendientes.'),
      closingStep('Módulo completado',
        'Para ganar la insignia, abre la página de solicitudes de alta por tu cuenta.')
    ]
  },
  {
    id: 'EDUCATION_TEAM',
    title: 'Equipo formativo',
    description: 'El panel de formación: alumnado, convalidaciones, equipo, eventos y oferta educativa.',
    icon: 'pi pi-briefcase',
    appliesTo: roles => roles.some(role => EDUCATION_ROLES.includes(role)),
    tasks: {
      OPEN_STUDENTS: {label: 'Consulta el listado de alumnado', route: '/app/alumnado', visitRoute: '/app/alumnado'},
      OPEN_EDUCATION_OFFER: {
        label: 'Explora la oferta educativa',
        route: '/app/oferta-educativa',
        visitRoute: '/app/oferta-educativa'
      }
    },
    steps: () => [
      pageStep('/app/formacion', 'Panel de formación', 'Un resumen del estado de la escuela.'),
      pageStep('/app/alumnado', 'Alumnado', 'El listado de alumnos y alumnas, con su progreso y su situación.'),
      pageStep('/app/convalidaciones', 'Convalidaciones',
        'Las solicitudes de reconocimiento de formación previa, para revisarlas y responderlas.'),
      pageStep('/app/equipo-formativo', 'Equipo formativo', 'Las personas que forman el equipo de la escuela y sus roles.'),
      pageStep('/app/eventos-formativos', 'Eventos formativos',
        'Desde aquí creas y gestionas los eventos formativos y sus actividades.'),
      pageStep('/app/oferta-educativa', 'Oferta educativa', 'Las etapas formativas de la escuela y su contenido.'),
      closingStep('Módulo completado',
        'Para ganar la insignia, abre por tu cuenta el listado de alumnado y la oferta educativa.')
    ]
  },
  {
    id: 'ADMIN',
    title: 'Administración',
    description: 'Gestión de usuarios y entidades de la plataforma.',
    icon: 'pi pi-cog',
    appliesTo: roles => roles.includes(Role.ADMIN),
    tasks: {
      OPEN_USERS: {label: 'Abre la gestión de usuarios', route: '/app/admin/usuarios', visitRoute: '/app/admin/usuarios'},
      OPEN_ENTITIES: {label: 'Abre la gestión de entidades', route: '/app/admin/entidades', visitRoute: '/app/admin/entidades'}
    },
    steps: () => [
      pageStep('/app/admin/usuarios', 'Usuarios', 'Da de alta, edita, activa y desactiva usuarios.'),
      pageStep('/app/admin/entidades', 'Entidades', 'Gestiona los grupos scouts y entidades de la plataforma.'),
      closingStep('Módulo completado',
        'Para ganar la insignia, abre por tu cuenta la gestión de usuarios y la de entidades.')
    ]
  }
];

export function modulesForRoles(roles: Role[]): OnboardingModuleDef[] {
  return ONBOARDING_MODULES.filter(module => module.appliesTo(roles));
}
