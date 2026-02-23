# JSON Spark — Plan de Desarrollo

> Extensión de Chrome moderna para visualizar, explorar, editar y transformar JSON.

---

## 1. Visión del Producto

Ser la extensión de JSON definitiva: rápida, confiable, sin permisos invasivos, y con las herramientas que los desarrolladores realmente necesitan pero que hoy están fragmentadas en 10+ extensiones diferentes.

**Posicionamiento:** "The JSON tool you can trust.", "Make JSON Great Again"

---

## 2. Principios de Diseño

| Principio           | Descripción                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Privacy-first**   | Cero tracking, cero analytics, cero permisos innecesarios. Todo se procesa localmente. |
| **Performance**     | Virtualización para manejar archivos de 50MB+ sin colgar el navegador.                 |
| **Responsive**      | Layout fluido que funciona desde 320px (split-screen, tablet, ventana estrecha).       |
| **Zero-dependency** | Mínimas dependencias externas. Vanilla TS + CSS puro. Bundle ultraligero.              |
| **Developer UX**    | Diseñado por y para desarrolladores. Atajos de teclado, accesibilidad, zero-friction.  |
| **Open Source**     | Código abierto desde el día 1. Confianza a través de transparencia.                    |
| **Modular**         | Arquitectura que permita agregar features sin reescribir.                              |

---

## 3. Stack Tecnológico

### Filosofía: Zero-framework, máxima ligereza

Cada dependencia agrega peso, complejidad y riesgo de supply-chain. Para una extensión de navegador, el bundle ideal es el más pequeño posible.

### Stack del MVP (Fase 1-2) — 0 dependencias de runtime

| Componente         | Tecnología                   | Justificación                                                               |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------- |
| **Lenguaje**       | TypeScript                   | Tipado estricto, cero costo en runtime (se compila a JS)                    |
| **Bundler**        | Vite                         | Build rápido, HMR, tree-shaking. Config manual para MV3 (sin plugins extra) |
| **Styling**        | CSS puro + Custom Properties | Temas con variables CSS nativas. Cero runtime, cero build step extra        |
| **State**          | Vanilla store (~50 líneas)   | Patrón pub/sub simple. Sin dependencias externas                            |
| **Virtualización** | Custom (~100 líneas)         | IntersectionObserver + pool de nodos DOM. Sin librería externa              |
| **Testing**        | Vitest + Playwright          | Unit tests + E2E tests de la extensión (solo dev)                           |
| **CI/CD**          | GitHub Actions               | Build, test, y publicación automatizada a Chrome Web Store                  |

### Dependencias diferidas (lazy-loaded, solo cuando se usan)

| Componente    | Tecnología              | Fase   | Justificación                                                                 |
| ------------- | ----------------------- | ------ | ----------------------------------------------------------------------------- |
| **jq Engine** | jq-wasm (~400KB)        | Fase 2 | Compilado a WebAssembly. Se descarga solo al abrir Query Bar                  |
| **Editor**    | CodeMirror 6 (~130KB)   | Fase 3 | Solo se carga al activar modo edición. Pre-MVP usa `<pre>` + highlight manual |
| **Diff**      | diff-match-patch (~7KB) | Fase 3 | Solo se carga al abrir Diff View                                              |

### Dependencias descartadas

| Descartada       | Razón                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------ |
| React / Preact   | +40KB / +3KB de runtime innecesario. El DOM API nativo es suficiente para un viewer        |
| Tailwind CSS     | Agrega build step y complejidad. CSS puro con custom properties es más ligero y mantenible |
| Zustand          | Sin framework, un store vanilla de 50 líneas cumple lo mismo                               |
| TanStack Virtual | Es React-specific. Virtualización custom con IntersectionObserver es trivial               |
| CRXJS            | Plugin de Vite que agrega abstracción innecesaria. Config manual de MV3 es simple          |

---

## 4. Arquitectura de la Extensión (Manifest V3)

### Modo de renderizado: In-Tab (Content Script)

La extensión **reemplaza el contenido de la pestaña** cuando detecta JSON, igual que JSON Formatter y JSON Viewer. No es un popup. El viewer ocupa toda la ventana del navegador, aprovechando el espacio completo.

