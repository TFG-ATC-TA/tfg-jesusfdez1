sequenceDiagram
    participant Usuario as Usuario
    participant IU as Interfaz de Usuario
    participant API as Servidor API
    participant Auth as Servicio de Autenticación
    participant BD as Base de Datos

    Usuario->>IU: Navegar a la página de granjas
    IU->>API: GET /farm/list
    API->>Auth: Verificar token
    alt Token válido
        Auth-->>API: Token válido
        API->>Auth: Verificar rol del usuario
        Auth-->>API: Rol (Administrador u Otro)
        
        alt Administrador
            API->>BD: Obtener todas las granjas
            BD-->>API: Devolver todas las granjas
        else Otros roles
            API->>BD: Obtener granjas accesibles por el usuario
            BD-->>API: Devolver granjas accesibles
        end
        
        API-->>IU: Devolver datos de las granjas
        IU-->>Usuario: Mostrar datos de las granjas
    else Token inválido
        Auth-->>API: Token inválido
        API-->>IU: Devolver mensaje de error
        IU-->>Usuario: Mostrar mensaje de error
    end

#Diagrama de secuencia para obtener la lista de granjas
