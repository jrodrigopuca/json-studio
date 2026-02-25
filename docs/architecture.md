# Arquitectura

## 1. Visión General

JSON Spark es una **extensión de Chrome Manifest V3** que detecta respuestas JSON en pestañas del navegador y las renderiza con un visor interactivo basado en React. La arquitectura sigue un patrón **modular por capas** con un store centralizado (Zustand) como sistema nervioso de la aplicación.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Chrome Extension (MV3)                        │
│                                                                      │
│  ┌───────────────┐  ┌─────────────────┐  ┌──────────┐  ┌──────────┐│
│  │  Background    │  │  Content Script  │  │  Popup   │  │ Options  ││
│  │  (Service      │◄─│  (detector.ts)   │  │          │  │          ││
│  │   Worker)      │  │                  │  │          │  │          ││
│  └───────────────┘  └────────┬─────────┘  └──────────┘  └──────────┘│
│                              │                                       │
│                    activateViewer()                                   │
│                              │                                       │
│                 ┌────────────▼────────────┐                          │
│                 │     React Viewer App     │                          │
│                 │  ┌──────────────────┐   │                          │
│                 │  │  Zustand Store    │   │  ← 6 slices (~960 LOC)  │
│                 │  │  (6 slices +      │   │    estado centralizado   │
│                 │  │   middlewares)    │   │                          │
│                 │  └────────┬─────────┘   │                          │
│                 │  ┌────────┴─────────┐   │                          │
│                 │  │   Core Modules    │   │  ← parser, formatter,   │
│                 │  │  + Web Worker     │   │    highlighter, converter│
│                 │  └──────────────────┘   │                          │
│                 │  ┌──────────────────┐   │                          │
│                 │  │   17 Components   │   │  ← React + CSS Modules  │
│                 │  └──────────────────┘   │                          │
│                 │  ┌──────────────────┐   │                          │
│                 │  │    5 Hooks        │   │  ← loader, shortcuts,   │
│                 │  │                   │   │    theme, i18n           │
│                 │  └──────────────────┘   │                          │
│                 │  ┌──────────────────┐   │                          │
│                 │  │   i18n System     │   │  ← EN/ES/PT, 188 keys   │
│                 │  └──────────────────┘   │                          │
│                 └────────────────────────┘                          │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. Capas del Sistema

### 2.1 Capa de Extensión (Chrome Shell)

Los cuatro puntos de entrada del Manifest V3:

| Módulo             | Archivo                                | Rol                                                                                                                                                              |
| ------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Background**     | `src/background/service-worker.ts`     | Service Worker persistente. Gestiona menú contextual ("Format JSON in selection"), escucha mensajes `GET_SETTINGS` / `JSON_DETECTED`, actualiza badge del ícono. |
| **Content Script** | `src/content/detector.ts` (302 líneas) | Inyectado en todas las URLs. Detecta JSON por content-type + inspección del DOM. Extrae texto, valida, y activa el visor React.                                  |
| **Popup**          | `src/popup/popup.{ts,html,css}`        | Ventana emergente con funciones de pegado de JSON, scratchpad (prettify/minify), y apertura en nueva pestaña (blob URL).                                         |
| **Options**        | `src/options/options.{ts,html,css}`    | Página de configuración. Actualmente es placeholder con tabla de atajos de teclado.                                                                              |

### 2.2 Capa Compartida (`src/shared/`)

Módulos agnósticos de framework usados por todas las capas:

