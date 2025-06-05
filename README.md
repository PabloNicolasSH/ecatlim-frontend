# 🎓 ECATLIM - Frontend

Este proyecto es el frontend de la plataforma **ECATLIM**, un aula virtual para la formación en animación sociocultural, perteneciente a la Escuela Canaria de Animación y Tiempo Libre Insignia de Madera. Ha sido generado con [Angular CLI](https://github.com/angular/angular-cli) versión 19.2.0.

## 🧰 Tecnologías

- Angular 19
- TailwindCSS
- PrimeNG + PrimeIcons
- TypeScript

---

## 🚀 Servidor de desarrollo

Para iniciar un servidor de desarrollo local, ejecuta:

```bash
ng serve
```
Una vez iniciado, abre tu navegador en http://localhost:4200. <br>
La aplicación se recargará automáticamente cada vez que modifiques los archivos fuente.

---

## ⚙️ Generación de código (Scaffolding)
Angular CLI permite generar componentes y otros elementos de forma automática. Por ejemplo:
```bash
ng generate component nombre-componente
```
Para ver todas las opciones disponibles (component, directive, pipe, etc.):

```bash
ng generate --help
```
---
## 🏗️ Compilación del proyecto
Para compilar el proyecto:

```bash
ng build
```

Los archivos de salida se almacenarán en la carpeta `dist/`. <br>
La compilación en modo producción incluye optimizaciones de rendimiento.

---
## ✅ Pruebas unitarias
Para ejecutar las pruebas unitarias con [Karma](https://karma-runner.github.io/latest/index.html):
```bash
ng test
```

---
## 🧪 Pruebas end-to-end (E2E)
Angular CLI no incluye por defecto un framework de pruebas end-to-end. Puedes integrar uno según tus necesidades. <br>
Si ya tienes uno configurado, ejecuta:
```bash
ng e2e
```
---
## 🌐 Variables de entorno
Edita el archivo `src/environments/environment.ts` para configurar el entorno de desarrollo o producción:
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api' // Cambiar a URL real en producción
};
```
---
## 🚧 Flujo de desarrollo y despliegue (GitFlow)
Este repositorio sigue una estrategia GitFlow, por lo que el desarrollo se organiza de la siguiente manera:
- `main`: Rama principal de producción (despliegue estable)
- `develop`: Rama de integración continua (pre-producción)
- `feature/*`: Nuevas funcionalidades
- `fix/*`: Correcciones
- `release/*`: Versiones candidatas
- `hotfix/*`: Urgencias en producción

El despliegue se realiza desde la rama main, y está previsto su uso con CI/CD en Azure u otras plataformas.

---

## 📚 Recursos adicionales
- [Documentación oficial de Angular CLI](https://angular.dev/tools/cli)
- [TailwindCSS](https://tailwindcss.com/docs/installation/using-vite)
- [PrimeNG](https://primeng.org/installation)
