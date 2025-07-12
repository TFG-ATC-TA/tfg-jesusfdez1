> [!NOTE]
> To read this document in English, visit [README.md](README.md)

# Backend
El backend de Lactokeeper constituye una API RESTful robusta desarrollada con Node.js y Express, diseñada para gestionar la totalidad de las funcionalidades del servidor en el sistema de gestión de granjas lecheras. Esta aplicación proporciona una interfaz de programación completa para la administración de usuarios, granjas, equipos, dispositivos IoT, recolección de datos y sistema de notificaciones.

## Stack tecnológico

La aplicación se fundamenta en un stack tecnológico moderno que implementa una arquitectura híbrida para el manejo eficiente de diferentes tipos de datos:

- **Backend**: Node.js + Express.js
- **Bases de datos**: 
  - MongoDB (NoSQL principal con Mongoose)
  - PostgreSQL (datos relacionales)
  - InfluxDB (series temporales de sensores IoT)
- **Comunicación**: MQTT (dispositivos IoT) + WebSockets (tiempo real)
- **Seguridad**: JWT + bcryptjs
- **Logging**: Winston
- **Testing**: Jest
- **Despliegue**: Docker

## Estructura del proyecto

El proyecto backend se organiza siguiendo una arquitectura modular que facilita el mantenimiento y la escalabilidad del código:

```
├── app.js              # Configuración principal de Express
├── bin/                # Punto de entrada del servidor
├── config/             # Configuraciones (DB, logging)
├── models/             # Esquemas Mongoose (User, Farm, Equipment, Device, Collection, Notification)
├── routes/             # Endpoints de la API
├── middleware/         # Autenticación y validaciones
├── utils/              # Utilidades del sistema
├── tests/              # Suite de pruebas automatizadas
└── logs/               # Archivos de log
```

## Instalación y configuración


## Instalación y configuración

### Prerrequisitos del sistema

La aplicación requiere Node.js versión 16 o superior como entorno de ejecución principal. Para el almacenamiento de datos es necesario disponer de MongoDB, PostgreSQL e InfluxDB en funcionamiento. 

### Proceso de instalación

La instalación del proyecto comienza con la descarga de todas las dependencias mediante npm install. Una vez completada la instalación de paquetes, es necesario configurar y verificar el correcto funcionamiento de las bases de datos MongoDB, PostgreSQL e InfluxDB, asegurándose de que todas estén operativas y accesibles.


## Scripts disponibles

```bash
npm start               # Producción
npm run dev            # Desarrollo (nodemon)
npm test               # Tests completos
npm run test:watch     # Tests en modo watch
npm run test:coverage  # Reporte de cobertura
```

## Contenedorización y despliegue

La aplicación está preparada para despliegue mediante Docker utilizando una imagen base de Node.js Alpine. El contenedor expone el puerto 3001 por defecto y está optimizado para entornos de producción.


