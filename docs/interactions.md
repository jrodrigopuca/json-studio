# Interacción entre Componentes

Este documento describe cómo fluyen los datos y las acciones entre los distintos módulos del sistema.

---

## 1. Flujo de Detección e Inicialización

El flujo comienza cuando el usuario navega a una URL que devuelve JSON:

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  Navegador   │────▶│  Content Script    │────▶│  Service Worker  │
│  carga URL   │     │  (detector.ts)     │     │  (badge update)  │
└──────────────┘     └─────────┬─────────┘     └──────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  activateViewer()   │
                    │  dynamic import     │
                    │  viewer/init.tsx    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  initViewer()       │
                    │  → React.createRoot │
                    │  → <App />          │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  useJsonLoader()    │
                    │  → parseAndSet()    │
                    │  → FlatNode[]       │
                    └─────────────────────┘
```

### Secuencia detallada:

1. **`detector.ts`** se inyecta en la página vía content script
2. **`detectContentType()`** examina el header `Content-Type` contra 11 MIME types conocidos
3. **`extractRawText()`** busca un `<pre>` dentro de `<body>` (patrón estándar de navegadores al mostrar JSON)
4. **`extractJson()`** stripea wrapper JSONP si existe (regex `JSONP_PATTERN`)
5. **`isValidJson()`** valida con `JSON.parse`
6. Si es válido → envía mensaje `JSON_DETECTED` al service worker → badge "JSON"
7. **`activateViewer()`** hace `import()` dinámico de `viewer/init.tsx`
8. **`initViewer()`** crea un React root en el container de la página, monta `<App />`
9. **`useJsonLoader`** hook extrae el JSON (de URL params, sessionStorage, o raw) y llama `store.parseAndSet()`
10. **`parseJSON()`** aplana el JSON en `FlatNode[]` → el store actualiza `nodes`, `metadata`, `rawJson`

---

## 2. Flujo de Datos en el Visor

Una vez inicializado, todos los componentes leen y escriben a través del store Zustand:

```
                    ┌─────────────────────┐
                    │    Zustand Store     │
                    │   (single source     │
                    │    of truth)         │
                    └──────┬──────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │  Toolbar   │   │  SearchBar│   │  StatusBar │
    │  (actions) │   │  (search) │   │  (display) │
    └─────┬─────┘   └─────┬─────┘   └───────────┘
          │                │
          ▼                ▼
    ┌───────────────────────────────────┐
    │         Active View Component     │
    │  (TreeView | RawView | EditView   │
    │   | TableView | DiffView |        │
    │   SavedView | ConvertView)        │
    └───────────────────────────────────┘
```

**Patrón de comunicación:**

- Los componentes **nunca** se comunican directamente entre sí
- Todo pasa por el store: componente A → `store.action()` → state change → componente B re-renders
- Los selectores de Zustand (`useStore(s => s.prop)`) aseguran re-renders granulares

---

## 3. Flujo de Búsqueda

```
SearchBar                    Store                     TreeView / RawView
   │                          │                              │
   │  setSearchTerm("foo")    │                              │
   │─────────────────────────▶│                              │
   │  (debounce 150ms)        │                              │
   │                          │  filtra nodes que            │
   │                          │  match en key/value          │
   │                          │──────────────────────────────▶│
   │                          │  searchMatches: number[]     │
   │                          │  currentMatchIndex: number   │
   │                          │                              │
   │  nextMatch()             │                              │
   │─────────────────────────▶│  incrementa index            │
   │                          │  auto-expand parents         │
   │                          │──────────────────────────────▶│
   │                          │                      scroll-to-match