```
json-spark/
├── src/
│   ├── background/
│   │   └── service-worker.ts         # Detecta content-type, decide si activar viewer
│   │
│   ├── content/
│   │   └── detector.ts               # Extrae el JSON raw, inyecta el viewer
│   │
│   ├── viewer/                       # App principal — Vanilla TS, zero frameworks
│   │   ├── app.ts                    # Entry point, orquesta componentes
│   │   │
│   │   ├── components/               # Cada componente = carpeta autocontenida
│   │   │   ├── tree-view/
│   │   │   │   ├── tree-view.ts          # Lógica del componente
│   │   │   │   ├── tree-view.css         # Estilos del componente
│   │   │   │   ├── tree-view.types.ts    # Tipos e interfaces propios
│   │   │   │   └── index.ts              # Re-export público
│   │   │   ├── raw-view/
│   │   │   │   ├── raw-view.ts
│   │   │   │   ├── raw-view.css
│   │   │   │   ├── raw-view.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── table-view/               # Fase 2
│   │   │   │   ├── table-view.ts
│   │   │   │   ├── table-view.css
│   │   │   │   ├── table-view.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── diff-view/                # Fase 3
│   │   │   │   └── ...
│   │   │   ├── query-bar/                # Fase 2
│   │   │   │   └── ...
│   │   │   ├── search-bar/
│   │   │   │   ├── search-bar.ts
│   │   │   │   ├── search-bar.css
│   │   │   │   ├── search-bar.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── breadcrumb/               # Fase 2
│   │   │   │   └── ...
│   │   │   ├── toolbar/
│   │   │   │   ├── toolbar.ts
│   │   │   │   ├── toolbar.css
│   │   │   │   ├── toolbar.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── status-bar/
│   │   │   │   ├── status-bar.ts
│   │   │   │   ├── status-bar.css
│   │   │   │   ├── status-bar.types.ts
│   │   │   │   └── index.ts
│   │   │   └── banner/
│   │   │       ├── banner.ts              # Warnings de content-type, JSON inválido
│   │   │       ├── banner.css
│   │   │       ├── banner.types.ts
│   │   │       └── index.ts
│   │   │
│   │   ├── core/                     # Lógica reutilizable, sin UI
│   │   │   ├── store.ts              # State management vanilla (pub/sub)
│   │   │   ├── store.types.ts
│   │   │   ├── virtual-scroll.ts     # Virtualización con IntersectionObserver
│   │   │   ├── parser.ts             # Parser JSON robusto
│   │   │   ├── parser.types.ts
│   │   │   ├── formatter.ts          # Pretty print / minify
│   │   │   ├── highlighter.ts        # Syntax highlighting sin dependencias
│   │   │   └── worker.ts             # Web Worker para archivos grandes
│   │   │
│   │   ├── styles/                   # Estilos globales (no de componentes)
│   │   │   ├── base.css              # Reset, tipografía, variables CSS
│   │   │   ├── themes.css            # Dark/Light/System via custom properties
│   │   │   └── responsive.css        # Breakpoints y adaptación viewport
│   │   │
│   │   └── types.ts                  # Tipos globales del viewer
│   │
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   │
│   ├── options/
│   │   ├── options.html
│   │   ├── options.ts
│   │   └── options.css
│   │
│   └── shared/                       # Código compartido entre viewer, popup, options
│       ├── constants.ts
│       ├── messaging.ts              # Chrome messaging tipado
│       ├── dom.ts                    # Helpers DOM reutilizables (createElement, etc)
│       └── types.ts                  # Tipos compartidos globales
│
├── demo/                             # Página web para preview en desarrollo
│   ├── index.html                    # Entry point de la demo
│   ├── demo.ts                       # Bootstrap: carga viewer con JSON de ejemplo
│   ├── demo.css
│   └── fixtures/                     # JSONs de prueba
│       ├── small.json                # ~1KB, pocos nodos
│       ├── medium.json               # ~100KB, estructura realística
│       ├── large.json                # ~5MB, para probar virtualización
│       ├── huge.json                 # ~50MB, para probar Web Worker
│       ├── invalid.json              # JSON malformado
│       ├── nested-deep.json          # 20+ niveles de profundidad
│       ├── array-of-objects.json      # Para probar Table View
│       └── with-urls.json            # Para probar clickable URLs
│
├── scripts/                          # Scripts de desarrollo y utilidades
│   ├── generate-icons.ts             # Genera icon-16, icon-48, icon-128 desde SVG base
│   ├── generate-fixtures.ts          # Genera JSONs de prueba de distintos tamaños
│   ├── generate-screenshots.ts       # Captura screenshots para Chrome Web Store
│   └── build-extension.ts            # Build y empaquetado para distribución
│
├── public/
│   ├── manifest.json
│   └── icons/
│
├── tests/
│   ├── unit/                         # Tests unitarios por módulo
│   │   ├── parser.test.ts
│   │   ├── formatter.test.ts
│   │   ├── store.test.ts
│   │   └── highlighter.test.ts
│   └── e2e/                          # Tests end-to-end con Playwright
│       ├── detection.test.ts         # Detecta JSON en distintos content-types
│       ├── tree-view.test.ts         # Expand, collapse, navegación
│       └── search.test.ts            # Búsqueda full-text
│
└── wasm/                             # Solo se descarga en Fase 2+
    └── jq.wasm
```

### Convención de componentes

Cada componente visual es una carpeta autocontenida con 4 archivos:

```
components/
  └── mi-componente/
      ├── mi-componente.ts          # Lógica: clase que extiende BaseComponent
      ├── mi-componente.css         # Estilos: scoped por prefijo de clase
      ├── mi-componente.types.ts    # Interfaces, tipos, enums del componente
      └── index.ts                  # Re-export público: export { MiComponente } from './mi-componente'
```

**Reglas:**

- Un componente **nunca** importa los internos de otro componente. Solo importa desde `index.ts`.
- Los estilos de cada componente usan prefijo de clase: `.js-tree-view__node`, `.js-toolbar__button`.
- Los tipos locales viven en `*.types.ts`. Los tipos compartidos viven en `shared/types.ts`.
- Si un componente crece demasiado, se extrae en sub-componentes dentro de su propia carpeta.

### BaseComponent (patrón base)

Todos los componentes extienden una clase base minimalista:

```typescript
/**
 * Clase base para todos los componentes de UI.
 * Provee ciclo de vida, gestión de DOM y cleanup automático.
 */
abstract class BaseComponent {
	protected el: HTMLElement;
	private disposables: Array<() => void> = [];

	/** Renderiza el componente en el contenedor dado. */
	abstract render(container: HTMLElement): void;

	/** Actualiza el componente con nuevo estado. */
	abstract update(state: Partial<AppState>): void;

	/** Registra un event listener con cleanup automático. */
	protected on<K extends keyof HTMLElementEventMap>(
		el: HTMLElement,
		event: K,
		handler: (e: HTMLElementEventMap[K]) => void,
	): void {
		/* ... */
	}

	/** Limpia listeners, subscripciones y DOM. */
	dispose(): void {
		/* ... */
	}
}
```

---

### Principios de código

#### SOLID aplicado

