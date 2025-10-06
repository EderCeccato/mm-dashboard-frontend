/**
 * Gestão de Estoque - Sistema completo de gerenciamento de estoque
 * Integrado com backend Firebird via API REST
 * MM Softwares - Versão Integrada
 */

// ===== CLASSE DE UTILITÁRIOS E API =====
/**
 * Classe responsável por gerenciar comunicação com API e operações utilitárias
 */
class ApiUtils {
   /**
    * Busca dados do estoque
    * @returns {Promise<Array>} Lista de estoque
    */
   static async getGestaoEstoque() {
      const response = await Thefetch('/api/gestao-estoque', 'GET');
      return response.data || [];
   }

   /**
    * Formata data ISO para formato brasileiro com horário
    * @param {string} dateISO - Data em formato ISO
    * @returns {string} Data formatada (dd/mm/aaaa)
    */
   static formatDate(dateISO) {
      if (!dateISO) return '-';
      const date = new Date(dateISO);
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
   }

   /**
    * Formata valores monetários
    * @param {number} value - Valor numérico
    * @returns {string} Valor formatado em moeda brasileira
    */
   static formatCurrency(value) {
      if (value === null || value === undefined || isNaN(value)) {
         return 'R$ 0,00';
      }
      return new Intl.NumberFormat('pt-BR', {
         style: 'currency',
         currency: 'BRL'
      }).format(value);
   }

   /**
    * Formata números com decimais
    * @param {number} value - Valor numérico
    * @param {number} decimals - Número de casas decimais
    * @returns {string} Número formatado
    */
   static formatNumber(value, decimals = 2) {
      if (value === null || value === undefined || isNaN(value)) {
         return '0' + (decimals > 0 ? ',00' : '');
      }
      return new Intl.NumberFormat('pt-BR', {
         minimumFractionDigits: decimals,
         maximumFractionDigits: decimals
      }).format(value);
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
      // Configuração das colunas baseada nos dados reais do estoque
      this.defaultColumns = [
         // Colunas visíveis por padrão
         { key: 'nomarm', name: 'Armazém', visible: true, order: 0, className: 'col-armazem' },
         { key: 'nompro', name: 'Produto', visible: true, order: 1, className: 'col-produto' },
         { key: 'lote', name: 'Lote', visible: true, order: 2, className: 'col-lote' },
         { key: 'refcli', name: 'Ref Cliente', visible: true, order: 3, className: 'col-refcli' },
         { key: 'vlrunitnf', name: 'Vlr Unit NF', visible: true, order: 4, className: 'col-vlrunitnf currency-cell' },
         { key: 'nonf', name: 'N° NF', visible: true, order: 5, className: 'col-nonf' },
         { key: 'container', name: 'Container', visible: true, order: 6, className: 'col-container' },
         { key: 'disponivel', name: 'Disponível', visible: true, order: 7, className: 'col-disponivel quantity-cell' },
         { key: 'pesoliqdisp', name: 'Peso Líquido Disponível', visible: true, order: 8, className: 'col-pesoliqdisp number-cell' },

         // Colunas inicialmente ocultas
         { key: 'nopro', name: 'Código Produto', visible: false, order: 9, className: 'col-nopro' },
         { key: 'noarm', name: 'Código Armazém', visible: false, order: 10, className: 'col-noarm' },
         { key: 'noos', name: 'N° OS', visible: false, order: 11, className: 'col-noos' },
         { key: 'item', name: 'Item', visible: false, order: 12, className: 'col-item' },
         { key: 'nocli', name: 'N° Cliente', visible: false, order: 13, className: 'col-nocli' },
         { key: 'codcli', name: 'Código Cliente', visible: false, order: 14, className: 'col-codcli' },
         { key: 'vlwunit', name: 'Vlr Unit', visible: false, order: 15, className: 'col-vlwunit currency-cell' },
         { key: 'kg_ent', name: 'KG Entrada', visible: false, order: 16, className: 'col-kgent number-cell' },
         { key: 'pesocx', name: 'Peso CX', visible: false, order: 17, className: 'col-pesocx number-cell' },
         { key: 'pesoliq', name: 'Peso Líquido', visible: false, order: 18, className: 'col-pesoliq number-cell' },
         { key: 'kg_entliq', name: 'KG Entrada Líquido', visible: false, order: 19, className: 'col-kgentliq number-cell' },
         { key: 'nomun', name: 'Unidade', visible: false, order: 20, className: 'col-nomun' },
         { key: 'datavalidade', name: 'Data Validade', visible: false, order: 21, className: 'col-datavalidade' },
         { key: 'nomcli', name: 'Nome Cliente', visible: false, order: 22, className: 'col-nomcli' },
         { key: 'datamov', name: 'Data Movimento', visible: false, order: 23, className: 'col-datamov' },
         { key: 'fatorconv', name: 'Fator Conversão', visible: false, order: 24, className: 'col-fatorconv number-cell' },
         { key: 'qtdereserv', name: 'Qtde Reservada', visible: false, order: 25, className: 'col-qtdereserv quantity-cell' },
         { key: 'pesobrdisp', name: 'Peso Bruto Disponível', visible: false, order: 26, className: 'col-pesobrdisp number-cell' },
         { key: 'vlrmerc', name: 'Vlr Mercadoria', visible: false, order: 27, className: 'col-vlrmerc currency-cell' },
         { key: 'qtde', name: 'Quantidade', visible: false, order: 28, className: 'col-qtde quantity-cell' },
         { key: 'padraofc', name: 'Padrão FC', visible: false, order: 29, className: 'col-padraofc' },
         { key: 'padraofcdescr', name: 'Padrão FC Descrição', visible: false, order: 30, className: 'col-padraofcdescr' },
         { key: 'metros', name: 'Metros', visible: false, order: 31, className: 'col-metros number-cell' }
      ];

      this.columns = this.loadSettings();
      this.sortable = null;
   }