| Módulo         | Exports principales                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`     | `ViewMode` (7 modos), `Theme`, `MessageType` (enum), `ExtensionMessage`, `DetectionResult`, `Settings`, `DEFAULT_SETTINGS`                                                    |
| `constants.ts` | `APP_NAME`, `WORKER_THRESHOLD` (1MB), `LARGE_FILE_THRESHOLD` (1MB), `HEAVY_VIEW_THRESHOLD` (200KB), `TABLE_PAGE_SIZE` (100), `NODE_HEIGHT` (24), `RAW_LINE_HEIGHT` (21), etc. |
| `dom.ts`       | `createElement()`, `querySelector()`, `copyToClipboard()`, `escapeHtml()`                                                                                                     |
| `messaging.ts` | `sendMessage<T>()`, `sendMessageToTab()`, `onMessage()` — wrappers tipados sobre `chrome.runtime`                                                                             |
| `i18n/`        | Sistema de internacionalización: `types.ts` (188 keys), `en.ts`, `es.ts`, `pt.ts`, `index.ts` (locale management con `useSyncExternalStore`)                                  |

### 2.3 Capa Core (`src/viewer/core/`)

Módulos de lógica pura sin dependencias de React, completamente testeados:

| Módulo                   | Líneas | Responsabilidad                                | Exports clave                                                                                          |
| ------------------------ | ------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `parser.ts`              | 225    | Parsea JSON en array plano de `FlatNode[]`     | `parseJSON(raw, options?)` → `ParseResult`                                                             |
| `parser.types.ts`        | ~60    | Tipos del parser                               | `FlatNode`, `ParseError`, `ParseResult`, `JsonNodeType`                                                |
| `parser.worker.ts`       | 54     | Web Worker para parsing off-main-thread (≥1MB) | Recibe `WorkerRequest`, envía `WorkerResponse`                                                         |
| `parser.worker.types.ts` | 30     | Tipos del Worker                               | `WorkerRequest`, `WorkerResponse`                                                                      |
| `formatter.ts`           | ~180   | Formateo y utilidades                          | `prettyPrint()`, `minify()`, `formatSize()`, `sortJsonByKeys()`                                        |
| `highlighter.ts`         | ~120   | Syntax highlighting vía regex                  | `highlightJson()`, `wrapUrlsInString()`                                                                |
| `clipboard.ts`           | 124    | Reconstrucción de valores desde nodos planos   | `getNodeValue()`, `getFormattedNodeValue()`, `copyToClipboard()`                                       |
| `converters.ts`          | 734    | Conversiones JSON → otros formatos             | `jsonToYaml()`, `jsonToCsv()`, `jsonToTypeScript()`, `jsonToXml()`, `convertJson()`, `CONVERT_FORMATS` |

### 2.4 Capa de Estado (`src/viewer/store/`)

Store Zustand centralizado con middlewares `devtools` + `subscribeWithSelector`, refactorizado en **6 slices** independientes:

| Slice           | Archivo           | Líneas | Responsabilidad                                                                   |
| --------------- | ----------------- | ------ | --------------------------------------------------------------------------------- |
| `JsonSlice`     | `json-slice.ts`   | 117    | rawJson, nodes[], parseError, isValid, viewMode, theme, metadata                  |
| `TreeSlice`     | `tree-slice.ts`   | 146    | expandedNodes, selectedNode, focusNode, expandAll/collapseAll, selectVisibleNodes |
| `SearchSlice`   | `search-slice.ts` | 87     | searchQuery, searchMatches, currentMatchIndex, navigation                         |
| `EditorSlice`   | `editor-slice.ts` | 213    | editContent, undo/redo stacks, save, indent/wrap/font settings, prettify/minify   |
| `SavedSlice`    | `saved-slice.ts`  | 138    | savedJsons (localStorage), CRUD, max 10 docs / 500KB each                         |
| `UiSlice`       | `ui-slice.ts`     | 129    | showLineNumbers, modals (unsaved/sizeWarning/shortcuts), reset                    |
| **Composición** | `index.ts`        | 111    | Combina slices con `create()` + middlewares                                       |
| **Tipos**       | `store.types.ts`  | 18     | `StoreState` = intersección de todos los slices                                   |

```
┌─────────────────────────────────────────────────────┐
│                   Zustand Store                      │
│            (6 slices + devtools +                    │
│             subscribeWithSelector)                   │
│                                                      │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐ │
│  │  JsonSlice   │  │ TreeSlice│  │  SearchSlice   │ │
│  │  rawJson     │  │  expanded│  │  searchQuery   │ │
│  │  nodes[]     │  │  Nodes   │  │  matches[]     │ │
│  │  parseError  │  │  selected│  │  matchIndex    │ │
│  │  viewMode    │  │  Node    │  │                │ │
│  │  isLargeFile │  │  focus   │  │                │ │
│  └─────────────┘  └──────────┘  └────────────────┘ │
│                                                      │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ EditorSlice │  │SavedSlice│  │    UiSlice     │ │
│  │  editContent│  │  saved   │  │  showLineNums  │ │
│  │  undoStack  │  │  JSONs[] │  │  modals:       │ │
│  │  redoStack  │  │  (local  │  │   unsaved      │ │
│  │  indent/wrap│  │  storage)│  │   sizeWarning  │ │
│  │  fontSize   │  │          │  │   shortcuts    │ │
│  └─────────────┘  └──────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Selectores derivados:**