| Principio                 | Aplicación concreta                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Single Responsibility** | Cada archivo tiene una sola razón para cambiar. `parser.ts` solo parsea, `highlighter.ts` solo colorea, cada componente solo maneja su UI. |
| **Open/Closed**           | Nuevas vistas (Table, Chart, Diff) se agregan como nuevos componentes sin modificar `app.ts`. El app usa un registry de vistas.            |
| **Liskov Substitution**   | Todas las vistas implementan la misma interfaz `ViewComponent`. Se pueden intercambiar sin romper el sistema.                              |
| **Interface Segregation** | Interfaces pequeñas y específicas: `Renderable`, `Searchable`, `Disposable` en vez de una interfaz monolítica.                             |
| **Dependency Inversion**  | Los componentes dependen de abstracciones (interfaces), no de implementaciones concretas. El store se inyecta, no se importa directamente. |

#### DRY

- Lógica DOM común en `shared/dom.ts` (crear elementos, bind events, etc).
- Colores de sintaxis definidos una vez en CSS custom properties, consumidos por todos los componentes.
- Tipos compartidos en `shared/types.ts`, nunca duplicados entre componentes.

#### Clean Code + JSDoc

Todo el código público documentado con JSDoc:

````typescript
/**
 * Parsea un string JSON y devuelve un árbol aplanado para virtualización.
 *
 * @param raw - El string JSON sin procesar
 * @param options - Opciones de parseo
 * @returns Resultado del parseo con nodos aplanados o error detallado
 *
 * @example
 * ```ts
 * const result = parseJSON('{"name": "Alice"}');
 * if (result.ok) {
 *   console.log(result.nodes); // FlatNode[]
 * } else {
 *   console.error(result.error); // ParseError con línea y columna
 * }
 * ```
 */
export function parseJSON(raw: string, options?: ParseOptions): ParseResult {
	// ...
}
````

Convenciones:

- Funciones ≤ 30 líneas. Si crece más, extraer helpers privados.
- Nombres descriptivos: `isJsonContentType()` no `check()`.
- No abreviar: `container` no `ctnr`, `element` no `el` (excepción: `el` en BaseComponent por brevedad interna).
- Early returns sobre nesting profundo.
- Sin `any`. Usar `unknown` + type guards cuando el tipo no es conocido.
- Errores con mensajes útiles para el desarrollador.

---

### Demo (preview en desarrollo)

La carpeta `demo/` permite ver el viewer sin instalar la extensión:

```bash
# Iniciar servidor de demo
npm run demo
# Abre http://localhost:5173/demo/
```

- Carga el viewer directamente en una página HTML.
- Selector de fixtures para probar distintos JSONs.
- Toggle para simular distintos viewports.
- Útil para iterar rápido sin recargar la extensión en Chrome.
- El código del viewer es exactamente el mismo que usa la extensión (mismos imports).

### Scripts

| Script                    | Descripción                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `generate-icons.ts`       | Toma `icons/icon.svg` y genera PNG en 16x16, 48x48, 128x128 usando sharp o canvas                              |
| `generate-fixtures.ts`    | Genera JSONs de prueba: small (1KB), medium (100KB), large (5MB), huge (50MB) con datos realistas              |
| `generate-screenshots.ts` | Usa Playwright para abrir la demo con distintos fixtures/temas y capturar screenshots para la Chrome Web Store |
| `build-extension.ts`      | Build de producción: bundle, minify, copiar manifest, empaquetar como .zip para subir a CWS                    |

### manifest.json (Manifest V3)

```json
{
	"manifest_version": 3,
	"name": "JSON Spark",
	"version": "0.1.0",
	"description": "The JSON tool you can trust. Fast, beautiful, private.",
	"icons": {
		"16": "icons/icon-16.png",
		"48": "icons/icon-48.png",
		"128": "icons/icon-128.png"
	},
	"permissions": ["activeTab", "clipboardWrite"],
	"background": {
		"service_worker": "background/service-worker.js",
		"type": "module"
	},
	"content_scripts": [
		{
			"matches": ["<all_urls>"],
			"js": ["content/detector.js"],
			"run_at": "document_end"
		}
	],
	"action": {
		"default_popup": "popup/popup.html",
		"default_icon": "icons/icon-48.png"
	},
	"web_accessible_resources": [
		{
			"resources": ["viewer/*", "wasm/*"],
			"matches": ["<all_urls>"]
		}
	]
}
```

> **Nota:** `<all_urls>` en `content_scripts` es necesario para detectar JSON en cualquier URL. No se inyecta UI a menos que el contenido sea JSON. El permiso `activeTab` limita el acceso real solo a la pestaña activa.

### Detección de Content-Type

No todos los servidores devuelven `application/json`. La extensión debe manejar múltiples escenarios:

| Content-Type recibido                | Comportamiento                                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `application/json`                   | Activar viewer automáticamente                                                                                              |
| `application/json; charset=utf-8`    | Activar viewer automáticamente                                                                                              |
| `text/json`                          | Mostrar banner: "⚠ Content-Type `text/json` detectado. El estándar es `application/json`." Activar viewer.                  |
| `text/plain` con cuerpo JSON válido  | Mostrar banner: "⚠ Content-Type `text/plain` pero el contenido es JSON. Considera usar `application/json`." Activar viewer. |
| `application/ld+json`                | Activar viewer (JSON-LD)                                                                                                    |
| Sin content-type, cuerpo parece JSON | Intentar parsear. Si es válido, activar viewer con banner informativo.                                                      |
| Archivos `.json` locales (`file://`) | Activar viewer automáticamente                                                                                              |
| JSONP (`callback({...})`)            | Extraer JSON del wrapper, activar viewer                                                                                    |

El banner es dismissible y no intrusivo (barra superior de 32px, fondo amarillo suave).

### Manejo de JSON inválido y variantes

**Filosofía:** Parsear estrictamente como JSON estándar (RFC 8259). Si falla, informar al usuario con detalle y permitir edición.

