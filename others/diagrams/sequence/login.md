sequenceDiagram
    participant Usuario as Usuario
    participant WebUI as Interfaz de Usuario
    participant Servidor as Servidor API
    participant BD as Base de datos

    Usuario->>WebUI: Enviar formulario de inicio de sesión
    WebUI->>Servidor: POST /login
    activate Servidor
    Servidor->>BD: Consultar usuario por correo electrónico
    activate BD
    BD-->>Servidor: Devolver datos del usuario
    deactivate BD
    alt El usuario existe
        Servidor->>bcrypt: Comparar contraseña
        activate bcrypt
        bcrypt-->>Servidor: Devolver resultado de la comparación
        deactivate bcrypt
        alt La contraseña coincide
            Servidor-->>WebUI: Devolver datos del usuario
            WebUI-->>Usuario: Redirigir al panel de control
        else La contraseña no coincide
            Servidor-->>WebUI: Devolver mensaje de error
            WebUI-->>Usuario: Mostrar mensaje de error
        end
    else El usuario no existe
        Servidor-->>WebUI: Devolver mensaje de error
        WebUI-->>Usuario: Mostrar mensaje de error
    end
    deactivate Servidor

#Diagrama de secuencia para iniciar sesión
