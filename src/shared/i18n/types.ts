/**
 * i18n system — types, hook, and locale management.
 */

export type Locale = "en" | "es" | "pt";

/** All translation keys with their string values. */
export interface Translations {
	// ─── App ───────────────────────────────────────────────────────────────────
	"app.toast.changesSaved": string;
	"app.toast.saveError": string;
	"app.loading.parsingJson": string;
	"app.error.parseErrorTitle": string;
	"app.error.parseErrorLocation": string; // {line}, {column}

	// ─── Toolbar ──────────────────────────────────────────────────────────────
	"toolbar.tab.tree": string;
	"toolbar.tab.raw": string;
	"toolbar.tab.table": string;
	"toolbar.tab.diff": string;
	"toolbar.tab.edit": string;
	"toolbar.tab.saved": string;
	"toolbar.tab.convert": string;
	"toolbar.tooltip.collapseAll": string;
	"toolbar.tooltip.expandAll": string;
	"toolbar.tooltip.sortKeysAsc": string;
	"toolbar.tooltip.sortKeysDesc": string;
	"toolbar.tooltip.sortKeysRestore": string;
	"toolbar.tooltip.toggleLineNumbers": string;
	"toolbar.tooltip.prettifyJson": string;
	"toolbar.tooltip.minifyJson": string;
	"toolbar.tooltip.search": string;
	"toolbar.tooltip.undo": string;
	"toolbar.tooltip.redo": string;
	"toolbar.tooltip.keyboardShortcuts": string;
	"toolbar.toast.jsonCopied": string;
	"toolbar.tooltip.copyJson": string;
	"toolbar.tooltip.downloadJson": string;
	"toolbar.toast.savedFavorite": string; // {name}
	"toolbar.toast.saveError": string;
	"toolbar.tooltip.saveToFavorites": string;

	// ─── TreeView ─────────────────────────────────────────────────────────────
	"treeView.toast.copiedKey": string; // {key}
	"treeView.toast.copiedPath": string; // {path}
	"treeView.toast.valueCopied": string;
	"treeView.toast.formattedJsonCopied": string;
	"treeView.expandable.items": string; // {count}
	"treeView.expandable.item": string;

	// ─── TreeViewHeader ───────────────────────────────────────────────────────
	"treeViewHeader.tooltip.clearFilter": string;
	"treeViewHeader.button.expand": string;
	"treeViewHeader.tooltip.expandAll": string;
	"treeViewHeader.button.collapse": string;
	"treeViewHeader.tooltip.collapseAll": string;
	"treeViewHeader.label.level": string;
	"treeViewHeader.tooltip.expandToLevel": string;
	"treeViewHeader.option.all": string;
	"treeViewHeader.stats.nodeCount": string; // {count}

	// ─── SearchBar ────────────────────────────────────────────────────────────
	"searchBar.placeholder": string;
	"searchBar.ariaLabel": string;
	"searchBar.count.format": string; // {current}, {total}
	"searchBar.count.noResults": string;
	"searchBar.tooltip.previous": string;
	"searchBar.tooltip.next": string;
	"searchBar.tooltip.close": string;

	// ─── StatusBar ────────────────────────────────────────────────────────────
	"statusBar.tooltip.unsavedChanges": string;
	"statusBar.tooltip.fileSize": string;
	"statusBar.tooltip.totalKeys": string;
	"statusBar.stats.keys": string; // {count}
	"statusBar.tooltip.maxDepth": string;
	"statusBar.stats.depth": string; // {depth}
	"statusBar.tooltip.switchTheme": string; // {theme}
	"statusBar.tooltip.switchLocale": string; // {locale}

	// ─── EditView ─────────────────────────────────────────────────────────────
	"editView.error.invalidJson": string;
	"editView.ariaLabel.jsonEditor": string;
	"editView.button.save": string;
	"editView.button.discard": string;
	"editView.tooltip.unfold": string;
	"editView.tooltip.fold": string;

	// ─── EditorToolbar ────────────────────────────────────────────────────────
	"editorToolbar.tooltip.indent": string; // {size}
	"editorToolbar.label.tab": string;
	"editorToolbar.label.spaces": string; // {n}
	"editorToolbar.tooltip.wordWrapOn": string;
	"editorToolbar.tooltip.wordWrapOff": string;
	"editorToolbar.label.wrap": string;
	"editorToolbar.tooltip.decreaseFontSize": string;
	"editorToolbar.tooltip.increaseFontSize": string;
	"editorToolbar.info.cursorPosition": string; // {line}, {col}
	"editorToolbar.info.totalLines": string; // {count}