| Escenario                                   | Comportamiento                                                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSON válido (RFC 8259)                      | Renderizar normalmente                                                                                                                                        |
| JSON malformado                             | Banner rojo: "⚠ JSON inválido: [mensaje de error] en línea X, columna Y". Mostrar vista Raw con la línea del error resaltada. Permitir edición para corregir. |
| Trailing commas                             | Marcar como inválido (no es JSON estándar). Mostrar error específico: "Trailing comma en línea X".                                                            |
| Comentarios (`//` o `/* */`)                | Marcar como inválido. Sugerir: "¿Es JSONC? Soporte JSONC próximamente."                                                                                       |
| Números grandes (> Number.MAX_SAFE_INTEGER) | Preservar como string, indicar con badge "BigInt"                                                                                                             |
| Duplicated keys                             | Parsear (usar último valor como hace `JSON.parse`), mostrar warning                                                                                           |

**Soporte futuro JSONC (Fase 2):**
JSONC (JSON with Comments) es ampliamente usado en configuraciones de desarrollo (`tsconfig.json`, `.vscode/settings.json`, etc.). Tiene sentido soportarlo como segunda prioridad:

- Si el parse JSON estándar falla y se detectan comentarios → ofrecer toggle "Parsear como JSONC (stripear comentarios)".
- Indicar en status bar: "JSONC" en lugar de "JSON".

**JSON5: No soportado.** JSON5 añade demasiada permisividad (unquoted keys, trailing commas, etc.) y su adopción es marginal. Complejidad de implementación no justifica el beneficio.

### Web Worker: Justificación

El parseo de JSON grandes **debe** ejecutarse fuera del hilo principal para evitar congelar la UI:

| Tamaño del JSON | Tiempo de `JSON.parse` (aprox.) | ¿Web Worker?                          |
| --------------- | ------------------------------- | ------------------------------------- |
| < 1MB           | < 50ms                          | No. Parse directo en main thread      |
| 1MB - 10MB      | 50ms - 500ms                    | Sí. Worker evita que la UI se congele |
| 10MB - 50MB     | 500ms - 3s                      | Sí + indicador de progreso            |
| > 50MB          | > 3s                            | Sí + streaming parse + progress bar   |

**Umbral:** A partir de **1MB**, el parseo se delega al Web Worker. Para el usuario el cambio es transparente.

El Worker devuelve al main thread una estructura aplanada (flat tree) optimizada para virtualización, no el JSON parseado completo.

### Flujo de la extensión

```
Navegador carga URL
        │
        ▼
Content Script analiza el contenido del <body>
  ├─ ¿Es JSON válido? → Activar viewer
  ├─ ¿Content-Type es text/json o text/plain con JSON? → Activar viewer + banner de advertencia
  ├─ ¿Es JSONP? → Extraer JSON, activar viewer
  └─ ¿No es JSON? → No hacer nada
        │
        ▼
¿Tamaño > 1MB?
  ├─ Sí → Parsear en Web Worker con progress bar
  └─ No → Parsear directo en main thread
        │
        ▼
TreeView renderiza con virtualización (solo nodos visibles en viewport)
        │
        ▼
Usuario interactúa: busca, filtra, edita, exporta
```

---

## 5. Features por Fase

### Fase 1 — MVP (v0.1) → Semanas 1-3

Objetivo: Publicar en Chrome Web Store con las features esenciales mejor ejecutadas que la competencia.

| Feature                | Detalle                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| Auto-detección de JSON | Detectar `application/json` y JSONP, renderizar automáticamente               |
| Tree View              | Árbol colapsable con virtualización custom (IntersectionObserver)             |
| Syntax highlighting    | Tipos diferenciados por color (strings, numbers, booleans, null)              |
| Collapse/Expand all    | Botón global + por nivel + Ctrl+click para siblings                           |
| Dark/Light/System mode | Detecta `prefers-color-scheme` del sistema automáticamente. Sin persistencia. |
| Raw/Parsed toggle      | Alternar entre JSON formateado y raw                                          |
| Copy value/path        | Click derecho → copiar valor o JSONPath                                       |
| Clickable URLs         | URLs dentro de strings son clickeables                                        |
| Búsqueda básica        | Ctrl+F para buscar texto dentro del JSON                                      |
| Status bar             | Tamaño del archivo, número de keys, profundidad                               |
| Keyboard shortcuts     | Navegación con flechas, J/K, Ctrl+arrows                                      |
| Cero permisos extra    | Solo permiso para leer páginas con JSON                                       |
| Página de opciones     | Info de la extensión, keyboard shortcuts reference                            |
| Responsive layout      | Toolbar colapsa a iconos en viewports estrechos (split-screen, tablet)        |

**Criterio de éxito:** La extensión es notablemente más rápida y pulida que JSON Formatter en un JSON de 1MB. Usable en un viewport de 320px (split-screen con DevTools).

---

### Fase 2 — Power Features (v0.5) → Semanas 4-6

| Feature               | Detalle                                                        |
| --------------------- | -------------------------------------------------------------- |
| jq filtering          | Barra de queries con jq vía WebAssembly                        |
| JSONPath support      | Alternar entre jq y JSONPath syntax                            |
| Table View            | Arrays de objetos renderizados como tabla sorteable            |
| Breadcrumb navigation | Barra de navegación clickeable: `root > users > [0] > address` |
| Copy path on click    | Click en cualquier key → copia el path al clipboard            |
| Line numbers          | Opcional, en la vista raw                                      |
| Prettify / Minify     | Botones de formateo con indent configurable                    |
| Download JSON         | Descargar el JSON (original o filtrado)                        |
| Scratch Pad           | Popup con área para pegar y formatear JSON ad-hoc              |
| JSON Lines support    | Detectar y renderizar archivos `.jsonl`                        |
| Sort by keys          | Ordenar propiedades alfabéticamente                            |
| Indent guides         | Líneas visuales de indentación en tree view                    |

---

### Fase 3 — Pro Features (v1.0) → Semanas 7-10

