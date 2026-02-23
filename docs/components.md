# Catálogo de Componentes

Referencia detallada de los 15 componentes React del visor, sus responsabilidades, dependencias y relaciones.

---

## Diagrama de Composición

```
App (root)
├── ToastProvider            ← Context provider para notificaciones
│   └── AppContent
│       ├── Toolbar          ← Navegación de vistas + acciones contextuales
│       ├── Breadcrumb       ← Solo en modo tree
│       ├── SearchBar        ← Búsqueda con debounce
│       ├── <main>
│       │   ├── TreeView     ← mode: tree
│       │   │   ├── TreeViewHeader
│       │   │   ├── TreeNode (×N)
│       │   │   └── ContextMenu (on right-click)
│       │   ├── RawView      ← mode: raw
│       │   ├── EditView     ← mode: edit
│       │   │   └── EditorToolbar
│       │   ├── TableView    ← mode: table
│       │   ├── DiffView     ← mode: diff
│       │   ├── SavedView    ← mode: saved
│       │   └── ConvertView  ← mode: convert
│       ├── StatusBar        ← Metadata + toggle de tema
│       ├── UnsavedChangesModal
│       └── ShortcutsHelpModal
```

---

## Componentes de Layout

### App

| Propiedad                 | Valor                                                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archivo**               | `src/viewer/App.tsx` (149 líneas)                                                                                                                         |
| **CSS**                   | `App.module.css`                                                                                                                                          |
| **Responsabilidad**       | Componente raíz. Envuelve todo en `ToastProvider`, gestiona qué vista mostrar según `viewMode`, maneja el flujo de cambios no guardados al salir de Edit. |
| **State consumido**       | `viewMode`, `isValid`, `parseError`, `isParsing`, `pendingViewMode`, `showShortcutsHelp`                                                                  |
| **Hooks**                 | `useJsonLoader()`, `useKeyboardShortcuts()`, `useTheme()`                                                                                                 |
| **Renders condicionales** | Loading spinner → Parse error → Vista según `viewMode`                                                                                                    |

### Toolbar

| Propiedad                   | Valor                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archivo**                 | `src/viewer/components/Toolbar/Toolbar.tsx` (~400 líneas)                                                                                                                             |
| **CSS**                     | `Toolbar.module.css`                                                                                                                                                                  |
| **Responsabilidad**         | Barra de herramientas principal con tabs para 7 modos de vista y botones contextuales por vista.                                                                                      |
| **Subcomponentes internos** | `CopyButton` (copy raw JSON), `DownloadButton` (JSON/format), `SaveFavoriteButton` + `SaveJsonModal`                                                                                  |
| **Acciones por vista**      | Tree: expand/collapse/sort, Raw: prettify/minify, Edit: save/undo/redo, Diff: swap panels, Saved: —, Convert: copy/download                                                           |
| **State consumido**         | `viewMode`, `rawJson`, `sortDirection`, `hasUnsavedChanges`, `setViewMode`, `expandAll`, `collapseAll`, `toggleSortedByKeys`, `prettify`, `minify`, `saveEditContent`, `undo`, `redo` |

### StatusBar

| Propiedad                | Valor                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Archivo**              | `src/viewer/components/StatusBar/StatusBar.tsx` (~80 líneas)                                                       |
| **CSS**                  | `StatusBar.module.css`                                                                                             |
| **Responsabilidad**      | Barra inferior con metadata del JSON y control de tema.                                                            |
| **Información mostrada** | Tamaño del archivo, total de claves, profundidad máxima, indicador de cambios sin guardar, botón toggle dark/light |
| **State consumido**      | `metadata`, `hasUnsavedChanges`, `viewMode`                                                                        |

---

## Componentes de Navegación

### SearchBar

| Propiedad           | Valor                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Archivo**         | `src/viewer/components/SearchBar/SearchBar.tsx` (~200 líneas)                                                                                    |
| **CSS**             | `SearchBar.module.css`                                                                                                                           |
| **Responsabilidad** | Búsqueda en tiempo real sobre claves y valores del JSON.                                                                                         |
| **Características** | Debounce de 150ms, navegación entre matches (prev/next), auto-expansión de nodos que contienen matches en TreeView, intercepta `⌘F` para enfocar |
| **State consumido** | `searchTerm`, `searchMatches`, `currentMatchIndex`, `setSearchTerm`, `nextMatch`, `prevMatch`                                                    |
| **Visibilidad**     | Se oculta en modos `edit`, `diff`, `saved`, `convert`                                                                                            |

### Breadcrumb

| Propiedad           | Valor                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| **Archivo**         | `src/viewer/components/Breadcrumb/Breadcrumb.tsx` (~100 líneas)                                      |
| **CSS**             | `Breadcrumb.module.css`                                                                              |
| **Responsabilidad** | Muestra el path JSON desde la raíz hasta el nodo seleccionado como migas de pan clickeables.         |
| **Comportamiento**  | Cada segmento es clickeable para navegar al nodo padre correspondiente. Solo visible en modo `tree`. |
| **State consumido** | `selectedNode`, `nodes`, `selectNode`                                                                |