   loadSettings() {
      const saved = localStorage.getItem('estoque-column-settings');
      return saved ? JSON.parse(saved) : [...this.defaultColumns];
   }

   saveSettings() {
      localStorage.setItem('estoque-column-settings', JSON.stringify(this.columns));
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

   /**
    * Inicializa a interface de configuração de colunas
    */
   initializeColumnSettings() {
      const container = document.getElementById('column-settings-list');
      if (!container) return;

      container.innerHTML = '';

      // Ordena colunas pela ordem atual
      const sortedColumns = [...this.columns].sort((a, b) => a.order - b.order);

      sortedColumns.forEach((column, index) => {
         const item = document.createElement('div');
         item.className = 'list-group-item d-flex justify-content-between align-items-center column-item';
         item.dataset.columnKey = column.key;

         item.innerHTML = `
            <div class="d-flex align-items-center">
               <i class="bi bi-grip-vertical me-3"></i>
               <div class="form-check">
                  <input class="form-check-input" type="checkbox"
                         id="col-${column.key}" ${column.visible ? 'checked' : ''}>
                  <label class="form-check-label" for="col-${column.key}">
                     ${column.name}
                  </label>
               </div>
            </div>
         `;

         container.appendChild(item);
      });

      // Inicializa drag & drop se Sortable estiver disponível
      if (typeof Sortable !== 'undefined') {
         this.sortable = new Sortable(container, {
            animation: 150,
            handle: '.bi-grip-vertical',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen'
         });
      }
   }

   /**
    * Salva as configurações das colunas
    */
   saveColumnSettings() {
      const container = document.getElementById('column-settings-list');
      if (!container) return;

      const items = container.querySelectorAll('.column-item');

      items.forEach((item, index) => {
         const columnKey = item.dataset.columnKey;
         const checkbox = item.querySelector(`#col-${columnKey}`);
         const columnSetting = this.columns.find(c => c.key === columnKey);

         if (columnSetting) {
            columnSetting.visible = checkbox.checked;
            columnSetting.order = index;
         }
      });

      this.saveSettings();
   }

   /**
    * Restaura configurações padrão
    */
   resetToDefault() {
      this.columns = [...this.defaultColumns];
      this.saveSettings();
      this.initializeColumnSettings();
   }
}

// ===== GERENCIADOR DE FILTROS =====
/**
 * Classe responsável por gerenciar os filtros da tabela
 */
class FilterManager {
   constructor(dataTable) {
      this.dataTable = dataTable;
      this.dateRangePicker = null;
      this._dateFilterFn = null;
      this.activeFilters = 0;
      this.initializeDateRangePicker();
   }