- `selectVisibleNodes` — filtra nodos por estado de expansión y modo enfocado, ajusta profundidad para subárboles enfocados
- `selectCurrentMatch` — retorna el nodo del match de búsqueda actual

**Persistencia:**

- `SavedJson[]` → `localStorage` con clave `"json-studio-saved"`
- Límites: máximo 10 documentos, 500KB por documento

### 2.5 Capa de Hooks (`src/viewer/hooks/`)

| Hook                   | Responsabilidad                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useJsonLoader`        | Carga JSON desde URL params (`?url=`, `?data=`), sessionStorage, o datos demo. Usa Web Worker para archivos ≥1MB.                                            |
| `useKeyboardShortcuts` | Handler global de `keydown` — `⌥1-7` cambio de vista, `⌥E/C` expandir/colapsar, `⌘Z/⌘⇧Z` undo/redo                                                           |
| `useTheme`             | Aplica tema (dark/light/system) a `document.documentElement.dataset.theme`, persiste en localStorage                                                         |
| `useI18n`              | Hook de internacionalización. Retorna `{ t, locale, setLocale }`. Usa `useSyncExternalStore` para reactividad. Detecta idioma del navegador automáticamente. |

### 2.6 Capa de Componentes (`src/viewer/components/`)

15 componentes React con CSS Modules + 2 componentes de performance (LargeFileTreeView, LargeContentWarningModal). Ver [components.md](./components.md) para detalle completo.

## 3. Estructura Flat Node (Modelo de Datos del Árbol)

El parser convierte el JSON en un array plano de `FlatNode[]` en vez de un árbol recursivo. Este diseño es fundamental para la performance:

```typescript
interface FlatNode {
	id: number; // ID secuencial (0, 1, 2, ...)
	key: string | null; // Clave si es propiedad de objeto
	value: unknown; // Valor primitivo o null para containers
	type: JsonNodeType; // 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'
	depth: number; // Nivel de profundidad (0 = raíz)
	parentId: number | null;
	isExpandable: boolean;
	childCount: number;
	childrenRange: [number, number]; // Rango [start, end] en el array plano
	path: string; // JSONPath (e.g. "$.data.items[0].name")
}
```

**Ventajas:**

- **O(1)** acceso a cualquier nodo por índice
- **Slicing** eficiente de hijos vía `childrenRange`
- **Fácil filtrado** para nodos visibles (sin recursión)
- Compatible con virtualización futura

## 4. Pipeline de Build

```
┌──────────┐     ┌──────────┐     ┌───────────────┐
│   tsc    │────▶│   Vite   │────▶│   dist/       │
│ (typecheck)    │  (bundle) │     │  ├─ viewer/   │
└──────────┘     │           │     │  ├─ popup/    │
                 │  rollup   │     │  ├─ options/  │
                 │  multi-   │     │  ├─ background│
                 │  entry    │     │  └─ content/  │
                 └──────────┘     └───────────────┘
