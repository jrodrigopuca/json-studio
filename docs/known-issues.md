# Known Issues

Inventario de bugs confirmados, code smells, deuda técnica y funcionalidades pendientes de implementar.

> **Última actualización**: Sesión actual — se resolvieron BUG-001, BUG-002, SMELL-001, SMELL-002, SMELL-003, DEBT-002, FEAT-001, FEAT-002, FEAT-004, FEAT-005. Mejoras de rendimiento (virtual scrolling, Web Worker, paginación, large file mode). EditView mejorado (parse error → edit, cursor indicator, scroll sync).

---

## Bugs Confirmados

### ~~BUG-001: Tag de cierre XML hardcodeado en `converters.ts`~~ ✅ RESUELTO

| Campo          | Detalle                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| **Resolución** | Corregido `</tag>` → `</${tag}>` en `converters.ts`. Se añadieron 6 tests nuevos. |

### ~~BUG-002: Versión incorrecta en popup.html~~ ✅ RESUELTO

| Campo          | Detalle                                      |
| -------------- | -------------------------------------------- |
| **Resolución** | Actualizado de `v0.1.0` a `v2.0.0` en popup. |

---

## Code Smells

### ~~SMELL-001: Módulos de conversión duplicados~~ ✅ RESUELTO

| Campo          | Detalle                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resolución** | `converter.ts` eliminado. Todo consolidado en `converters.ts` (~735 líneas). Se añadieron YAML y CSV a `CONVERT_FORMATS`. Tests actualizados a 129. |

### ~~SMELL-002: Store monolítico~~ ✅ RESUELTO

| Campo          | Detalle                                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resolución** | Store refactorizado en 6 slices: `json-slice.ts`, `tree-slice.ts`, `search-slice.ts`, `editor-slice.ts`, `saved-slice.ts`, `ui-slice.ts` + `store.types.ts`. `index.ts` reducido de 808 a ~105 líneas de composición. |

### ~~SMELL-003: Strings UI mezclados español/inglés~~ ✅ RESUELTO

| Campo          | Detalle                                                                                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Resolución** | Sistema i18n completo implementado con soporte EN/ES/PT. 188 claves de traducción en `src/shared/i18n/`. Hook `useI18n()` integrado en 15 componentes. Selector de idioma en StatusBar (cicla EN→ES→PT). Sistema usa `useSyncExternalStore` para reactividad, `localStorage` para persistencia, y detección automática del idioma del navegador. |

### SMELL-004: Documentación de plan desactualizada

| Campo             | Detalle                                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severidad**     | Baja                                                                                                                                                                                                              |
| **Archivo**       | `planes/PLAN.md`                                                                                                                                                                                                  |
| **Descripción**   | El plan maestro (958 líneas) referencia archivos y patrones de la arquitectura pre-React que ya no existen: `base-component.ts`, `store.types.ts`, `virtual-scroll.ts`, `worker.ts`, sistema de clases vanilla TS |
| **Recomendación** | Actualizar o archivar el plan original y usar `planes/FASE-REACT.md` como referencia vigente                                                                                                                      |

---

## Funcionalidades Planeadas No Implementadas

Estas funcionalidades están documentadas en los planes (`ROADMAP.md`, `FASE-REACT.md`, `PLAN.md`) pero no existen en el código actual:

### ~~FEAT-001: Virtual Scrolling~~ ✅ RESUELTO

| Campo          | Detalle                                                                                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resolución** | Virtual scrolling implementado en TreeView (`NODE_HEIGHT=24px`) y RawView (`RAW_LINE_HEIGHT=21px`). Usa `ResizeObserver` + `onScroll` para calcular rango visible con buffer de 10 elementos. Para archivos ≥1MB se usa `LargeFileTreeView` dedicado con UI simplificada. |

### ~~FEAT-002: Web Worker para Parsing~~ ✅ RESUELTO

| Campo          | Detalle                                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resolución** | `parser.worker.ts` (54 líneas) implementado con types (`parser.worker.types.ts`, 30 líneas). Archivos ≥1MB (`WORKER_THRESHOLD`) se parsean en web worker off-main-thread. El UI muestra loading indicator. |

### FEAT-003: Tests E2E con Playwright

| Campo         | Detalle                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Prioridad** | Media                                                                                                               |
| **Estado**    | Mencionado en plan, no existe configuración ni tests                                                                |
| **Impacto**   | Hay 211 tests (129 unit + 82 component) pero no hay cobertura E2E de flujos completos de usuario con navegador real |

### ~~FEAT-004: Tests de Componentes React~~ ✅ RESUELTO