   /**
    * Inicializa o seletor de período de data
    */
   initializeDateRangePicker() {
      const dateInput = document.getElementById('filter-data-movimento');
      if (!dateInput || typeof flatpickr === 'undefined') return;

      this.dateRangePicker = flatpickr(dateInput, {
         mode: 'range',
         dateFormat: 'd/m/Y',
         locale: 'pt',
         minDate: '2020-01-01',
         maxDate: 'today'
      });
   }

   /**
    * Popula opções dos filtros dropdown
    * @param {Array} data - Dados do estoque
    */
   populateFilterOptions(data) {
      // Armazéns
      const armazens = ApiUtils.getUniqueValues(data, 'nomarm');
      const armazemSelect = document.getElementById('filter-armazem');
      if (armazemSelect) {
         armazemSelect.innerHTML = '<option value="">Todos</option>';
         armazens.forEach(armazem => {
            armazemSelect.innerHTML += `<option value="${armazem}">${armazem}</option>`;
         });
      }

      // Clientes
      const clientes = ApiUtils.getUniqueValues(data, 'nomcli');
      const clienteSelect = document.getElementById('filter-cliente');
      if (clienteSelect) {
         clienteSelect.innerHTML = '<option value="">Todos</option>';
         clientes.forEach(cliente => {
            clienteSelect.innerHTML += `<option value="${cliente}">${cliente}</option>`;
         });
      }
   }

   /**
    * Aplica todos os filtros
    */
   applyFilters() {
      if (!this.dataTable) return;

      // Reset all filters
      this.dataTable.search('').columns().search('');
      this.activeFilters = 0;

      // Get filter values
      const filters = {
         armazem: document.getElementById('filter-armazem')?.value || '',
         produto: document.getElementById('filter-produto')?.value || '',
         lote: document.getElementById('filter-lote')?.value || '',
         cliente: document.getElementById('filter-cliente')?.value || '',
         container: document.getElementById('filter-container')?.value || ''
      };

      // Apply individual column filters
      Object.keys(filters).forEach(filterKey => {
         const value = filters[filterKey];
         if (value) {
            let columnKey;
            switch(filterKey) {
               case 'armazem': columnKey = 'nomarm'; break;
               case 'produto': columnKey = 'nompro'; break;
               case 'lote': columnKey = 'lote'; break;
               case 'cliente': columnKey = 'nomcli'; break;
               case 'container': columnKey = 'container'; break;
            }

            if (columnKey) {
               const columnIndex = window.estoqueManager?.columnManager?.getColumnIndex(columnKey);
               if (columnIndex !== -1) {
                  this.dataTable.column(columnIndex).search(value);
                  this.activeFilters++;
               }
            }
         }
      });

      // Apply date filter
      this.applyDateFilter();

      // Redraw table
      this.dataTable.draw();

      // Update filter counter
      this.updateFilterCounter();

      // Show success message
      this.showToast('Filtros aplicados com sucesso!', 'success');
   }

