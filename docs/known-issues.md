# Known Issues

Inventario de bugs confirmados, code smells, deuda técnica y funcionalidades pendientes de implementar.

> **Última actualización**: Sesión actual — se resolvieron BUG-001, BUG-002, SMELL-001, SMELL-002, SMELL-003, DEBT-002, y parcialmente FEAT-005.

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
| **Resolución** | Sistema i18n completo implementado con soporte EN/ES/PT. 171 claves de traducción en `src/shared/i18n/`. Hook `useI18n()` integrado en 15 componentes. Selector de idioma en StatusBar (cicla EN→ES→PT). Sistema usa `useSyncExternalStore` para reactividad, `localStorage` para persistencia, y detección automática del idioma del navegador. |

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

### FEAT-001: Virtual Scrolling

| Campo          | Detalle                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Prioridad**  | Alta                                                                                                                               |
| **Estado**     | Constante `MAX_VISIBLE_NODES = 500` definida en `constants.ts` pero no se usa como virtualizador                                   |
| **Impacto**    | JSONs con miles de nodos expandidos causan degradación de performance ya que TreeView renderiza todos los nodos visibles en el DOM |
| **Referencia** | `planes/ROADMAP.md` — Sprint 3                                                                                                     |

### FEAT-002: Web Worker para Parsing

| Campo          | Detalle                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| **Prioridad**  | Alta                                                                                                      |
| **Estado**     | Constante `WORKER_THRESHOLD = 1_000_000` (1MB) definida en `constants.ts` pero no existe código de Worker |
| **Impacto**    | Parsear JSONs mayores a 1MB bloquea el hilo principal, congelando la UI                                   |
| **Referencia** | `planes/PLAN.md` — Fase 2                                                                                 |

### FEAT-003: Tests E2E con Playwright

| Campo         | Detalle                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| **Prioridad** | Media                                                                                                         |
| **Estado**    | Mencionado en plan, no existe configuración ni tests                                                          |
| **Impacto**   | Solo hay tests unitarios para core logic (123 tests). Sin cobertura de componentes React ni flujos de usuario |

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
| **Alta**  | Feature faltante | 2 (virtual scroll, web worker)               | 0         |
| **Media** | Bug              | 1 (XML tag)                                  | ✅ 1      |
| **Media** | Code smell       | 2 (store monolítico, strings mixtos)         | ✅ 2      |
| **Media** | Feature faltante | 3 (E2E tests, component tests, más formatos) | ✅ 1      |
| **Baja**  | Bug              | 1 (versión popup)                            | ✅ 1      |
| **Baja**  | Code smell       | 1 (plan desactualizado)                      | 0         |
| **Baja**  | Feature faltante | 4 (previews, jq, iconos, build script)       | 0         |
| **Baja**  | Deuda técnica    | 4 (options, converter orphaned, JSONP, CI)   | ✅ 1      |
| **Total** | —                | **19**                                       | **✅ 7**  |