| Campo          | Detalle                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resolución** | Infraestructura de testing React implementada con `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` y `jsdom`. Creados 8 archivos de tests con 82 tests de componentes cubriendo: Breadcrumb, ContextMenu, StatusBar, SearchBar, TreeViewHeader, ConvertView, Toolbar, Modal (incluyendo UnsavedChangesModal y SaveJsonModal). Total: 211 tests (129 unit + 82 component), todos pasando. |

### ~~FEAT-005: Más formatos de conversión~~ ✅ RESUELTO

| Campo          | Detalle                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Resolución** | YAML y CSV añadidos a `CONVERT_FORMATS` en `converters.ts`. ConvertView ahora soporta TypeScript, XML, YAML y CSV. |

### FEAT-006: Content Previews (imágenes, colores, timestamps)

| Campo           | Detalle                                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Prioridad**   | Baja                                                                                                                                |
| **Estado**      | No implementado                                                                                                                     |
| **Descripción** | Detectar y renderizar previews inline: URLs de imágenes como thumbnails, colores hex como swatches, timestamps como fechas legibles |
| **Referencia**  | `planes/FASE-REACT.md` — Backlog futuro                                                                                             |

### FEAT-007: Consultas jq

| Campo           | Detalle                                                      |
| --------------- | ------------------------------------------------------------ |
| **Prioridad**   | Baja                                                         |
| **Estado**      | No implementado                                              |
| **Descripción** | Motor de consultas tipo `jq` para filtrar y transformar JSON |
| **Referencia**  | `planes/ROADMAP.md` — Sprint 3                               |

### FEAT-008: Generación de iconos PNG

| Campo         | Detalle                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Prioridad** | Baja                                                                                                                         |
| **Estado**    | Solo existe SVG en `public/icons/`. No hay script de build para generar PNG en tamaños requeridos por Chrome (16, 48, 128px) |

### FEAT-009: Script de build para extensión de producción

| Campo             | Detalle                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Prioridad**     | Baja                                                                                                                  |
| **Estado**        | `vite.extension.config.ts` existe pero no hay script npm que lo utilice. Build de extensión requiere ejecución manual |
| **Recomendación** | Agregar `"build:extension": "tsc && vite build --config vite.extension.config.ts"` en `package.json`                  |

---

## Deuda Técnica

### DEBT-001: Página de Options vacía

| Campo           | Detalle                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Archivo**     | `src/options/options.ts`                                                                                                                         |
| **Descripción** | Solo contiene `console.log("Options page loaded")`. La UI de settings completa (theme selection, indent size, default view, etc.) está pendiente |
| **Referencia**  | `DEFAULT_SETTINGS` en `types.ts` define la estructura pero no se usa                                                                             |

### ~~DEBT-002: `converter.ts` posiblemente orphaned~~ ✅ RESUELTO

| Campo          | Detalle                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| **Resolución** | Archivo eliminado como parte de SMELL-001. Todo consolidado en `converters.ts`. |

### DEBT-003: `JSONP_PATTERN` no testeado

| Campo           | Detalle                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Descripción** | El detector soporta extracción de JSONP (strip de callback wrapper) definido en `constants.ts` pero no hay tests unitarios para esta funcionalidad |

### DEBT-004: Sin CI/CD configurado

| Campo             | Detalle                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| **Descripción**   | No hay configuración de GitHub Actions, ni pipeline de CI. Tests y build solo se ejecutan localmente |
| **Recomendación** | Configurar workflow con: lint → typecheck → test → build → (opcional) publish to Chrome Web Store    |

---

## Resumen por Severidad

| Severidad | Tipo             | Count                                        | Resueltos |
| --------- | ---------------- | -------------------------------------------- | --------- |
| **Alta**  | Code smell       | 1 (módulos duplicados)                       | ✅ 1      |
| **Alta**  | Feature faltante | 2 (virtual scroll, web worker)               | ✅ 2      |
| **Media** | Bug              | 1 (XML tag)                                  | ✅ 1      |
| **Media** | Code smell       | 2 (store monolítico, strings mixtos)         | ✅ 2      |
| **Media** | Feature faltante | 3 (E2E tests, component tests, más formatos) | ✅ 2      |
| **Baja**  | Bug              | 1 (versión popup)                            | ✅ 1      |
| **Baja**  | Code smell       | 1 (plan desactualizado)                      | 0         |
| **Baja**  | Feature faltante | 4 (previews, jq, iconos, build script)       | 0         |
| **Baja**  | Deuda técnica    | 4 (options, converter orphaned, JSONP, CI)   | ✅ 1      |
| **Total** | —                | **19**                                       | **✅ 10** |
