> [!NOTE]
> To read this document in English, visit [README.md](README.md)

# Frontend
La interfaz web de Lactokeeper está desarrollada con **Next.js** y **React**, proporcionando una experiencia moderna, responsiva y optimizada para la gestión de granjas lecheras. El frontend permite la visualización y administración de usuarios, granjas, dispositivos IoT, notificaciones y datos relevantes del sector lácteo, integrando autenticación segura y funcionalidades PWA.

## Stack tecnológico

El frontend utiliza un stack actual y eficiente para aplicaciones web empresariales:

- **Framework principal**: Next.js + React 18
- **Estilos**: Tailwind CSS + CSS customizado
- **Componentes UI**: Radix UI, Lucide React, Framer Motion
- **Gestión de estado**: Zustand, React Context
- **Autenticación**: NextAuth.js
- **Validación de formularios**: React Hook Form + Zod
- **Testing**: Jest + Testing Library
- **PWA**: Configuración y soporte para Progressive Web App
- **Despliegue**: Docker

## Estructura del proyecto

El frontend está organizado de forma modular y escalable:

```
├── app/                # Estructura de rutas y páginas Next.js (incluye login, error, not-found, layout)
├── components/         # Componentes reutilizables (UI, layout, formularios, tablas, modales, charts)
├── constants/          # Configuración estática (navegación, colores, datos)
├── hooks/              # Custom hooks para lógica de negocio y contexto
├── lib/                # Utilidades y helpers
├── providers/          # Providers de contexto global (ej. sesión)
├── public/             # Recursos estáticos (imágenes, iconos, fuentes, manifest)
├── services/           # Lógica de acceso a APIs y datos
├── tests/              # Pruebas unitarias y de integración
├── types/              # Tipos y modelos TypeScript
├── middleware.ts       # Middleware de autenticación y control de acceso
├── next.config.mjs     # Configuración de Next.js
├── Dockerfile          # Configuración para despliegue en contenedores
├── tailwind.config.ts  # Configuración de Tailwind CSS
├── package.json        # Dependencias y scripts
└── tsconfig.json       # Configuración de TypeScript
```

## Instalación y configuración

### Prerrequisitos del sistema

- Node.js v18 o superior
- Acceso a las variables de entorno necesarias (ver `.env.local`)
- Backend y bases de datos operativos para la integración

### Proceso de instalación

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Configura las variables de entorno en `.env.local` (ver ejemplo en `.env.docker`).
3. Para desarrollo, ejecuta:
   ```bash
   npm run dev
   ```

## Scripts disponibles

- `dev`: Inicia el servidor de desarrollo Next.js
- `build`: Compila la aplicación para producción
- `start`: Inicia el servidor en modo producción
- `lint`: Ejecuta ESLint
- `test`: Ejecuta las pruebas unitarias
- `test:coverage`: Muestra el reporte de cobertura de tests
- `generate-icons`: Genera los iconos para PWA

## Seguridad y autenticación

El acceso a las rutas está protegido mediante middleware y NextAuth.js, permitiendo roles diferenciados (Administrador, Ganadero, Veterinario, Industria). El middleware controla el acceso y redirige según permisos y autenticación.

## PWA y experiencia móvil

La aplicación está optimizada como PWA, permitiendo instalación en dispositivos móviles y acceso offline limitado. Incluye manifest, iconos adaptativos y configuración para web-app en iOS y Android.

## Testing

Las pruebas se encuentran en la carpeta `tests/` y utilizan Jest junto con Testing Library para asegurar la calidad de los componentes y lógica de negocio.

## Despliegue

El despliegue se realiza mediante Docker, siguiendo buenas prácticas para producción y CI/CD.
