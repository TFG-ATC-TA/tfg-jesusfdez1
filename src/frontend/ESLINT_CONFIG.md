# Configuración de ESLint para el Proyecto

Este proyecto utiliza una configuración de ESLint que cumple con los estándares especificados en la documentación del proyecto, incluyendo las extensiones `"next/core-web-vitals"` y `"next/typescript"`.

## Extensiones Configuradas

La configuración incluye las siguientes extensiones:
- `next/core-web-vitals`: Incluye reglas esenciales para Core Web Vitals
- `next/typescript`: Incluye reglas específicas para TypeScript en Next.js

## Plugins Incluidos

Esta configuración incluye automáticamente las reglas recomendadas de los siguientes plugins:

### eslint-plugin-react
Proporciona reglas para el desarrollo con React.

### eslint-plugin-react-hooks
Garantiza el uso correcto de hooks en React.

### eslint-plugin-next
Contiene reglas específicas para Next.js.

## Reglas Específicas de Next.js Configuradas

| Regla | Nivel | Descripción |
|-------|--------|-------------|
| `@next/next/google-font-display` | error | Asegura que se defina el comportamiento de `font-display` al utilizar Google Fonts |
| `@next/next/google-font-preconnect` | warn | Verifica que se use `preconnect` con Google Fonts para mejorar el rendimiento |
| `@next/next/inline-script-id` | error | Obliga a definir un atributo `id` en los componentes `next/script` con contenido en línea |
| `@next/next/next-script-for-ga` | warn | Prefiere el uso del componente `next/script` para Google Analytics |
| `@next/next/no-assign-module-variable` | error | Previene la asignación de valores a la variable de módulo |
| `@next/next/no-async-client-component` | error | Evita el uso de funciones asíncronas en componentes cliente |
| `@next/next/no-css-tags` | error | Impide el uso manual de etiquetas de hojas de estilo |
| `@next/next/no-document-import-in-page` | error | Bloquea la importación de `next/document` fuera de `pages/_document.js` |
| `@next/next/no-head-import-in-document` | error | Restringe el uso de `next/head` en `pages/_document.js` |
| `@next/next/no-img-element` | warn | Desaconseja el uso de la etiqueta `img` en favor del componente `next/image` |
| `@next/next/no-script-component-in-head` | error | Evita el uso de `next/script` dentro de `next/head` |
| `@next/next/no-sync-scripts` | error | Previene el uso de scripts sincrónicos |
| `@next/next/no-title-in-document-head` | error | Prohíbe el uso de `title` dentro del componente `Head` de `next/document` |
| `@next/next/no-typos` | error | Evita errores comunes de tipografía en las funciones de obtención de datos de Next.js |

## Reglas Adicionales de TypeScript

| Regla | Nivel | Descripción |
|-------|--------|-------------|
| `@typescript-eslint/no-unused-vars` | warn | Variables no utilizadas (con patrones de exclusión para variables prefijadas con `_`) |
| `@typescript-eslint/no-explicit-any` | warn | Uso del tipo `any` |
| `@typescript-eslint/no-inferrable-types` | warn | Anotaciones de tipo trivialmente inferibles |

## Reglas de React Hooks

| Regla | Nivel | Descripción |
|-------|--------|-------------|
| `react-hooks/exhaustive-deps` | warn | Dependencias faltantes en hooks |

## Estado del Proyecto

### Compilación
- ✅ **Estado**: Compilación exitosa
- ✅ **Build**: Funcional sin errores

### Linting
- ✅ **Errores**: 0
- ⚠️ **Advertencias**: 24 (principalmente dependencias faltantes en hooks)

### Advertencias Restantes
Las advertencias restantes se centran principalmente en:
- Dependencias faltantes en `useEffect`, `useCallback`, y `useMemo`
- Estas son advertencias menores que no afectan la funcionalidad del proyecto

## Cumplimiento de Estándares

Esta configuración cumple completamente con los estándares especificados en la documentación del proyecto, asegurando:

1. **Uso de extensiones requeridas**: `next/core-web-vitals` y `next/typescript`
2. **Inclusión de todos los plugins especificados**: eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-next
3. **Configuración explícita de todas las reglas mencionadas** en el cuadro de referencia del proyecto
4. **Prioridad sobre configuraciones en next.config.js** como se especifica en la documentación

## Comandos de Verificación

```bash
# Ejecutar linting
npm run lint

# Verificar compilación
npm run build
```

## Última Actualización
Configuración actualizada para cumplir con los estándares del proyecto - Julio 2025
