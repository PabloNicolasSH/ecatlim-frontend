import {Role} from '../../shared/models/role.model';

export interface OnboardingStep {
  icon: string;
  title: string;
  description: string;
  tips?: string[];
}

const EDUCATION_ROLES = [Role.EVENT_DIRECTOR, Role.MANAGEMENT, Role.MANAGER_DIRECTOR, Role.TRAINER];

export function buildOnboardingSteps(roles: Role[]): OnboardingStep[] {
  const has = (...wanted: Role[]) => roles.some(role => wanted.includes(role));

  const steps: OnboardingStep[] = [
    {
      icon: 'pi pi-compass',
      title: '¡Te damos la bienvenida a ECATLIM!',
      description: 'Este es el aula virtual de la Escuela de Tiempo Libre de Scouts de Canarias. ' +
        'En un momento te enseñamos para qué sirve cada parte para que puedas moverte con tranquilidad.'
    },
    {
      icon: 'pi pi-bars',
      title: 'El menú',
      description: 'Arriba a la izquierda, en el botón «Menú», encontrarás todas las secciones de la plataforma. ' +
        'También ahí está tu perfil y el botón para cerrar sesión.'
    },
    {
      icon: 'pi pi-home',
      title: 'Inicio',
      description: 'Es la primera pantalla que ves al entrar. Reúne los próximos eventos y las últimas noticias de la escuela.'
    },
    {
      icon: 'pi pi-calendar',
      title: 'Calendario de la Escuela',
      description: 'Consulta los eventos formativos publicados, sus fechas y detalles, y desde aquí puedes gestionar tu inscripción.'
    },
    {
      icon: 'pi pi-bookmark',
      title: 'La Biblioteca',
      description: 'Recursos y documentación de apoyo que puedes consultar y descargar cuando los necesites.'
    },
    {
      icon: 'pi pi-info-circle',
      title: 'Información General',
      description: 'Todo lo que necesitas saber sobre la escuela y cómo funciona la formación.'
    }
  ];

  if (has(Role.STUDENT)) {
    steps.push({
      icon: 'pi pi-graduation-cap',
      title: 'Mi formación',
      description: 'En «Mi Progreso» ves tu ruta formativa: las etapas que estás cursando, las horas completadas, ' +
        'tus actividades y los certificados que vayas consiguiendo.'
    });
  }

  if (has(Role.HEAD_OF_EDUCATION)) {
    steps.push({
      icon: 'pi pi-user-plus',
      title: 'Solicitudes de alta',
      description: 'Como responsable de formación, aquí revisas y resuelves las solicitudes de las personas que quieren unirse a la escuela.'
    });
  }

  if (has(...EDUCATION_ROLES)) {
    steps.push({
      icon: 'pi pi-graduation-cap',
      title: 'Formación',
      description: 'Tu panel de gestión formativa: seguimiento del alumnado, convalidaciones, equipo formativo, ' +
        'eventos formativos y oferta educativa.'
    });
  }

  if (has(Role.ADMIN)) {
    steps.push({
      icon: 'pi pi-users',
      title: 'Administración',
      description: 'Desde «Usuarios» y «Entidades» puedes dar de alta, editar, activar y desactivar usuarios y gestionar los grupos scouts.'
    });
  }

  steps.push(
    {
      icon: 'pi pi-comments',
      title: 'Mensajes',
      description: 'El icono de chat de la esquina superior derecha te lleva a tus conversaciones. ' +
        'Un número sobre el icono te avisa de los mensajes sin leer.'
    },
    {
      icon: 'pi pi-bell',
      title: 'Notificaciones',
      description: 'La campana te avisa de novedades: actividades asignadas, nuevos eventos, noticias o certificados. ' +
        'Pulsa una notificación para ir directamente a ella.'
    },
    {
      icon: 'pi pi-user',
      title: 'Tu perfil',
      description: 'Pulsa tu nombre, al final del menú, para completar tus datos, cambiar tu foto o cambiar tu contraseña.'
    }
  );

  return steps;
}
