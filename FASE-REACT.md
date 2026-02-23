# JSON Spark — Fase 5: Migración a React 19

> Documentación del trabajo realizado en la migración del viewer de Vanilla TypeScript a React 19 + Zustand.

---

## Resumen Ejecutivo

Se migró completamente el viewer de JSON Spark desde una arquitectura Vanilla TypeScript a **React 19** con **Zustand 5** para gestión de estado. Esta migración permitió mejor mantenibilidad, componentes reutilizables y una base sólida para funcionalidades futuras.

### Stack Actualizado

| Componente       | Antes                     | Después                           |
| ---------------- | ------------------------- | --------------------------------- |
| **UI Framework** | Vanilla TS                | React 19.0.0                      |
| **State**        | Store custom (~50 líneas) | Zustand 5.0.0                     |
| **Styling**      | CSS puro                  | CSS Modules                       |
| **Build**        | Vite                      | Vite 7.3.1 + @vitejs/plugin-react |

---

## Funcionalidades Implementadas

### 🌳 Vistas Principales

| Vista     | Descripción                                                  |
| --------- | ------------------------------------------------------------ |
| **Tree**  | Árbol colapsable con nodos expandibles, búsqueda y selección |
| **Raw**   | JSON formateado con syntax highlighting y números de línea   |
| **Table** | Arrays de objetos como tabla (detección automática)          |
| **Diff**  | Comparación lado a lado con highlighting de diferencias      |
| **Edit**  | Editor con syntax highlighting, validación y guardado        |
| **Saved** | Gestión de JSONs favoritos (localStorage)                    |

### 🔧 Toolbar y Controles

