/**
 * Fluxo Operacional - Sistema completo de gerenciamento de fluxos logísticos
 * Integrado com backend Firebird via API REST
 * MM Softwares - Versão Integrada
 */

// ===== CLASSE DE UTILITÁRIOS E API =====
/**
 * Classe responsável por gerenciar comunicação com API e operações utilitárias
 */
class ApiUtils {
   /**
    * Busca dados do fluxo operacional
    * @returns {Promise<Array>} Lista de fluxos operacionais
    */
   static async getFluxoOperacional() {
      const response = await Thefetch('/api/fluxo-operacional', 'GET');
      return response.data || [];
   }

   /**
    * Busca detalhes de um fluxo específico (tarefas)
    * @param {number} nomovtra - Número do movimento
    * @param {number} nofluxoop - Número do fluxo
    * @returns {Promise<Object>} Detalhes do fluxo
    */
   static async getFluxoDetails(nomovtra, nofluxoop) {
      const response = await Thefetch(`/api/fluxo-operacional/${nomovtra}/${nofluxoop}/details`, 'GET');
      return response.data || {};
   }

   /**
    * Formata data ISO para formato brasileiro com horário
    * @param {string} dateISO - Data em formato ISO
    * @returns {string} Data formatada (dd/mm/aaaa hh:mm)
    */
   static formatDate(dateISO) {
      if (!dateISO) return '-';
      const date = new Date(dateISO);
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
   }

   /**
    * Calcula situação SLA baseado na lógica correta do ALERTA_SLA
    * @param {number} alertaSla - Valor do alerta SLA (1=Normal, 2=Atenção, 3=Crítico)
    * @param {number} percentual - Percentual de conclusão
    * @returns {Object} Situação e classe CSS
    */
   static calculateSlaStatus(alertaSla, percentual) {
      if (percentual >= 100) {
         return { status: 'Concluída', class: 'success' };
      }

      if (alertaSla === 3) {
         // SLA Crítico - prazo já passou
         return { status: 'Vencida', class: 'danger' };
      } else if (alertaSla === 2) {
         // SLA em atenção - falta 10 minutos para estourar
         return { status: 'Em atenção', class: 'warning' };
      } else {
         // SLA Normal (alertaSla === 1) - dentro do prazo
         return { status: 'No prazo', class: 'success' };
      }
   }

   /**
    * Extrai valores únicos de um campo específico dos dados
    * @param {Array} data - Array de dados
    * @param {string} field - Nome do campo
    * @returns {Array} Array com valores únicos ordenados
    */
   static getUniqueValues(data, field) {
      return [...new Set(data.map(item => item[field]))]
         .filter(Boolean)
         .sort();
   }

   /**
    * Download de arquivo blob
    * @param {Blob} blob - Arquivo blob
    * @param {string} filename - Nome do arquivo
    */
   static downloadBlob(blob, filename) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
   }
}

// ===== GERENCIADOR DE COLUNAS =====
/**
 * Classe responsável por gerenciar a configuração e exibição das colunas da tabela
 */
class ColumnManager {
   constructor() {
      // Configuração das colunas baseada nos dados reais do Firebird
      this.defaultColumns = [
         { key: 'situacao', name: 'Situação', visible: true, order: 0 },
         { key: 'nomovtra', name: 'Pedido', visible: true, order: 1 },
         { key: 'cliente', name: 'Cliente', visible: true, order: 2 },
         { key: 'descricaofluxo', name: 'Descrição Fluxo', visible: true, order: 3 },
         { key: 'posicao_fluxo', name: 'Posição', visible: true, order: 4 },
         { key: 'percentual', name: '%', visible: true, order: 5 },
         { key: 'container', name: 'Container', visible: true, order: 6 },
         { key: 'nomtipfre', name: 'Tipo Frete', visible: true, order: 7 },
         { key: 'nomtipcarga', name: 'Tipo Carga', visible: true, order: 8 },
         { key: 'rota', name: 'Rota', visible: true, order: 9 },
         { key: 'usuario_resp', name: 'Usuário Resp.', visible: true, order: 10 },
         { key: 'datainiciofluxo', name: 'Início', visible: true, order: 11 },
         { key: 'data', name: 'Data Movimento', visible: true, order: 12 },
         // Colunas inicialmente ocultas
         { key: 'processo', name: 'Processo', visible: false, order: 13 },
         { key: 'placacav', name: 'Cavalo', visible: false, order: 14 },
         { key: 'placacar', name: 'Reboque', visible: false, order: 15 },
         { key: 'docfiscal', name: 'Doc. Fiscal', visible: false, order: 16 },
         { key: 'navio', name: 'Navio', visible: false, order: 17 },
         { key: 'nomot', name: 'Motorista', visible: false, order: 18 }
      ];

      this.columns = this.loadSettings();
      this.sortable = null;
   }

   loadSettings() {
      const saved = localStorage.getItem('fluxo-column-settings');
      return saved ? JSON.parse(saved) : [...this.defaultColumns];
   }

   saveSettings() {
      localStorage.setItem('fluxo-column-settings', JSON.stringify(this.columns));
   }

   getVisibleColumns() {
      return this.columns
         .filter(col => col.visible)
         .sort((a, b) => a.order - b.order);
   }

   getColumnIndex(key) {
      const visibleColumns = this.getVisibleColumns();
      return visibleColumns.findIndex(col => col.key === key);
   }

   resetToDefault() {
      // Faz uma cópia profunda das configurações padrão originais
      this.columns = this.defaultColumns.map(col => ({
         key: col.key,
         name: col.name,
         visible: col.visible, // Mantém a visibilidade padrão original
         order: col.order
      }));
   }

   updateColumnVisibility(key, visible) {
      const column = this.columns.find(col => col.key === key);
      if (column) column.visible = visible;
   }

   renderColumnList() {
      const columnList = document.getElementById('column-list');
      if (!columnList) return;

      const sortedColumns = [...this.columns].sort((a, b) => a.order - b.order);

      columnList.innerHTML = sortedColumns.map(column => `
         <div class="list-group-item column-item d-flex align-items-center" data-column="${column.key}">
            <div class="form-check me-3">
               <input class="form-check-input column-visibility-toggle" type="checkbox"
                      ${column.visible ? 'checked' : ''} data-column="${column.key}">
            </div>
            <div class="flex-grow-1">
               <i class="bi bi-grip-vertical me-2 text-muted"></i>
               ${column.name}
            </div>
            <small class="text-muted">${column.key}</small>
         </div>
      `).join('');

      this.bindColumnEvents();
      this.initializeSortable();
   }

   bindColumnEvents() {
      const checkboxes = document.querySelectorAll('.column-visibility-toggle');
      checkboxes.forEach(checkbox => {
         checkbox.addEventListener('change', (e) => {
            const columnKey = e.target.getAttribute('data-column');
            this.updateColumnVisibility(columnKey, e.target.checked);
         });
      });
   }

