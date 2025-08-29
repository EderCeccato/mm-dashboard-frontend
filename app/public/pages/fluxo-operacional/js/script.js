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
    * Faz requisições HTTP usando Thefetch
    * @param {string} url - URL da API
    * @param {string} method - Método HTTP (GET, POST, etc.)
    * @param {Object} body - Corpo da requisição (opcional)
    * @returns {Promise} Resposta da API
    */
   static async request(url, method = 'GET', body = null) {
      try {
         const response = await Thefetch(url, method, body);
         return response;
      } catch (error) {
         console.error('Erro na requisição API:', error);
         throw error;
      }
   }

         /**
    * Busca dados do fluxo operacional
    * @returns {Promise<Array>} Lista de fluxos operacionais
    */
   static async getFluxoOperacional() {
      const url = `/api/fluxo-operacional`;
      const response = await this.request(url, 'GET');
      return response.data || [];
   }

   /**
    * Busca detalhes de um fluxo específico (tarefas)
    * @param {number} nomovtra - Número do movimento
    * @param {number} nofluxoop - Número do fluxo
    * @returns {Promise<Object>} Detalhes do fluxo
    */
   static async getFluxoDetails(nomovtra, nofluxoop) {
      const response = await this.request(`/api/fluxo-operacional/${nomovtra}/${nofluxoop}/details`, 'GET');
      return response.data || {};
   }

   /**
    * Exporta dados para Excel
    * @param {Object} filters - Filtros ativos
    * @returns {Promise<Blob>} Arquivo Excel
    */
   static async exportToExcel(filters = {}) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
         if (filters[key] && filters[key] !== '') {
            params.append(key, filters[key]);
         }
      });

      const queryString = params.toString();
      const url = `/api/fluxo-operacional/export/excel${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
         method: 'GET',
         headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
         }
      });

      if (!response.ok) {
         throw new Error('Erro ao exportar para Excel');
      }

      return await response.blob();
   }

   /**
    * Exporta dados para PDF
    * @param {Object} filters - Filtros ativos
    * @returns {Promise<Blob>} Arquivo PDF
    */
   static async exportToPDF(filters = {}) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
         if (filters[key] && filters[key] !== '') {
            params.append(key, filters[key]);
         }
      });

      const queryString = params.toString();
      const url = `/api/fluxo-operacional/export/pdf${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
         method: 'GET',
         headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
         }
      });

      if (!response.ok) {
         throw new Error('Erro ao exportar para PDF');
      }

      return await response.blob();
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
         { key: 'nomovtra', name: 'Movimento', visible: true, order: 1 },
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
      this.columns = [...this.defaultColumns];
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

         // Busca dados completos com modal de progresso
         const completeData = await this.getCompleteDataForExport();

         // Atualiza progresso para geração do arquivo
         this.updateProgress(completeData.length, completeData.length, 'Gerando arquivo Excel...');

         // Pequeno delay para mostrar a mensagem
         await new Promise(resolve => setTimeout(resolve, 500));

         // Gera Excel no frontend
         this.generateExcelFile(completeData);

         // Fecha modal de progresso
         this.closeProgressModal();

         NotificationManager.showToast('Excel gerado com sucesso!', 'success');

      } catch (error) {
         console.error('Erro ao gerar Excel:', error);
         this.closeProgressModal();
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

         // Busca dados completos com modal de progresso
         const completeData = await this.getCompleteDataForExport();

         // Atualiza progresso para geração do arquivo
         this.updateProgress(completeData.length, completeData.length, 'Gerando arquivo PDF...');

         // Pequeno delay para mostrar a mensagem
         await new Promise(resolve => setTimeout(resolve, 500));

         // Gera PDF no frontend
         this.generatePDFFile(completeData);

         // Fecha modal de progresso
         this.closeProgressModal();

         NotificationManager.showToast('PDF gerado com sucesso!', 'success');

      } catch (error) {
         console.error('Erro ao gerar PDF:', error);
         this.closeProgressModal();
         NotificationManager.showToast('Erro ao gerar PDF. Tente novamente.', 'error');
      } finally {
         // Restaura botão
         btn.disabled = false;
         btn.innerHTML = originalText;
      }
   }

      /**
    * Busca dados completos para exportação (OTIMIZADO - requisições paralelas)
    */
   static async getCompleteDataForExport() {
      const mainData = window.fluxoManager.data || [];
      const totalItems = mainData.length;

      // Criar modal de progresso
      this.createProgressModal();
      this.updateProgress(0, totalItems, 'Iniciando exportação...');

      // Processar em lotes paralelos para ser mais rápido
      const BATCH_SIZE = 20; // 20 requisições simultâneas
      const completeData = [];

      for (let i = 0; i < mainData.length; i += BATCH_SIZE) {
         const batch = mainData.slice(i, i + BATCH_SIZE);

         // Processa lote em paralelo
         const batchPromises = batch.map(async (item) => {
            try {
               const details = await ApiUtils.getFluxoDetails(item.nomovtra, item.nofluxoop);
               return {
                  ...item,
                  tarefas: details.tarefas || []
               };
            } catch (error) {
               console.warn(`Erro ao buscar tarefas do fluxo ${item.nomovtra}:`, error);
               return {
                  ...item,
                  tarefas: []
               };
            }
         });

         // Aguarda o lote completar
         const batchResults = await Promise.all(batchPromises);
         completeData.push(...batchResults);

         // Atualiza progresso
         const progress = Math.min(i + BATCH_SIZE, totalItems);
         const percentage = Math.round((progress / totalItems) * 100);
         this.updateProgress(progress, totalItems, `Processando dados... ${percentage}%`);
      }

      this.updateProgress(totalItems, totalItems, 'Dados coletados! Gerando arquivo...');

      return completeData;
   }

   /**
    * Cria modal de progresso para exportação
    */
   static createProgressModal() {
      // Remove modal existente se houver
      const existingModal = document.getElementById('export-progress-modal');
      if (existingModal) {
         existingModal.remove();
      }

      const modalHtml = `
         <div class="modal fade" id="export-progress-modal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered">
               <div class="modal-content">
                  <div class="modal-header">
                     <h5 class="modal-title">
                        <i class="bi bi-download me-2"></i>
                        Exportando Dados
                     </h5>
                  </div>
                  <div class="modal-body text-center">
                     <div class="mb-3">
                        <div class="spinner-border text-primary me-2" role="status"></div>
                        <span id="progress-message">Preparando exportação...</span>
                     </div>

                     <div class="progress mb-3" style="height: 20px;">
                        <div id="progress-bar" class="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                             role="progressbar" style="width: 0%">
                           <span id="progress-text">0%</span>
                        </div>
                     </div>

                     <small class="text-muted" id="progress-details">
                        Processados: <span id="progress-current">0</span> de <span id="progress-total">0</span> itens
                     </small>
                  </div>
               </div>
            </div>
         </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      // Mostra o modal
      const modal = new bootstrap.Modal(document.getElementById('export-progress-modal'));
      modal.show();
   }

   /**
    * Atualiza progresso da exportação
    */
   static updateProgress(current, total, message) {
      const percentage = Math.round((current / total) * 100);

      document.getElementById('progress-message').textContent = message;
      document.getElementById('progress-bar').style.width = `${percentage}%`;
      document.getElementById('progress-text').textContent = `${percentage}%`;
      document.getElementById('progress-current').textContent = current;
      document.getElementById('progress-total').textContent = total;
   }

   /**
    * Fecha modal de progresso
    */
   static closeProgressModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('export-progress-modal'));
      if (modal) {
         modal.hide();
         setTimeout(() => {
            document.getElementById('export-progress-modal')?.remove();
         }, 300);
      }
   }

      /**
    * Gera arquivo Excel no frontend
    */
   static generateExcelFile(data) {
      const workbook = XLSX.utils.book_new();
      const rows = [];

      // Cabeçalho
      rows.push([
         'Situação', 'Pedido', 'Cliente', 'Descrição Fluxo', 'Posição',
         '%', 'Container', 'Tipo Frete', 'Tipo Carga', 'Rota',
         'Usuário Resp.', 'Início', 'Fim', 'Tarefa', 'Status Tarefa', 'Data Conclusão'
      ]);

      // Dados com estrutura pai/filho
      data.forEach(fluxo => {
         if (fluxo.tarefas && fluxo.tarefas.length > 0) {
            // Para cada tarefa, cria uma linha com dados do fluxo + tarefa
            fluxo.tarefas.forEach(tarefa => {
               rows.push([
                  fluxo.situacao,
                  fluxo.nomovtra,
                  fluxo.cliente || '',
                  fluxo.descricaofluxo || '',
                  `${fluxo.posicaofluxo}/${fluxo.qtdetotalfluxo}`,
                  fluxo.percentual + '%',
                  fluxo.container || '',
                  fluxo.nomtipfre || '',
                  fluxo.nomtipcarga || '',
                  fluxo.rota || '',
                  fluxo.usuario_resp || '',
                  ApiUtils.formatDate(fluxo.datainiciofluxo),
                  ApiUtils.formatDate(fluxo.data),
                  tarefa.descricao || '',
                  tarefa.status || '',
                  tarefa.dataconclusao ? ApiUtils.formatDate(tarefa.dataconclusao) : ''
               ]);
            });
         } else {
            // Fluxo sem tarefas
            rows.push([
               fluxo.situacao,
               fluxo.nomovtra,
               fluxo.cliente || '',
               fluxo.descricaofluxo || '',
               `${fluxo.posicaofluxo}/${fluxo.qtdetotalfluxo}`,
               fluxo.percentual + '%',
               fluxo.container || '',
               fluxo.nomtipfre || '',
               fluxo.nomtipcarga || '',
               fluxo.rota || '',
               fluxo.usuario_resp || '',
               ApiUtils.formatDate(fluxo.datainiciofluxo),
               ApiUtils.formatDate(fluxo.data),
               '', '', ''
            ]);
         }
      });

      // Criar worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(rows);

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
         { wch: 15 }, // Rota
         { wch: 20 }, // Usuário
         { wch: 12 }, // Início
         { wch: 12 }, // Fim
         { wch: 40 }, // Tarefa
         { wch: 15 }, // Status Tarefa
         { wch: 12 }  // Data Conclusão
      ];
      worksheet['!cols'] = colWidths;

      // Adicionar ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Fluxos Operacionais');

      // Gerar arquivo e fazer download
      const fileName = `fluxo-operacional-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
   }

            /**
    * Gera arquivo PDF profissional e limpo
    */
   static generatePDFFile(data) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Configurações
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Cabeçalho simples e profissional
      doc.setFillColor(54, 69, 79); // Azul escuro profissional
      doc.rect(0, 0, pageWidth, 30, 'F');

      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('RELATORIO DE FLUXOS OPERACIONAIS', margin, 20);

      // Informações do cabeçalho
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      yPosition = 40;
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition);
      doc.text(`Total de fluxos: ${data.length}`, pageWidth - margin - 40, yPosition);

      yPosition = 55;

      // Para cada fluxo
      data.forEach((fluxo, index) => {
         // Verificar se precisa de nova página
         if (yPosition > pageHeight - 70) {
            doc.addPage();
            yPosition = margin;
         }

                  // Cabeçalho do fluxo
         const situacaoColor = this.getSituacaoColorBySLA(fluxo.alerta_sla);

         // Linha colorida do status baseada no SLA numérico
         doc.setFillColor(...situacaoColor);
         doc.rect(margin, yPosition, 5, 20, 'F');

         // Fundo do cabeçalho
         doc.setFillColor(248, 249, 250);
         doc.rect(margin + 5, yPosition, pageWidth - (margin * 2) - 5, 20, 'F');
         doc.setDrawColor(220, 220, 220);
         doc.rect(margin + 5, yPosition, pageWidth - (margin * 2) - 5, 20, 'S');

         // Texto do cabeçalho
         doc.setFontSize(12);
         doc.setFont(undefined, 'bold');
         doc.setTextColor(0, 0, 0);
         doc.text(`FLUXO ${index + 1}: ${fluxo.nomovtra}`, margin + 10, yPosition + 8);

         doc.setFontSize(10);
         doc.setFont(undefined, 'normal');
         doc.text(`Cliente: ${fluxo.cliente || 'Nao informado'}`, margin + 10, yPosition + 16);

         yPosition += 25;

         // Informações principais em duas colunas
         const colWidth = (pageWidth - (margin * 2) - 5) / 2;

         // Coluna esquerda
         doc.setFontSize(9);
         doc.setFont(undefined, 'bold');
         doc.text('Situacao:', margin + 5, yPosition);
         doc.setFont(undefined, 'normal');
         doc.text(fluxo.situacao, margin + 25, yPosition);

         doc.setFont(undefined, 'bold');
         doc.text('Progresso:', margin + 5, yPosition + 6);
         doc.setFont(undefined, 'normal');
         doc.text(`${fluxo.posicaofluxo}/${fluxo.qtdetotalfluxo} (${fluxo.percentual}%)`, margin + 30, yPosition + 6);

         // Coluna direita
         doc.setFont(undefined, 'bold');
         doc.text('Usuario:', margin + colWidth + 10, yPosition);
         doc.setFont(undefined, 'normal');
         const usuario = fluxo.usuario_resp || 'Nao informado';
         doc.text(usuario.substring(0, 25), margin + colWidth + 25, yPosition);

         doc.setFont(undefined, 'bold');
         doc.text('Periodo:', margin + colWidth + 10, yPosition + 6);
         doc.setFont(undefined, 'normal');
         const inicio = ApiUtils.formatDate(fluxo.datainiciofluxo);
         const fim = ApiUtils.formatDate(fluxo.data);
         doc.text(`${inicio} - ${fim}`, margin + colWidth + 25, yPosition + 6);

         yPosition += 15;

         // Descrição se houver
         if (fluxo.descricaofluxo) {
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.text('Descricao:', margin + 5, yPosition);
            doc.setFont(undefined, 'normal');

            const descricao = fluxo.descricaofluxo.substring(0, 100);
            const maxWidth = pageWidth - (margin * 2) - 30;
            const splitDesc = doc.splitTextToSize(descricao, maxWidth);
            doc.text(splitDesc, margin + 25, yPosition);
            yPosition += Math.max(5, splitDesc.length * 3);
         }

         yPosition += 5;

         // Tarefas
         if (fluxo.tarefas && fluxo.tarefas.length > 0) {
            // Cabeçalho das tarefas
            doc.setFillColor(235, 235, 235);
            doc.rect(margin + 10, yPosition, pageWidth - (margin * 2) - 20, 8, 'F');

            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`TAREFAS (${fluxo.tarefas.length})`, margin + 15, yPosition + 6);

            yPosition += 12;

            // Lista de tarefas
            fluxo.tarefas.forEach((tarefa) => {
               if (yPosition > pageHeight - 25) {
                  doc.addPage();
                  yPosition = margin;
               }

               const isCompleted = tarefa.status === 'Realizado';
               const statusIcon = isCompleted ? '[OK]' : '[ ]';

               // Linha da tarefa
               doc.setFontSize(8);
               doc.setFont(undefined, 'normal');
               doc.setTextColor(isCompleted ? 0 : 100, isCompleted ? 100 : 100, isCompleted ? 0 : 100);
               doc.text(statusIcon, margin + 15, yPosition);

               doc.setTextColor(0, 0, 0);
               const taskText = tarefa.descricao || 'Tarefa sem descricao';
               const maxTaskWidth = pageWidth - (margin * 2) - 40;
               const splitTask = doc.splitTextToSize(taskText.substring(0, 80), maxTaskWidth);
               doc.text(splitTask, margin + 25, yPosition);

               yPosition += Math.max(5, splitTask.length * 3);

               // Data de conclusão
               if (tarefa.dataconclusao) {
                  doc.setFontSize(7);
                  doc.setTextColor(100, 100, 100);
                  doc.text(`Concluido: ${ApiUtils.formatDate(tarefa.dataconclusao)}`, margin + 25, yPosition);
                  yPosition += 4;
               }

               yPosition += 2;
            });
         } else {
            doc.setFontSize(8);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('Nenhuma tarefa encontrada', margin + 15, yPosition);
            yPosition += 8;
         }

         // Linha separadora
         doc.setDrawColor(200, 200, 200);
         doc.line(margin, yPosition + 5, pageWidth - margin, yPosition + 5);
         yPosition += 15;
      });

      // Rodapé simples
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
         doc.setPage(i);
         doc.setFontSize(8);
         doc.setTextColor(100, 100, 100);
         doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
         doc.text('MM Softwares - Software para transportadoras, armazéns e depots', margin, pageHeight - 10);
      }

      // Salvar PDF
      const fileName = `fluxo-operacional-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
   }

   /**
    * Retorna cores para o PDF baseada na lógica correta do SLA
    */
   static getSituacaoColorRGB(situacao) {
      switch (situacao) {
         case 'Vencida': return [220, 53, 69];    // Vermelho - SLA Crítico (3)
         case 'Em atenção': return [255, 193, 7]; // Amarelo - SLA Atenção (2)
         case 'No prazo': return [40, 167, 69];   // Verde - SLA Normal (1)
         default: return [108, 117, 125];         // Cinza - Outros casos
      }
   }

   /**
    * Retorna cores baseada diretamente no valor numérico do ALERTA_SLA
    */
   static getSituacaoColorBySLA(alertaSla) {
      switch (alertaSla) {
         case 3: return [220, 53, 69];   // Vermelho - SLA Crítico (prazo passou)
         case 2: return [255, 193, 7];   // Amarelo - SLA Atenção (falta 10 min)
         case 1: return [40, 167, 69];   // Verde - SLA Normal (dentro do prazo)
         default: return [108, 117, 125]; // Cinza - Valor inválido
      }
   }

   /**
    * Retorna cor RGB para a situação (baseada na lógica correta do SLA)
    */
   static getSituacaoColor(situacao) {
      switch (situacao) {
         case 'Vencida': return [220, 53, 69];   // Vermelho - SLA Crítico (3)
         case 'Em atenção': return [255, 193, 7]; // Amarelo - SLA Atenção (2)
         case 'No prazo': return [40, 167, 69];   // Verde - SLA Normal (1)
         default: return [108, 117, 125];         // Cinza - Outros casos
      }
   }

   /**
    * Retorna emoji para a situação
    */
   static getSituacaoEmoji(situacao) {
      switch (situacao) {
         case 'Vencida': return '🚨';
         case 'Em atenção': return '⚠️';
         case 'No prazo': return '✅';
         default: return '📋';
      }
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
      this.columnManager.resetToDefault();
      this.columnManager.renderColumnList();
      this.updateTable();
      NotificationManager.showToast('Configurações restauradas para o padrão', 'info');
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
   console.log('🚀 Iniciando Fluxo Operacional...');
   console.log('🔍 Verificando Thefetch:', typeof Thefetch);

   window.fluxoManager = new FluxoOperacionalManager();
   fluxoManager.init();
});