- **Tabs de navegación**: Tree, Raw, Table, Diff, Edit, Saved (⌘1-6)
- **Expand/Collapse All**: Expandir o colapsar todos los nodos (⌘E / ⌘W)
- **Sort by Keys**: 3 estados — A→Z (ascendente), Z→A (descendente), original
- **Line Numbers**: Toggle para mostrar/ocultar números de línea (#)
- **Prettify/Minify**: Formatear (`{ }`) o compactar (`{}`) JSON en vista Raw
- **Search**: Búsqueda con navegación entre resultados (⌘F)
- **Undo/Redo**: Historial de cambios (⌘Z / ⌘⇧Z)
- **Copy**: Copiar JSON al clipboard (📋)
- **Download**: Descargar como archivo .json (⬇)
- **Save to Favorites**: Guardar JSON actual con nombre personalizado (⭐)

### 🔍 Búsqueda

- Búsqueda en tiempo real con highlighting de matches
- Navegación con ↑/↓ entre resultados
- Contador de matches (X de Y)
- Auto-scroll al match actual
- Funciona en Tree View (por nodos) y Raw View (por líneas)

### 📊 Diff View

- Comparación lado a lado (Original vs Compare)
- Syntax highlighting en ambos paneles
- Números de línea
- Indicadores visuales: +added, -removed, ~changed
- Estadísticas de diferencias (+N -N ~N)
- Input panel con syntax highlighting para pegar JSON a comparar
- Soporte para cargar archivo o pegar desde clipboard

### ✏️ Edit View

- Editor con syntax highlighting en tiempo real
- Validación de JSON con errores inline
- Guardado con formateo automático
- Modal de confirmación para cambios no guardados
- Preview del JSON formateado

### 💾 Saved View (Favoritos)

- Guardar JSON actual con nombre personalizado
- Lista de JSONs guardados con metadata (tamaño, fecha)
- Cargar JSON guardado en cualquier vista
- Renombrar y eliminar favoritos
- Persistencia en localStorage
- Modal para guardar desde botón ⭐ en toolbar

### 📍 StatusBar

- Tamaño del archivo formateado (B, KB, MB)
- Número total de keys
- Profundidad máxima del JSON
- Indicador de tema actual

### 🎨 Theming

- Modo claro / oscuro / sistema
- Detección automática de `prefers-color-scheme`
- Variables CSS para syntax highlighting:
  - Keys, strings, numbers, booleans, null, brackets

### ⌨️ Keyboard Shortcuts

Los shortcuts usan ⌥ (Option/Alt) para evitar conflictos con Chrome (⌘W cierra pestaña, etc.)

| Shortcut | Acción                        |
| -------- | ----------------------------- |
| ⌥1-6     | Cambiar vista                 |
| ⌘F       | Abrir búsqueda                |
| ⌥E       | Expandir todos (Tree)         |
| ⌥C       | Colapsar todos (Tree)         |
| ⌥S       | Ordenar por keys (Tree)       |
| ⌥L       | Toggle números de línea (Raw) |
| ⌘Z       | Deshacer                      |
| ⌘⇧Z      | Rehacer                       |
| ?        | Mostrar ayuda de shortcuts    |
| Escape   | Cerrar búsqueda/modal         |
| ↑/↓      | Navegar entre resultados      |
| Enter    | Ir al siguiente resultado     |

### 🏗️ Arquitectura

```
src/viewer/
├── App.tsx                 # Componente principal
├── init.tsx                # Inicialización para content scripts
├── components/
│   ├── Breadcrumb/         # Navegación de path
│   ├── DiffView/           # Comparador
│   ├── EditView/           # Editor
│   ├── Modal/              # Modales reutilizables
│   ├── RawView/            # Vista raw con syntax
│   ├── SavedView/          # Gestión de favoritos
│   ├── SearchBar/          # Barra de búsqueda
│   ├── StatusBar/          # Barra de estado
│   ├── TableView/          # Vista tabla
│   ├── Toast/              # Notificaciones
│   ├── Toolbar/            # Barra de herramientas
│   └── TreeView/           # Vista árbol
├── core/
│   ├── formatter.ts        # prettyPrint, minify, sortJsonByKeys
│   ├── highlighter.ts      # Syntax highlighting
│   ├── parser.ts           # Parser JSON → FlatNode[]
│   └── parser.types.ts     # Tipos del parser
├── hooks/
│   ├── useJsonLoader.ts    # Carga inicial de JSON
│   ├── useKeyboardShortcuts.ts
│   └── useTheme.ts
├── store/
│   └── index.ts            # Zustand store centralizado
└── styles/
    ├── index.css           # Estilos globales
    └── variables.css       # CSS custom properties
```

### 🧪 Testing

- **123 tests unitarios** pasando
- Cobertura en:
  - Parser (31 tests)
  - Formatter (34 tests)
  - Highlighter (28 tests)
  - Converter (30 tests)

---

## Funcionalidades Futuras (Backlog)

### Mejoras de UX

- [ ] Drag & drop para cargar archivos JSON
- [ ] Redimensionar paneles en Diff View
- [ ] Breadcrumb clickeable para navegar en Tree View
- [ ] Copiar path/valor con click derecho (context menu)
- [ ] Indent guides (líneas verticales de indentación)
- [ ] Tooltips con preview de valores largos

### Búsqueda Avanzada

- [ ] Búsqueda por JSONPath (`$.users[*].name`)
- [ ] Filtrado con jq (`jq '.users | length'`)
- [ ] Búsqueda con regex
- [ ] Búsqueda case-sensitive toggle
- [ ] Historial de búsquedas

### Transformaciones

- [ ] Convertir a YAML
- [ ] Convertir a CSV (para arrays)
- [ ] Convertir a TypeScript interfaces
- [ ] Convertir a XML
- [ ] Extraer schema JSON automáticamente

### Validación

- [ ] Validar contra JSON Schema
- [ ] Mostrar errores de schema inline
- [ ] Cargar schema desde URL

### Performance

- [ ] Web Worker para parsing de JSONs grandes (>10MB)
- [ ] Virtualización para Tree View con miles de nodos
- [ ] Lazy loading de nodos profundos
- [ ] Streaming parser para archivos enormes

### Visualización

- [ ] Chart View para arrays numéricos
- [ ] Mapa para datos geográficos (GeoJSON)
- [ ] Timeline para datos con timestamps
- [ ] Graph view para relaciones entre objetos

### Colaboración

- [ ] Compartir JSON via URL comprimida (sin servidor)
- [ ] Exportar vista actual como imagen/PDF
- [ ] Generar documentación desde JSON

### Integración

- [ ] Extensión para Firefox
- [ ] Extensión para Safari
- [ ] Omnibox: escribir `json` para abrir scratch pad
- [ ] Context menu: "Format JSON in selection" mejorado
- [ ] Integración con APIs de desarrollo (Postman collections)

### Personalización

- [ ] Temas personalizados con editor visual
- [ ] Configurar indent size (2/4 espacios o tabs)
- [ ] Configurar font family y size
- [ ] Exportar/importar configuración

### JSON Lines

- [ ] Soporte para archivos `.jsonl`
- [ ] Vista tabla para JSON Lines
- [ ] Filtrado por línea

### Favoritos Avanzados

- [ ] Organizar en carpetas/tags
- [ ] Sincronizar con Chrome Sync Storage
- [ ] Exportar/importar favoritos
- [ ] Buscar en favoritos guardados

---

## Métricas Actuales

| Métrica                | Valor       |
| ---------------------- | ----------- |
| **Bundle size**        | ~243 KB     |
| **Tests**              | 123 pasando |
| **Componentes React**  | 12          |
| **Vistas disponibles** | 6           |
| **Shortcuts**          | 10+         |

---

## Changelog Resumido

1. ✅ Migración completa de Vanilla TS a React 19
2. ✅ Implementación de Zustand 5 para state management
3. ✅ CSS Modules para estilos por componente
4. ✅ Todas las vistas reimplementadas (Tree, Raw, Table, Diff, Edit, Saved)
5. ✅ Sistema de búsqueda con highlighting
6. ✅ Diff View con syntax highlighting y line numbers
7. ✅ Sort by keys con 3 estados (asc/desc/original)
8. ✅ Prettify/Minify en vista Raw
9. ✅ Sistema de favoritos con persistencia localStorage
10. ✅ Editor con validación y modal de cambios no guardados
11. ✅ Keyboard shortcuts completos
12. ✅ Cleanup de código legacy (vanilla TS)
13. ✅ Refactoring SOLID/DRY con carpetas por componente

---

_Última actualización: Febrero 2026_
