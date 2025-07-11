sequenceDiagram
    participant Usuario as Usuario
    participant IU as Interfaz de Usuario
    participant API as Servidor API
    participant Auth as Servicio de Autenticación
    participant BD as Base de Datos

    Usuario->>IU: Completar formulario de nueva granja
    IU->>API: POST /farm
    API->>Auth: Verificar token
    alt Token válido
        Auth-->>API: Token válido
        API->>Auth: Verificar rol del usuario
        Auth-->>API: Rol (Administrador)
        
        alt Administrador
            API->>BD: Verificar si la granja ya existe
            BD-->>API: Granja no existe
            API->>BD: Crear nueva granja
            BD-->>API: Granja creada con éxito
            API-->>IU: Devolver mensaje de éxito
            IU-->>Usuario: Mostrar mensaje de éxito
        else Granja ya existe
            BD-->>API: Granja ya existe
            API-->>IU: Devolver mensaje de error
            IU-->>Usuario: Mostrar mensaje de error
        end
    else No administrador
        Auth-->>API: No administrador
        API-->>IU: Devolver mensaje de error
        IU-->>Usuario: Mostrar mensaje de error
    else Token inválido
        Auth-->>API: Token inválido
        API-->>IU: Devolver mensaje de error
        IU-->>Usuario: Mostrar mensaje de error
    end

# Diagrama de secuencia para crear granja
