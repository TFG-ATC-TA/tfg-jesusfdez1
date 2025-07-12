<div align="center">

<img src=".github/assets/vacas.png" width="400"/>

Aplicación web de código abierto para la gestión de vaquerías, dispositivos IoT y más.

</div>

# Lactokeeper

> [!NOTE]
> To read this document in English, visit this [file](readme.md)

Este proyecto tiene como objetivo desarrollar una aplicación web para la gestión de vaquerías, equipamiento relacionado, recogidas de leche y dispositivos IoT que permiten monitorear distintos aspectos del proceso de producción láctea. La aplicación está diseñada para diferentes roles de usuario, como administradores, veterinarios y ganaderos, cada uno con permisos y vistas personalizadas.

## Estructura del proyecto

El repositorio contiene dos carpetas principales:

- **`src/`**: Esta carpeta contiene el código fuente de la aplicación. Esta a su vez se separa en dos carpetas para el frontend y el backend.
    - **`frontend/`**: Se incluye el código relacionado con la interfaz de usuario, utilizando tecnologías modernas de desarrollo web.
    - **`backend/`**: Código encargado de gestionar las funcionalidades del servidor, base de datos y API que conecta con el frontend.

- **`others/`**: Contiene recursos adicionales necesarios para entender el proyecto. Esto incluye bocetos y prototipos de las interfaces y lógica de usuario. Así como documentación, diagramas, y cualquier material relacionado con la estructura del sistema. También incluye un poblador de datos (`populate-mongodb/`) que permite inicializar la base de datos MongoDB con datos de prueba.

## Cómo ejecutar el programa

Lactokeeper está completamente dockerizado para facilitar su despliegue y ejecución. Lo único que necesitas tener instalado en tu sistema es [Docker](https://www.docker.com/get-started), que se encargará de gestionar todas las dependencias y servicios necesarios.

### Puesta en marcha

Comienza clonando este repositorio en tu máquina local y navegando al directorio del proyecto:
```bash
git clone https://github.com/TFG-ATC-TA/tfg-jesusfdez1.git
cd tfg-jesusfdez1
```

Si es tu primera vez ejecutando el proyecto o has realizado cambios en el código, es recomendable compilar las imágenes de Docker antes de proceder:
```bash
docker-compose build
```

Con todo preparado, puedes levantar todos los servicios de la aplicación con un comando. Este proceso iniciará automáticamente la base de datos, el backend y el frontend:
```bash
docker-compose up
```

Una vez que todos los contenedores estén funcionando correctamente, simplemente abre tu navegador web favorito y visita [http://localhost:3000](http://localhost:3000). Allí encontrarás la interfaz de Lactokeeper lista para usar.

### Finalizar la ejecución

Cuando hayas terminado de trabajar con la aplicación, puedes detener todos los servicios de manera sencilla:
```bash
# Presiona Ctrl+C en la terminal donde está ejecutándose, o alternativamente:
docker-compose down
```

## Contribuir

¿Quieres formar parte del desarrollo de Lactokeeper? ¡Bienvenido! No dudes en colaborar aunque no seas desarrollador, hay muchas otras formas importantes en las que puedes contribuir.

---

## Seguridad

Si crees que has encontrado una vulnerabilidad de seguridad, por favor, notifícalo de creando un pull request o un issue en el repositorio. Investigaremos todos los avisos que recibamos. 