   /**
    * Aplica filtro de data
    */
   applyDateFilter() {
      // Remove previous date filter
      if (this._dateFilterFn) {
         const idx = $.fn.dataTable.ext.search.indexOf(this._dateFilterFn);
         if (idx > -1) {
            $.fn.dataTable.ext.search.splice(idx, 1);
         }
         this._dateFilterFn = null;
      }

      const dateRange = document.getElementById('filter-data-movimento')?.value || '';
      if (!dateRange) return;

      const columnIndex = window.estoqueManager?.columnManager?.getColumnIndex('datamov');
      if (columnIndex === -1) return;

      const [start, endRaw] = dateRange.includes(' to ') ?
         dateRange.split(' to ') :
         dateRange.split(' a ');

      const startDate = start ? this.parsePtBrDate(start.trim()) : null;
      const endDate = endRaw ? this.parsePtBrDate(endRaw.trim()) : null;

      this._dateFilterFn = (settings, data) => {
         if (settings.nTable !== this.dataTable.table().node()) return true;

         const value = data[columnIndex];
         if (!value) return false;

         const current = new Date(value);
         if (isNaN(current.getTime())) return false;

         if (startDate && current < startDate) return false;
         if (endDate && current > endDate) return false;

         return true;
      };

      $.fn.dataTable.ext.search.push(this._dateFilterFn);
      this.activeFilters++;
   }

   /**
    * Limpa todos os filtros
    */
   clearFilters() {
      if (!this.dataTable) return;

      // Clear DataTable filters
      this.dataTable.search('').columns().search('');

      // Remove custom date filter
      if (this._dateFilterFn) {
         const idx = $.fn.dataTable.ext.search.indexOf(this._dateFilterFn);
         if (idx > -1) {
            $.fn.dataTable.ext.search.splice(idx, 1);
         }
         this._dateFilterFn = null;
      }

      // Clear form inputs
      const form = document.getElementById('filters-form');
      if (form) {
         form.reset();
      }

      // Clear date picker
      if (this.dateRangePicker) {
         this.dateRangePicker.clear();
      }

      this.activeFilters = 0;

      // Redraw table
      this.dataTable.draw();

      // Update counter
      this.updateFilterCounter();

      this.showToast('Filtros limpos!', 'info');
   }

   /**
    * Converte data em formato brasileiro para objeto Date
    * @param {string} dateStr - Data no formato dd/mm/aaaa
    * @returns {Date} Objeto Date
    */
   parsePtBrDate(dateStr) {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
   }

   /**
    * Atualiza contador de filtros ativos
    */
   updateFilterCounter() {
      const counter = document.getElementById('active-filters-count');
      if (counter) {
         if (this.activeFilters > 0) {
            counter.textContent = this.activeFilters;
            counter.style.display = 'inline';
         } else {
            counter.style.display = 'none';
         }
      }
   }

   /**
    * Exibe toast de notificação
    */
   showToast(message, type = 'info') {
      if (typeof window.showToast === 'function') {
         window.showToast(message, type);
      } else {
         console.log(`${type.toUpperCase()}: ${message}`);
      }
   }
}

// ===== CLASSE PRINCIPAL - GERENCIADOR DE ESTOQUE =====
/**
 * Classe principal que gerencia toda a funcionalidade da tela de estoque
 */
class EstoqueManager {
   constructor() {
      this.data = [];
      this.dataTable = null;
      this.columnManager = new ColumnManager();
      this.filterManager = null;
      this.isLoading = false;

      this.init();
   }

   /**
    * Inicialização principal
    */
   async init() {
      console.log('🚀 Inicializando Gestão de Estoque...');

      // Aguarda carregamento das dependências
      await this.waitForDependencies();

      // Carrega dados
      await this.loadData();

      // Inicializa componentes
      this.initializeDataTable();
      this.bindEvents();

      console.log('✅ Gestão de Estoque inicializada com sucesso!');
   }

