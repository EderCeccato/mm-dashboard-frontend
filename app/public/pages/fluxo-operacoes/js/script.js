/**
 * Fluxo Operações - Sistema completo de gerenciamento de operações WMS
 * Integrado com backend Firebird via API REST
 * MM Softwares - Versão Integrada
 */

// ===== CLASSE DE UTILITÁRIOS E API =====
/**
 * Classe responsável por gerenciar comunicação com API e operações utilitárias
 */
class ApiUtils {
   /**
    * Busca dados do fluxo de operações
    * @returns {Promise<Array>} Lista de operações
    */
   static async getFluxoOperacoes() {
      const response = await Thefetch('/api/fluxo-operacoes', 'GET');
      return response.data || [];
   }

   /**
    * Busca detalhes de uma operação específica (itens e checklist)
    * @param {number} noosmov - Número da OS de movimento
    * @returns {Promise<Object>} Detalhes da operação
    */
   static async getOperacaoDetails(noosmov) {
      const response = await Thefetch(`/api/fluxo-operacoes/${noosmov}`, 'GET');
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
    * Formata data para formato brasileiro sem horário
    * @param {string} dateISO - Data em formato ISO
    * @returns {string} Data formatada (dd/mm/aaaa)
    */
   static formatDateOnly(dateISO) {
      if (!dateISO) return '-';
      const date = new Date(dateISO);
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
   }

   /**
    * Determina a classe CSS e texto do status baseado no valor
    * @param {string} status - Status da operação
    * @returns {Object} Status formatado e classe CSS
    */
   static getStatusBadge(status) {
      if (!status) return { text: '-', class: 'bg-secondary' };

      const statusLower = status.toLowerCase();

      if (statusLower.includes('incluindo tarefa')) {
         return { text: status, class: 'status-incluindo-tarefa' };
      } else if (statusLower.includes('em andamento') || statusLower.includes('processando')) {
         return { text: status, class: 'status-em-andamento' };
      } else if (statusLower.includes('conclu') || statusLower.includes('finalizado')) {
         return { text: status, class: 'status-concluido' };
      } else if (statusLower.includes('pendente') || statusLower.includes('aguardando')) {
         return { text: status, class: 'status-pendente' };
      } else {
         return { text: status, class: 'bg-info' };
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

   /**
    * Trunca texto para exibição
    * @param {string} text - Texto a ser truncado
    * @param {number} maxLength - Comprimento máximo
    * @returns {string} Texto truncado
    */
   static truncateText(text, maxLength = 50) {
      if (!text) return '-';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
   }
}

// ===== GERENCIADOR DE COLUNAS =====
/**
 * Classe responsável por gerenciar a configuração e exibição das colunas da tabela
 */
class ColumnManager {
   constructor() {
      this.storageKey = 'fluxo-operacoes-columns';
      this.defaultColumns = [
         { data: 'noosmov', title: 'OS Movimento', visible: true, width: '100px' },
         { data: 'nocli', title: 'Cód. Cliente', visible: true, width: '100px' },
         { data: 'nomcli', title: 'Cliente', visible: true, width: '250px' },
         { data: 'nomopos', title: 'Tipo Op.', visible: true, width: '100px' },
         { data: 'empresa', title: 'Empresa', visible: true, width: '200px' },
         { data: 'status', title: 'Status', visible: true, width: '150px' },
         { data: 'tarefaatual', title: 'Tarefa Atual', visible: true, width: '150px' },
         { data: 'data', title: 'Data', visible: true, width: '130px' },
         { data: 'separador', title: 'Separador', visible: true, width: '120px' }
      ];
   }

   /**
    * Carrega configuração das colunas do localStorage
    * @returns {Array} Configuração das colunas
    */
   loadColumnSettings() {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : this.defaultColumns;
   }

   /**
    * Salva configuração das colunas no localStorage
    * @param {Array} columns - Configuração das colunas
    */
   saveColumnSettings(columns) {
      localStorage.setItem(this.storageKey, JSON.stringify(columns));
   }

   /**
    * Reseta colunas para configuração padrão
    */
   resetColumns() {
      localStorage.removeItem(this.storageKey);
      return this.defaultColumns;
   }

   /**
    * Gera configuração de colunas para DataTable
    * @param {Array} data - Dados das operações
    * @returns {Array} Configuração de colunas do DataTable
    */
   generateDataTableColumns(data) {
      const columns = this.loadColumnSettings();

      return columns.map(col => ({
         data: col.data,
         title: col.title,
         visible: col.visible,
         width: col.width,
         className: 'text-center',
         render: (data, type, row) => {
            if (type === 'display') {
               return this.formatColumnData(col.data, data, row);
            }
            return data;
         }
      }));
   }

   /**
    * Formata dados da coluna para exibição
    * @param {string} column - Nome da coluna
    * @param {*} data - Dados da célula
    * @param {Object} row - Linha completa de dados
    * @returns {string} HTML formatado
    */
   formatColumnData(column, data, row) {
      switch (column) {
         case 'noosmov':
            return `<span class="badge bg-primary">${data || '-'}</span>`;

         case 'nomcli':
            return `<span class="text-truncate-custom" title="${data || ''}">${ApiUtils.truncateText(data, 40)}</span>`;

         case 'empresa':
            return `<span class="text-truncate-custom" title="${data || ''}">${ApiUtils.truncateText(data, 30)}</span>`;

         case 'status':
            const statusBadge = ApiUtils.getStatusBadge(data);
            return `<span class="badge ${statusBadge.class}">${statusBadge.text}</span>`;

         case 'data':
            return ApiUtils.formatDate(data);

         case 'separador':
            return data || '<span class="text-muted">-</span>';

         default:
            return data || '-';
      }
   }

   /**
    * Renderiza interface de configuração de colunas
    */
   renderColumnSettings() {
      const columns = this.loadColumnSettings();
      const container = document.getElementById('column-list');

      container.innerHTML = columns.map((col, index) => `
         <div class="list-group-item d-flex justify-content-between align-items-center" data-column="${col.data}">
            <div class="form-check">
               <input class="form-check-input" type="checkbox" id="col-${col.data}" ${col.visible ? 'checked' : ''}>
               <label class="form-check-label ms-2" for="col-${col.data}">
                  <i class="bi bi-grip-vertical me-2 text-muted"></i>
                  ${col.title}
               </label>
            </div>
            <div class="badge bg-secondary">${col.width}</div>
         </div>
      `).join('');
   }

   /**
    * Salva configurações de colunas do modal
    */
   saveSettingsFromModal() {
      const columns = this.loadColumnSettings();
      const items = document.querySelectorAll('#column-list .list-group-item');

      items.forEach((item, index) => {
         const columnData = item.dataset.column;
         const checkbox = item.querySelector('.form-check-input');
         const column = columns.find(col => col.data === columnData);

         if (column) {
            column.visible = checkbox.checked;
         }
      });

      this.saveColumnSettings(columns);
   }
}

// ===== GERENCIADOR DE FILTROS =====
/**
 * Classe responsável por gerenciar filtros da tabela
 */
class FilterManager {
   constructor() {
      this.activeFilters = {};
   }

   /**
    * Inicializa filtros com dados das operações
    * @param {Array} data - Dados das operações
    */
   initializeFilters(data) {
      this.populateFilterOptions('filter-status', ApiUtils.getUniqueValues(data, 'status'));
      this.populateFilterOptions('filter-cliente', ApiUtils.getUniqueValues(data, 'nomcli'));
      this.populateFilterOptions('filter-empresa', ApiUtils.getUniqueValues(data, 'empresa'));
      this.populateFilterOptions('filter-tarefa', ApiUtils.getUniqueValues(data, 'tarefaatual'));
      this.populateFilterOptions('filter-separador', ApiUtils.getUniqueValues(data, 'separador'));
   }

   /**
    * Popula opções de um filtro select
    * @param {string} selectId - ID do elemento select
    * @param {Array} options - Opções do filtro
    */
   populateFilterOptions(selectId, options) {
      const select = document.getElementById(selectId);
      if (!select) return;

      const currentValue = select.value;
      select.innerHTML = '<option value="">Todos</option>';

      options.forEach(option => {
         const optionElement = document.createElement('option');
         optionElement.value = option;
         optionElement.textContent = option;
         if (option === currentValue) {
            optionElement.selected = true;
         }
         select.appendChild(optionElement);
      });
   }

   /**
    * Aplica filtros à tabela
    * @param {Object} dataTable - Instância do DataTable
    */
   applyFilters(dataTable) {
      // Coleta valores dos filtros
      this.activeFilters = {
         status: document.getElementById('filter-status')?.value || '',
         cliente: document.getElementById('filter-cliente')?.value || '',
         empresa: document.getElementById('filter-empresa')?.value || '',
         tarefa: document.getElementById('filter-tarefa')?.value || '',
         separador: document.getElementById('filter-separador')?.value || ''
      };

      // Aplica filtros por coluna
      Object.keys(this.activeFilters).forEach(key => {
         const value = this.activeFilters[key];
         let columnIndex;

         switch (key) {
            case 'status': columnIndex = 5; break;
            case 'cliente': columnIndex = 2; break;
            case 'empresa': columnIndex = 4; break;
            case 'tarefa': columnIndex = 6; break;
            case 'separador': columnIndex = 8; break;
         }

         if (columnIndex !== undefined) {
            dataTable.column(columnIndex).search(value).draw();
         }
      });

      this.updateFilterCount();
   }

   /**
    * Limpa todos os filtros
    * @param {Object} dataTable - Instância do DataTable
    */
   clearFilters(dataTable) {
      // Limpa campos do formulário
      document.getElementById('filters-form').reset();

      // Limpa filtros da tabela
      dataTable.search('').columns().search('').draw();

      this.activeFilters = {};
      this.updateFilterCount();
   }

   /**
    * Atualiza contador de filtros ativos
    */
   updateFilterCount() {
      const activeCount = Object.values(this.activeFilters).filter(value => value !== '').length;
      const badge = document.getElementById('active-filters-count');

      if (activeCount > 0) {
         badge.textContent = activeCount;
         badge.style.display = 'inline';
      } else {
         badge.style.display = 'none';
      }
   }
}

// ===== GERENCIADOR DE EXPORTAÇÃO =====
/**
 * Classe responsável por exportar dados
 */
class ExportManager {
   /**
    * Exporta dados para Excel
    * @param {Array} data - Dados para exportar
    * @param {string} filename - Nome do arquivo
    */
   static exportToExcel(data, filename = 'fluxo_operacoes') {
      const worksheet = XLSX.utils.json_to_sheet(data.map(row => ({
         'OS Movimento': row.noosmov,
         'Cód. Cliente': row.nocli,
         'Cliente': row.nomcli,
         'Tipo Operação': row.nomopos,
         'Empresa': row.empresa,
         'Status': row.status,
         'Tarefa Atual': row.tarefaatual,
         'Data': ApiUtils.formatDate(row.data),
         'Separador': row.separador || ''
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Operações');
      XLSX.writeFile(workbook, `${filename}.xlsx`);
   }

   /**
    * Exporta dados para PDF
    * @param {Array} data - Dados para exportar
    * @param {string} filename - Nome do arquivo
    */
   static exportToPDF(data, filename = 'fluxo_operacoes') {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');

      // Cabeçalho
      doc.setFontSize(16);
      doc.text('Fluxo de Operações', 20, 20);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);

      // Dados da tabela
      const tableData = data.map(row => [
         row.noosmov,
         row.nocli,
         ApiUtils.truncateText(row.nomcli, 20),
         row.nomopos,
         ApiUtils.truncateText(row.empresa, 15),
         ApiUtils.truncateText(row.status, 15),
         ApiUtils.truncateText(row.tarefaatual, 15),
         ApiUtils.formatDate(row.data),
         row.separador || ''
      ]);

      doc.autoTable({
         head: [['OS Mov.', 'Cód.', 'Cliente', 'Tipo', 'Empresa', 'Status', 'Tarefa', 'Data', 'Separador']],
         body: tableData,
         startY: 40,
         styles: { fontSize: 8 },
         headStyles: { fillColor: [13, 110, 253] }
      });

      doc.save(`${filename}.pdf`);
   }
}

// ===== GERENCIADOR PRINCIPAL =====
/**
 * Classe principal que gerencia toda a funcionalidade da tela
 */
class FluxoOperacoesManager {
   constructor() {
      this.dataTable = null;
      this.operacoesData = [];
      this.columnManager = new ColumnManager();
      this.filterManager = new FilterManager();

      this.init();
   }

   /**
    * Inicializa o gerenciador
    */
   async init() {
      try {
         this.showLoading(true);
         await this.loadOperacoes();
         this.initializeDataTable();
         this.setupEventListeners();
         this.showLoading(false);
      } catch (error) {
         console.error('Erro ao inicializar:', error);
         this.showError('Erro ao carregar dados das operações');
         this.showLoading(false);
      }
   }

   /**
    * Carrega dados das operações
    */
   async loadOperacoes() {
      this.operacoesData = await ApiUtils.getFluxoOperacoes();
      this.updateTotalRecords(this.operacoesData.length);
      this.filterManager.initializeFilters(this.operacoesData);
   }

   /**
    * Inicializa DataTable
    */
   initializeDataTable() {
      if (this.dataTable) {
         this.dataTable.destroy();
      }

      // Remove event listeners anteriores para evitar duplicação
      $('#operacoes-table tbody').off('click', 'tr');

      this.dataTable = $('#operacoes-table').DataTable({
         data: this.operacoesData,
         columns: this.columnManager.generateDataTableColumns(this.operacoesData),
         pageLength: 25,
         lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
         order: [[7, 'desc']], // Ordenar por data decrescente
         responsive: true,
         scrollX: true,
         language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
         },
         dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>t<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
         drawCallback: (settings) => {
            // Evita chamar durante a inicialização ou destruição
            if (settings.bInitialised && this.dataTable) {
               this.updateTotalRecords(this.dataTable.page.info().recordsDisplay);
            }
         }
      });

      // Event listener para clique nas linhas
      $('#operacoes-table tbody').on('click', 'tr', (e) => {
         // Evita cliques múltiplos e propagação
         if (e.detail > 1) return; // Ignora cliques duplos
         e.preventDefault();
         e.stopImmediatePropagation();

         const $row = $(e.currentTarget);
         if ($row.hasClass('processing')) return; // Evita múltiplos cliques

         const data = this.dataTable.row(e.currentTarget).data();
         if (data && data.noosmov) {
            $row.addClass('processing');
            this.openOperacaoDetails(data.noosmov).finally(() => {
               $row.removeClass('processing');
            });
         }
      });
   }

   /**
    * Configura event listeners
    */
   setupEventListeners() {
      // Botão filtros
      document.getElementById('btn-toggle-filters')?.addEventListener('click', () => {
         const sidebar = new bootstrap.Offcanvas(document.getElementById('filters-sidebar'));
         sidebar.show();
      });

      // Aplicar filtros
      document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
         this.filterManager.applyFilters(this.dataTable);
         const sidebar = bootstrap.Offcanvas.getInstance(document.getElementById('filters-sidebar'));
         sidebar.hide();
      });

      // Limpar filtros
      document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
         this.filterManager.clearFilters(this.dataTable);
      });

      // Configuração de colunas
      document.getElementById('btn-column-settings')?.addEventListener('click', () => {
         this.columnManager.renderColumnSettings();
         const modal = new bootstrap.Modal(document.getElementById('modal-column-settings'));
         modal.show();
      });

      // Salvar configurações de colunas
      document.getElementById('btn-save-columns')?.addEventListener('click', () => {
         const currentColumns = JSON.stringify(this.columnManager.loadColumnSettings());
         this.columnManager.saveSettingsFromModal();
         const newColumns = JSON.stringify(this.columnManager.loadColumnSettings());

         // Só reinicializa se as colunas realmente mudaram
         if (currentColumns !== newColumns) {
            this.initializeDataTable();
         }

         const modal = bootstrap.Modal.getInstance(document.getElementById('modal-column-settings'));
         modal.hide();
      });

      // Reset colunas
      document.getElementById('btn-reset-columns')?.addEventListener('click', () => {
         this.columnManager.resetColumns();
         this.columnManager.renderColumnSettings();
      });

      // Exportação
      document.querySelectorAll('[data-export]').forEach(btn => {
         btn.addEventListener('click', (e) => {
            e.preventDefault();
            const format = btn.dataset.export;
            const visibleData = this.getVisibleTableData();

            if (format === 'excel') {
               ExportManager.exportToExcel(visibleData);
            } else if (format === 'pdf') {
               ExportManager.exportToPDF(visibleData);
            }
         });
      });
   }

   /**
    * Abre modal com detalhes da operação
    * @param {number} noosmov - Número da OS de movimento
    */
   async openOperacaoDetails(noosmov) {
      try {
         // Reutiliza instância do modal se já existir
         const modalElement = document.getElementById('modal-operation-details');
         let modal = bootstrap.Modal.getInstance(modalElement);
         if (!modal) {
            modal = new bootstrap.Modal(modalElement);
         }

         // Abre o modal imediatamente
         modal.show();

         // Mostra loading dentro do modal
         this.showModalLoading(true);

         // Carrega os dados
         const details = await ApiUtils.getOperacaoDetails(noosmov);
         this.renderOperacaoDetails(noosmov, details);

         // Remove loading do modal
         this.showModalLoading(false);
      } catch (error) {
         console.error('Erro ao carregar detalhes:', error);
         this.showModalError('Erro ao carregar detalhes da operação');
         this.showModalLoading(false);
      }
   }

   /**
    * Renderiza detalhes da operação no modal
    * @param {number} noosmov - Número da OS
    * @param {Object} details - Detalhes da operação
    */
   renderOperacaoDetails(noosmov, details) {
      // Restaura o conteúdo original do modal
      this.restoreModalContent();

      // Busca dados básicos da operação
      const operacao = this.operacoesData.find(op => op.noosmov === noosmov);

      // Preenche cabeçalho
      document.getElementById('detail-noosmov').textContent = noosmov;
      document.getElementById('detail-cliente').textContent = operacao?.nomcli || '-';
      document.getElementById('detail-empresa').textContent = operacao?.empresa || '-';
      document.getElementById('detail-status').textContent = operacao?.status || '-';

      // Renderiza itens
      this.renderItensOperacao(details.itensOperacao || []);

      // Renderiza checklist
      this.renderChecklistOperacao(details.checkListOperacao || []);

      // Atualiza contadores nas abas
      document.getElementById('itens-count').textContent = (details.itensOperacao || []).length;
      document.getElementById('checklist-count').textContent = (details.checkListOperacao || []).length;
   }

   /**
    * Renderiza tabela de itens da operação
    * @param {Array} itens - Lista de itens
    */
   renderItensOperacao(itens) {
      const tbody = document.querySelector('#itens-table tbody');

      if (!itens || itens.length === 0) {
         tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Nenhum item encontrado</td></tr>';
         return;
      }

      tbody.innerHTML = itens.map(item => `
         <tr>
            <td><span class="badge bg-secondary">${item.item}</span></td>
            <td class="text-start">
               <div class="fw-semibold">${ApiUtils.truncateText(item.nompro, 30)}</div>
               <small class="text-muted">Cód: ${item.nopro}</small>
            </td>
            <td><span class="badge bg-info">${item.codcli}</span></td>
            <td><span class="badge bg-warning text-dark">${item.lote || '-'}</span></td>
            <td><strong>${(item.qtde || 0).toLocaleString('pt-BR')}</strong></td>
            <td>${item.nomun || '-'}</td>
            <td><span class="badge bg-success">${item.status}</span></td>
            <td>${ApiUtils.formatDateOnly(item.datavalidade)}</td>
            <td>
               <div class="position-badge">
                  L${item.linha || '?'}-B${item.bloco || '?'}-N${item.nivel || '?'}-A${item.apto || '?'}
               </div>
            </td>
         </tr>
      `).join('');
   }

   /**
    * Renderiza checklist da operação
    * @param {Array} checklist - Lista de checklist
    */
   renderChecklistOperacao(checklist) {
      const container = document.getElementById('checklist-container');

      if (!checklist || checklist.length === 0) {
         container.innerHTML = '<div class="text-center text-muted py-4">Nenhum item de checklist encontrado</div>';
         return;
      }

      container.innerHTML = checklist.map((item, index) => `
         <div class="checklist-item fade-in" style="animation-delay: ${index * 0.1}s">
            <div class="d-flex justify-content-between align-items-start mb-2">
               <h6 class="mb-0">
                  <i class="bi bi-check-square me-2 text-success"></i>
                  ${item.nomchecklistwms}
               </h6>
               <span class="badge bg-primary">${item.sequencia}º</span>
            </div>
            <div class="row">
               <div class="col-md-6">
                  <small class="text-muted">
                     <i class="bi bi-calendar me-1"></i>
                     <strong>Registrado:</strong> ${ApiUtils.formatDate(item.datareg)}
                  </small>
               </div>
               <div class="col-md-6">
                  <small class="text-muted">
                     <i class="bi bi-person me-1"></i>
                     <strong>Usuário:</strong> ${item.usuario}
                  </small>
               </div>
            </div>
            ${item.imagens && item.imagens.length > 0 ? `
               <div class="checklist-images">
                  ${item.imagens.map(img => `
                     <img src="${img.url}" alt="Imagem ${img.id}" class="checklist-image"
                          onclick="this.classList.toggle('enlarged')">
                  `).join('')}
               </div>
            ` : ''}
         </div>
      `).join('');
   }

   /**
    * Obtém dados visíveis da tabela para exportação
    * @returns {Array} Dados visíveis filtrados
    */
   getVisibleTableData() {
      return this.dataTable.rows({ search: 'applied' }).data().toArray();
   }

   /**
    * Atualiza contador de registros
    * @param {number} count - Número de registros
    */
   updateTotalRecords(count) {
      const element = document.getElementById('total-records');
      if (element) {
         element.textContent = `${count.toLocaleString('pt-BR')} registros`;
      }
   }

   /**
    * Mostra/oculta indicador de loading
    * @param {boolean} show - Se deve mostrar o loading
    */
   showLoading(show) {
      const indicator = document.getElementById('loading-indicator');
      const container = document.getElementById('table-container');

      if (indicator && container) {
         if (show) {
            indicator.style.display = 'block';
            container.style.opacity = '0.5';
            container.style.pointerEvents = 'none';
         } else {
            indicator.style.display = 'none';
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
         }
      }
   }

   /**
    * Mostra/oculta loading dentro do modal
    * @param {boolean} show - Se deve mostrar o loading
    */
   showModalLoading(show) {
      const modalBody = document.querySelector('#modal-operation-details .modal-body');

      if (show) {
         modalBody.innerHTML = `
            <div class="modal-loading">
               <div class="text-center">
                  <div class="spinner-border text-primary mb-3" role="status">
                     <span class="visually-hidden">Carregando...</span>
                  </div>
                  <p class="text-muted">Carregando detalhes da operação...</p>
               </div>
            </div>
         `;
      } else {
         // O conteúdo será preenchido pelo renderOperacaoDetails
      }
   }

   /**
    * Mostra erro dentro do modal
    * @param {string} message - Mensagem de erro
    */
   showModalError(message) {
      const modalBody = document.querySelector('#modal-operation-details .modal-body');
      modalBody.innerHTML = `
         <div class="modal-error">
            <div class="text-center">
               <i class="bi bi-exclamation-triangle text-danger mb-3"></i>
               <p class="text-danger fw-semibold mb-0">${message}</p>
               <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                  <i class="bi bi-x-circle me-1"></i>Fechar
               </button>
            </div>
         </div>
      `;
   }

   /**
    * Restaura o conteúdo original do modal
    */
   restoreModalContent() {
      const modalBody = document.querySelector('#modal-operation-details .modal-body');
      modalBody.innerHTML = `
         <!-- Info Header -->
         <div class="row mb-3">
            <div class="col-12">
               <div class="card border-secondary">
                  <div class="card-header bg-light">
                     <h6 class="mb-0 text-dark"><i class="bi bi-info-circle me-2"></i>Informações da Operação</h6>
                  </div>
                  <div class="card-body">
                     <div class="row">
                        <div class="col-md-3">
                           <strong>OS Movimento:</strong> <span id="detail-noosmov" class="text-primary"></span>
                        </div>
                        <div class="col-md-3">
                           <strong>Cliente:</strong> <span id="detail-cliente"></span>
                        </div>
                        <div class="col-md-3">
                           <strong>Empresa:</strong> <span id="detail-empresa"></span>
                        </div>
                        <div class="col-md-3">
                           <strong>Status:</strong> <span id="detail-status"></span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <!-- Tabs Navigation -->
         <ul class="nav nav-tabs nav-justified" id="detailsTab" role="tablist">
            <li class="nav-item" role="presentation">
               <button class="nav-link active" id="itens-tab" data-bs-toggle="tab" data-bs-target="#itens-pane" type="button" role="tab" aria-controls="itens-pane" aria-selected="true">
                  <i class="bi bi-box-seam me-2"></i>Itens da Operação
                  <span class="badge bg-primary ms-2" id="itens-count">0</span>
               </button>
            </li>
            <li class="nav-item" role="presentation">
               <button class="nav-link" id="checklist-tab" data-bs-toggle="tab" data-bs-target="#checklist-pane" type="button" role="tab" aria-controls="checklist-pane" aria-selected="false">
                  <i class="bi bi-check2-square me-2"></i>Checklist
                  <span class="badge bg-success ms-2" id="checklist-count">0</span>
               </button>
            </li>
         </ul>

         <!-- Tabs Content -->
         <div class="tab-content mt-3" id="detailsTabContent">
            <!-- Itens Tab -->
            <div class="tab-pane fade show active" id="itens-pane" role="tabpanel" aria-labelledby="itens-tab">
               <div class="table-responsive">
                  <table class="table table-striped table-hover" id="itens-table">
                     <thead>
                        <tr>
                           <th>Item</th>
                           <th>Produto</th>
                           <th>Código Cliente</th>
                           <th>Lote</th>
                           <th>Qtde</th>
                           <th>Unidade</th>
                           <th>Status</th>
                           <th>Validade</th>
                           <th>Posição</th>
                        </tr>
                     </thead>
                     <tbody>
                        <!-- Dados serão preenchidos via JavaScript -->
                     </tbody>
                  </table>
               </div>
            </div>

            <!-- Checklist Tab -->
            <div class="tab-pane fade" id="checklist-pane" role="tabpanel" aria-labelledby="checklist-tab">
               <div id="checklist-container">
                  <!-- Checklist será preenchido via JavaScript -->
               </div>
            </div>
         </div>
      `;
   }

   /**
    * Exibe mensagem de erro
    * @param {string} message - Mensagem de erro
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
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
   new FluxoOperacoesManager();
});

// Estilo adicional para imagem ampliada no checklist
const style = document.createElement('style');
style.textContent = `
   .checklist-image.enlarged {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: auto;
      height: 80vh;
      max-width: 90vw;
      z-index: 9999;
      border: 5px solid #fff;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      cursor: zoom-out;
   }
   .checklist-image.enlarged::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: -1;
   }
`;
document.head.appendChild(style);