| Feature                | Detalle                                                         |
| ---------------------- | --------------------------------------------------------------- |
| JSON Diff              | Comparar dos JSONs lado a lado con highlighting de diferencias  |
| Edición inline         | Editar valores directamente en el tree view                     |
| JSON Schema validation | Validar contra un schema, mostrar errores inline                |
| Conversión             | JSON → YAML, CSV, XML, TypeScript interfaces                    |
| Chart View             | Visualizar arrays numéricos como gráficos básicos               |
| Custom themes          | Editor de temas con preview en vivo                             |
| Shareable URLs         | Generar datos comprimidos en URL (sin servidor)                 |
| Omnibox integration    | Escribir `jq` en la barra de direcciones para abrir scratch pad |
| Context menu           | Click derecho en cualquier página → "Format JSON in selection"  |
| Import files           | Abrir archivos locales JSON, YAML, XML y convertir              |
| Undo/Redo              | En modo edición                                                 |
| Bookmarks              | Guardar paths favoritos dentro de un JSON grande                |

---

### Fase 4 — Comunidad (v1.5+) → Post-lanzamiento

| Feature                 | Detalle                                         |
| ----------------------- | ----------------------------------------------- |
| Plugin system           | API para que otros creen viewers/transformers   |
| i18n                    | Español, portugués, chino, japonés              |
| Firefox / Edge / Safari | Extensión cross-browser                         |
| VS Code companion       | Extensión VS Code con la misma UI               |
| JSON Spark Online       | Versión web standalone (sin instalar extensión) |

---

## 6. Requisitos No-Funcionales

| Requisito                        | Meta                                               |
| -------------------------------- | -------------------------------------------------- |
| **Tamaño del bundle** (MVP)      | < 50KB (comprimido, sin lazy deps)                 |
| **Tamaño total** (con lazy deps) | < 500KB (jq-wasm se carga on-demand)               |
| **Tiempo de render** (1MB JSON)  | < 500ms                                            |
| **Tiempo de render** (50MB JSON) | < 3s (con virtualización + web worker)             |
| **Memoria** (10MB JSON)          | < 100MB de RAM adicional                           |
| **Lighthouse score**             | 95+ en accesibilidad                               |
| **Permisos**                     | Solo `activeTab` + `clipboardWrite` en MVP         |
| **Compatibilidad**               | Chrome 120+, Edge 120+                             |
| **Viewport mínimo**              | 320px de ancho (iPhone SE)                         |
| **Touch targets**                | Mínimo 44x44px en todos los elementos interactivos |
| **Tests**                        | 80%+ coverage en lógica core                       |

---

## 7. Diseño Visual

### Paleta de colores (Dark mode)

```
Background:     #1a1a2e → #16213e (gradient sutil)
Surface:        #1e293b
Border:         #334155
Text primary:   #f1f5f9
Text secondary: #94a3b8

Syntax:
  String:       #a5d6a7  (verde suave)
  Number:       #90caf9  (azul claro)
  Boolean:      #ffcc80  (naranja suave)
  Null:         #ef9a9a  (rojo suave)
  Key:          #ce93d8  (púrpura suave)
  Bracket:      #78909c  (gris azulado)

Accent:         #fbbf24  (amarillo spark ⚡)
```

### Paleta de colores (Light mode)

```
Background:     #ffffff
Surface:        #f8fafc
Border:         #e2e8f0
Text primary:   #1e293b
Text secondary: #64748b

Syntax:
  String:       #2e7d32
  Number:       #1565c0
  Boolean:      #e65100
  Null:         #c62828
  Key:          #6a1b9a
  Bracket:      #546e7a

Accent:         #f59e0b
```

### Layout — Desktop (≥768px)

```
┌─────────────────────────────────────────────────┐
│  ⚡ JSON Spark     [Tree] [Table] [Raw] [Chart] │  ← Toolbar
├─────────────────────────────────────────────────┤
│  root > data > users > [0]                      │  ← Breadcrumb
├─────────────────────────────────────────────────┤
│  🔍 Search...          jq: .data.users[].name   │  ← Search + Query
├─────────────────────────────────────────────────┤
│                                                 │
│  ▼ {3}                                          │
│    ▼ data {2}                                   │
│      ▼ users [3]                                │
│        ▼ {4}                                    │
│           name: "Alice"                         │
│           age: 30                               │
│           active: true                          │
│           email: null                           │
│        ▶ {4}                                    │
│        ▶ {4}                                    │
│      total: 3                                   │
│    status: "ok"                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  152 keys · 3 levels · 2.4 KB · Valid JSON      │  ← Status bar
└─────────────────────────────────────────────────┘
```

### Layout — Viewport estrecho (<600px: split-screen, tablet, ventana reducida)

El mismo layout se adapta fluidamente. No hay una "versión mobile" separada,
solo el toolbar y status bar se compactan:

```
┌──────────────────────────┐
│  ⚡ JSON Spark   [≡] [🔍] │  ← Toolbar: tabs se colapsan a menú [≡]
├──────────────────────────┤
│  root > … > users > [0]  │  ← Breadcrumb: se trunca con ellipsis
├──────────────────────────┤
│                          │
│ ▼ {3}                    │
│  ▼ data {2}              │
│   ▼ users [3]            │
│    ▼ {4}                 │
│      name: "Alice"       │
│      age: 30             │
│      active: true        │
│    ▶ {4}                 │
│    ▶ {4}                 │
│   total: 3               │
│  status: "ok"            │
│                          │
├──────────────────────────┤
│ 152 keys · 2.4 KB · ✓    │  ← Status bar: se omiten campos secundarios
└──────────────────────────┘

[≡] despliega dropdown con:
  - Tree / Table / Raw / Chart
  - Download
  - Settings
```

### Responsive CSS Strategy