---

## Componentes de Vista

### TreeView

| Propiedad           | Valor                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archivo**         | `src/viewer/components/TreeView/TreeView.tsx` (~500 líneas)                                                                                                                            |
| **CSS**             | `TreeView.module.css`                                                                                                                                                                  |
| **Responsabilidad** | Vista principal de árbol. Renderiza nodos expandibles/colapsables con indentación visual.                                                                                              |
| **Subcomponentes**  | `TreeViewHeader`, `TreeNode`, `PrimitiveValue`, `ExpandableValue`                                                                                                                      |
| **Características** | Click para seleccionar, doble-click para expandir/colapsar, right-click para menú contextual, detección de URLs/emails en valores string, conteo de hijos en objetos/arrays colapsados |
| **Selector clave**  | `selectVisibleNodes` — filtra nodos según estado de expansión y modo focused                                                                                                           |
| **State**           | `nodes`, `expandedNodes`, `selectedNode`, `focusNode`, `searchMatches`, `toggleNode`, `selectNode`, `setFocusNode`                                                                     |

### TreeViewHeader

| Propiedad           | Valor                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Archivo**         | `src/viewer/components/TreeView/TreeViewHeader.tsx` (~115 líneas)                                                       |
| **CSS**             | `TreeView.module.css` (compartido)                                                                                      |
| **Responsabilidad** | Controles superiores del TreeView: Expand All, Collapse All, selector de nivel (1-5 + All), indicador de nodo enfocado. |
| **State**           | `expandAll`, `collapseAll`, `expandToLevel`, `focusNode`, `setFocusNode`                                                |

### RawView

| Propiedad           | Valor                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Archivo**         | `src/viewer/components/RawView/RawView.tsx` (~150 líneas)                                                                              |
| **CSS**             | `RawView.module.css`                                                                                                                   |
| **Responsabilidad** | Vista de JSON con syntax highlighting y numeración de líneas.                                                                          |
| **Características** | Highlighting vía `highlightJson()`, numeración de líneas opcional, resaltado de matches de búsqueda, scroll automático al match actual |
| **State**           | `rawJson`, `showLineNumbers`, `searchMatches`, `currentMatchIndex`                                                                     |

### EditView

| Propiedad           | Valor                                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archivo**         | `src/viewer/components/EditView/EditView.tsx` (~508 líneas)                                                                                                                                                                                        |
| **CSS**             | `EditView.module.css`                                                                                                                                                                                                                              |
| **Responsabilidad** | Editor de JSON con textarea superpuesta sobre `<pre>` con syntax highlighting. El componente más complejo del proyecto.                                                                                                                            |
| **Características** | Bracket matching (resalta pareja al posicionar cursor), code folding, tracking de posición del cursor, auto-format al pegar, indentación con Tab, `⌘S` para guardar, validación JSON en tiempo real, sincronización de scroll entre textarea y pre |
| **Subcomponente**   | `EditorToolbar`                                                                                                                                                                                                                                    |
| **State**           | `editContent`, `hasUnsavedChanges`, `setEditContent`, `saveEditContent`, `undo`, `redo`, `undoStack`, `redoStack`                                                                                                                                  |

### EditorToolbar

| Propiedad           | Valor                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Archivo**         | `src/viewer/components/EditView/EditorToolbar.tsx` (~80 líneas)                                                                         |
| **CSS**             | `EditorToolbar.module.css`                                                                                                              |
| **Responsabilidad** | Barra de herramientas contextual del editor: tamaño de indentación, word wrap, tamaño de fuente, posición del cursor, conteo de líneas. |

### TableView

| Propiedad           | Valor                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archivo**         | `src/viewer/components/TableView/TableView.tsx` (~200 líneas)                                                                                                                         |
| **CSS**             | `TableView.module.css`                                                                                                                                                                |
| **Responsabilidad** | Renderiza arrays de objetos como tabla HTML con headers automáticos.                                                                                                                  |
| **Casos manejados** | Array de objetos → tabla completa, Array de primitivos → tabla de una columna, Objeto simple → tabla key/value, Array vacío → mensaje vacío, No-array/no-objeto → mensaje informativo |
| **State**           | `rawJson`                                                                                                                                                                             |

### DiffView

| Propiedad             | Valor                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Archivo**           | `src/viewer/components/DiffView/DiffView.tsx` (~350 líneas)                                                              |
| **CSS**               | `DiffView.module.css`                                                                                                    |
| **Responsabilidad**   | Comparación lado a lado de dos JSONs con diff línea por línea.                                                           |
| **Inputs soportados** | Textarea manual, carga desde archivo, pegado desde clipboard                                                             |
| **Algoritmo**         | `computeLineDiff()` — compara líneas normalizadas (pretty-printed) y las clasifica como added/removed/modified/unchanged |
| **Estadísticas**      | Muestra conteo de líneas añadidas (+), eliminadas (-) y modificadas (~)                                                  |
| **State**             | `rawJson` (como original por defecto), `diffOriginal`, `diffModified`                                                    |

