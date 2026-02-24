import type { Translations } from "./types";

export const pt: Translations = {
	// ─── App ────────────────────────────────────────────────────
	"app.toast.changesSaved": "Alterações salvas",
	"app.toast.saveError": "Erro ao salvar (JSON inválido)",
	"app.loading.parsingJson": "Analisando JSON...",
	"app.error.parseErrorTitle": "Erro de análise",
	"app.error.parseErrorLocation": "Linha {line}, Coluna {column}",
	"app.error.editToFix": "Editar para corrigir",

	// ─── Toolbar ────────────────────────────────────────────────
	"toolbar.tab.tree": "Árvore",
	"toolbar.tab.raw": "Raw",
	"toolbar.tab.table": "Tabela",
	"toolbar.tab.diff": "Diff",
	"toolbar.tab.edit": "Editar",
	"toolbar.tab.saved": "Salvos",
	"toolbar.tab.convert": "Converter",
	"toolbar.tooltip.collapseAll": "Recolher tudo (⌥C)",
	"toolbar.tooltip.expandAll": "Expandir tudo (⌥E)",
	"toolbar.tooltip.sortKeysAsc": "Ordenar chaves A→Z (⌥S)",
	"toolbar.tooltip.sortKeysDesc": "Ordenar chaves Z→A (⌥S)",
	"toolbar.tooltip.sortKeysRestore": "Restaurar ordem original (⌥S)",
	"toolbar.tooltip.toggleLineNumbers": "Alternar números de linha (⌥L)",
	"toolbar.tooltip.prettifyJson": "Formatar JSON",
	"toolbar.tooltip.minifyJson": "Minificar JSON",
	"toolbar.tooltip.search": "Pesquisar (⌘F)",
	"toolbar.tooltip.undo": "Desfazer (⌘Z)",
	"toolbar.tooltip.redo": "Refazer (⌘⇧Z)",
	"toolbar.tooltip.keyboardShortcuts": "Atalhos de teclado (?)",
	"toolbar.toast.jsonCopied": "JSON copiado",
	"toolbar.tooltip.copyJson": "Copiar JSON para a área de transferência",
	"toolbar.tooltip.downloadJson": "Baixar JSON",
	"toolbar.toast.savedFavorite": '"{name}" salvo',
	"toolbar.toast.saveError": "Erro ao salvar",
	"toolbar.tooltip.saveToFavorites": "Salvar nos favoritos",

	// ─── TreeView ───────────────────────────────────────────────
	"treeView.toast.copiedKey": "Copiado: {key}",
	"treeView.toast.copiedPath": "Copiado: {path}",
	"treeView.toast.valueCopied": "Valor copiado para a área de transferência",
	"treeView.toast.formattedJsonCopied": "JSON formatado copiado",
	"treeView.expandable.items": "{count} itens",
	"treeView.expandable.item": "1 item",

	// ─── TreeViewHeader ─────────────────────────────────────────
	"treeViewHeader.tooltip.clearFilter": "Limpar filtro e mostrar todos os nós",
	"treeViewHeader.button.expand": "Expandir",
	"treeViewHeader.tooltip.expandAll": "Expandir tudo (⌥E)",
	"treeViewHeader.button.collapse": "Recolher",
	"treeViewHeader.tooltip.collapseAll": "Recolher tudo (⌥C)",
	"treeViewHeader.label.level": "Nível:",
	"treeViewHeader.tooltip.expandToLevel":
		"Expandir até um nível de profundidade",
	"treeViewHeader.option.all": "Todos",
	"treeViewHeader.stats.nodeCount": "{count} nós",

	// ─── SearchBar ──────────────────────────────────────────────
	"searchBar.placeholder": "Pesquisar...",
	"searchBar.ariaLabel": "Consulta de pesquisa",
	"searchBar.count.format": "{current} de {total}",
	"searchBar.count.noResults": "Sem resultados",
	"searchBar.tooltip.previous": "Anterior (Shift+Enter)",
	"searchBar.tooltip.next": "Próximo (Enter)",
	"searchBar.tooltip.close": "Fechar (Escape)",

	// ─── StatusBar ──────────────────────────────────────────────
	"statusBar.tooltip.unsavedChanges": "Alterações não salvas",
	"statusBar.tooltip.fileSize": "Tamanho do arquivo",
	"statusBar.tooltip.totalKeys": "Total de chaves",
	"statusBar.stats.keys": "{count} chaves",
	"statusBar.tooltip.maxDepth": "Profundidade máxima",
	"statusBar.stats.depth": "Profundidade: {depth}",
	"statusBar.tooltip.switchTheme": "Mudar para tema {theme}",
	"statusBar.tooltip.switchLocale": "Idioma: {locale}",

	// ─── EditView ───────────────────────────────────────────────
	"editView.error.invalidJson": "JSON inválido",
	"editView.ariaLabel.jsonEditor": "Editor JSON",
	"editView.button.save": "Salvar (⌘S)",
	"editView.button.discard": "Descartar",
	"editView.largeFile.banner":
		"Arquivo grande ({size}) — algumas funcionalidades do editor foram desativadas por desempenho.",
	"editView.largeFile.noHighlight": "Destaque de sintaxe desativado",
	"editView.largeFile.noBracketMatch":
		"Correspondência de colchetes desativada",

	// ─── EditorToolbar ──────────────────────────────────────────
	"editorToolbar.tooltip.indent": "Indentação: {size} (clique para alterar)",
	"editorToolbar.label.tab": "Tab",
	"editorToolbar.label.spaces": "{n}sp",
	"editorToolbar.tooltip.wordWrapOn": "Quebra de linha: ativada",
	"editorToolbar.tooltip.wordWrapOff": "Quebra de linha: desativada",
	"editorToolbar.label.wrap": "Quebra",
	"editorToolbar.tooltip.decreaseFontSize": "Reduzir tamanho da fonte",
	"editorToolbar.tooltip.increaseFontSize": "Aumentar tamanho da fonte",
	"editorToolbar.info.cursorPosition": "Ln {line}, Col {col}",
	"editorToolbar.info.totalLines": "{count} linhas",

	// ─── SavedView ──────────────────────────────────────────────
	"savedView.title": "JSONs salvos",
	"savedView.empty": "Nenhum JSON salvo",
	"savedView.tooltip.doubleClickRename": "Duplo clique para renomear",
	"savedView.tooltip.loadInTreeView": "Carregar na vista Árvore",
	"savedView.tooltip.openInEditMode": "Abrir no modo Edição",
	"savedView.tooltip.rename": "Renomear",
	"savedView.tooltip.delete": "Excluir",
	"savedView.saveTitle": "Salvar JSON atual",
	"savedView.placeholder.saveName": "Nome do salvamento...",
	"savedView.tooltip.jsonExceedsLimit": "O JSON excede o limite de {maxSize}KB",
	"savedView.tooltip.savedLimitReached": "Limite de 10 salvamentos atingido",
	"savedView.button.save": "Salvar",
	"savedView.label.size": "Tamanho: {size}",
	"savedView.label.sizeWarning": "(máx: {maxSize}KB)",
	"savedView.label.savedCount": "{count}/10 salvos",
	"savedView.toast.saved": '"{name}" salvo',
	"savedView.toast.saveError": "Erro ao salvar",
	"savedView.toast.loaded": '"{name}" carregado',
	"savedView.toast.openedInEdit": '"{name}" aberto em Edição',
	"savedView.toast.deleted": '"{name}" excluído',
	"savedView.toast.nameUpdated": "Nome atualizado",

	// ─── ConvertView ────────────────────────────────────────────
	"convertView.tooltip.copyToClipboard": "Copiar para a área de transferência",
	"convertView.tooltip.downloadFile": "Baixar arquivo",
	"convertView.toast.copiedToClipboard": "Copiado para a área de transferência",
	"convertView.toast.copyError": "Erro ao copiar",
	"convertView.toast.downloadedAs": "Baixado como converted.{ext}",

	// ─── DiffView ───────────────────────────────────────────────
	"diffView.header.original": "Original (Atual)",
	"diffView.header.compare": "Comparar",
	"diffView.button.clear": "Limpar",
	"diffView.button.openFile": "Abrir arquivo",
	"diffView.button.pasteFromClipboard": "Colar da área de transferência",
	"diffView.placeholder.pasteJson": "Cole ou digite JSON para comparar...",
	"diffView.button.compare": "Comparar",
	"diffView.error.invalidJson": "JSON inválido",
	"diffView.error.invalidJsonFile": "Arquivo JSON inválido",
	"diffView.error.invalidJsonInClipboard":
		"JSON inválido na área de transferência",
	"diffView.error.failedToReadClipboard": "Erro ao ler a área de transferência",

	// ─── Modal — Unsaved Changes ────────────────────────────────
	"modal.unsavedChanges.title": "Alterações não salvas",
	"modal.unsavedChanges.message":
		"Você tem alterações não salvas no editor. O que deseja fazer?",
	"modal.unsavedChanges.cancel": "Cancelar",
	"modal.unsavedChanges.discard": "Descartar alterações",
	"modal.unsavedChanges.save": "Salvar alterações",

	// ─── Modal — Save JSON ──────────────────────────────────────
	"modal.saveJson.title": "Salvar JSON",
	"modal.saveJson.cancel": "Cancelar",
	"modal.saveJson.save": "Salvar",
	"modal.saveJson.placeholder": "Nome do salvamento...",
	"modal.saveJson.size": "Tamanho: {size}",
	"modal.saveJson.sizeWarning": "(máx: {maxSize})",
	"modal.saveJson.savedCount": "{count}/{max} salvos",
	"modal.saveJson.limitReached": "(limite atingido)",

	// ─── Modal — Large Content Warning ──────────────────────────
	"modal.largeContent.title": "Aviso de conteúdo grande",
	"modal.largeContent.message":
		"O JSON atual tem {size}. Abrir a visualização {view} com conteúdo grande pode fazer o navegador ficar lento ou não responder.",
	"modal.largeContent.warning":
		"Considere usar a visualização Árvore ou Bruto para melhor desempenho.",
	"modal.largeContent.continue": "Abrir mesmo assim",
	"modal.largeContent.cancel": "Cancelar",

	// ─── Modal — Shortcuts ──────────────────────────────────────
	"modal.shortcuts.title": "Atalhos de teclado",
	"modal.shortcuts.close": "Fechar",
	"modal.shortcuts.navigation": "Navegação",
	"modal.shortcuts.treeView": "Vista Árvore",
	"modal.shortcuts.rawView": "Vista Bruto",
	"modal.shortcuts.tableView": "Vista Tabela",
	"modal.shortcuts.diffView": "Vista Diff",
	"modal.shortcuts.editView": "Vista Editar",
	"modal.shortcuts.savedView": "Vista Salvos",
	"modal.shortcuts.search": "Pesquisa",
	"modal.shortcuts.openSearch": "Abrir pesquisa",
	"modal.shortcuts.openSearchAlt": "Abrir pesquisa (alternativa)",
	"modal.shortcuts.closeSearch": "Fechar pesquisa",
	"modal.shortcuts.prevNextResult": "Resultado anterior/próximo",
	"modal.shortcuts.goToNextResult": "Ir ao próximo resultado",
	"modal.shortcuts.treeViewCategory": "Vista Árvore",
	"modal.shortcuts.expandAllNodes": "Expandir todos os nós",
	"modal.shortcuts.collapseAllNodes": "Recolher todos os nós",
	"modal.shortcuts.sortByKeys": "Ordenar por chaves (ciclo)",
	"modal.shortcuts.rawEditView": "Vista Bruto / Editar",
	"modal.shortcuts.toggleLineNumbers": "Alternar números de linha",
	"modal.shortcuts.editing": "Edição",
	"modal.shortcuts.undo": "Desfazer",
	"modal.shortcuts.redo": "Refazer",
	"modal.shortcuts.saveChanges": "Salvar alterações (em Editar)",
	"modal.shortcuts.general": "Geral",
	"modal.shortcuts.showHideHelp": "Mostrar/ocultar esta ajuda",

	// ─── ContextMenu ────────────────────────────────────────────
	"contextMenu.copyKey": "Copiar chave",
	"contextMenu.copyPath": "Copiar caminho",
	"contextMenu.copyValue": "Copiar valor",
	"contextMenu.copyFormattedJson": "Copiar JSON formatado",
	"contextMenu.collapseChildren": "Recolher filhos",
	"contextMenu.expandChildren": "Expandir filhos",
	"contextMenu.filterToThis": "Filtrar para este nó",

	// ─── Breadcrumb ─────────────────────────────────────────────
	"breadcrumb.ariaLabel": "Caminho JSON",
	"breadcrumb.root": "$",

	// ─── TableView ──────────────────────────────────────────────
	"tableView.error.invalidJson":
		"JSON inválido — não é possível renderizar como tabela.",
	"tableView.message.worksWithArrays":
		"A vista de tabela funciona melhor com arrays de objetos.",
	"tableView.message.currentDataType": "O dado atual é um {type}.",
	"tableView.message.emptyArray": "Array vazio — nenhum dado para exibir.",
	"tableView.column.index": "Índice",
	"tableView.column.value": "Valor",
	"tableView.column.rowNumber": "#",
	"tableView.cell.arrayLabel": "[Array: {length}]",
	"tableView.cell.objectLabel": "{Object}",
	"tableView.pagination.showing": "{start}–{end} de {total}",
	"tableView.pagination.page": "Página {page} de {totalPages}",
	"tableView.pagination.first": "Primeira",
	"tableView.pagination.previous": "Anterior",
	"tableView.pagination.next": "Próxima",
	"tableView.pagination.last": "Última",

	// ─── LargeFileTreeView ────────────────────────────────────────────────────
	"largeFile.tab": "Arquivo grande",
	"largeFile.banner":
		"Modo arquivo grande — apenas a visualização em árvore está disponível para melhor desempenho.",
	"largeFile.nodes": "nós",
	"largeFile.visible": "visíveis",
};