```css
:root {
	--toolbar-height: 40px;
	--node-height: 24px;
	--font-size: 13px;
	--indent: 20px;
}

/* Viewport estrecho: split-screen, tablet, ventana pequeña */
@media (max-width: 600px) {
	.toolbar-tabs {
		display: none;
	} /* Tabs → menú hamburguesa */
	.toolbar-menu {
		display: flex;
	} /* Mostrar [≡] */
	.breadcrumb {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.status-bar-secondary {
		display: none;
	} /* Solo keys + size + valid */
	:root {
		--indent: 14px; /* Menos indentación */
		--font-size: 12px;
	}
}

/* Viewport muy estrecho: DevTools side panel, móvil */
@media (max-width: 400px) {
	.search-bar {
		flex-direction: column;
	} /* Search y query apilados */
	:root {
		--indent: 10px;
	}
}
```

---

## 8. Accesibilidad (a11y)

| Aspecto              | Implementación                                                                |
| -------------------- | ----------------------------------------------------------------------------- |
| **ARIA roles**       | Tree view usa `role="tree"`, `role="treeitem"`, `aria-expanded`, `aria-level` |
| **Focus management** | Tab navega entre toolbar → search → tree. Enter/Space expande/colapsa nodos   |
| **Screen reader**    | Cada nodo anuncia: tipo (object/array/string/etc), key, valor, nivel          |
| **Contraste**        | Ambos temas cumplen WCAG 2.1 AA (ratio mínimo 4.5:1 para texto)               |
| **Reduced motion**   | `prefers-reduced-motion: reduce` desactiva animaciones de expand/collapse     |
| **Keyboard-only**    | Toda la funcionalidad es accesible sin mouse                                  |

### Keyboard Shortcuts (MVP)

| Atajo             | Acción                                                          |
| ----------------- | --------------------------------------------------------------- |
| `↑` / `↓`         | Mover entre nodos del tree                                      |
| `←`               | Colapsar nodo actual (o ir al padre si ya está colapsado)       |
| `→`               | Expandir nodo actual (o ir al primer hijo si ya está expandido) |
| `Enter` / `Space` | Toggle expand/collapse del nodo seleccionado                    |
| `Ctrl+F` / `⌘+F`  | Abrir barra de búsqueda                                         |
| `Ctrl+Shift+F`    | Expand all                                                      |
| `Ctrl+Shift+C`    | Collapse all                                                    |
| `Ctrl+C`          | Copiar valor del nodo seleccionado                              |
| `Ctrl+Shift+P`    | Copiar JSONPath del nodo seleccionado                           |
| `Escape`          | Cerrar barra de búsqueda / deseleccionar                        |
| `1` / `2` / `3`   | Cambiar vista: Tree / Table / Raw                               |

---

## 9. Licencia

**Recomendación: GPL v3 (GNU General Public License v3)**

| Requisito                       | GPL v3                                                          |
| ------------------------------- | --------------------------------------------------------------- |
| Mantener autoría original       | Sí — obligatorio en todas las copias y derivados                |
| Derivados deben dar crédito     | Sí — deben incluir el copyright original                        |
| Derivados deben ser open source | Sí — si distribuyen, deben liberar su código bajo GPL v3        |
| Uso comercial permitido         | Sí — pero el código derivado sigue siendo GPL                   |
| Protección contra apropiación   | Máxima — nadie puede tomar el código, cerrarlo y redistribuirlo |

Alternativas consideradas:

| Licencia   | Por qué no                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| MIT        | Permite que alguien tome el código, lo modifique y lo cierre. No garantiza mantener autoría en derivados. |
| Apache 2.0 | Requiere atribución pero permite código cerrado en derivados.                                             |
| MPL 2.0    | Copyleft a nivel de archivo, pero permite combinar con código cerrado. Más débil que GPL.                 |
| AGPL v3    | Como GPL pero cubre uso en red (SaaS). Overkill para una extensión de Chrome.                             |

```
Copyright (C) 2026 [Tu nombre]

JSON Spark is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```

---

## 10. Riesgos y Mitigación

| Riesgo                                    | Mitigación                                                           |
| ----------------------------------------- | -------------------------------------------------------------------- |
| Chrome depreca APIs en MV3                | Seguir de cerca el blog de Chrome Extensions, tests automatizados    |
| Un competidor copia las features          | GPL v3 obliga a mantener autoría + velocidad de ejecución como moat  |
| jq-wasm es pesado (~400KB)                | Lazy loading: solo se carga cuando el usuario abre la barra de query |
| Content Security Policy bloquea ejecución | Fallback: popup mode cuando CSP es restrictivo                       |
| JSON malformado crashea el viewer         | Try/catch robusto + vista raw como fallback siempre disponible       |
| Burnout del mantenedor                    | Arquitectura modular para facilitar contribuciones externas          |

---

## 11. Timeline Resumen

```
Semana 1-2:   Setup proyecto + Scaffold + Tree View básico
Semana 3:     MVP feature-complete, testing, Chrome Web Store submit
Semana 4-5:   jq, Table View, Breadcrumbs
Semana 6:     Scratch Pad, JSON Lines, Sorting
Semana 7-8:   Diff View, Edición inline
Semana 9-10:  Schema validation, Conversiones, Charts
Semana 11+:   Comunidad, plugins, cross-browser
```

---

## 12. Progreso de Implementación

> Última actualización: Febrero 2026

### Estado actual: Fase 3 — Pro Features (en progreso)

Fase 1 scaffold completo. Fase 2 features de prioridad alta y media implementadas con iteración de UX/diseño. Fase 3 prioridades Alta y Media completadas: Import files, Conversión (JSON↔YAML, CSV, TS), Edición inline, Context menu, Undo/Redo, JSON Diff, Bookmarks. TypeScript compila sin errores, 141 unit tests pasando (5 archivos), y la estructura sigue la arquitectura definida en este plan.

### Archivos implementados (75+ archivos)