   initializeSortable() {
      const columnList = document.getElementById('column-list');
      if (!columnList || typeof Sortable === 'undefined') return;

      this.sortable = new Sortable(columnList, {
         animation: 150,
         ghostClass: 'sortable-ghost',
         chosenClass: 'sortable-chosen',
         handle: '.bi-grip-vertical',
         onEnd: (evt) => this.handleSortEnd(evt)
      });
   }

   handleSortEnd(evt) {
      const columnKey = evt.item.getAttribute('data-column');
      const newIndex = evt.newIndex;
      const oldIndex = evt.oldIndex;

      const sortedColumns = [...this.columns].sort((a, b) => a.order - b.order);
      const movedColumn = sortedColumns.splice(oldIndex, 1)[0];
      sortedColumns.splice(newIndex, 0, movedColumn);

      sortedColumns.forEach((column, index) => {
         column.order = index;
      });
   }
}

// ===== GERENCIADOR DE FILTROS =====
/**
 * Classe responsável por gerenciar todos os filtros da aplicação
 */
class FilterManager {
   constructor(data = []) {
      this.data = data;
      this.dateRangePicker = null;
   }

   updateData(data) {
      this.data = data;
      this.populateFilterOptions();
   }

   populateFilterOptions() {
      if (!this.data || this.data.length === 0) return;

      const clientes = ApiUtils.getUniqueValues(this.data, 'cliente');
      const tiposCarga = ApiUtils.getUniqueValues(this.data, 'nomtipcarga');
      const tiposFrete = ApiUtils.getUniqueValues(this.data, 'nomtipfre');
      const usuarios = ApiUtils.getUniqueValues(this.data, 'usuario_resp');

      this.fillSelectOptions('filter-cliente', clientes);
      this.fillSelectOptions('filter-tipo-carga', tiposCarga);
      this.fillSelectOptions('filter-tipo-frete', tiposFrete);
      this.fillSelectOptions('filter-usuario', usuarios);
   }

   fillSelectOptions(elementId, values, placeholder = 'Todos') {
      const element = document.getElementById(elementId);
      if (!element) return;

      element.innerHTML = `<option value="">${placeholder}</option>` +
         values.map(value => `<option value="${value}">${value}</option>`).join('');
   }

   initializeDateRangePicker() {
      const dateRangeInput = document.getElementById('filter-date-range');
      if (!dateRangeInput || typeof flatpickr === 'undefined') return;

      this.dateRangePicker = flatpickr(dateRangeInput, {
         mode: 'range',
         dateFormat: 'd/m/Y',
         locale: 'pt'
      });

      const iconElement = dateRangeInput.nextElementSibling?.querySelector('i');
      if (iconElement) {
         iconElement.style.cursor = 'pointer';
         iconElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dateRangePicker?.open();
         });
      }
   }

   getFilterValues() {
      return {
         situacao: document.getElementById('filter-situacao')?.value || '',
         cliente: document.getElementById('filter-cliente')?.value || '',
         tipoCarga: document.getElementById('filter-tipo-carga')?.value || '',
         tipoFrete: document.getElementById('filter-tipo-frete')?.value || '',
         usuario: document.getElementById('filter-usuario')?.value || ''
      };
   }

   clearFilters() {
      document.getElementById('filters-form')?.reset();
      this.updateActiveFiltersCount();
   }

   updateActiveFiltersCount() {
      const filters = this.getFilterValues();
      let activeCount = 0;

      Object.values(filters).forEach(value => {
         if (value && value !== '') activeCount++;
      });

      const badge = document.getElementById('active-filters-count');
      if (badge) {
         if (activeCount > 0) {
            badge.textContent = activeCount;
            badge.style.display = 'inline';
         } else {
            badge.style.display = 'none';
         }
      }
   }
}

// ===== GERENCIADOR DA TABELA =====
/**
 * Classe responsável por gerenciar a tabela principal (DataTables)
 */
class TableManager {
   constructor(columnManager) {
      this.data = [];
      this.columnManager = columnManager;
      this.dataTable = null;
   }

   updateData(data) {
      this.data = data;
      if (this.dataTable) {
         this.dataTable.clear().rows.add(data).draw();
      }
   }

   initialize() {
      this.destroyExisting();
      this.createDataTable();
      this.bindTableEvents();
   }

   destroyExisting() {
      const table = $('#tms-table');
      if ($.fn.DataTable.isDataTable(table)) {
         table.DataTable().destroy();
      }
   }

   createDataTable() {
      const columns = this.buildColumns();
      const defaultOrderIndex = this.getDefaultOrderIndex();

      this.dataTable = $('#tms-table').DataTable({
         data: this.data,
         columns,
         pageLength: 25,
         lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'Todos']],
         language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json' },
         responsive: true,
         scrollX: true,
         scrollY: false, // Remove scroll vertical
         scrollCollapse: false,
         paging: true,
         dom: '<"row"<"col-sm-6"l><"col-sm-6"f>><"row"<"col-sm-12"tr>><"row"<"col-sm-5"i><"col-sm-7"p>>',
         order: [[0, 'asc']], // Ordena por situação (vencidas primeiro)
         rowCallback: (row, data) => this.styleTableRow(row, data),
         drawCallback: () => {
            // Esconde o loader quando a tabela termina de desenhar
            window.fluxoManager?.showLoading(false);
         }
      });
   }

   buildColumns() {
      const visibleColumns = this.columnManager.getVisibleColumns();

      return visibleColumns.map(col => {
         return this.buildDataColumn(col);
      });
   }

   buildDataColumn(col) {
      return {
         data: col.key,
         title: col.name,
         render: (data, type, row) => this.renderColumnData(col.key, data, row)
      };
   }

   renderColumnData(key, data, row) {
      switch (key) {
         case 'situacao':
            const slaStatus = ApiUtils.calculateSlaStatus(row.alerta_sla, row.percentual);
            return `<span class="badge bg-${slaStatus.class}">${slaStatus.status}</span>`;

         case 'percentual':
            return this.renderPercentage(row.percentual);

         case 'posicao_fluxo':
            return `${row.posicaofluxo}/${row.qtdetotalfluxo}`;

         case 'datainiciofluxo':
         case 'data':
            return ApiUtils.formatDate(data);

         case 'cliente':
            return row.cliente || '-';

         case 'container':
            return data ? `<code>${data}</code>` : '-';

         case 'placacav':
         case 'placacar':
            return data ? `<code>${data}</code>` : '-';

         default:
            return data || '-';
      }
   }

   renderPercentage(percentual) {
      const pct = Number(percentual) || 0;
      return `
         <div class="d-flex align-items-center">
            <div class="progress me-2" style="height:8px; min-width:60px;">
            <div class="progress-bar" role="progressbar" style="width:${pct}%"
                 aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
         </div>
         <small>${pct}%</small>
         </div>
      `;
   }

   styleTableRow(row, data) {
      // Remove todas as classes de coloração - mantém tabela padrão cinza/branco
      row.classList.remove('flow-warning', 'flow-overdue', 'flow-completed');

      // Não aplica mais cores nas linhas - apenas os badges de situação ficam coloridos
      // A tabela permanece com o estilo padrão cinza/branco alternado
   }

   bindTableEvents() {
      const table = $('#tms-table');

      table.find('tbody').on('click', 'tr', (e) => {
         const data = this.dataTable.row(e.currentTarget).data();
         if (data) {
            window.fluxoManager.showDetails(data.nomovtra, data.nofluxoop);
         }
      });

      table.find('tbody')
         .on('mouseenter', 'tr', function() {
            $(this).addClass('table-hover-effect');
         })
         .on('mouseleave', 'tr', function() {
            $(this).removeClass('table-hover-effect');
         });
   }

   getDefaultOrderIndex() {
      const visibleColumns = this.columnManager.getVisibleColumns();
      return visibleColumns.findIndex(col => col.key === 'nomovtra');
   }

   applyFilters(filters, columnManager) {
      // Limpa pesquisas anteriores
      this.dataTable.search('').columns().search('');

      // Mapeia filtros para índices de colunas
      const columnMap = this.buildColumnMap(columnManager);
      // Aplica filtros individuais por coluna
      this.applyColumnFilters(filters, columnMap);
   }

   buildColumnMap(columnManager) {
      return {
         'situacao': columnManager.getColumnIndex('situacao'),
         'cliente': columnManager.getColumnIndex('cliente'),
         'nomtipcarga': columnManager.getColumnIndex('nomtipcarga'),
         'nomtipfre': columnManager.getColumnIndex('nomtipfre'),
         'container': columnManager.getColumnIndex('container'),
         'processo': columnManager.getColumnIndex('processo'),
         'placacav': columnManager.getColumnIndex('placacav'),
         'placacar': columnManager.getColumnIndex('placacar'),
         'usuario_resp': columnManager.getColumnIndex('usuario_resp')
      };
   }

   applyColumnFilters(filters, columnMap) {
      const filterMappings = [
         { filter: filters.situacao, column: columnMap.situacao },
         { filter: filters.cliente, column: columnMap.cliente },
         { filter: filters.tipoCarga, column: columnMap.nomtipcarga },
         { filter: filters.tipoFrete, column: columnMap.nomtipfre },
         { filter: filters.usuario, column: columnMap.usuario_resp }
      ];

      filterMappings.forEach(({ filter, column }) => {
         if (filter && column !== -1) {
            this.dataTable.column(column).search(filter, false, false);
         }
      });

      this.dataTable.draw();
   }

   getFilteredCount() {
      return this.dataTable?.page.info()?.recordsDisplay || 0;
   }

   rebuild() {
      this.destroyExisting();
      const table = document.getElementById('tms-table');
      table.innerHTML = '<thead><tr></tr></thead><tbody></tbody>';
      this.initialize();
   }
}