```

### Interacción clave:

- **SearchBar** despacha `setSearchTerm()` con debounce de 150ms
- **Store** calcula `searchMatches` (array de node IDs que hacen match)
- **TreeView**: resalta nodos que matchean, auto-expande padres del match actual
- **RawView**: resalta texto en la vista de syntax highlighting, scroll automático al match

---

## 4. Flujo de Edición

```
                      ┌─────────────────┐
                      │   EditView      │
                      │                 │
    typing ──────────▶│  textarea       │
                      │  onChange        │
                      └────────┬────────┘
                               │
                    setEditContent(text)
                               │
                      ┌────────▼────────┐
                      │     Store       │
                      │                 │
                      │  editContent    │──── undoStack.push()
                      │  hasUnsaved = T │
                      └────────┬────────┘
                               │
                    ⌘S / save button
                               │
                      ┌────────▼────────┐
                      │ saveEditContent │
                      │                 │
                      │  JSON.parse()   │
                      │  ├─ valid ──────│──▶ rawJson = new
                      │  │              │    nodes = re-parse
                      │  │              │    hasUnsaved = F
                      │  │              │    undoStack = []
                      │  └─ invalid ────│──▶ toast("Error")
                      └─────────────────┘
```

### Flujo de cambios no guardados al cambiar de vista:

```
User clicks tab      Store               UnsavedChangesModal
     │                 │                        │
     │ setViewMode()   │                        │
     │────────────────▶│                        │
     │                 │  hasUnsavedChanges?     │
     │                 │  ├─ NO: change view     │
     │                 │  └─ YES: pendingView    │
     │                 │       = target mode     │
     │                 │────────────────────────▶│  show modal
     │                 │                        │
     │                 │        ┌────────────────┤
     │                 │        │  Save    │ saves + changes view
     │                 │        │  Discard │ changes view without save
     │                 │        │  Cancel  │ stays in edit
     │                 │        └────────────────┘
```

---

## 5. Flujo de TreeView (Expandir/Colapsar/Seleccionar)

```
TreeNode (click)          Store                    TreeView (re-render)
     │                      │                            │
     │  toggleNode(id)      │                            │
     │─────────────────────▶│                            │
     │                      │  expandedNodes             │
     │                      │  Set.add/delete(id)        │
     │                      │                            │
     │                      │  selectVisibleNodes        │
     │                      │  re-computes ──────────────▶│ re-render
     │                      │                            │  visible nodes
     │                      │                            │
     │  selectNode(id)      │                            │
     │─────────────────────▶│  selectedNode = id         │
     │                      │──────────────────────────▶ │  highlight
     │                      │                    Breadcrumb  update path
```

### ContextMenu interaction:

```
TreeNode (right-click)    ContextMenu              Store
     │                      │                        │
     │  show at (x,y)       │                        │
     │─────────────────────▶│                        │
     │                      │                        │
     │           "Copy Key" │                        │
     │                      │  clipboard.copy()      │
     │                      │                        │
     │     "Filter to This" │                        │
     │                      │  setFocusNode(id) ────▶│
     │                      │                        │  re-filter
     │                      │                        │  visible nodes
```

---

## 6. Flujo de Conversión

```
ConvertView              converters.ts              Toolbar
     │                        │                        │
     │  user selects          │                        │
     │  format: "typescript"  │                        │
     │                        │                        │
     │  convertJson(raw,fmt)  │                        │
     │───────────────────────▶│                        │
     │                        │  jsonToTypeScript()    │
     │◀───────────────────────│  → interfaces string   │
     │                        │                        │
     │  display in preview    │                        │
     │  pane                  │                        │
     │                        │                        │
     │  "Copy" button         │                        │
     │  → clipboard           │                        │
     │                        │                        │
     │  "Download" button     │                 DownloadButton
     │  → blob + download     │                        │
```

---

## 7. Flujo de Diff

```
DiffView                         Store
   │                               │
   │  User enters/loads second     │
   │  JSON in right panel          │
   │                               │
   │  computeLineDiff(             │
   │    prettyPrint(original),     │
   │    prettyPrint(modified)      │
   │  )                            │
   │                               │
   │  Renders side-by-side         │
   │  with colored lines:          │
   │  ├─ green: added             │
   │  ├─ red: removed             │
   │  ├─ yellow: modified         │
   │  └─ none: unchanged          │
   │                               │
   │  Stats: +N / -N / ~N         │