| Área                  | Archivos                                                                                                                         | Estado      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Configuración**     | `package.json`, `tsconfig.json`, `vite.demo.config.ts`, `vite.extension.config.ts`, `src/vite-env.d.ts`                          | ✅ Completo |
| **Manifest & assets** | `public/manifest.json`, `public/icons/icon.svg`                                                                                  | ✅ Completo |
| **Shared utilities**  | `types.ts`, `constants.ts`, `dom.ts`, `messaging.ts`                                                                             | ✅ Completo |
| **Core modules**      | `store.ts`, `store.types.ts`, `parser.ts`, `parser.types.ts`, `formatter.ts`, `highlighter.ts`, `virtual-scroll.ts`, `worker.ts` | ✅ Completo |
| **Base component**    | `base-component.ts`, `types.ts` (viewer)                                                                                         | ✅ Completo |
| **Estilos globales**  | `base.css`, `themes.css`, `responsive.css`                                                                                       | ✅ Completo |
| **Toolbar**           | `toolbar.ts`, `toolbar.css`, `toolbar.types.ts`, `index.ts`                                                                      | ✅ Completo |
| **Tree View**         | `tree-view.ts`, `tree-view.css`, `tree-view.types.ts`, `index.ts`                                                                | ✅ Completo |
| **Raw View**          | `raw-view.ts`, `raw-view.css`, `raw-view.types.ts`, `index.ts`                                                                   | ✅ Completo |
| **Search Bar**        | `search-bar.ts`, `search-bar.css`, `search-bar.types.ts`, `index.ts`                                                             | ✅ Completo |
| **Status Bar**        | `status-bar.ts`, `status-bar.css`, `status-bar.types.ts`, `index.ts`                                                             | ✅ Completo |
| **Banner**            | `banner.ts`, `banner.css`, `banner.types.ts`, `index.ts`                                                                         | ✅ Completo |
| **Viewer entry**      | `app.ts`                                                                                                                         | ✅ Completo |
| **Content script**    | `detector.ts`                                                                                                                    | ✅ Completo |
| **Background**        | `service-worker.ts`                                                                                                              | ✅ Completo |
| **Popup**             | `popup.html`, `popup.ts`, `popup.css`                                                                                            | ✅ Completo |
| **Options**           | `options.html`, `options.ts`, `options.css`                                                                                      | ✅ Completo |
| **Demo**              | `index.html`, `demo.ts`, 7 fixtures JSON (incluye `minified.json`)                                                               | ✅ Completo |
| **Breadcrumb**        | `breadcrumb.ts`, `breadcrumb.css`, `breadcrumb.types.ts`, `index.ts`                                                             | ✅ Completo |
| **Table View**        | `table-view.ts`, `table-view.css`, `table-view.types.ts`, `index.ts`                                                             | ✅ Completo |
| **Diff View**         | `diff-view.ts`, `diff-view.css`, `diff-view.types.ts`, `index.ts`                                                                | ✅ Completo |
| **Converter**         | `converter.ts` (JSON↔YAML, CSV, TypeScript)                                                                                      | ✅ Completo |

### Checklist Fase 1 — MVP (v0.1)

#### Infraestructura

- [x] Inicialización del proyecto (npm, TypeScript, Vite)
- [x] Configuración de build para extensión (multi-entry: background, content, viewer, popup, options)
- [x] Configuración de demo (servidor dev en puerto 5173)
- [x] Path aliases (`@viewer/*`, `@shared/*`)
- [x] Manifest V3 con permisos mínimos (`activeTab`, `clipboardWrite`)
- [x] Icono SVG base
- [ ] Generar iconos PNG (16x16, 48x48, 128x128) desde SVG — `scripts/generate-icons.ts`
- [ ] Script de build para producción — `scripts/build-extension.ts`

#### Lógica core

- [x] Store pub/sub con `getState`, `setState`, `subscribe`, `dispose`
- [x] Parser JSON → flat tree (`FlatNode[]`) para virtualización
- [x] Formatter (pretty print, minify, formatSize, formatNumber)
- [x] Syntax highlighter (regex, clases CSS, detección de URLs)
- [x] Virtual scroll (overscan, `scrollToItem`)
- [x] Web Worker para parseo de archivos > 1MB

#### Componentes UI

- [x] BaseComponent con auto-cleanup (`on`, `watch`, `dispose`)
- [x] Toolbar (brand, tabs Tree/Raw/Table, botones contextuales por vista, menú hamburguesa)
- [x] Tree View (virtualizado, expand/collapse, keyboard nav, context menu)
- [x] Raw View (syntax highlighting, line numbers, muestra rawJson tal cual para Prettify/Minify)
- [x] Search Bar (Ctrl+F, debounce, prev/next, contador de matches)
- [x] Status Bar (keys, profundidad, tamaño, indicador válido/inválido)
- [x] Banner (info/warning/error, dismissible)

#### Estilos

- [x] Reset, variables CSS, scrollbar custom, focus visible
- [x] Temas dark/light con CSS custom properties
- [x] Responsive (breakpoints 600px, 400px, touch targets 44x44)

#### Extensión Chrome

- [x] Content script detector (JSON en `<pre>`, JSONP, validación)
- [x] Service worker (mensajería, badge, detección content-type)
- [x] Popup (brand, paste JSON, link a settings)
- [x] Options (shortcuts reference, about)

#### Testing

- [x] Unit tests: `parser.test.ts`
- [x] Unit tests: `formatter.test.ts` (incluye `sortJsonByKeys`)
- [x] Unit tests: `store.test.ts`
- [x] Unit tests: `highlighter.test.ts`
- [x] Unit tests: `converter.test.ts` (jsonToYaml, jsonToCsv, jsonToTypeScript, yamlToJson)
- [ ] Fixtures grandes: `large.json` (~5MB), `huge.json` (~50MB) — `scripts/generate-fixtures.ts`
- [ ] E2E tests con Playwright (detección, tree-view, búsqueda)