// ===== GERENCIADOR DE MODAL =====
/**
 * Classe responsável pelo modal de detalhes dos itens
 */
class ModalManager {
   static async showDetails(nomovtra, nofluxoop) {
      try {
         // Busca item principal dos dados carregados
         const mainItem = window.fluxoManager.data.find(item =>
            item.nomovtra == nomovtra && item.nofluxoop == nofluxoop
         );

         if (!mainItem) {
            NotificationManager.showToast('Dados do item não encontrados', 'error');
            return;
         }

         // Preenche campos básicos ANTES de abrir o modal
         document.getElementById('detail-pedido').textContent = nomovtra;
         document.getElementById('detail-cliente').textContent = mainItem.cliente;
         document.getElementById('detail-descricao').textContent = mainItem.descricaofluxo;

         // Período
         document.getElementById('detail-periodo').textContent =
            `${ApiUtils.formatDate(mainItem.datainiciofluxo)} → ${ApiUtils.formatDate(mainItem.data)}`;

         // Progresso
         document.getElementById('detail-posicao').textContent =
            `${mainItem.posicaofluxo}/${mainItem.qtdetotalfluxo}`;
         document.getElementById('detail-percentual').textContent = `${mainItem.percentual}%`;

         // Barra de progresso
         const progressBar = document.getElementById('detail-progress-bar');
         progressBar.style.width = `${mainItem.percentual}%`;

         // Cor da barra baseada no SLA
         const slaStatus = ApiUtils.calculateSlaStatus(mainItem.alerta_sla, mainItem.percentual);
         progressBar.className = `progress-bar bg-${slaStatus.class}`;

         // Mostra loading nas tarefas
         this.showTasksLoading();

         // Exibe modal IMEDIATAMENTE
         const modal = new bootstrap.Modal(document.getElementById('modal-operation-details'));
         modal.show();

         // Busca detalhes do fluxo via API (em background)
         const details = await ApiUtils.getFluxoDetails(nomovtra, nofluxoop);

         // Renderiza tarefas (substitui o loading)
         this.renderTasks(details.tarefas || []);

      } catch (error) {
         console.error('Erro ao buscar detalhes:', error);
         this.showTasksError();
         NotificationManager.showToast('Erro ao carregar detalhes do fluxo', 'error');
      }
   }

   static showTasksLoading() {
      const concluidas = document.getElementById('detail-tarefas-concluidas');
      const pendentes = document.getElementById('detail-tarefas-pendentes');

      const loadingHtml = `
         <li class="list-group-item text-center py-4">
            <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
            <span class="text-muted">Carregando tarefas...</span>
         </li>
      `;

      concluidas.innerHTML = loadingHtml;
      pendentes.innerHTML = loadingHtml;
   }

   static showTasksError() {
      const concluidas = document.getElementById('detail-tarefas-concluidas');
      const pendentes = document.getElementById('detail-tarefas-pendentes');

      const errorHtml = `
         <li class="list-group-item text-center py-4 text-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Erro ao carregar tarefas
         </li>
      `;

      concluidas.innerHTML = errorHtml;
      pendentes.innerHTML = errorHtml;
   }

   static renderTasks(tarefas) {
      const concluidas = document.getElementById('detail-tarefas-concluidas');
      const pendentes = document.getElementById('detail-tarefas-pendentes');

      concluidas.innerHTML = '';
      pendentes.innerHTML = '';

      tarefas.forEach(tarefa => {
         const listItem = document.createElement('li');
         listItem.className = 'list-group-item d-flex align-items-center';

         const isCompleted = tarefa.status === 'Realizado';
         const icon = isCompleted
            ? '<i class="bi bi-check2-circle text-success me-2"></i>'
            : '<i class="bi bi-circle text-muted me-2"></i>';

         const dateInfo = tarefa.dataconclusao ?
            `<small class="text-muted ms-auto">${ApiUtils.formatDate(tarefa.dataconclusao)}</small>` : '';

         listItem.innerHTML = `${icon}${tarefa.descricao}${dateInfo}`;

         const targetList = isCompleted ? concluidas : pendentes;
         targetList.appendChild(listItem);
      });
   }
}

// ===== GERENCIADOR DE EXPORTAÇÃO =====
/**
 * Classe responsável por gerenciar exportações Excel/PDF com feedback visual
 */