```

---

## 8. Flujo de Guardado (SavedView)

```
Toolbar                    Store                    SavedView
  │                          │                          │
  │ SaveFavoriteButton       │                          │
  │ → SaveJsonModal opens    │                          │
  │ → user enters name       │                          │
  │                          │                          │
  │ saveCurrentJson(name)    │                          │
  │─────────────────────────▶│                          │
  │                          │  savedJsons.push({       │
  │                          │    id, name, json,       │
  │                          │    size, timestamps      │
  │                          │  })                      │
  │                          │                          │
  │                          │  localStorage.setItem()  │
  │                          │                          │
  │                          │                          │
  │            tab: "saved"  │                          │
  │─────────────────────────▶│                          │
  │                          │──────────────────────────▶│
  │                          │                          │  renders list
  │                          │                          │
  │                          │  loadSavedJson(id)       │
  │                          │◀─────────────────────────│  user clicks
  │                          │                          │
  │                          │  rawJson = saved.json    │
  │                          │  re-parse → nodes[]      │
  │                          │  viewMode → "tree"       │
```

---

## 9. Comunicación Extension Shell ↔ Viewer

```
detector.ts ──────── chrome.runtime.sendMessage ──────▶ service-worker.ts
    │                    (JSON_DETECTED)                      │
    │                                                         │
    │◀─────── chrome.runtime.sendMessage ─────────────────────│
    │              (GET_SETTINGS response)                     │
    │                                                         │
    │                                                         │
    │── dynamic import ──▶ viewer/init.tsx                    │
    │                         │                               │
    │                    initViewer({                          │
    │                      container,                         │
    │                      rawJson,                           │
    │                      contentType,                       │
    │                      url                                │
    │                    })                                    │
    │                         │                               │
    │                    React mounts in                      │
    │                    same tab context                     │
```

**Nota:** El visor React se ejecuta **en la misma pestaña**, no en un iframe o popup. La página original se reemplaza completamente con el visor.

---

## 10. Flujo de Atajos de Teclado

```
document (keydown)          useKeyboardShortcuts          Store
       │                           │                        │
       │  event                    │                        │
       │──────────────────────────▶│                        │
       │                           │                        │
       │                           │  skip if target is     │
       │                           │  textarea/input        │
       │                           │                        │
       │                           │  match e.code to       │
       │                           │  SHORTCUTS map         │
       │                           │                        │
       │                           │  ⌥1 → setViewMode     │
       │                           │──────────────────────▶ │
       │                           │                        │
       │                           │  ⌥E → expandAll()     │
       │                           │──────────────────────▶ │
       │                           │                        │
       │                           │  ⌘Z → undo()          │
       │                           │──────────────────────▶ │
       │                           │                        │
       │                           │  ? → setShowShortcuts  │
       │                           │──────────────────────▶ │
       │                           │              ShortcutsHelpModal
```

---

## 11. Mapa de Dependencias entre Módulos

```
shared/types ◄──────────── TODOS los módulos
shared/constants ◄──────── store, components, detector
shared/dom ◄────────────── popup, options, detector
shared/messaging ◄──────── service-worker, detector, popup

core/parser ◄──────────── store, useJsonLoader
core/parser.types ◄────── parser, store, TreeView, ContextMenu
core/formatter ◄───────── store, RawView, EditView, DiffView
core/highlighter ◄──────── RawView, DiffView, EditView
core/clipboard ◄────────── TreeView, ContextMenu
core/converters ◄───────── ConvertView, Toolbar (download)
core/converter ◄────────── tests (posiblemente orphaned en producción)

store ◄─────────────────── App, TODOS los components, hooks
hooks ◄─────────────────── App.tsx únicamente

components/Icon ◄───────── Toolbar, StatusBar, TreeViewHeader,
                            ContextMenu, SearchBar, SavedView,
                            ConvertView, EditorToolbar
```

### Nota sobre `converter.ts` vs `converters.ts`:

- **`converters.ts`** es el módulo activo en producción — importado por `ConvertView` y `Toolbar`
- **`converter.ts`** contiene `jsonToYaml`, `jsonToCsv`, `yamlToJson` — solo referenciado por tests
- Existe duplicación de `jsonToTypeScript` con implementaciones distintas en ambos archivos