	// ─── SavedView ────────────────────────────────────────────────────────────
	"savedView.title": string;
	"savedView.empty": string;
	"savedView.tooltip.doubleClickRename": string;
	"savedView.tooltip.loadInTreeView": string;
	"savedView.tooltip.openInEditMode": string;
	"savedView.tooltip.rename": string;
	"savedView.tooltip.delete": string;
	"savedView.saveTitle": string;
	"savedView.placeholder.saveName": string;
	"savedView.tooltip.jsonExceedsLimit": string; // {maxSize}
	"savedView.tooltip.savedLimitReached": string;
	"savedView.button.save": string;
	"savedView.label.size": string; // {size}
	"savedView.label.sizeWarning": string; // {maxSize}
	"savedView.label.savedCount": string; // {count}
	"savedView.toast.saved": string; // {name}
	"savedView.toast.saveError": string;
	"savedView.toast.loaded": string; // {name}
	"savedView.toast.openedInEdit": string; // {name}
	"savedView.toast.deleted": string; // {name}
	"savedView.toast.nameUpdated": string;

	// ─── ConvertView ──────────────────────────────────────────────────────────
	"convertView.tooltip.copyToClipboard": string;
	"convertView.tooltip.downloadFile": string;
	"convertView.toast.copiedToClipboard": string;
	"convertView.toast.copyError": string;
	"convertView.toast.downloadedAs": string; // {ext}

	// ─── DiffView ─────────────────────────────────────────────────────────────
	"diffView.header.original": string;
	"diffView.header.compare": string;
	"diffView.button.clear": string;
	"diffView.button.openFile": string;
	"diffView.button.pasteFromClipboard": string;
	"diffView.placeholder.pasteJson": string;
	"diffView.button.compare": string;
	"diffView.error.invalidJson": string;
	"diffView.error.invalidJsonFile": string;
	"diffView.error.invalidJsonInClipboard": string;
	"diffView.error.failedToReadClipboard": string;

	// ─── Modal — Unsaved Changes ──────────────────────────────────────────────
	"modal.unsavedChanges.title": string;
	"modal.unsavedChanges.message": string;
	"modal.unsavedChanges.cancel": string;
	"modal.unsavedChanges.discard": string;
	"modal.unsavedChanges.save": string;

	// ─── Modal — Save JSON ────────────────────────────────────────────────────
	"modal.saveJson.title": string;
	"modal.saveJson.cancel": string;
	"modal.saveJson.save": string;
	"modal.saveJson.placeholder": string;
	"modal.saveJson.size": string; // {size}
	"modal.saveJson.sizeWarning": string; // {maxSize}
	"modal.saveJson.savedCount": string; // {count}, {max}
	"modal.saveJson.limitReached": string;

	// ─── Modal — Large Content Warning ────────────────────────────────────────
	"modal.largeContent.title": string;
	"modal.largeContent.message": string; // {size}, {view}
	"modal.largeContent.warning": string;
	"modal.largeContent.continue": string;
	"modal.largeContent.cancel": string;

	// ─── Modal — Shortcuts ────────────────────────────────────────────────────
	"modal.shortcuts.title": string;
	"modal.shortcuts.close": string;
	"modal.shortcuts.navigation": string;
	"modal.shortcuts.treeView": string;
	"modal.shortcuts.rawView": string;
	"modal.shortcuts.tableView": string;
	"modal.shortcuts.diffView": string;
	"modal.shortcuts.editView": string;
	"modal.shortcuts.savedView": string;
	"modal.shortcuts.search": string;
	"modal.shortcuts.openSearch": string;
	"modal.shortcuts.openSearchAlt": string;
	"modal.shortcuts.closeSearch": string;
	"modal.shortcuts.prevNextResult": string;
	"modal.shortcuts.goToNextResult": string;
	"modal.shortcuts.treeViewCategory": string;
	"modal.shortcuts.expandAllNodes": string;
	"modal.shortcuts.collapseAllNodes": string;
	"modal.shortcuts.sortByKeys": string;
	"modal.shortcuts.rawEditView": string;
	"modal.shortcuts.toggleLineNumbers": string;
	"modal.shortcuts.editing": string;
	"modal.shortcuts.undo": string;
	"modal.shortcuts.redo": string;
	"modal.shortcuts.saveChanges": string;
	"modal.shortcuts.general": string;
	"modal.shortcuts.showHideHelp": string;

	// ─── ContextMenu ──────────────────────────────────────────────────────────
	"contextMenu.copyKey": string;
	"contextMenu.copyPath": string;
	"contextMenu.copyValue": string;
	"contextMenu.copyFormattedJson": string;
	"contextMenu.collapseChildren": string;
	"contextMenu.expandChildren": string;
	"contextMenu.filterToThis": string;

	// ─── Breadcrumb ───────────────────────────────────────────────────────────
	"breadcrumb.ariaLabel": string;
	"breadcrumb.root": string;

	// ─── LargeFileTreeView ────────────────────────────────────────────────────
	"largeFile.tab": string;
	"largeFile.banner": string;
	"largeFile.nodes": string;
	"largeFile.visible": string;

	// ─── TableView ────────────────────────────────────────────────────────────
	"tableView.error.invalidJson": string;
	"tableView.message.worksWithArrays": string;
	"tableView.message.currentDataType": string; // {type}
	"tableView.message.emptyArray": string;
	"tableView.column.index": string;
	"tableView.column.value": string;
	"tableView.column.rowNumber": string;
	"tableView.cell.arrayLabel": string; // {length}
	"tableView.cell.objectLabel": string;
}

export type TranslationKey = keyof Translations;