class ExportManager {
      /**
    * Exporta dados para Excel (gerado no frontend)
    */
      static async exportToExcel() {
      const btn = document.querySelector('[data-export="excel"]');
      const originalText = btn.innerHTML;

      try {
         // Desabilita botão
         btn.disabled = true;
         btn.innerHTML = `
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Exportando...
         `;

         // Obtém dados filtrados da tabela (sem buscar tarefas filhas)
         const filteredData = this.getFilteredTableData();

         if (filteredData.length === 0) {
            NotificationManager.showToast('Nenhum dado para exportar. Aplique filtros ou verifique se há dados na tabela.', 'warning');
            return;
         }

         // Gera Excel no frontend com dados filtrados
         this.generateExcelFile(filteredData);

         NotificationManager.showToast(`Excel gerado com sucesso! ${filteredData.length} item(ns) exportado(s)`, 'success');

      } catch (error) {
         console.error('Erro ao gerar Excel:', error);
         NotificationManager.showToast('Erro ao gerar Excel. Tente novamente.', 'error');
      } finally {
         // Restaura botão
         btn.disabled = false;
         btn.innerHTML = originalText;
      }
   }

      /**
    * Exporta dados para PDF (gerado no frontend)
    */
      static async exportToPDF() {
      const btn = document.querySelector('[data-export="pdf"]');
      const originalText = btn.innerHTML;

      try {
         // Desabilita botão
         btn.disabled = true;
         btn.innerHTML = `
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Exportando...
         `;

         // Obtém dados filtrados da tabela (sem buscar tarefas filhas)
         const filteredData = this.getFilteredTableData();

         if (filteredData.length === 0) {
            NotificationManager.showToast('Nenhum dado para exportar. Aplique filtros ou verifique se há dados na tabela.', 'warning');
            return;
         }

         // Gera PDF no frontend com dados filtrados
         this.generatePDFFile(filteredData);

         NotificationManager.showToast(`PDF gerado com sucesso! ${filteredData.length} item(ns) exportado(s)`, 'success');

      } catch (error) {
         console.error('Erro ao gerar PDF:', error);
         NotificationManager.showToast('Erro ao gerar PDF. Tente novamente.', 'error');
      } finally {
         // Restaura botão
         btn.disabled = false;
         btn.innerHTML = originalText;
      }
   }

      /**
    * Obtém dados filtrados da tabela (apenas dados visíveis)
    */
   static getFilteredTableData() {
      const tableManager = window.fluxoManager?.tableManager;
      if (!tableManager || !tableManager.dataTable) {
         console.warn('Tabela não inicializada, retornando dados originais');
         return window.fluxoManager?.data || [];
      }

      // Obtém dados filtrados da DataTable
      const filteredData = [];
      const dataTable = tableManager.dataTable;

      // Itera sobre todas as linhas visíveis (considerando paginação e filtros)
      dataTable.rows({ search: 'applied' }).every(function() {
         const rowData = this.data();
         filteredData.push(rowData);
      });

      console.log(`Exportando ${filteredData.length} itens filtrados de ${tableManager.data.length} total`);
      return filteredData;
   }