### SavedView

| Propiedad                | Valor                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| **Archivo**              | `src/viewer/components/SavedView/SavedView.tsx` (~250 líneas)                                     |
| **CSS**                  | `SavedView.module.css`                                                                            |
| **Responsabilidad**      | CRUD completo para JSONs guardados en localStorage.                                               |
| **Operaciones**          | Guardar actual (con nombre), cargar, renombrar, eliminar (con confirmación)                       |
| **Límites**              | Máximo 10 documentos, 500KB por documento                                                         |
| **Información mostrada** | Nombre, tamaño formateado, fecha de creación/actualización, preview truncada                      |
| **State**                | `savedJsons`, `rawJson`, `saveCurrentJson`, `loadSavedJson`, `deleteSavedJson`, `renameSavedJson` |

### ConvertView

| Propiedad            | Valor                                                             |
| -------------------- | ----------------------------------------------------------------- |
| **Archivo**          | `src/viewer/components/ConvertView/ConvertView.tsx` (~200 líneas) |
| **CSS**              | `ConvertView.module.css`                                          |
| **Responsabilidad**  | Convierte JSON a otros formatos con preview lado a lado.          |
| **Formatos**         | TypeScript interfaces, XML                                        |
| **Acciones**         | Copiar resultado, descargar como archivo                          |
| **Dependencia core** | `converters.ts` → `convertJson()`, `CONVERT_FORMATS`              |
| **State**            | `rawJson`                                                         |

---

## Componentes UI Transversales

### Toast

| Propiedad           | Valor                                                                               |
| ------------------- | ----------------------------------------------------------------------------------- |
| **Archivo**         | `src/viewer/components/Toast/Toast.tsx` (~100 líneas)                               |
| **CSS**             | `Toast.module.css`                                                                  |
| **Responsabilidad** | Sistema de notificaciones toast con contexto React.                                 |
| **API**             | `ToastProvider` (wraps app), `useToast()` → `{ show({ message, type, duration }) }` |
| **Tipos**           | `info`, `success`, `warning`, `error`                                               |
| **Auto-dismiss**    | Configurable, default por tipo                                                      |

### Modal

| Propiedad           | Valor                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Archivo**         | `src/viewer/components/Modal/Modal.tsx` (~200 líneas)                                                                   |
| **CSS**             | `Modal.module.css`                                                                                                      |
| **Responsabilidad** | Modal genérico portal-based + variantes especializadas.                                                                 |
| **Variantes**       | `UnsavedChangesModal` (save/discard/cancel), `SaveJsonModal` (nombre + guardar), `ShortcutsHelpModal` (tabla de atajos) |
| **Características** | Click en overlay cierra, `Escape` cierra, focus trap, portal a `document.body`                                          |

### ContextMenu

| Propiedad           | Valor                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Archivo**         | `src/viewer/components/ContextMenu/ContextMenu.tsx` (~120 líneas)                                                         |
| **CSS**             | `ContextMenu.module.css`                                                                                                  |
| **Responsabilidad** | Menú contextual posicionado en TreeView (right-click).                                                                    |
| **Opciones**        | Copy Key, Copy Path, Copy Value, Copy Formatted Value, Expand Children, Collapse Children, Filter to This (set focusNode) |
| **Posicionamiento** | Calculado por coordenadas del evento, con ajuste de viewport                                                              |

### Icon

| Propiedad              | Valor                                                                                                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archivo**            | `src/viewer/components/Icon/Icon.tsx` (~200 líneas)                                                                                                                                                                                                                             |
| **CSS**                | `Icon.module.css`                                                                                                                                                                                                                                                               |
| **Responsabilidad**    | Sistema de iconos SVG inline.                                                                                                                                                                                                                                                   |
| **Props**              | `name: IconName`, `size?: number` (default 16), `className?: string`                                                                                                                                                                                                            |
| **Iconos disponibles** | 27: `chevron-right`, `chevron-down`, `sort-asc`, `sort-desc`, `copy`, `download`, `star`, `star-filled`, `undo`, `redo`, `search`, `close`, `sun`, `moon`, `check`, `warning`, `info`, `error`, `expand`, `collapse`, `edit`, `eye`, `table`, `diff`, `save`, `convert`, `menu` |
| **Diseño**             | `currentColor` para herencia de color, viewBox `0 0 16 16`                                                                                                                                                                                                                      |

---

## Barrel Exports

Todos los componentes se re-exportan desde `src/viewer/components/index.ts`, lo que permite imports limpios en `App.tsx`:

```typescript
import {
	Toolbar,
	SearchBar,
	Breadcrumb,
	StatusBar,
	ToastProvider,
	useToast,
	TreeView,
	RawView,
	EditView,
	TableView,
	DiffView,
	SavedView,
	ConvertView,
	UnsavedChangesModal,
	ShortcutsHelpModal,
} from "./components";
```

Cada componente también tiene su propio `index.ts` barrel para facilitar imports individuales.
