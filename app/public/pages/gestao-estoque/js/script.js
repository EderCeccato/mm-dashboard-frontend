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
      try {
         const saved = localStorage.getItem('estoque-column-settings');
         if (saved) {
            const parsedSettings = JSON.parse(saved);

            // Verificar se as configurações são válidas
            if (Array.isArray(parsedSettings) && parsedSettings.length > 0) {
               // Validar se todas as colunas têm as propriedades necessárias
               const validSettings = parsedSettings.filter(col =>
                  col && col.key && col.name &&
                  typeof col.visible === 'boolean' &&
                  typeof col.order === 'number'
               );

               if (validSettings.length > 0) {
                  return validSettings;
               }
            }
         }
      } catch (error) {
         console.warn('Erro ao carregar configurações salvas:', error);
         // Limpar configurações inválidas
         localStorage.removeItem('estoque-column-settings');
      }

      // Retornar configuração padrão
      return [...this.defaultColumns];
   }

   saveSettings() {
      localStorage.setItem('estoque-column-settings', JSON.stringify(this.columns));
   }

   getVisibleColumns() {
      // Validar se columns existe e é um array
      if (!this.columns || !Array.isArray(this.columns)) {
         console.warn('Colunas não definidas, usando configuração padrão');
         this.columns = [...this.defaultColumns];
      }

      // Filtrar e ordenar colunas visíveis
      const visibleColumns = this.columns
         .filter(col => col && col.visible && col.key)
         .sort((a, b) => (a.order || 0) - (b.order || 0));

      // Garantir que pelo menos uma coluna esteja visível
      if (visibleColumns.length === 0) {
         console.warn('Nenhuma coluna visível, forçando primeira coluna');
         if (this.columns.length > 0) {
            this.columns[0].visible = true;
            return [this.columns[0]];
         }
      }

      return visibleColumns;
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
         maxDate: 'today',
         // Configurações para funcionar dentro do offcanvas
         appendTo: document.body,
         static: false,
         positionElement: dateInput
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

      // Get filter values (apenas dropdowns)
      const filters = {
         armazem: document.getElementById('filter-armazem')?.value || '',
         cliente: document.getElementById('filter-cliente')?.value || ''
      };

      // Apply individual column filters
      Object.keys(filters).forEach(filterKey => {
         const value = filters[filterKey];
         if (value) {
            let columnKey;
            switch(filterKey) {
               case 'armazem': columnKey = 'nomarm'; break;
               case 'cliente': columnKey = 'nomcli'; break;
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

// ===== GERENCIADOR DE EXPORTAÇÕES =====
/**
 * Classe responsável por gerenciar exportações Excel/PDF com feedback visual
 */
class ExportManager {
   /**
    * Exporta dados para Excel (gerado no frontend)
    */
   static async exportToExcel() {
      const btn = document.querySelector('[data-export="excel"]');
      if (!btn) return;

      const originalText = btn.innerHTML;

      try {
         // Desabilita botão
         btn.disabled = true;
         btn.innerHTML = `
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Exportando...
         `;

         // Obtém dados filtrados da tabela
         const filteredData = this.getFilteredTableData();

         if (filteredData.length === 0) {
            window.estoqueManager?.showToast('Nenhum dado para exportar. Aplique filtros ou verifique se há dados na tabela.', 'warning');
            return;
         }

         // Gera Excel no frontend com dados filtrados
         this.generateExcelFile(filteredData);

         window.estoqueManager?.showToast(`Excel gerado com sucesso! ${filteredData.length} item(ns) exportado(s)`, 'success');

      } catch (error) {
         console.error('Erro ao gerar Excel:', error);
         window.estoqueManager?.showToast('Erro ao gerar Excel. Tente novamente.', 'error');
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
      if (!btn) return;

      const originalText = btn.innerHTML;

      try {
         // Desabilita botão
         btn.disabled = true;
         btn.innerHTML = `
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Exportando...
         `;

         // Obtém dados filtrados da tabela
         const filteredData = this.getFilteredTableData();

         if (filteredData.length === 0) {
            window.estoqueManager?.showToast('Nenhum dado para exportar. Aplique filtros ou verifique se há dados na tabela.', 'warning');
            return;
         }

         // Gera PDF no frontend com dados filtrados
         this.generatePDFFile(filteredData);

         window.estoqueManager?.showToast(`PDF gerado com sucesso! ${filteredData.length} item(ns) exportado(s)`, 'success');

      } catch (error) {
         console.error('Erro ao gerar PDF:', error);
         window.estoqueManager?.showToast('Erro ao gerar PDF. Tente novamente.', 'error');
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
      const estoqueManager = window.estoqueManager;
      if (!estoqueManager || !estoqueManager.dataTable) {
         console.warn('Tabela não inicializada, retornando dados originais');
         return estoqueManager?.data || [];
      }

      // Obtém dados filtrados da DataTable
      const filteredData = [];
      const dataTable = estoqueManager.dataTable;

      // Itera sobre todas as linhas visíveis (considerando paginação e filtros)
      dataTable.rows({ search: 'applied' }).every(function() {
         const rowData = this.data();
         filteredData.push(rowData);
      });

      console.log(`Exportando ${filteredData.length} itens filtrados de ${estoqueManager.data.length} total`);
      return filteredData;
   }

   /**
    * Gera arquivo Excel no frontend
    */
   static generateExcelFile(data) {
      // Usar SheetJS (XLSX) para gerar Excel no frontend
      if (typeof XLSX === 'undefined') {
         console.error('Biblioteca XLSX não encontrada');
         window.estoqueManager?.showToast('Biblioteca XLSX não encontrada. Verifique se está incluída no HTML.', 'error');
         return;
      }

      const workbook = XLSX.utils.book_new();

      // Preparar dados para Excel com colunas específicas do estoque
      const excelData = data.map(item => ({
         'Armazém': item.nomarm || '',
         'Produto': item.nompro || '',
         'Lote': item.lote || '',
         'Ref Cliente': item.refcli || '',
         'Vlr Unit NF': item.vlrunitnf || 0,
         'N° NF': item.nonf || '',
         'Container': item.container || '',
         'Disponível': item.disponivel || 0,
         'Peso Líq. Disponível': item.pesoliqdisp || 0,
         'Código Produto': item.nopro || '',
         'Código Armazém': item.noarm || '',
         'N° OS': item.noos || '',
         'Item': item.item || '',
         'N° Cliente': item.nocli || '',
         'Código Cliente': item.codcli || '',
         'Vlr Unit': item.vlwunit || 0,
         'KG Entrada': item.kg_ent || 0,
         'Peso CX': item.pesocx || 0,
         'Peso Líquido': item.pesoliq || 0,
         'KG Entrada Líquido': item.kg_entliq || 0,
         'Unidade': item.nomun || '',
         'Data Validade': item.datavalidade ? new Date(item.datavalidade).toLocaleDateString('pt-BR') : '',
         'Nome Cliente': item.nomcli || '',
         'Data Movimento': item.datamov ? new Date(item.datamov).toLocaleDateString('pt-BR') : '',
         'Fator Conversão': item.fatorconv || 0,
         'Qtde Reservada': item.qtdereserv || 0,
         'Peso Bruto Disponível': item.pesobrdisp || 0,
         'Vlr Mercadoria': item.vlrmerc || 0,
         'Quantidade': item.qtde || 0,
         'Padrão FC': item.padraofc || '',
         'Padrão FC Descrição': item.padraofcdescr || '',
         'Metros': item.metros || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Ajustar largura das colunas
      const colWidths = [
         { wch: 20 }, // Armazém
         { wch: 40 }, // Produto
         { wch: 15 }, // Lote
         { wch: 15 }, // Ref Cliente
         { wch: 12 }, // Vlr Unit NF
         { wch: 12 }, // N° NF
         { wch: 15 }, // Container
         { wch: 12 }, // Disponível
         { wch: 18 }, // Peso Líq. Disponível
         { wch: 15 }, // Código Produto
         { wch: 15 }, // Código Armazém
         { wch: 10 }, // N° OS
         { wch: 8 },  // Item
         { wch: 12 }, // N° Cliente
         { wch: 15 }, // Código Cliente
         { wch: 12 }, // Vlr Unit
         { wch: 12 }, // KG Entrada
         { wch: 10 }, // Peso CX
         { wch: 12 }, // Peso Líquido
         { wch: 18 }, // KG Entrada Líquido
         { wch: 10 }, // Unidade
         { wch: 15 }, // Data Validade
         { wch: 30 }, // Nome Cliente
         { wch: 15 }, // Data Movimento
         { wch: 15 }, // Fator Conversão
         { wch: 12 }, // Qtde Reservada
         { wch: 18 }, // Peso Bruto Disponível
         { wch: 15 }, // Vlr Mercadoria
         { wch: 12 }, // Quantidade
         { wch: 12 }, // Padrão FC
         { wch: 25 }, // Padrão FC Descrição
         { wch: 10 }  // Metros
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Gestao Estoque');

      // Gerar arquivo e fazer download
      const filename = `gestao_estoque_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
   }

   /**
    * Gera arquivo PDF no frontend com design profissional (padrão MM Softwares)
    */
   static generatePDFFile(data) {
      try {
         // Tentar diferentes formas de acessar jsPDF
         const jsPDF = window.jspdf?.jsPDF || window.jsPDF || window.jsPdf;

         if (!jsPDF) {
            window.estoqueManager?.showToast('Biblioteca jsPDF não encontrada. Verifique se está incluída no HTML.', 'error');
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
         const margin = 15;
         let currentY = 20;

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
         const filename = `gestao_estoque_${new Date().toISOString().split('T')[0]}.pdf`;
         doc.save(filename);

      } catch (error) {
         console.error('Erro ao gerar PDF:', error);
         console.error('Stack trace:', error.stack);
         console.error('Tipo do erro:', error.name);
         console.error('Objetos PDF disponíveis no window:', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));

         window.estoqueManager?.showToast(`Erro ao gerar PDF: ${error.message}. Verifique o console para mais detalhes.`, 'error');
      }
   }   /**
    * Cria o cabeçalho principal do PDF (padrão MM Softwares)
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
      doc.text('RELATÓRIO DE GESTÃO DE ESTOQUE', pageWidth / 2, startY, { align: 'center' });

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
      const stats = this.calculateEstoqueStats(data);

      // Informações do estoque
      doc.text(`Total de itens: ${data.length}`, margin, currentY);

      doc.setTextColor(40, 167, 69);
      doc.text(`Com estoque: ${stats.comEstoque}`, margin + 70, currentY);

      doc.setTextColor(255, 193, 7);
      doc.text(`Estoque baixo: ${stats.estoqueBaixo}`, margin + 150, currentY);

      doc.setTextColor(220, 53, 69);
      doc.text(`Sem estoque: ${stats.semEstoque}`, margin + 230, currentY);

      // Voltar para cor preta
      doc.setTextColor(0, 0, 0);

      return currentY;
   }

   /**
    * Calcula estatísticas dos dados de estoque
    */
   static calculateEstoqueStats(data) {
      return data.reduce((stats, item) => {
         const disponivel = parseFloat(item.disponivel) || 0;
         if (disponivel > 10) {
            stats.comEstoque++;
         } else if (disponivel > 0) {
            stats.estoqueBaixo++;
         } else {
            stats.semEstoque++;
         }
         return stats;
      }, { comEstoque: 0, estoqueBaixo: 0, semEstoque: 0 });
   }

   /**
    * Adiciona rodapé do PDF (padrão MM Softwares)
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
         doc.text('MM Softwares - Sistema de Gestão de Estoque', margin, pageHeight - 8);

         // Centro: Data
         const now = new Date();
         doc.text(`Relatório gerado em ${now.toLocaleDateString('pt-BR')}`, pageWidth / 2, pageHeight - 8, { align: 'center' });

         // Direita: Numeração
         doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      }
   }   /**
    * Cria a tabela principal do PDF com quebra de linha automática (padrão MM Softwares)
    */
   static createPDFTable(doc, data, margin, startY, pageWidth, pageHeight) {
      const headers = [
         'Armazém', 'Produto', 'Lote', 'Ref Cliente', 'Vlr Unit NF',
         'N° NF', 'Container', 'Disponível'
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
      doc.setFontSize(9);
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
      doc.setFontSize(8);
      const baseRowHeight = 10;

      data.forEach((item, index) => {
         // Preparar dados da linha
         const rowData = [
            item.nomarm || '',
            item.nompro || '',
            item.lote || '',
            item.refcli || '',
            this.formatCurrency(item.vlrunitnf),
            item.nonf || '',
            item.container || '',
            this.formatNumber(item.disponivel, 2)
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
            const availableTextWidth = cellWidth - 4;

            // Configurar fonte baseada na coluna
            if (colIndex === 7) { // Disponível
               const disponivel = parseFloat(item.disponivel) || 0;
               if (disponivel > 10) {
                  doc.setTextColor(40, 167, 69); // Verde
               } else if (disponivel > 0) {
                  doc.setTextColor(255, 193, 7); // Amarelo
               } else {
                  doc.setTextColor(220, 53, 69); // Vermelho
               }
               doc.setFont('helvetica', 'bold');
               doc.setFontSize(8);
            } else {
               doc.setTextColor(0, 0, 0);
               doc.setFont('helvetica', 'normal');
               doc.setFontSize(8);
            }

            // Tratamento especial por tipo de coluna
            let lines;
            if (colIndex === 1) { // Produto: truncar em uma linha
               lines = [this.truncateTextToFit(doc, text.toString(), availableTextWidth)];
            } else if (colIndex === 6) { // Container: sempre mostrar completo
               const fullText = text.toString();
               if (doc.getTextWidth(fullText) > availableTextWidth) {
                  doc.setFontSize(6);
                  if (doc.getTextWidth(fullText) > availableTextWidth) {
                     doc.setFontSize(5);
                  }
               }
               lines = [fullText];
            } else {
               lines = this.wrapText(doc, text.toString(), availableTextWidth);
            }

            // Calcular posição Y para centralização vertical
            const totalTextHeight = lines.length * 3;
            const startY = currentY + (rowHeight - totalTextHeight) / 2 + 3;

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

         currentY += rowHeight;
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
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');

      let currentX = margin;
      headers.forEach((header, index) => {
         const cellWidth = colWidths[index];
         const textWidth = doc.getTextWidth(header);
         const textX = currentX + (cellWidth - textWidth) / 2;
         const textY = currentY + headerHeight / 2 + 2;

         doc.text(header, textX, textY);
         currentX += cellWidth;
      });
   }

   /**
    * Calcula larguras ótimas das colunas baseadas no conteúdo
    */
   static calculateOptimalColumnWidths(doc, headers, data, pageWidth, margin) {
      const availableWidth = pageWidth - (margin * 2);

      // Prioridades para cada coluna (1 = baixa, 3 = alta)
      const priorities = [2, 3, 1, 1, 2, 1, 2, 2]; // Armazém, Produto(alta), Lote, Ref, Vlr, NF, Container, Disponível

      // Larguras mínimas
      const minWidths = [20, 40, 15, 15, 20, 15, 20, 18];

      // Se não cabe nem o mínimo, usar proporções das prioridades
      const totalPriority = priorities.reduce((sum, p) => sum + p, 0);
      return priorities.map(priority => (availableWidth * priority) / totalPriority);
   }

   /**
    * Calcula altura necessária para uma linha considerando quebras de texto
    */
   static calculateRowHeight(doc, rowData, colWidths, baseHeight) {
      let maxLines = 1;

      rowData.forEach((text, colIndex) => {
         const availableTextWidth = colWidths[colIndex] - 4;

         if (colIndex === 1 || colIndex === 6) { // Produto ou Container: máximo 1 linha
            maxLines = Math.max(maxLines, 1);
         } else {
            doc.setFontSize(8);
            const lines = this.wrapText(doc, text.toString(), availableTextWidth);
            maxLines = Math.max(maxLines, lines.length);
         }
      });

      return Math.max(baseHeight, maxLines * 3 + 4);
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
            if (currentLine) {
               lines.push(currentLine);
               currentLine = word;
            } else {
               const truncated = this.truncateTextToFit(doc, word, maxWidth);
               lines.push(truncated);
               currentLine = '';
            }
         }
      }

      if (currentLine) {
         lines.push(currentLine);
      }

      return lines.slice(0, 3); // Limitar a 3 linhas por célula
   }

   /**
    * Trunca texto para caber na largura disponível
    */
   static truncateTextToFit(doc, text, maxWidth) {
      if (!text) return '';

      const originalText = text.toString().trim();
      let currentText = originalText;

      if (doc.getTextWidth(currentText) <= maxWidth) {
         return currentText;
      }

      const ellipsis = '...';
      const ellipsisWidth = doc.getTextWidth(ellipsis);

      for (let i = originalText.length - 1; i > 0; i--) {
         const truncated = originalText.substring(0, i) + ellipsis;
         if (doc.getTextWidth(truncated) <= maxWidth) {
            return truncated;
         }
      }

      return ellipsis;
   }

   /**
    * Obtém a cor da empresa do localStorage ou usa verde como fallback
    */
   static getCompanyColor() {
      try {
         const companyData = localStorage.getItem('company');
         if (companyData) {
            const company = JSON.parse(companyData);
            if (company.primaryColor) {
               return this.hexToRgb(company.primaryColor);
            }
         }
      } catch (error) {
         console.warn('Erro ao obter cor da empresa:', error);
      }

      return [40, 167, 69]; // Verde Material Design (fallback)
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
      ] : [40, 167, 69];
   }

   /**
    * Formata valores monetários
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
    * Formata números
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
         scrollCollapse: false,
         colReorder: true,
         dom: '<"row"<"col-sm-6"l><"col-sm-6"f>>' +
              '<"row"<"col-sm-12"tr>>' +
              '<"row"<"col-sm-5"i><"col-sm-7"p>>',
         order: [[7, 'desc']]
      });

      // Initialize filter manager
      this.filterManager = new FilterManager(this.dataTable);
      this.filterManager.populateFilterOptions(this.data);

      console.log('✅ DataTable inicializado');
   }

   /**
    * Cria a instância do DataTable (padrão MM Softwares simplificado)
    */
   createDataTable() {
      const visibleColumns = this.columnManager.getVisibleColumns();

      // Configure columns
      const columns = visibleColumns.map(col => ({
         data: col.key,
         title: col.name || col.key,
         className: col.className || '',
         render: (data, type, row) => {
            if (type === 'display' || type === 'type') {
               return this.formatCellData(data, col.key);
            }
            return data;
         }
      }));

      // Initialize DataTable
      this.dataTable = $('#estoque-table').DataTable({
         data: this.data,
         columns: columns,
         pageLength: 25,
         lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'Todos']],
         language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
         },
         responsive: true,
         scrollX: true,
         dom: '<"row"<"col-sm-6"l><"col-sm-6"f>>' +
              '<"row"<"col-sm-12"tr>>' +
              '<"row"<"col-sm-5"i><"col-sm-7"p>>',
         order: [[0, 'asc']]
      });

      // Initialize filter manager
      this.filterManager = new FilterManager(this.dataTable);
      this.filterManager.populateFilterOptions(this.data);
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
         this.updateTableColumns();
         const modal = bootstrap.Modal.getInstance(document.getElementById('modal-column-settings'));
         if (modal) modal.hide();
         this.showToast('Configurações salvas!', 'success');
      });

      document.getElementById('btn-reset-columns')?.addEventListener('click', () => {
         this.columnManager.resetToDefault();
         this.columnManager.initializeColumnSettings();
         this.updateTableColumns();
         this.showToast('Configurações restauradas!', 'info');
      });

      // Export
      document.querySelectorAll('[data-export]').forEach(btn => {
         btn.addEventListener('click', (e) => {
            e.preventDefault();
            const format = btn.dataset.export;
            if (format === 'excel') {
               ExportManager.exportToExcel();
            } else if (format === 'pdf') {
               ExportManager.exportToPDF();
            }
         });
      });
   }

   /**
    * Atualiza colunas da tabela (padrão MM Softwares)
    */
   updateTableColumns() {
      if (this.dataTable) {
         // Destruir tabela
         this.dataTable.destroy();

         // Limpar completamente o HTML da tabela
         const table = document.getElementById('estoque-table');
         table.innerHTML = `
            <thead>
               <tr></tr>
            </thead>
            <tbody></tbody>
         `;

         // Reinicializar com novos dados
         this.initializeDataTable();
      }
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