      /**
    * Gera arquivo Excel no frontend
    */
   static generateExcelFile(data) {
      // Usar SheetJS (XLSX) para gerar Excel no frontend
      if (typeof XLSX === 'undefined') {
         // Fallback: usar CSV se XLSX não estiver disponível
         this.generateCSVFile(data);
         return;
      }

      const workbook = XLSX.utils.book_new();

      // Preparar dados para Excel (apenas dados principais, sem tarefas)
      const excelData = data.map(item => ({
         'Situação': item.situacao,
         'Pedido': item.nomovtra,
         'Cliente': item.cliente || '',
         'Descrição Fluxo': item.descricaofluxo || '',
         'Posição': `${item.posicaofluxo}/${item.qtdetotalfluxo}`,
         '%': `${item.percentual}%`,
         'Container': item.container || '',
         'Tipo Frete': item.nomtipfre || '',
         'Tipo Carga': item.nomtipcarga || '',
         'Usuário Resp.': item.usuario_resp || '',
         'Início': item.datainiciofluxo ? new Date(item.datainiciofluxo).toLocaleDateString('pt-BR') : '',
         'Fim': item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '',
         'Processo': item.processo || '',
         'Placa CAV': item.placacav || '',
         'Placa CAR': item.placacar || '',
         'Placa CAR2': item.placacar2 || '',
         'Rota': item.rota || '',
         'Doc. Fiscal': item.docfiscal || '',
         'Nota C': item.notac || '',
         'Navio': item.navio || '',
         'Cliente Armador': item.nocli_arm || '',
         'Cliente Despachante': item.nocli_desp || '',
         'Cliente': item.nocli || '',
         'Usuário Agendador': item.usuario_agendador || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Ajustar largura das colunas
      const colWidths = [
         { wch: 12 }, // Situação
         { wch: 15 }, // Pedido
         { wch: 30 }, // Cliente
         { wch: 40 }, // Descrição
         { wch: 10 }, // Posição
         { wch: 8 },  // %
         { wch: 15 }, // Container
         { wch: 15 }, // Tipo Frete
         { wch: 15 }, // Tipo Carga
         { wch: 20 }, // Usuário Resp
         { wch: 12 }, // Início
         { wch: 12 }, // Fim
         { wch: 15 }, // Processo
         { wch: 12 }, // Placa CAV
         { wch: 12 }, // Placa CAR
         { wch: 12 }, // Placa CAR2
         { wch: 20 }, // Rota
         { wch: 15 }, // Doc Fiscal
         { wch: 12 }, // Nota C
         { wch: 20 }, // Navio
         { wch: 20 }, // Cliente Armador
         { wch: 20 }, // Cliente Despachante
         { wch: 15 }, // Cliente
         { wch: 20 }  // Usuário Agendador
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Fluxos Operacionais');

      // Gerar arquivo e fazer download
      const filename = `fluxo_operacional_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
   }

            /**
    * Gera arquivo PDF no frontend com design profissional
    */
   static generatePDFFile(data) {
      try {
         // Tentar diferentes formas de acessar jsPDF
         const jsPDF = window.jspdf?.jsPDF || window.jsPDF || window.jsPdf;

         if (!jsPDF) {
            NotificationManager.showToast('Biblioteca jsPDF não encontrada. Verifique se está incluída no HTML.', 'warning');
            console.error('jsPDF não encontrado. Objetos disponíveis:', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));
            return;
         }

         const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
         });

         // Configurações gerais
         const pageWidth = doc.internal.pageSize.width;
         const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
         let currentY = margin;

         // === CABEÇALHO PRINCIPAL ===
         this.createPDFHeader(doc, pageWidth, currentY);
         currentY = 50;

         // === INFORMAÇÕES DO RELATÓRIO ===
         currentY = this.addReportInfo(doc, data, margin, currentY);
         currentY += 15;

         // === DADOS DA TABELA ===
         this.createPDFTable(doc, data, margin, currentY, pageWidth, pageHeight);

         // === RODAPÉ ===
         this.addPDFFooter(doc, pageWidth, pageHeight, margin);

         // Salvar arquivo
         const filename = `fluxo_operacional_${new Date().toISOString().split('T')[0]}.pdf`;
         doc.save(filename);

      } catch (error) {
         console.error('Erro ao gerar PDF:', error);
         console.error('Stack trace:', error.stack);
         console.error('Tipo do erro:', error.name);
         console.error('Objetos PDF disponíveis no window:', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));

         NotificationManager.showToast(`Erro ao gerar PDF: ${error.message}. Verifique o console para mais detalhes.`, 'error');
      }
   }

   /**
    * Cria o cabeçalho principal do PDF
    */
   static createPDFHeader(doc, pageWidth, startY) {
      // Obter cor da empresa ou usar verde como fallback
      const companyColor = this.getCompanyColor();

         // Fundo do cabeçalho
      doc.setFillColor(...companyColor);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Título principal - melhor espaçamento
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO DE FLUXOS OPERACIONAIS', pageWidth / 2, startY, { align: 'center' });

      // Subtítulo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      // doc.text('Sistema de Gestão Logística - MM Softwares', pageWidth / 2, startY + 20, { align: 'center' });

      // Data e hora de geração
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR');
         doc.setFontSize(10);
      doc.text(`Gerado em: ${dateStr} às ${timeStr}`, pageWidth / 2, startY + 32, { align: 'center' });
   }

   /**
    * Adiciona informações do relatório
    */
   static addReportInfo(doc, data, margin, currentY) {
         doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO DO RELATÓRIO', margin, currentY);

      currentY += 8;
         doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Estatísticas básicas
      const stats = this.calculateStats(data);

      // Fallback para símbolos simples se emojis não funcionarem
      doc.text(`Total de itens: ${data.length}`, margin, currentY);

      doc.setTextColor(220, 53, 69);
      doc.text(`Vencidos: ${stats.vencidos}`, margin + 70, currentY);

      doc.setTextColor(255, 193, 7);
      doc.text(`Em atenção: ${stats.atencao}`, margin + 140, currentY);

      doc.setTextColor(40, 167, 69);
      doc.text(`No prazo: ${stats.prazo}`, margin + 210, currentY);

      // Voltar para cor preta
      doc.setTextColor(0, 0, 0);

      return currentY;
   }

   /**
    * Calcula estatísticas dos dados
    */
   static calculateStats(data) {
      return data.reduce((stats, item) => {
         switch (item.situacao) {
            case 'Vencida':
               stats.vencidos++;
               break;
            case 'Em atenção':
               stats.atencao++;
               break;
            case 'No prazo':
               stats.prazo++;
               break;
         }
         return stats;
      }, { vencidos: 0, atencao: 0, prazo: 0 });
   }

      /**
    * Cria a tabela principal do PDF com quebra de linha automática
    */
   static createPDFTable(doc, data, margin, startY, pageWidth, pageHeight) {
      const headers = [
         'Situação', 'Pedido', 'Cliente', 'Descrição', 'Posição', '%',
         'Container', 'Tipo Frete', 'Usuário Resp.'
      ];

      // Calcular larguras automáticas com prioridade para campos importantes
      const colWidths = this.calculateOptimalColumnWidths(doc, headers, data, pageWidth, margin);
      let currentY = startY;

      // === CABEÇALHO DA TABELA ===
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);

      // Desenhar fundo do cabeçalho - altura maior
      const headerHeight = 12;
      doc.rect(margin, currentY, pageWidth - (margin * 2), headerHeight, 'FD');

      // Desenhar bordas das células do cabeçalho
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      let headerX = margin;
      colWidths.forEach((width, idx) => {
         doc.rect(headerX, currentY, width, headerHeight, 'D');
         headerX += width;
      });

      // Texto do cabeçalho
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9); // Fonte menor para cabeçalho também
      doc.setFont('helvetica', 'bold');

      let currentX = margin;
      headers.forEach((header, index) => {
         const cellWidth = colWidths[index];
         const textWidth = doc.getTextWidth(header);

         // Centralizar texto horizontalmente e verticalmente
         const textX = currentX + (cellWidth - textWidth) / 2;
         const textY = currentY + headerHeight / 2 + 2;

         doc.text(header, textX, textY);
         currentX += cellWidth;
      });

      currentY += headerHeight + 2;

      // === DADOS DA TABELA ===
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8); // Fonte menor para caber mais conteúdo
      const baseRowHeight = 10; // Altura fixa das linhas (sem espaço extra)

      data.forEach((item, index) => {
         // Preparar dados da linha (removeu data início)
         const rowData = [
            item.situacao || '',
            item.nomovtra?.toString() || '',
            item.cliente || '',
            item.descricaofluxo || '',
            `${item.posicaofluxo}/${item.qtdetotalfluxo}`,
            `${item.percentual}%`, // Mostra numero% completo
            item.container || '',
            item.nomtipfre || '',
            item.usuario_resp || ''
         ];

         // Calcular altura necessária para esta linha com quebra de texto
         const rowHeight = this.calculateRowHeight(doc, rowData, colWidths, baseRowHeight);

         // Verificar nova página
         if (currentY + rowHeight > pageHeight - 30) {
            doc.addPage();
            currentY = margin + 20;

            // Repetir cabeçalho na nova página
            this.drawTableHeader(doc, headers, colWidths, margin, currentY, pageWidth);
            currentY += headerHeight + 2;
         }

         // Cor de fundo alternada
         if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
         } else {
            doc.setFillColor(255, 255, 255);
         }

         // Desenhar fundo da linha
         doc.rect(margin, currentY, pageWidth - (margin * 2), rowHeight, 'F');

         // Desenhar bordas das células
         doc.setDrawColor(220, 220, 220);
         doc.setLineWidth(0.1);
         let cellX = margin;
         colWidths.forEach((width, idx) => {
            doc.rect(cellX, currentY, width, rowHeight, 'D');
            cellX += width;
         });

                  // Desenhar conteúdo das células com centralização vertical
         currentX = margin;
         rowData.forEach((text, colIndex) => {
            const cellWidth = colWidths[colIndex];
            const availableTextWidth = cellWidth - 4; // 2mm padding de cada lado

            // Configurar fonte e cor baseada na coluna
            if (colIndex === 0) {
               // Situação: colorida e negrito
               const statusColor = this.getStatusColor(item.situacao);
               doc.setTextColor(...statusColor);
               doc.setFont('helvetica', 'bold');
               doc.setFontSize(8);
            } else if (colIndex === 6) {
               // Container: fonte ainda menor para garantir que apareça completo
               doc.setTextColor(0, 0, 0);
               doc.setFont('helvetica', 'normal');
               doc.setFontSize(7); // Fonte menor para container
            } else {
               // Outras colunas: fonte padrão
               doc.setTextColor(0, 0, 0);
               doc.setFont('helvetica', 'normal');
               doc.setFontSize(8);
            }

            // Tratamento especial por tipo de coluna
            let lines;
            if (colIndex === 2) {
               // Cliente: truncar em uma linha sem quebra
               lines = [this.truncateTextToFit(doc, text.toString(), availableTextWidth)];
            } else if (colIndex === 6) {
               // Container: NUNCA quebrar, sempre mostrar completo
               const fullText = text.toString();
               // Tenta com fonte 7, se não couber, diminui mais
               if (doc.getTextWidth(fullText) > availableTextWidth) {
                  doc.setFontSize(6);
                  if (doc.getTextWidth(fullText) > availableTextWidth) {
                     doc.setFontSize(5);
                  }
               }
               lines = [fullText]; // Sempre mostra o container completo
            } else {
               // Outras colunas: quebrar texto normalmente
               lines = this.wrapText(doc, text.toString(), availableTextWidth);
            }

            // Calcular posição Y para centralização vertical
            const totalTextHeight = lines.length * 3; // 3mm por linha
            const startY = currentY + (rowHeight - totalTextHeight) / 2 + 3; // Centralizado verticalmente

            // Desenhar cada linha do texto
            lines.forEach((line, lineIndex) => {
               const lineY = startY + (lineIndex * 3);

               // Centralizar horizontalmente
               const textWidth = doc.getTextWidth(line);
               const textX = currentX + (cellWidth - textWidth) / 2;

               doc.text(line, textX, lineY);
            });

            currentX += cellWidth;
         });

         currentY += rowHeight; // SEM espaço extra entre linhas
      });
   }

   /**
    * Desenha cabeçalho da tabela (para páginas adicionais)
    */
      static drawTableHeader(doc, headers, colWidths, margin, currentY, pageWidth) {
      const headerHeight = 12;

      doc.setFillColor(240, 240, 240);
         doc.setDrawColor(200, 200, 200);
      doc.rect(margin, currentY, pageWidth - (margin * 2), headerHeight, 'FD');

      // Desenhar bordas das células do cabeçalho
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      let headerX = margin;
      colWidths.forEach((width, idx) => {
         doc.rect(headerX, currentY, width, headerHeight, 'D');
         headerX += width;
      });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9); // Fonte menor para cabeçalho
      doc.setFont('helvetica', 'bold');

      let currentX = margin;
      headers.forEach((header, index) => {
         const cellWidth = colWidths[index];
         const textWidth = doc.getTextWidth(header);

         // Centralizar texto horizontalmente e verticalmente
         const textX = currentX + (cellWidth - textWidth) / 2;
         const textY = currentY + headerHeight / 2 + 2;

         doc.text(header, textX, textY);
         currentX += cellWidth;
      });
   }

   /**
    * Adiciona rodapé ao PDF
    */
   static addPDFFooter(doc, pageWidth, pageHeight, margin) {
      const totalPages = doc.internal.getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
         doc.setPage(i);

         // Linha separadora
         doc.setDrawColor(200, 200, 200);
         doc.setLineWidth(0.5);
         doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

         // Informações do rodapé
         doc.setTextColor(100, 100, 100);
         doc.setFontSize(8);
         doc.setFont('helvetica', 'normal');

         // Esquerda: Info da empresa
         doc.text('MM Softwares - Sistema de Gestão Logística', margin, pageHeight - 8);

         // Centro: Data
         const now = new Date();
         doc.text(`Relatório gerado em ${now.toLocaleDateString('pt-BR')}`, pageWidth / 2, pageHeight - 8, { align: 'center' });

         // Direita: Numeração
         doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      }
   }

   /**
    * Retorna cor RGB baseada na situação
    */
   static getStatusColor(situacao) {
      switch (situacao) {
         case 'Vencida':
            return [220, 53, 69]; // Vermelho
         case 'Em atenção':
            return [255, 152, 0]; // Laranja
         case 'No prazo':
            return [76, 175, 80]; // Verde
         default:
            return [0, 0, 0]; // Preto
      }
   }

   /**
    * Calcular larguras ótimas das colunas baseadas no conteúdo com prioridade para campos importantes
    */
      static calculateOptimalColumnWidths(doc, headers, data, pageWidth, margin) {
      const availableWidth = pageWidth - (margin * 2);

      // Larguras mínimas fixas para garantir legibilidade (removeu data início)
      const minWidths = [
         15,  // Situação
         15,  // Pedido
         30,  // Cliente - Reduzido para truncar com ...
         50,  // Descrição - MUITO IMPORTANTE (mais espaço)
         12,  // Posição
         8,   // %
         20,  // Container - Aumentado para não quebrar
         25,  // Tipo Frete
         25   // Usuário Resp
      ];

      // Prioridades para distribuição de espaço extra (maior = mais importante)
      const priorities = [2, 2, 3, 6, 1, 1, 3, 4, 3];

      // Calcular largura total das colunas mínimas
      const totalMinWidth = minWidths.reduce((sum, width) => sum + width, 0);

      // Se há espaço extra, distribuir proporcionalmente às prioridades
      if (totalMinWidth < availableWidth) {
         const extraSpace = availableWidth - totalMinWidth;
         const totalPriority = priorities.reduce((sum, p) => sum + p, 0);

         return minWidths.map((minWidth, index) => {
            const extraForColumn = (extraSpace * priorities[index]) / totalPriority;
            return minWidth + extraForColumn;
         });
      }

      // Se não cabe nem o mínimo, usar proporções das prioridades
      const totalPriority = priorities.reduce((sum, p) => sum + p, 0);
      return priorities.map(priority => (availableWidth * priority) / totalPriority);
   }

   /**
    * Quebra texto em múltiplas linhas para caber na largura disponível
    */
   static wrapText(doc, text, maxWidth) {
      if (!text || text.trim() === '') return [''];

      const words = text.trim().split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
         const testLine = currentLine ? `${currentLine} ${word}` : word;
         const testWidth = doc.getTextWidth(testLine);

         if (testWidth <= maxWidth) {
            currentLine = testLine;
         } else {
            // Se a linha atual não está vazia, salva ela
            if (currentLine) {
               lines.push(currentLine);
               currentLine = word;
            } else {
               // Palavra muito longa, trunca ela
               const truncated = this.truncateWordToFit(doc, word, maxWidth);
               lines.push(truncated);
               currentLine = '';
            }
         }
      }

      // Adiciona a última linha se não estiver vazia
      if (currentLine) {
         lines.push(currentLine);
      }

      // Limitar a 3 linhas por célula para não ficar muito alto
      return lines.slice(0, 3);
   }

      /**
    * Trunca uma palavra longa para caber na largura disponível
    */
   static truncateWordToFit(doc, word, maxWidth) {
      if (doc.getTextWidth(word) <= maxWidth) {
         return word;
      }

      const ellipsis = '...';
      const ellipsisWidth = doc.getTextWidth(ellipsis);

      for (let i = word.length - 1; i > 0; i--) {
         const truncated = word.substring(0, i) + ellipsis;
         if (doc.getTextWidth(truncated) <= maxWidth) {
            return truncated;
         }
      }

      return ellipsis;
   }

   /**
    * Trunca texto em uma linha para caber na largura disponível (sem quebra de linha)
    */
   static truncateTextToFit(doc, text, maxWidth) {
      if (!text) return '';

      const cleanText = text.toString().trim();
      if (doc.getTextWidth(cleanText) <= maxWidth) {
         return cleanText;
      }

      const ellipsis = '...';

      for (let i = cleanText.length - 1; i > 0; i--) {
         const truncated = cleanText.substring(0, i) + ellipsis;
         if (doc.getTextWidth(truncated) <= maxWidth) {
            return truncated;
         }
      }

      return ellipsis;
   }

      /**
    * Calcula a altura necessária para uma linha baseada no conteúdo com quebra de texto
    */
   static calculateRowHeight(doc, rowData, colWidths, baseHeight) {
      let maxLines = 1;

      rowData.forEach((text, colIndex) => {
         const cellWidth = colWidths[colIndex];
         const availableTextWidth = cellWidth - 4; // padding

         // Cliente (col 2) e Container (col 6) são sempre 1 linha
         if (colIndex === 2 || colIndex === 6) {
            maxLines = Math.max(maxLines, 1);
         } else {
            // Configurar fonte temporariamente para medição
            doc.setFontSize(8);
            const lines = this.wrapText(doc, text.toString(), availableTextWidth);
            maxLines = Math.max(maxLines, lines.length);
         }
      });

      // Altura mais compacta: 3mm por linha + mínimo padding
      return Math.max(baseHeight, maxLines * 3 + 4);
   }

   /**
    * Obtém a cor da empresa do localStorage ou usa verde como fallback
    */
   static getCompanyColor() {
      try {
         // Tentar obter cor da empresa do localStorage
         const companyData = localStorage.getItem('company');
         if (companyData) {
            const company = JSON.parse(companyData);
            if (company.primaryColor) {
               // Converter cor hex para RGB
               return this.hexToRgb(company.primaryColor);
            }
         }
      } catch (error) {
         console.warn('Erro ao obter cor da empresa:', error);
      }

      // Fallback: Verde profissional
      return [40, 167, 69]; // Verde Material Design
   }

   /**
    * Converte cor hex para RGB
    */
   static hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
         parseInt(result[1], 16),
         parseInt(result[2], 16),
         parseInt(result[3], 16)
      ] : [40, 167, 69]; // Fallback verde
   }

   /**
    * Ajusta texto para caber na largura disponível da célula
    */
   static fitTextToWidth(doc, text, maxWidth) {
      if (!text) return '';

      const originalText = text.toString().trim();
      let currentText = originalText;

      // Se o texto cabe, retornar como está
      if (doc.getTextWidth(currentText) <= maxWidth) {
         return currentText;
      }

      // Tentar reduzir a fonte primeiro (até um mínimo de 7pt)
      const originalSize = 9;
      for (let fontSize = originalSize; fontSize >= 7; fontSize -= 0.5) {
         doc.setFontSize(fontSize);
         if (doc.getTextWidth(originalText) <= maxWidth) {
            return originalText;
         }
      }

      // Se ainda não cabe, truncar com reticências
      doc.setFontSize(originalSize); // Voltar para tamanho original
      const ellipsis = '...';
      const ellipsisWidth = doc.getTextWidth(ellipsis);

      for (let i = originalText.length - 1; i > 0; i--) {
         const truncated = originalText.substring(0, i) + ellipsis;
         if (doc.getTextWidth(truncated) <= maxWidth) {
            return truncated;
         }
      }

      return ellipsis; // Caso extremo
   }

   /**
    * Trunca texto para caber na coluna com melhor formatação (legacy)
    */
   static truncateText(text, maxLength) {
      if (!text) return '';
      const str = text.toString().trim();
      return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
   }

   /**
    * Fallback: gera arquivo CSV se XLSX não estiver disponível
    */
   static generateCSVFile(data) {
      const headers = [
         'Situação', 'Pedido', 'Cliente', 'Descrição Fluxo', 'Posição', '%',
         'Container', 'Tipo Frete', 'Tipo Carga', 'Usuário Resp.', 'Início', 'Fim'
      ];

      const csvContent = [
         headers.join(','),
         ...data.map(item => [
            `"${item.situacao}"`,
            item.nomovtra,
            `"${item.cliente || ''}"`,
            `"${item.descricaofluxo || ''}"`,
            `${item.posicaofluxo}/${item.qtdetotalfluxo}`,
            `${item.percentual}%`,
            `"${item.container || ''}"`,
            `"${item.nomtipfre || ''}"`,
            `"${item.nomtipcarga || ''}"`,
            `"${item.usuario_resp || ''}"`,
            item.datainiciofluxo ? new Date(item.datainiciofluxo).toLocaleDateString('pt-BR') : '',
            item.data ? new Date(item.data).toLocaleDateString('pt-BR') : ''
         ].join(','))
      ].join('\n');

      // Criar blob e fazer download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `fluxo_operacional_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   }
}

// ===== GERENCIADOR DE NOTIFICAÇÕES =====
/**
 * Classe responsável por exibir notificações toast
 */
class NotificationManager {
   static showToast(message, type = 'info') {
      const container = document.querySelector('.toast-container');
      if (!container) return;

      const id = 'toast-' + Date.now();
      const bgClass = this.getBgClass(type);

      container.insertAdjacentHTML('beforeend', `
         <div id="${id}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
            <div class="d-flex">
               <div class="toast-body">${message}</div>
               <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
         </div>
      `);

      const toastElement = document.getElementById(id);
      const toast = new bootstrap.Toast(toastElement, {
         autohide: true,
         delay: 3000
      });
      toast.show();

      toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
   }

   static getBgClass(type) {
      const classes = {
         success: 'bg-success',
         error: 'bg-danger',
         warning: 'bg-warning',
         info: 'bg-info'
      };
      return classes[type] || 'bg-info';
   }
}

// ===== CLASSE PRINCIPAL DO SISTEMA =====
/**
 * Classe principal que coordena todo o sistema
 */
class FluxoOperacionalManager {
   constructor() {
      this.data = [];
      this.columnManager = new ColumnManager();
      this.filterManager = new FilterManager();
      this.tableManager = new TableManager(this.columnManager);
      this.isLoading = false;
   }

   async init() {
      // Verifica se a função Thefetch está disponível
      if (typeof Thefetch !== 'function') {
         console.error('❌ Função Thefetch não encontrada. Aguardando...');
         setTimeout(() => {
            if (typeof Thefetch === 'function') {
               this.init();
            } else {
               console.error('❌ Função Thefetch ainda não encontrada após delay');
               this.showError('Erro ao carregar sistema: Thefetch não disponível');
            }
         }, 1000);
         return;
      }

      this.showLoading(true);
      this.bindEvents();
      this.columnManager.renderColumnList();

      // Carrega dados e inicializa tabela
      await this.loadData();
   }

   async loadData() {
      try {
         if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            this.showError('Erro: Sistema de requisições não disponível');
            return;
         }

         this.showLoading(true);
         this.hideError();

         const data = await ApiUtils.getFluxoOperacional();

         // Filtrar apenas itens pendentes (percentual < 100) e processar dados
         this.data = data
            .filter(item => (item.percentual || 0) < 100)
            .map(item => this.processItemData(item));

         this.filterManager.updateData(this.data);
         this.tableManager.updateData(this.data);
         this.tableManager.initialize();
         this.updateTotalRecords(this.data.length);

         if (this.data.length === 0) {
            NotificationManager.showToast('Nenhum item pendente encontrado', 'info');
         } else {
            NotificationManager.showToast(`${this.data.length} item(ns) pendente(s) carregado(s)`, 'success');
         }

      } catch (error) {
         console.error('Erro ao carregar dados:', error);
         this.showError('Erro ao carregar dados do fluxo operacional');
      } finally {
         this.showLoading(false);
      }
   }

   processItemData(item) {
      const alertaSla = item.alerta_sla || 1;
      const percentual = item.percentual || 0;

      // Calcular situação baseada na lógica correta do ALERTA_SLA
      let situacao = '';
      let situacaoClass = '';
      let prioridade = 0; // Para ordenação: menor valor = maior prioridade

      if (percentual >= 100) {
         situacao = 'Concluída';
         situacaoClass = 'success';
         prioridade = 4;
      } else if (alertaSla === 3) {
         // SLA Crítico - prazo já passou
         situacao = 'Vencida';
         situacaoClass = 'danger';
         prioridade = 1; // Máxima prioridade
      } else if (alertaSla === 2) {
         // SLA em atenção - falta 10 minutos para estourar
         situacao = 'Em atenção';
         situacaoClass = 'warning';
         prioridade = 2;
      } else {
         // SLA Normal (alertaSla === 1) - dentro do prazo
         situacao = 'No prazo';
         situacaoClass = 'success';
         prioridade = 3;
      }

      return {
         ...item,
         situacao,
         situacao_class: situacaoClass,
         prioridade_ordenacao: prioridade
      };
   }

   showLoading(show) {
      const loading = document.getElementById('loading-indicator');
      const table = document.getElementById('table-container');

      if (loading) {
         loading.style.display = show ? 'block' : 'none';
      }
      if (table) {
         table.style.display = show ? 'none' : 'block';
      }

      this.isLoading = show;
   }

   showError(message) {
      const errorDiv = document.getElementById('error-message');
      const errorText = document.getElementById('error-text');

      if (errorDiv && errorText) {
         errorText.textContent = message;
         errorDiv.classList.remove('d-none');
      }
   }

   hideError() {
      const errorDiv = document.getElementById('error-message');
      if (errorDiv) {
         errorDiv.classList.add('d-none');
      }
   }

   updateTotalRecords(count) {
      const badge = document.getElementById('total-records');
      if (badge) {
         badge.textContent = `${count} registro${count !== 1 ? 's' : ''}`;
      }
   }

   bindEvents() {

      // Sidebar de filtros
      document.getElementById('btn-toggle-filters')?.addEventListener('click', () => {
         new bootstrap.Offcanvas(document.getElementById('filters-sidebar')).show();
      });

      // Modal de colunas
      document.getElementById('btn-column-settings')?.addEventListener('click', () => {
         new bootstrap.Modal(document.getElementById('modal-column-settings')).show();
      });

      // Filtros
      document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
         this.applyFilters();
      });

      document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
         this.clearFilters();
      });

