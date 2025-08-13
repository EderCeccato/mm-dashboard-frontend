class WMSManager {
   constructor() {
      this.data = this.getSampleData();
      this.dataTable = null;
      this.columnSettings = this.getDefaultColumnSettings();
      this.dateRangePicker = null;
      this._dateFilterFn = null;
      this.init();
   }

   init() {
      this.loadSavedSettings();
      this.populateFilterOptions();
      this.initializeDateRangePicker();
      this.initializeDataTable();
      this.bindEvents();
      this.initializeColumnSettings();
      this.showToast('Tela WMS carregada com sucesso!', 'success');
   }

   getSampleData() {
      return [
         { sku: 'SKU-0001', processo: 'PRC-2024-001', nfe: '551234567', pedido: 'PED-10001', produto: 'Biscoito Recheado Morango 120g', disponivel: 1240, reservada: 150, peso_bruto_disponivel: 372.50, valor_mercadoria: 8420.90, data_mov: '15/01/2024', armazem: 'A1', rua: 'R01', bloco: 'B1', nivel: 'N2', apto: 'A12' },
         { sku: 'SKU-0002', processo: 'PRC-2024-002', nfe: '559876321', pedido: 'PED-10002', produto: 'Arroz Tipo 1 5kg', disponivel: 560, reservada: 80, peso_bruto_disponivel: 2800.00, valor_mercadoria: 4200.00, data_mov: '16/01/2024', armazem: 'A1', rua: 'R02', bloco: 'B1', nivel: 'N1', apto: 'A05' },
         { sku: 'SKU-0003', processo: 'PRC-2024-003', nfe: '551112223', pedido: 'PED-10003', produto: 'Açúcar Refinado 1kg', disponivel: 3200, reservada: 620, peso_bruto_disponivel: 3200.00, valor_mercadoria: 9600.00, data_mov: '16/01/2024', armazem: 'A2', rua: 'R05', bloco: 'B3', nivel: 'N4', apto: 'A02' },
         { sku: 'SKU-0004', processo: 'PRC-2024-004', nfe: '558880001', pedido: 'PED-10004', produto: 'Leite UHT Integral 1L', disponivel: 980, reservada: 120, peso_bruto_disponivel: 980.00, valor_mercadoria: 2940.00, data_mov: '17/01/2024', armazem: 'A3', rua: 'R03', bloco: 'B2', nivel: 'N1', apto: 'A22' },
         { sku: 'SKU-0005', processo: 'PRC-2024-005', nfe: '557770009', pedido: 'PED-10005', produto: 'Feijão Carioca 1kg', disponivel: 1450, reservada: 0, peso_bruto_disponivel: 1450.00, valor_mercadoria: 4350.00, data_mov: '18/01/2024', armazem: 'A2', rua: 'R07', bloco: 'B1', nivel: 'N2', apto: 'A18' }
      ];
   }

   getDefaultColumnSettings() {
      return [
         { key: 'sku', name: 'SKU', visible: true, order: 0, className: 'col-sku' },
         { key: 'processo', name: 'Processo', visible: true, order: 1, className: 'col-processo' },
         { key: 'nfe', name: 'NF-e', visible: true, order: 2, className: 'col-nfe' },
         { key: 'pedido', name: 'Pedido', visible: true, order: 3, className: 'col-pedido' },
         { key: 'produto', name: 'Produto', visible: true, order: 4, className: 'col-produto' },
         { key: 'disponivel', name: 'Disponível', visible: true, order: 5, className: 'col-disponivel' },
         { key: 'reservada', name: 'Qtd. Reservada', visible: true, order: 6, className: 'col-reservada' },
         { key: 'peso_bruto_disponivel', name: 'Peso Bruto Disponível', visible: true, order: 7, className: 'col-peso' },
         { key: 'valor_mercadoria', name: 'Valor Mercadoria', visible: true, order: 8, className: 'col-valor' },
         { key: 'data_mov', name: 'Data Movimentação', visible: true, order: 9, className: 'col-data' },
         { key: 'armazem', name: 'Armazém', visible: true, order: 10, className: 'col-armazem' },
         { key: 'rua', name: 'Rua', visible: true, order: 11, className: 'col-rua' },
         { key: 'bloco', name: 'Bloco', visible: true, order: 12, className: 'col-bloco' },
         { key: 'nivel', name: 'Nível', visible: true, order: 13, className: 'col-nivel' },
         { key: 'apto', name: 'Apto', visible: true, order: 14, className: 'col-apto' }
      ];
   }

   initializeDataTable() {
      const table = $('#wms-table');
      if ($.fn.DataTable.isDataTable(table)) table.DataTable().destroy();
      const visibleColumns = this.columnSettings.filter(c => c.visible).sort((a, b) => a.order - b.order);
      const columns = visibleColumns.map(col => ({
         data: col.key,
         title: col.name,
         className: col.className || '',
         render: (data) => {
            if (col.key === 'valor_mercadoria') return this.formatCurrency(data);
            if (col.key === 'peso_bruto_disponivel') return data?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '-';
            if (col.key === 'disponivel' || col.key === 'reservada') return data?.toLocaleString('pt-BR') || '0';
            return data ?? '-';
               }
            }));
      const defaultOrderIndex = visibleColumns.findIndex(c => c.key === 'data_mov');
      this.dataTable = table.DataTable({
         data: this.data,
         columns,
         pageLength: 10,
         lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'Todos']],
         language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json' },
         responsive: true,
         scrollX: true,
         scrollY: '400px',
         scrollCollapse: true,
         dom: '<"row"<"col-sm-6"l><"col-sm-6"f>>' + '<"row"<"col-sm-12"tr>>' + '<"row"<"col-sm-5"i><"col-sm-7"p>>',
         order: defaultOrderIndex !== -1 ? [[defaultOrderIndex, 'desc']] : []
      });
   }

   initializeDateRangePicker() {
      const dateRangeInput = document.getElementById('filter-date-range');
      if (!dateRangeInput || typeof flatpickr === 'undefined') return;
      this.dateRangePicker = flatpickr(dateRangeInput, { mode: 'range', dateFormat: 'd/m/Y', locale: 'pt', minDate: '2020-01-01', maxDate: 'today' });
      const icon = dateRangeInput.nextElementSibling?.querySelector('i');
      if (icon) { icon.style.cursor = 'pointer'; icon.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.dateRangePicker?.open(); }); }
   }

   bindEvents() {
      document.getElementById('btn-toggle-filters')?.addEventListener('click', () => {
         const filtersSidebar = new bootstrap.Offcanvas(document.getElementById('filters-sidebar'));
         filtersSidebar.show();
      });
      document.getElementById('btn-apply-filters')?.addEventListener('click', () => this.applyFilters());
      document.getElementById('btn-clear-filters')?.addEventListener('click', () => this.clearFilters());
      document.getElementById('btn-column-settings')?.addEventListener('click', () => {
         const modal = new bootstrap.Modal(document.getElementById('modal-column-settings'));
         modal.show();
      });
      this.bindExportEvents();
   }

   bindExportEvents() {
      document.getElementById('export-excel')?.addEventListener('click', (e) => {
         e.preventDefault(); if (!this.dataTable) return;
         const buttons = new $.fn.dataTable.Buttons(this.dataTable, { buttons: [{ extend: 'excelHtml5', title: 'WMS_Conferencia', exportOptions: { columns: ':visible' } }] });
         const container = buttons.container(); document.body.appendChild(container[0]); buttons.buttons(0, 0).node.click(); buttons.destroy();
      });
      document.getElementById('export-pdf')?.addEventListener('click', (e) => {
         e.preventDefault(); if (!this.dataTable) return;
         const buttons = new $.fn.dataTable.Buttons(this.dataTable, { buttons: [{ extend: 'pdfHtml5', orientation: 'landscape', pageSize: 'A4', title: 'WMS_Conferencia', exportOptions: { columns: ':visible' } }] });
         const container = buttons.container(); document.body.appendChild(container[0]); buttons.buttons(0, 0).node.click(); buttons.destroy();
      });
   }

   applyFilters() {
      if (!this.dataTable) return;
      const sku = document.getElementById('filter-sku')?.value || '';
      const processo = document.getElementById('filter-processo')?.value || '';
      const nfe = document.getElementById('filter-nfe')?.value || '';
      const pedido = document.getElementById('filter-pedido')?.value || '';
      const produto = document.getElementById('filter-produto')?.value || '';
      const armazem = document.getElementById('filter-armazem')?.value || '';

      this.dataTable.search('').columns().search('');
      const columnMap = { sku: this.getColumnIndex('sku'), processo: this.getColumnIndex('processo'), nfe: this.getColumnIndex('nfe'), pedido: this.getColumnIndex('pedido'), produto: this.getColumnIndex('produto'), armazem: this.getColumnIndex('armazem') };
      if (sku && columnMap.sku !== -1) this.dataTable.column(columnMap.sku).search(sku);
      if (processo && columnMap.processo !== -1) this.dataTable.column(columnMap.processo).search(processo);
      if (nfe && columnMap.nfe !== -1) this.dataTable.column(columnMap.nfe).search(nfe);
      if (pedido && columnMap.pedido !== -1) this.dataTable.column(columnMap.pedido).search(pedido);
      if (produto && columnMap.produto !== -1) this.dataTable.column(columnMap.produto).search(produto);
      if (armazem && columnMap.armazem !== -1) this.dataTable.column(columnMap.armazem).search(armazem);

      const dateRange = document.getElementById('filter-date-range')?.value || '';
      if (this._dateFilterFn) { const idx = $.fn.dataTable.ext.search.indexOf(this._dateFilterFn); if (idx > -1) $.fn.dataTable.ext.search.splice(idx, 1); this._dateFilterFn = null; }
      if (dateRange && this.getColumnIndex('data_mov') !== -1) {
         const [start, endRaw] = dateRange.includes(' to ') ? dateRange.split(' to ') : dateRange.split(' a ');
         const startDate = start ? this.parsePtBrDate(start.trim()) : null;
         const endDate = endRaw ? this.parsePtBrDate(endRaw.trim()) : null;
         const colIdx = this.getColumnIndex('data_mov');
         this._dateFilterFn = (settings, data) => {
            if (settings.nTable !== this.dataTable.table().node()) return true;
            const value = data[colIdx]; if (!value) return false; const current = this.parsePtBrDate(String(value));
            if (startDate && current < startDate) return false; if (endDate && current > endDate) return false; return true;
         };
         $.fn.dataTable.ext.search.push(this._dateFilterFn);
      }

      this.dataTable.draw();
      const filtersSidebar = bootstrap.Offcanvas.getInstance(document.getElementById('filters-sidebar')); filtersSidebar?.hide();
      const filteredCount = this.dataTable.rows({ search: 'applied' }).count(); this.showToast(`${filteredCount} registro(s) encontrado(s)`, 'success');
   }

   clearFilters() {
      document.getElementById('filters-form')?.reset();
      if (this.dateRangePicker) this.dateRangePicker.clear();
      if (this._dateFilterFn) { const idx = $.fn.dataTable.ext.search.indexOf(this._dateFilterFn); if (idx > -1) $.fn.dataTable.ext.search.splice(idx, 1); this._dateFilterFn = null; }
      if (this.dataTable) this.dataTable.search('').columns().search('').draw();
      this.showToast('Filtros limpos', 'info');
   }

   getColumnIndex(key) {
      const visibleColumns = this.columnSettings.filter(c => c.visible).sort((a, b) => a.order - b.order);
      return visibleColumns.findIndex(c => c.key === key);
   }

   initializeColumnSettings() { this.renderColumnList(); this.initializeSortable(); }

   renderColumnList() {
      const columnList = document.getElementById('column-list'); if (!columnList) return;
      const sorted = [...this.columnSettings].sort((a, b) => a.order - b.order);
      columnList.innerHTML = sorted.map(c => `
         <div class="list-group-item column-item d-flex align-items-center" data-column="${c.key}">
            <div class="form-check me-3"><input class="form-check-input column-visibility-toggle" type="checkbox" ${c.visible ? 'checked' : ''} data-column="${c.key}"></div>
            <div class="flex-grow-1"><i class="bi bi-grip-vertical me-2 text-muted"></i>${c.name}</div>
            <small class="text-muted">${c.key}</small>
         </div>`).join('');
      columnList.querySelectorAll('.column-visibility-toggle').forEach(cb => cb.addEventListener('change', (e) => {
         const k = e.target.getAttribute('data-column'); const col = this.columnSettings.find(x => x.key === k); if (col) col.visible = e.target.checked;
      }));
      document.getElementById('btn-save-columns')?.addEventListener('click', () => { this.saveSettings(); this.updateTableColumns(); bootstrap.Modal.getInstance(document.getElementById('modal-column-settings'))?.hide(); this.showToast('Configurações de colunas salvas!', 'success'); });
      document.getElementById('btn-reset-columns')?.addEventListener('click', () => { this.columnSettings = this.getDefaultColumnSettings(); this.renderColumnList(); this.updateTableColumns(); this.showToast('Configurações restauradas para o padrão', 'info'); });
   }

   initializeSortable() {
      const columnList = document.getElementById('column-list'); if (!columnList || typeof Sortable === 'undefined') return;
      new Sortable(columnList, { animation: 150, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', handle: '.bi-grip-vertical', onEnd: (evt) => { this.reorderColumns(evt.item.getAttribute('data-column'), evt.oldIndex, evt.newIndex); this.updateColumnOrderNumbers(); } });
   }

   reorderColumns(movedColumnKey, oldIndex, newIndex) {
      const sorted = [...this.columnSettings].sort((a, b) => a.order - b.order);
      const moved = sorted.splice(oldIndex, 1)[0]; sorted.splice(newIndex, 0, moved); sorted.forEach((c, i) => { c.order = i; });
   }

   updateColumnOrderNumbers() {
      const items = document.querySelectorAll('#column-list .column-item'); items.forEach((item, index) => { const k = item.getAttribute('data-column'); const col = this.columnSettings.find(c => c.key === k); if (col) col.order = index; });
   }

   updateTableColumns() { if (this.dataTable) { this.dataTable.destroy(); const table = document.getElementById('wms-table'); table.innerHTML = '<thead><tr></tr></thead><tbody></tbody>'; this.initializeDataTable(); } }

   saveSettings() { localStorage.setItem('wms-column-settings', JSON.stringify(this.columnSettings)); }
   loadSavedSettings() { const saved = localStorage.getItem('wms-column-settings'); if (saved) { try { this.columnSettings = JSON.parse(saved); } catch (_) {} } }
   formatCurrency(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0); }
   parsePtBrDate(str) { const [d, m, y] = str.split('/').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
   showToast(message, type = 'info') { const toastContainer = document.querySelector('.toast-container'); if (!toastContainer) return; const toastId = 'toast-' + Date.now(); const bgClass = { success: 'bg-success', error: 'bg-danger', warning: 'bg-warning', info: 'bg-info' }[type] || 'bg-info'; const html = `<div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert"><div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`; toastContainer.insertAdjacentHTML('beforeend', html); const el = document.getElementById(toastId); const toast = new bootstrap.Toast(el, { autohide: true, delay: 3000 }); toast.show(); el.addEventListener('hidden.bs.toast', () => el.remove()); }

   populateFilterOptions() { const armazens = [...new Set(this.data.map(i => i.armazem))].filter(Boolean).sort(); const select = document.getElementById('filter-armazem'); if (select) { select.innerHTML = '<option value="">Todos</option>' + armazens.map(a => `<option value="${a}">${a}</option>`).join(''); } }
}

document.addEventListener('DOMContentLoaded', () => { window.wmsManager = new WMSManager(); });