### Checklist Fase 2 — Power Features (v0.5)

#### Prioridad Alta ✅

- [x] Breadcrumb navigation — Barra clickeable `$ › users › [0] › address`, actualiza al seleccionar nodos
- [x] Copy path on click — Click en key copia JSONPath al clipboard con feedback visual
- [x] Prettify / Minify — Botones contextuales (solo en Raw view) para reformatear el JSON
- [x] Download JSON — Botón para descargar como archivo `.json`
- [x] Sort by keys — Ordenar propiedades alfabéticamente (recursivo), toggle en toolbar
- [x] Indent guides — Líneas visuales de indentación en tree view

#### Prioridad Media ✅

- [x] Table View — Arrays de objetos renderizados como tabla sorteable con columnas auto-detectadas
- [x] Line numbers — Números de línea opcionales en raw view
- [x] Scratch Pad — Popup con textarea para pegar, prettify, minify y abrir JSON ad-hoc

#### UX & Design Polish ✅

- [x] Tooltips descriptivos — Todos los botones del toolbar con formato `"Acción — Descripción (atajo)"`
- [x] Botones contextuales por vista — Cada modo (Tree/Raw/Table) muestra solo los botones relevantes:
  - **Tree:** Search, Expand/Collapse toggle, Copy, Sort Keys, Download, Theme
  - **Raw:** Search, Copy, Prettify, Minify, Sort Keys, Download, Theme
  - **Table:** Search, Copy, Download, Theme
- [x] Expand/Collapse unificado — Un solo botón toggle `⊞`/`⊟` que refleja el estado actual
- [x] Separadores visuales — Grupos de botones separados con líneas verticales
- [x] Reorden de botones — Download junto a Theme (lejos de botones de formato para evitar clicks accidentales)
- [x] Fix demo fixture loading — Container cacheado, `classList` en vez de `id` para evitar pérdida de referencia
- [x] Fix Prettify/Minify — Raw view muestra `rawJson` directo (sin auto-prettyPrint), JSON se formatea al inicializar
- [x] Fixture `minified.json` — Fixture compacto en demo para probar Prettify/Minify

#### Prioridad Baja (diferido a fases posteriores)

- [ ] jq filtering — Barra de queries con jq vía WebAssembly
- [ ] JSON Lines support — Detectar y renderizar archivos `.jsonl`

#### Publicación

- [ ] Probar como extensión sin empaquetar en Chrome (`chrome://extensions`)
- [ ] Build de producción funcional
- [ ] Screenshots para Chrome Web Store — `scripts/generate-screenshots.ts`
- [ ] Publicación en Chrome Web Store

### Checklist Fase 3 — Pro Features (v1.0)

#### Prioridad Alta ✅

- [x] Import files — Botón 📂 para abrir archivos locales (.json, .yaml, .yml, .xml, .csv), convierte YAML→JSON automáticamente, dispara custom event `json-spark:import`
- [x] Conversión — Export dropdown (⤓) con 4 formatos: JSON, YAML, CSV, TypeScript interfaces. Módulo `converter.ts` zero-dependency
- [x] Edición inline — Toggle ✏️ activa modo edición, doble-click en valores abre input inline, commit con Enter, cancel con Escape
- [x] Context menu — Chrome contextMenus API: "Format JSON in selection", crea panel flotante con JSON formateado y botón Copy

#### Prioridad Media ✅

- [x] Undo/Redo — Botones ↩/↪ en toolbar + atajos Ctrl+Z / Ctrl+Shift+Z, stack de historial en AppState
- [x] JSON Diff — Vista lado a lado con input de segundo JSON (textarea o carga de archivo), diff estructural con highlighting (added/removed/changed), resumen de diferencias
- [x] Bookmarks — Panel desplegable ★, guardar/navegar/eliminar paths, expande la cadena de padres al navegar

#### Prioridad Baja (diferido — evaluación futura)

Las siguientes features se evalúan para fases posteriores por los motivos indicados:

- [ ] JSON Schema validation — **Motivo:** Requiere que el usuario provea o referencie un schema externo; workflow poco frecuente en uso casual. Alta complejidad de implementación (parser de JSON Schema, display de errores inline) con beneficio limitado para la mayoría de usuarios. Mejor candidato para un plugin.
- [ ] Chart View — **Motivo:** Caso de uso muy nicho (solo arrays numéricos). Requiere una librería de charting o implementación SVG custom, lo cual contradice la filosofía zero-dependency. El peso del bundle no justifica el uso marginal.
- [ ] Custom themes — **Motivo:** Dark/Light con CSS custom properties ya cubre el 95% de las preferencias. Un editor de temas completo agrega complejidad de UI (color pickers, preview, persistencia) con retorno bajo. Los usuarios avanzados pueden usar la extensión Stylus para customizar.
- [ ] Shareable URLs — **Motivo:** Comprimir JSON en URL tiene limitaciones severas de tamaño (~2KB útil). Para JSONs grandes (el caso de uso principal) es inviable. Alternativas como pastebin cubren mejor este caso.
- [ ] Omnibox integration — **Motivo:** Requiere permiso adicional (`omnibox`) y solo funciona en Chrome. Beneficio marginal vs. abrir Scratch Pad desde el popup, que ya existe. Bajo descubrimiento por parte de usuarios.

### Próximos pasos inmediatos

1. **Fase 3 — Alta prioridad**: Import files, Conversión, Edición inline, Context menu.
2. **Fase 3 — Media prioridad**: Undo/Redo, JSON Diff, Bookmarks.
3. **Build de producción** — Verificar que `vite build` con `vite.extension.config.ts` genera los bundles correctos.
4. **Prueba en Chrome** — Cargar como "unpacked" y verificar detección + rendering.
5. **Chrome Web Store submission** — Screenshots, descripción, y publicar.

---

_"Make JSON beautiful again." ⚡_