      // Colunas
      document.getElementById('btn-save-columns')?.addEventListener('click', () => {
         this.saveColumnSettings();
      });

      document.getElementById('btn-reset-columns')?.addEventListener('click', () => {
         this.resetColumnSettings();
      });

      // Eventos de exportação
      document.querySelector('[data-export="excel"]')?.addEventListener('click', (e) => {
         e.preventDefault();
         ExportManager.exportToExcel();
      });

      document.querySelector('[data-export="pdf"]')?.addEventListener('click', (e) => {
         e.preventDefault();
         ExportManager.exportToPDF();
      });


   }

   async applyFilters() {
      const filters = this.filterManager.getFilterValues();
      this.tableManager.applyFilters(filters, this.columnManager);

      bootstrap.Offcanvas.getInstance(document.getElementById('filters-sidebar'))?.hide();

      const count = this.tableManager.getFilteredCount();
      this.filterManager.updateActiveFiltersCount();
      NotificationManager.showToast(`${count} item(ns) encontrado(s)`, 'success');
   }

   clearFilters() {
      this.filterManager.clearFilters();
      this.tableManager.dataTable?.search('').columns().search('').draw();
      NotificationManager.showToast('Filtros limpos', 'info');
   }

   saveColumnSettings() {
      this.columnManager.saveSettings();
      this.updateTable();
      bootstrap.Modal.getInstance(document.getElementById('modal-column-settings'))?.hide();
      NotificationManager.showToast('Configurações de colunas salvas!', 'success');
   }

   resetColumnSettings() {
      // Limpa TODAS as configurações salvas no localStorage
      localStorage.removeItem('fluxo-operacional-columns');
      localStorage.removeItem('fluxo-column-settings');

      // Restaura para o padrão original (sem configurações salvas)
      this.columnManager.resetToDefault();
      this.columnManager.renderColumnList();
      this.updateTable();

      NotificationManager.showToast('Configurações restauradas para o padrão original', 'success');
   }

   updateTable() {
      this.tableManager.rebuild();
   }

   async showDetails(nomovtra, nofluxoop) {
      await ModalManager.showDetails(nomovtra, nofluxoop);
   }

   updateTotalRecords(count) {
      const badge = document.getElementById('total-records');
      if (badge) {
         badge.textContent = `${count} registro${count !== 1 ? 's' : ''}`;
      }
   }

   async exportToExcel() {
      try {
         const filters = this.filterManager.getFilterValues();
         const blob = await ApiUtils.exportToExcel(filters);
         const filename = `fluxo_operacional_${new Date().toISOString().split('T')[0]}.xlsx`;
         ApiUtils.downloadBlob(blob, filename);
         NotificationManager.showToast('Exportação para Excel concluída!', 'success');
      } catch (error) {
         console.error('Erro ao exportar Excel:', error);
         NotificationManager.showToast('Erro ao exportar para Excel', 'error');
      }
   }

   async exportToPDF() {
      try {
         const filters = this.filterManager.getFilterValues();
         const blob = await ApiUtils.exportToPDF(filters);
         const filename = `fluxo_operacional_${new Date().toISOString().split('T')[0]}.pdf`;
         ApiUtils.downloadBlob(blob, filename);
         NotificationManager.showToast('Exportação para PDF concluída!', 'success');
      } catch (error) {
         console.error('Erro ao exportar PDF:', error);
         NotificationManager.showToast('Erro ao exportar para PDF', 'error');
      }
   }
}

// ===== INICIALIZAÇÃO DO SISTEMA =====
document.addEventListener('DOMContentLoaded', () => {

   window.fluxoManager = new FluxoOperacionalManager();
   fluxoManager.init();
});
