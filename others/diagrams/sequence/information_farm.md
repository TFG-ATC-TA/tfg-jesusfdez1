sequenceDiagram
    participant Usuario as Usuario
    participant IU as Interfaz de Usuario
    participant API as Servidor API
    participant Auth as Servicio de Autenticación
    participant BD as Base de Datos

    Usuario->>IU: Seleccionar granja para ver detalles
    IU->>API: GET /farm/:farmId
    API->>Auth: Verificar Token
    alt Token válido
        Auth-->>API: Token válido
        API->>Auth: Verificar rol y acceso del usuario
        Auth-->>API: Rol y acceso (Administrador / Otro tipo de rol)
        
        alt tiene acceso
            API->>BD: Obtener detalles de la granja
            BD-->>API: Devolver detalles de la granja
            API-->>IU: Devolver detalles de la granja
            IU-->>Usuario: Mostrar detalles de la granja
        else No tiene acceso
            API-->>IU: Devolver mensaje de acceso denegado
            IU-->>Usuario: Mostrar mensaje de acceso denegado
        end
    else Token inválido
        Auth-->>API: Token inválido
        API-->>IU: Devolver mensaje de error
        IU-->>Usuario: Mostrar mensaje de error
    end

# Diagrama de secuencia para obtener información de una granja