```

| Comando                                 | Config                     | Salida                        | Puerto |
| --------------------------------------- | -------------------------- | ----------------------------- | ------ |
| `npm run dev`                           | `vite.config.ts`           | Dev server                    | :3000  |
| `npm run build`                         | `vite.config.ts`           | `dist/`                       | —      |
| `npm run test`                          | `vitest.config.ts`         | —                             | —      |
| `npx vite --config vite.demo.config.ts` | `vite.demo.config.ts`      | `dist-demo/`                  | :5173  |
| (manual)                                | `vite.extension.config.ts` | `dist/` (chrome120, minified) | —      |

**Entradas de Rollup (multi-entry):**

```javascript
input: {
  viewer:     'src/viewer/index.html',
  popup:      'src/popup/popup.html',
  options:    'src/options/options.html',
  background: 'src/background/service-worker.ts',
  content:    'src/content/detector.ts'
}
```

## 5. Path Aliases

Configurados en `tsconfig.json` y replicados en los tres `vite.config`:

| Alias       | Ruta           |
| ----------- | -------------- |
| `@/*`       | `src/*`        |
| `@viewer/*` | `src/viewer/*` |
| `@shared/*` | `src/shared/*` |

## 6. Sistema de Estilos

```
styles/index.css
  ├── themes.css    → CSS custom properties (dark + light), colores Apple HIG
  ├── base.css      → Reset, tipografía monospace, scrollbars, focus
  └── responsive.css → Breakpoints: 600px, 400px, pointer:coarse

components/
  └── [Component].module.css  → 18 archivos de CSS Modules (class scoping)
```

**Temas:** Dark (default) y Light, controlados via `[data-theme]` en el `<html>`.

**Responsive:** 3 breakpoints:

- `≤600px`: toolbar compacto, indentación reducida
- `≤400px`: barra de búsqueda apilada
- `pointer: coarse`: targets táctiles de 44px

## 7. Testing

| Suite          | Archivo                                    | Tests   | Cobertura                                             |
| -------------- | ------------------------------------------ | ------- | ----------------------------------------------------- |
| Parser         | `tests/unit/parser.test.ts`                | 31      | Parseo, FlatNode, JSONPath, maxDepth, edge cases      |
| Formatter      | `tests/unit/formatter.test.ts`             | 34      | prettyPrint, minify, formatSize, sortJsonByKeys       |
| Highlighter    | `tests/unit/highlighter.test.ts`           | 28      | Tokens, URLs, XSS, getTypeClass                       |
| Converter      | `tests/unit/converter.test.ts`             | 36      | YAML, CSV, TypeScript, XML, yamlToJson                |
| Breadcrumb     | `tests/components/Breadcrumb.test.tsx`     | 7       | Rendering, navigation, root display                   |
| ContextMenu    | `tests/components/ContextMenu.test.tsx`    | 10      | Copy options, expand/collapse, filter                 |
| StatusBar      | `tests/components/StatusBar.test.tsx`      | 9       | Metadata display, theme toggle, i18n                  |
| SearchBar      | `tests/components/SearchBar.test.tsx`      | 8       | Input, navigation, match count                        |
| TreeViewHeader | `tests/components/TreeViewHeader.test.tsx` | 9       | Level controls, expand/collapse, focus indicator      |
| ConvertView    | `tests/components/ConvertView.test.tsx`    | 7       | Format tabs, output, copy/download                    |
| Toolbar        | `tests/components/Toolbar.test.tsx`        | 15      | Tab rendering, contextual actions, large file mode    |
| Modal          | `tests/components/Modal.test.tsx`          | 17      | UnsavedChanges, SaveJson, ShortcutsHelp, LargeContent |
| **Total**      | **12 archivos**                            | **211** | Core logic + componentes React                        |

## 8. Seguridad

- **Permisos mínimos**: `activeTab`, `clipboardWrite`, `contextMenus` — no requiere `storage`, `tabs`, ni `<all_urls>` permanente
- **Content Script sandboxed**: detector ejecuta en el contexto de la página pero no accede a datos sensibles
- **Sin dependencias de red**: todas las conversiones y parseo son locales, zero-fetch
- **XSS prevention**: el highlighter escapa HTML antes de insertar en el DOM
