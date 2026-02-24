import type { Translations } from "./types";

export const es: Translations = {
	// ─── App ────────────────────────────────────────────────────
	"app.toast.changesSaved": "Cambios guardados",
	"app.toast.saveError": "Error al guardar (JSON inválido)",
	"app.loading.parsingJson": "Analizando JSON...",
	"app.error.parseErrorTitle": "Error de análisis",
	"app.error.parseErrorLocation": "Línea {line}, Columna {column}",
	"app.error.editToFix": "Editar para corregir",

	// ─── Toolbar ────────────────────────────────────────────────
	"toolbar.tab.tree": "Árbol",
	"toolbar.tab.raw": "Raw",
	"toolbar.tab.table": "Tabla",
	"toolbar.tab.diff": "Diff",
	"toolbar.tab.edit": "Editar",
	"toolbar.tab.saved": "Guardados",
	"toolbar.tab.convert": "Convertir",
	"toolbar.tooltip.collapseAll": "Colapsar todo (⌥C)",
	"toolbar.tooltip.expandAll": "Expandir todo (⌥E)",
	"toolbar.tooltip.sortKeysAsc": "Ordenar claves A→Z (⌥S)",
	"toolbar.tooltip.sortKeysDesc": "Ordenar claves Z→A (⌥S)",
	"toolbar.tooltip.sortKeysRestore": "Restaurar orden original (⌥S)",
	"toolbar.tooltip.toggleLineNumbers": "Alternar números de línea (⌥L)",
	"toolbar.tooltip.prettifyJson": "Formatear JSON",
	"toolbar.tooltip.minifyJson": "Minificar JSON",
	"toolbar.tooltip.search": "Buscar (⌘F)",
	"toolbar.tooltip.undo": "Deshacer (⌘Z)",
	"toolbar.tooltip.redo": "Rehacer (⌘⇧Z)",
	"toolbar.tooltip.keyboardShortcuts": "Atajos de teclado (?)",
	"toolbar.toast.jsonCopied": "JSON copiado",
	"toolbar.tooltip.copyJson": "Copiar JSON al portapapeles",
	"toolbar.tooltip.downloadJson": "Descargar JSON",
	"toolbar.toast.savedFavorite": '"{name}" guardado',
	"toolbar.toast.saveError": "Error al guardar",
	"toolbar.tooltip.saveToFavorites": "Guardar en favoritos",

	// ─── TreeView ───────────────────────────────────────────────
	"treeView.toast.copiedKey": "Copiado: {key}",
	"treeView.toast.copiedPath": "Copiado: {path}",
	"treeView.toast.valueCopied": "Valor copiado al portapapeles",
	"treeView.toast.formattedJsonCopied": "JSON formateado copiado",
	"treeView.expandable.items": "{count} elementos",
	"treeView.expandable.item": "1 elemento",

	// ─── TreeViewHeader ─────────────────────────────────────────
	"treeViewHeader.tooltip.clearFilter":
		"Limpiar filtro y mostrar todos los nodos",
	"treeViewHeader.button.expand": "Expandir",
	"treeViewHeader.tooltip.expandAll": "Expandir todo (⌥E)",
	"treeViewHeader.button.collapse": "Colapsar",
	"treeViewHeader.tooltip.collapseAll": "Colapsar todo (⌥C)",
	"treeViewHeader.label.level": "Nivel:",
	"treeViewHeader.tooltip.expandToLevel":
		"Expandir hasta un nivel de profundidad",
	"treeViewHeader.option.all": "Todo",
	"treeViewHeader.stats.nodeCount": "{count} nodos",

	// ─── SearchBar ──────────────────────────────────────────────
	"searchBar.placeholder": "Buscar...",
	"searchBar.ariaLabel": "Consulta de búsqueda",
	"searchBar.count.format": "{current} de {total}",
	"searchBar.count.noResults": "Sin resultados",
	"searchBar.tooltip.previous": "Anterior (Shift+Enter)",
	"searchBar.tooltip.next": "Siguiente (Enter)",
	"searchBar.tooltip.close": "Cerrar (Escape)",

	// ─── StatusBar ──────────────────────────────────────────────
	"statusBar.tooltip.unsavedChanges": "Cambios sin guardar",
	"statusBar.tooltip.fileSize": "Tamaño del archivo",
	"statusBar.tooltip.totalKeys": "Total de claves",
	"statusBar.stats.keys": "{count} claves",
	"statusBar.tooltip.maxDepth": "Profundidad máxima",
	"statusBar.stats.depth": "Profundidad: {depth}",
	"statusBar.tooltip.switchTheme": "Cambiar a tema {theme}",
	"statusBar.tooltip.switchLocale": "Idioma: {locale}",

	// ─── EditView ───────────────────────────────────────────────
	"editView.error.invalidJson": "JSON inválido",
	"editView.ariaLabel.jsonEditor": "Editor JSON",
	"editView.button.save": "Guardar (⌘S)",
	"editView.button.discard": "Descartar",
	"editView.largeFile.banner":
		"Archivo grande ({size}) — algunas funciones del editor están desactivadas por rendimiento.",
	"editView.largeFile.noHighlight": "Resaltado de sintaxis desactivado",
	"editView.largeFile.noBracketMatch": "Coincidencia de corchetes desactivada",

	// ─── EditorToolbar ──────────────────────────────────────────
	"editorToolbar.tooltip.indent": "Indentación: {size} (clic para cambiar)",
	"editorToolbar.label.tab": "Tab",
	"editorToolbar.label.spaces": "{n}sp",
	"editorToolbar.tooltip.wordWrapOn": "Ajuste de línea: activado",
	"editorToolbar.tooltip.wordWrapOff": "Ajuste de línea: desactivado",
	"editorToolbar.label.wrap": "Ajuste",
	"editorToolbar.tooltip.decreaseFontSize": "Reducir tamaño de fuente",
	"editorToolbar.tooltip.increaseFontSize": "Aumentar tamaño de fuente",
	"editorToolbar.info.cursorPosition": "Ln {line}, Col {col}",
	"editorToolbar.info.totalLines": "{count} líneas",

	// ─── SavedView ──────────────────────────────────────────────
	"savedView.title": "JSONs guardados",
	"savedView.empty": "No hay JSONs guardados",
	"savedView.tooltip.doubleClickRename": "Doble clic para renombrar",
	"savedView.tooltip.loadInTreeView": "Cargar en vista Árbol",
	"savedView.tooltip.openInEditMode": "Abrir en modo Edición",
	"savedView.tooltip.rename": "Renombrar",
	"savedView.tooltip.delete": "Eliminar",
	"savedView.saveTitle": "Guardar JSON actual",
	"savedView.placeholder.saveName": "Nombre del guardado...",
	"savedView.tooltip.jsonExceedsLimit":
		"El JSON excede el límite de {maxSize}KB",
	"savedView.tooltip.savedLimitReached": "Límite de 10 guardados alcanzado",
	"savedView.button.save": "Guardar",
	"savedView.label.size": "Tamaño: {size}",
	"savedView.label.sizeWarning": "(máx: {maxSize}KB)",
	"savedView.label.savedCount": "{count}/10 guardados",
	"savedView.toast.saved": '"{name}" guardado',
	"savedView.toast.saveError": "Error al guardar",
	"savedView.toast.loaded": '"{name}" cargado',
	"savedView.toast.openedInEdit": '"{name}" abierto en Edición',
	"savedView.toast.deleted": '"{name}" eliminado',
	"savedView.toast.nameUpdated": "Nombre actualizado",

	// ─── ConvertView ────────────────────────────────────────────
	"convertView.tooltip.copyToClipboard": "Copiar al portapapeles",
	"convertView.tooltip.downloadFile": "Descargar archivo",
	"convertView.toast.copiedToClipboard": "Copiado al portapapeles",
	"convertView.toast.copyError": "Error al copiar",
	"convertView.toast.downloadedAs": "Descargado como converted.{ext}",

	// ─── DiffView ───────────────────────────────────────────────
	"diffView.header.original": "Original (Actual)",
	"diffView.header.compare": "Comparar",
	"diffView.button.clear": "Limpiar",
	"diffView.button.openFile": "Abrir archivo",
	"diffView.button.pasteFromClipboard": "Pegar del portapapeles",
	"diffView.placeholder.pasteJson": "Pega o escribe JSON para comparar...",
	"diffView.button.compare": "Comparar",
	"diffView.error.invalidJson": "JSON inválido",
	"diffView.error.invalidJsonFile": "Archivo JSON inválido",
	"diffView.error.invalidJsonInClipboard": "JSON inválido en el portapapeles",
	"diffView.error.failedToReadClipboard": "Error al leer el portapapeles",

	// ─── Modal — Unsaved Changes ────────────────────────────────
	"modal.unsavedChanges.title": "Cambios sin guardar",
	"modal.unsavedChanges.message":
		"Tienes cambios sin guardar en el editor. ¿Qué deseas hacer?",
	"modal.unsavedChanges.cancel": "Cancelar",
	"modal.unsavedChanges.discard": "Descartar cambios",
	"modal.unsavedChanges.save": "Guardar cambios",

	// ─── Modal — Save JSON ──────────────────────────────────────
	"modal.saveJson.title": "Guardar JSON",
	"modal.saveJson.cancel": "Cancelar",
	"modal.saveJson.save": "Guardar",
	"modal.saveJson.placeholder": "Nombre del guardado...",
	"modal.saveJson.size": "Tamaño: {size}",
	"modal.saveJson.sizeWarning": "(máx: {maxSize})",
	"modal.saveJson.savedCount": "{count}/{max} guardados",
	"modal.saveJson.limitReached": "(límite alcanzado)",

	// ─── Modal — Large Content Warning ──────────────────────────
	"modal.largeContent.title": "Advertencia de contenido grande",
	"modal.largeContent.message":
		"El JSON actual pesa {size}. Abrir la vista {view} con contenido grande puede hacer que el navegador se ralentice o deje de responder.",
	"modal.largeContent.warning":
		"Considera usar la vista Árbol o Crudo para mejor rendimiento.",
	"modal.largeContent.continue": "Abrir de todos modos",
	"modal.largeContent.cancel": "Cancelar",

	// ─── Modal — Shortcuts ──────────────────────────────────────
	"modal.shortcuts.title": "Atajos de teclado",
	"modal.shortcuts.close": "Cerrar",
	"modal.shortcuts.navigation": "Navegación",
	"modal.shortcuts.treeView": "Vista Árbol",
	"modal.shortcuts.rawView": "Vista Crudo",
	"modal.shortcuts.tableView": "Vista Tabla",
	"modal.shortcuts.diffView": "Vista Diff",
	"modal.shortcuts.editView": "Vista Editar",
	"modal.shortcuts.savedView": "Vista Guardados",
	"modal.shortcuts.search": "Búsqueda",
	"modal.shortcuts.openSearch": "Abrir búsqueda",
	"modal.shortcuts.openSearchAlt": "Abrir búsqueda (alternativa)",
	"modal.shortcuts.closeSearch": "Cerrar búsqueda",
	"modal.shortcuts.prevNextResult": "Resultado anterior/siguiente",
	"modal.shortcuts.goToNextResult": "Ir al siguiente resultado",
	"modal.shortcuts.treeViewCategory": "Vista Árbol",
	"modal.shortcuts.expandAllNodes": "Expandir todos los nodos",
	"modal.shortcuts.collapseAllNodes": "Colapsar todos los nodos",
	"modal.shortcuts.sortByKeys": "Ordenar por claves (ciclo)",
	"modal.shortcuts.rawEditView": "Vista Crudo / Editar",
	"modal.shortcuts.toggleLineNumbers": "Alternar números de línea",
	"modal.shortcuts.editing": "Edición",
	"modal.shortcuts.undo": "Deshacer",
	"modal.shortcuts.redo": "Rehacer",
	"modal.shortcuts.saveChanges": "Guardar cambios (en Editar)",
	"modal.shortcuts.general": "General",
	"modal.shortcuts.showHideHelp": "Mostrar/ocultar esta ayuda",

	// ─── ContextMenu ────────────────────────────────────────────
	"contextMenu.copyKey": "Copiar clave",
	"contextMenu.copyPath": "Copiar ruta",
	"contextMenu.copyValue": "Copiar valor",
	"contextMenu.copyFormattedJson": "Copiar JSON formateado",
	"contextMenu.collapseChildren": "Colapsar hijos",
	"contextMenu.expandChildren": "Expandir hijos",
	"contextMenu.filterToThis": "Filtrar a este nodo",

	// ─── Breadcrumb ─────────────────────────────────────────────
	"breadcrumb.ariaLabel": "Ruta JSON",
	"breadcrumb.root": "$",

	// ─── TableView ──────────────────────────────────────────────
	"tableView.error.invalidJson":
		"JSON inválido — no se puede renderizar como tabla.",
	"tableView.message.worksWithArrays":
		"La vista de tabla funciona mejor con arrays de objetos.",
	"tableView.message.currentDataType": "El dato actual es un {type}.",
	"tableView.message.emptyArray": "Array vacío — no hay datos que mostrar.",
	"tableView.column.index": "Índice",
	"tableView.column.value": "Valor",
	"tableView.column.rowNumber": "#",
	"tableView.cell.arrayLabel": "[Array: {length}]",
	"tableView.cell.objectLabel": "{Object}",
	"tableView.pagination.showing": "{start}–{end} de {total}",
	"tableView.pagination.page": "Página {page} de {totalPages}",
	"tableView.pagination.first": "Primera",
	"tableView.pagination.previous": "Anterior",
	"tableView.pagination.next": "Siguiente",
	"tableView.pagination.last": "Última",

	// ─── LargeFileTreeView ────────────────────────────────────────────────────
	"largeFile.tab": "Archivo grande",
	"largeFile.banner":
		"Modo archivo grande — solo la vista de árbol está disponible para mejor rendimiento.",
	"largeFile.nodes": "nodos",
	"largeFile.visible": "visibles",
};
