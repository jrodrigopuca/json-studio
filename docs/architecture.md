# Arquitectura

## 1. Visión General

JSON Studio es una **extensión de Chrome Manifest V3** que detecta respuestas JSON en pestañas del navegador y las renderiza con un visor interactivo basado en React. La arquitectura sigue un patrón **modular por capas** con un store centralizado (Zustand) como sistema nervioso de la aplicación.

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
│                 │  │   Zustand Store   │   │  ← 808 líneas           │
│                 │  │   (~40 props,     │   │     estado centralizado  │
│                 │  │    ~50 acciones)  │   │                          │
│                 │  └────────┬─────────┘   │                          │
│                 │  ┌────────┴─────────┐   │                          │
│                 │  │   Core Modules    │   │  ← parser, formatter,   │
│                 │  │                   │   │    highlighter, converter│
│                 │  └──────────────────┘   │                          │
│                 │  ┌──────────────────┐   │                          │
│                 │  │   15 Components   │   │  ← React + CSS Modules  │
│                 │  └──────────────────┘   │                          │
│                 │  ┌──────────────────┐   │                          │
│                 │  │    3 Hooks        │   │  ← loader, shortcuts,   │
│                 │  │                   │   │    theme                 │
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

| Módulo         | Exports principales                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`     | `ViewMode` (7 modos), `Theme`, `MessageType` (enum), `ExtensionMessage`, `DetectionResult`, `Settings`, `DEFAULT_SETTINGS`                                |
| `constants.ts` | `APP_NAME`, `WORKER_THRESHOLD` (1MB), `DEFAULT_INDENT` (2), `MAX_VISIBLE_NODES` (500), `JSON_CONTENT_TYPES` (11 MIME types), `JSONP_PATTERN`, `SHORTCUTS` |
| `dom.ts`       | `createElement()`, `querySelector()`, `copyToClipboard()`, `escapeHtml()`                                                                                 |
| `messaging.ts` | `sendMessage<T>()`, `sendMessageToTab()`, `onMessage()` — wrappers tipados sobre `chrome.runtime`                                                         |

### 2.3 Capa Core (`src/viewer/core/`)

Módulos de lógica pura sin dependencias de React, completamente testeados:

| Módulo            | Líneas | Responsabilidad                              | Exports clave                                                           |
| ----------------- | ------ | -------------------------------------------- | ----------------------------------------------------------------------- |
| `parser.ts`       | 226    | Parsea JSON en array plano de `FlatNode[]`   | `parseJSON(raw, options?)` → `ParseResult`                              |
| `parser.types.ts` | ~60    | Tipos del parser                             | `FlatNode`, `ParseError`, `ParseResult`, `JsonNodeType`                 |
| `formatter.ts`    | ~180   | Formateo y utilidades                        | `prettyPrint()`, `minify()`, `formatSize()`, `sortJsonByKeys()`         |
| `highlighter.ts`  | ~120   | Syntax highlighting vía regex                | `highlightJson()`, `wrapUrlsInString()`                                 |
| `clipboard.ts`    | 124    | Reconstrucción de valores desde nodos planos | `getNodeValue()`, `getFormattedNodeValue()`, `copyToClipboard()`        |
| `converter.ts`    | 469    | Conversiones JSON ↔ YAML/CSV                 | `jsonToYaml()`, `jsonToCsv()`, `jsonToTypeScript()`, `yamlToJson()`     |
| `converters.ts`   | 367    | Conversiones JSON → TypeScript/XML           | `jsonToTypeScript()`, `jsonToXml()`, `convertJson()`, `CONVERT_FORMATS` |

### 2.4 Capa de Estado (`src/viewer/store/`)

Store Zustand centralizado con middlewares `devtools` + `subscribeWithSelector`.

**Categorías de estado (~40 propiedades):**

```
┌─────────────────────────────────────────────────────┐
│                   Zustand Store                      │
│                                                      │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐ │
│  │  JSON Data   │  │  View    │  │     Tree       │ │
│  │  rawJson     │  │  viewMode│  │  expandedNodes │ │
│  │  nodes[]     │  │  showLine│  │  selectedNode  │ │
│  │  metadata    │  │  Numbers │  │  focusNode     │ │
│  │  parseError  │  │          │  │  sortDirection │ │
│  └─────────────┘  └──────────┘  └────────────────┘ │
│                                                      │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐ │
│  │   Search    │  │  Editor  │  │   Bookmarks    │ │
│  │  searchTerm │  │  editCont│  │  bookmarks[]   │ │
│  │  matches[]  │  │  undoStk │  │                │ │
│  │  matchIndex │  │  redoStk │  │                │ │
│  └─────────────┘  └──────────┘  └────────────────┘ │
│                                                      │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐ │
│  │    Diff     │  │  Saved   │  │    Modals      │ │
│  │  original   │  │  JSONs[] │  │  unsavedModal  │ │
│  │  modified   │  │  (local  │  │  pendingView   │ │
│  │             │  │  storage)│  │  shortcutsHelp │ │
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

| Hook                   | Responsabilidad                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `useJsonLoader`        | Carga JSON desde URL params (`?url=`, `?data=`), sessionStorage, o datos demo como fallback          |
| `useKeyboardShortcuts` | Handler global de `keydown` — `⌥1-7` cambio de vista, `⌥E/C` expandir/colapsar, `⌘Z/⌘⇧Z` undo/redo   |
| `useTheme`             | Aplica tema (dark/light/system) a `document.documentElement.dataset.theme`, persiste en localStorage |

### 2.6 Capa de Componentes (`src/viewer/components/`)

15 componentes React con CSS Modules. Ver [components.md](./components.md) para detalle completo.

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

| Suite       | Archivo                          | Tests   | Cobertura                                        |
| ----------- | -------------------------------- | ------- | ------------------------------------------------ |
| Parser      | `tests/unit/parser.test.ts`      | 31      | Parseo, FlatNode, JSONPath, maxDepth, edge cases |
| Formatter   | `tests/unit/formatter.test.ts`   | 34      | prettyPrint, minify, formatSize, sortJsonByKeys  |
| Highlighter | `tests/unit/highlighter.test.ts` | 28      | Tokens, URLs, XSS, getTypeClass                  |
| Converter   | `tests/unit/converter.test.ts`   | 30      | YAML, CSV, TypeScript, yamlToJson                |
| **Total**   | **4 archivos**                   | **123** | Solo core logic; sin tests de componentes/E2E    |

## 8. Seguridad

- **Permisos mínimos**: `activeTab`, `clipboardWrite`, `contextMenus` — no requiere `storage`, `tabs`, ni `<all_urls>` permanente
- **Content Script sandboxed**: detector ejecuta en el contexto de la página pero no accede a datos sensibles
- **Sin dependencias de red**: todas las conversiones y parseo son locales, zero-fetch
- **XSS prevention**: el highlighter escapa HTML antes de insertar en el DOM