   /**
    * Aguarda o carregamento das dependências necessárias
    */
   async waitForDependencies() {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
         if (typeof Thefetch === 'function' && typeof $ !== 'undefined' && $.fn.DataTable) {
            return;
         }

         await new Promise(resolve => setTimeout(resolve, 500));
         attempts++;
      }

      if (attempts >= maxAttempts) {
         console.error('❌ Dependências não carregadas após tentativas');
         this.showError('Erro ao carregar dependências necessárias');
      }
   }

   /**
    * Carrega dados do estoque via API
    */
   async loadData() {
      try {
         this.showLoading(true);
         console.log('🔄 Carregando dados do estoque...');

         this.data = await ApiUtils.getGestaoEstoque();
         console.log(`✅ ${this.data.length} registros carregados`);

         this.updateRecordCount();

      } catch (error) {
         console.error('❌ Erro ao carregar dados:', error);
         this.showError(`Erro ao carregar dados: ${error.message}`);
         this.data = [];
      } finally {
         this.showLoading(false);
      }
   }

   /**
    * Inicializa o DataTable
    */
   initializeDataTable() {
      const table = $('#estoque-table');

      // Destroy existing instance
      if ($.fn.DataTable.isDataTable(table)) {
         table.DataTable().destroy();
      }

      const visibleColumns = this.columnManager.getVisibleColumns();

      // Configure columns
      const columns = visibleColumns.map(col => ({
         data: col.key,
         title: col.name,
         className: col.className || '',
         render: (data, type, row) => {
            if (type === 'display' || type === 'type') {
               return this.formatCellData(data, col.key);
            }
            return data;
         }
      }));

      // Initialize DataTable
      this.dataTable = table.DataTable({
         data: this.data,
         columns: columns,
         pageLength: 25,
         lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'Todos']],
         language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
         },
         responsive: true,
         scrollX: true,
         colReorder: true,
         dom: '<"row"<"col-sm-6"l><"col-sm-6"f>>' +
              '<"row"<"col-sm-12"tr>>' +
              '<"row"<"col-sm-5"i><"col-sm-7"p>>',
         order: [[0, 'asc']]
      });

      // Initialize filter manager
      this.filterManager = new FilterManager(this.dataTable);
      this.filterManager.populateFilterOptions(this.data);

      console.log('✅ DataTable inicializado');
   }

   /**
    * Formata dados das células conforme o tipo
    */
   formatCellData(data, columnKey) {
      if (data === null || data === undefined || data === '') {
         return '-';
      }

      switch (columnKey) {
         case 'vlrunitnf':
         case 'vlwunit':
         case 'vlrmerc':
            return ApiUtils.formatCurrency(data);

         case 'kg_ent':
         case 'pesocx':
         case 'pesoliq':
         case 'kg_entliq':
         case 'pesobrdisp':
         case 'pesoliqdisp':
         case 'fatorconv':
         case 'metros':
            return ApiUtils.formatNumber(data, 2);

         case 'disponivel':
         case 'qtdereserv':
         case 'qtde':
         case 'nonf':
         case 'noos':
         case 'item':
         case 'nocli':
         case 'noarm':
         case 'nopro':
            return ApiUtils.formatNumber(data, 0);

         case 'datamov':
         case 'datavalidade':
            return ApiUtils.formatDate(data);

         default:
            return String(data);
      }
   }

   /**
    * Vincula eventos dos elementos
    */
   bindEvents() {
      // Filters
      document.getElementById('btn-toggle-filters')?.addEventListener('click', () => {
         const sidebar = new bootstrap.Offcanvas(document.getElementById('filters-sidebar'));
         sidebar.show();
      });

      document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
         this.filterManager?.applyFilters();
      });

      document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
         this.filterManager?.clearFilters();
      });

      // Column settings
      document.getElementById('btn-column-settings')?.addEventListener('click', () => {
         this.columnManager.initializeColumnSettings();
         const modal = new bootstrap.Modal(document.getElementById('modal-column-settings'));
         modal.show();
      });

      document.getElementById('btn-save-column-settings')?.addEventListener('click', () => {
         this.columnManager.saveColumnSettings();
         this.initializeDataTable();
         const modal = bootstrap.Modal.getInstance(document.getElementById('modal-column-settings'));
         if (modal) modal.hide();
         this.showToast('Configurações salvas!', 'success');
      });

      document.getElementById('btn-reset-columns')?.addEventListener('click', () => {
         this.columnManager.resetToDefault();
         this.showToast('Configurações restauradas!', 'info');
      });

      // Export
      document.querySelectorAll('[data-export]').forEach(btn => {
         btn.addEventListener('click', (e) => {
            e.preventDefault();
            const format = btn.dataset.export;
            this.exportData(format);
         });
      });
   }

   /**
    * Exporta dados em formato específico
    */
   exportData(format) {
      if (!this.dataTable) return;

      const filename = `Gestao_Estoque_${new Date().toISOString().split('T')[0]}`;

      const buttons = new $.fn.dataTable.Buttons(this.dataTable, {
         buttons: [{
            extend: format === 'excel' ? 'excelHtml5' : 'pdfHtml5',
            title: format === 'pdf' ? 'Gestão de Estoque - ' + new Date().toLocaleDateString('pt-BR') : filename,
            orientation: format === 'pdf' ? 'landscape' : undefined,
            pageSize: format === 'pdf' ? 'A4' : undefined,
            exportOptions: {
               columns: ':visible'
            }
         }]
      });

      const container = buttons.container();
      document.body.appendChild(container[0]);
      buttons.buttons(0, 0).node.click();
      buttons.destroy();
   }

   /**
    * Atualiza contador de registros
    */
   updateRecordCount() {
      const counter = document.getElementById('total-records');
      if (counter) {
         counter.textContent = `${this.data.length} registros`;
      }
   }

   /**
    * Controla exibição do loading
    */
   showLoading(show) {
      const indicator = document.getElementById('loading-indicator');
      const container = document.getElementById('table-container');

      if (indicator) {
         indicator.style.display = show ? 'block' : 'none';
      }
      if (container) {
         container.style.display = show ? 'none' : 'block';
      }

      this.isLoading = show;
   }

   /**
    * Exibe mensagem de erro
    */
   showError(message) {
      if (typeof Swal !== 'undefined') {
         Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: message,
            confirmButtonText: 'OK'
         });
      } else {
         alert(`Erro: ${message}`);
      }
   }

   /**
    * Exibe toast de notificação
    */
   showToast(message, type = 'info') {
      if (typeof window.showToast === 'function') {
         window.showToast(message, type);
      } else {
         console.log(`${type.toUpperCase()}: ${message}`);
      }
   }
}

// ===== INICIALIZAÇÃO =====
/**
 * Verifica se a função Thefetch está disponível antes de inicializar
 */
async function checkThefetchAvailability() {
   if (typeof Thefetch !== 'function') {
      console.error('❌ Função Thefetch não encontrada. Aguardando...');

      // Aguarda um pouco e tenta novamente
      setTimeout(() => {
         if (typeof Thefetch === 'function') {
            initializeEstoque();
         } else {
            console.error('❌ Função Thefetch ainda não encontrada após delay');
         }
      }, 1000);
      return;
   }

   initializeEstoque();
}

/**
 * Inicializa o sistema de gestão de estoque
 */
function initializeEstoque() {
   // Verifica se a função já está disponível
   if (typeof Thefetch !== 'function') {
      console.error('❌ Função Thefetch não encontrada');
      return;
   }

   // Aguarda DOM e dependências
   if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
         setTimeout(() => {
            window.estoqueManager = new EstoqueManager();
         }, 500);
      });
   } else {
      setTimeout(() => {
         window.estoqueManager = new EstoqueManager();
      }, 500);
   }
}

// Inicia verificação quando script carrega
checkThefetchAvailability();
