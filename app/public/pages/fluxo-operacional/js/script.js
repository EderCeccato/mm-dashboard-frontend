/**
 * Fluxo Operacional - Sistema completo de gerenciamento de fluxos logísticos
 * Inclui: Lista com filtros, gerenciador de colunas, modal de detalhes e notificações
 * MM Softwares - Versão Refatorada e Comentada
 */

// ===== CLASSE DE UTILITÁRIOS E DADOS =====
/**
 * Classe responsável por gerenciar dados e operações utilitárias
 * Fornece dados de exemplo e funções auxiliares para cálculos
 */
class DataUtils {
   /**
    * Gera dados de exemplo para demonstração do sistema
    * @returns {Array} Array com objetos representando itens do fluxo operacional
    */
   static getSampleData() {
      // Função helper para criar um item base com valores padrão
      const buildItem = (overrides = {}) => ({
         pedido: 'FLX-0001',                    // Código do pedido
         cliente: 'Cliente Exemplo',            // Nome do cliente
         descricao_fluxo: 'Fluxo padrão de operação',  // Descrição do processo
         processo_cliente: 'PROC-CL-0001',      // Código do processo do cliente
         container: 'MSKU1234567',              // Código do container
         cavalo: 'ABC-1A23',                    // Placa do cavalo mecânico
         reboque: 'DEF-4B56',                   // Placa do reboque
         tipo_frete: 'CIF',                     // Tipo de frete (CIF/FOB)
         tipo_carga: 'CONTAINER',               // Tipo da carga
         rota: 'Origem → Destino',              // Rota de transporte
         contrato: 'CTR-2025-001',              // Código do contrato
         usuario_responsavel: 'Operador 1',     // Usuário responsável
         data_inicio: '2025-01-15T08:00:00',    // Data/hora de início
         data_fim: '2025-01-20T18:00:00',       // Data/hora de fim
         // Lista de tarefas do fluxo com status de conclusão
         tarefas: [
            { nome: 'Receber pedido', concluida: true },
            { nome: 'Programar coleta', concluida: true },
            { nome: 'Vincular veículo', concluida: false },
            { nome: 'Carregar', concluida: false },
            { nome: 'Transporte', concluida: false },
            { nome: 'Entrega', concluida: false }
         ],
         ...overrides  // Sobrescreve valores específicos
      });

      // Array com dados de exemplo variados
      const rawData = [
         // Item 1: Importação do Porto de Santos
         buildItem({
            pedido: 'FLX-0001',
            cliente: 'ABC Importadora',
            descricao_fluxo: 'Importação - Porto de Santos',
            processo_cliente: 'IMP-2025-001',
            rota: 'Santos/SP → Guarulhos/SP',
            usuario_responsavel: 'Ana Lima',
            data_inicio: '2025-01-10T08:00:00',
            data_fim: '2025-09-20T18:00:00',
            tarefas: [
               { nome: 'Receber pedido', concluida: true },
               { nome: 'Programar coleta', concluida: true },
               { nome: 'Vincular veículo', concluida: true },
               { nome: 'Carregar', concluida: false },
               { nome: 'Transporte', concluida: false },
               { nome: 'Entrega', concluida: false }
            ]
         }),
         // Item 2: Transferência CD → Loja
         buildItem({
            pedido: 'FLX-0002',
            cliente: 'XYZ Comercial',
            descricao_fluxo: 'Transferência CD → Loja',
            processo_cliente: 'TRF-2025-014',
            container: '',  // Sem container
            tipo_carga: 'CARGA GERAL',
            tipo_frete: 'FOB',
            rota: 'Campinas/SP → São Paulo/SP',
            usuario_responsavel: 'Bruno Souza',
            data_inicio: '2025-01-15T08:00:00',
            data_fim: '2025-01-16T20:00:00',
            tarefas: [
               { nome: 'Separação', concluida: true },
               { nome: 'Conferência', concluida: true },
               { nome: 'Carregar', concluida: true },
               { nome: 'Transporte', concluida: true },
               { nome: 'Entrega', concluida: false }
            ]
         }),
         // Item 3: Produtos químicos perigosos
         buildItem({
            pedido: 'FLX-0003',
            cliente: 'Perigosos Express',
            descricao_fluxo: 'Químicos - Rotas especiais',
            processo_cliente: 'QMC-2025-007',
            container: 'HAZM5555555',
            tipo_carga: 'PERIGOSA',
            rota: 'Paulínia/SP → Duque de Caxias/RJ',
            usuario_responsavel: 'Carla Dias',
            data_inicio: '2025-01-12T07:00:00',
            data_fim: '2025-01-13T19:00:00'
         }),
         // Item 4: Granel sólido
         buildItem({
            pedido: 'FLX-0004',
            cliente: 'Graneleiros Sul',
            descricao_fluxo: 'Granel sólido',
            processo_cliente: 'GRN-2025-003',
            container: '',  // Granel não usa container
            tipo_carga: 'GRANEL',
            rota: 'Vitória/ES → Salvador/BA',
            usuario_responsavel: 'Diego Alves',
            data_inicio: '2025-01-08T09:00:00',
            data_fim: '2025-01-25T18:00:00'
         }),
         // Item 5: Carga refrigerada
         buildItem({
            pedido: 'FLX-0005',
            cliente: 'Supermercados Brasil',
            descricao_fluxo: 'Refrigerados - rota Norte',
            processo_cliente: 'REF-2025-010',
            container: 'TCLU9876543',
            tipo_carga: 'REFRIGERADA',
            rota: 'Campinas/SP → Brasília/DF',
            usuario_responsavel: 'Eduardo Lima',
            data_inicio: '2025-01-17T08:00:00',
            data_fim: '2025-01-21T18:00:00'
         })
      ];

      // Enriquece cada item com dados calculados (posição, percentual, situação)
      return rawData.map(item => this.enrichItemData(item));
   }

   /**
    * Enriquece um item com dados calculados baseados nas tarefas
    * @param {Object} item - Item a ser enriquecido
    * @returns {Object} Item com dados adicionais calculados
    */
   static enrichItemData(item) {
      // Calcula estatísticas das tarefas
      const { concluidas, total, percentual } = this.calculateTasks(item.tarefas);
      // Determina a situação baseada nas datas e progresso
      const situacao = this.calculateSituacao(item.data_inicio, item.data_fim, percentual);

      return {
         ...item,
         posicao_fluxo: `${concluidas}/${total}`,  // Formato "3/6"
         percentual,                               // Percentual de conclusão
         situacao                                  // Status do fluxo
      };
   }

   /**
    * Calcula estatísticas das tarefas de um item
    * @param {Array} tarefas - Lista de tarefas
    * @returns {Object} Objeto com totais e percentual
    */
   static calculateTasks(tarefas) {
      // Validação: se não for array, retorna zeros
      if (!Array.isArray(tarefas)) return { concluidas: 0, total: 0, percentual: 0 };

      const total = tarefas.length;  // Total de tarefas
      // Conta tarefas marcadas como concluídas
      const concluidas = tarefas.filter(t => t.concluida).length;
      // Calcula percentual (arredonda para inteiro)
      const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;

      return { concluidas, total, percentual };
   }

   /**
    * Determina a situação de um fluxo baseado nas datas e progresso
    * @param {string} dataInicioISO - Data de início em formato ISO
    * @param {string} dataFimISO - Data de fim em formato ISO
    * @param {number} percentual - Percentual de conclusão
    * @returns {string} Situação do fluxo
    */
   static calculateSituacao(dataInicioISO, dataFimISO, percentual) {
      const now = new Date();           // Data/hora atual
      const inicio = new Date(dataInicioISO);  // Data de início
      const fim = new Date(dataFimISO);        // Data de fim

      // Se 100% concluído, está concluída
      if (percentual >= 100) return 'Concluída';

      // Se passou do prazo, está vencida
      if (now > fim) return 'Vencida';

      // Calcula ponto médio do prazo
      const metade = new Date(inicio.getTime() + (fim.getTime() - inicio.getTime()) / 2);

      // Se passou da metade do prazo, está em atenção
      return now >= metade ? 'Em atenção' : 'No prazo';
   }

   /**
    * Formata data ISO para formato brasileiro com horário
    * @param {string} dateISO - Data em formato ISO
    * @returns {string} Data formatada (dd/mm/aaaa hh:mm)
    */
   static formatDate(dateISO) {
      const date = new Date(dateISO);
      // Função helper para adicionar zero à esquerda
      const pad = (n) => String(n).padStart(2, '0');

      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
   }

   /**
    * Extrai valores únicos de um campo específico dos dados
    * @param {Array} data - Array de dados
    * @param {string} field - Nome do campo
    * @returns {Array} Array com valores únicos ordenados
    */
   static getUniqueValues(data, field) {
      return [...new Set(data.map(item => item[field]))]  // Remove duplicatas
         .filter(Boolean)  // Remove valores falsy (null, undefined, "")
         .sort();          // Ordena alfabeticamente
   }
}

// ===== GERENCIADOR DE COLUNAS =====
/**
 * Classe responsável por gerenciar a configuração e exibição das colunas da tabela
 * Permite mostrar/ocultar colunas e reordenar através de drag & drop
 */
class ColumnManager {
   constructor() {
      // Configuração padrão das colunas com ordem e visibilidade
      this.defaultColumns = [
         { key: 'acoes', name: 'Ações', visible: true, order: 0 },
         { key: 'pedido', name: 'Pedido', visible: true, order: 1 },
         { key: 'cliente', name: 'Cliente', visible: true, order: 2 },
         { key: 'descricao_fluxo', name: 'Descrição Fluxo', visible: true, order: 3 },
         { key: 'posicao_fluxo', name: 'Posição', visible: true, order: 4 },
         { key: 'percentual', name: '%', visible: true, order: 5 },
         { key: 'container', name: 'Container', visible: true, order: 6 },
         { key: 'tipo_frete', name: 'Tipo Frete', visible: true, order: 7 },
         { key: 'tipo_carga', name: 'Tipo Carga', visible: true, order: 8 },
         { key: 'rota', name: 'Rota', visible: true, order: 9 },
         { key: 'usuario_responsavel', name: 'Usuário Resp.', visible: true, order: 10 },
         { key: 'data_inicio', name: 'Início', visible: true, order: 11 },
         { key: 'data_fim', name: 'Fim', visible: true, order: 12 },
         { key: 'situacao', name: 'Situação', visible: true, order: 13 },
         // Colunas inicialmente ocultas
         { key: 'processo_cliente', name: 'Proc. Cliente', visible: false, order: 14 },
         { key: 'cavalo', name: 'Cavalo', visible: false, order: 15 },
         { key: 'reboque', name: 'Reboque', visible: false, order: 16 },
         { key: 'contrato', name: 'Contrato', visible: false, order: 17 }
      ];

      // Carrega configurações salvas ou usa padrão
      this.columns = this.loadSettings();
      this.sortable = null;  // Instância do SortableJS para reordenação
   }

   /**
    * Carrega configurações das colunas do localStorage
    * @returns {Array} Configurações das colunas
    */
   loadSettings() {
      const saved = localStorage.getItem('fluxo-column-settings');
      return saved ? JSON.parse(saved) : [...this.defaultColumns];
   }

   /**
    * Salva as configurações atuais das colunas no localStorage
    */
   saveSettings() {
      localStorage.setItem('fluxo-column-settings', JSON.stringify(this.columns));
   }

   /**
    * Retorna apenas as colunas marcadas como visíveis, ordenadas
    * @returns {Array} Array de colunas visíveis ordenadas
    */
   getVisibleColumns() {
      return this.columns
         .filter(col => col.visible)           // Apenas visíveis
         .sort((a, b) => a.order - b.order);   // Ordenadas por order
   }

   /**
    * Encontra o índice de uma coluna na lista de colunas visíveis
    * @param {string} key - Chave da coluna
    * @returns {number} Índice da coluna (-1 se não encontrada)
    */
   getColumnIndex(key) {
      const visibleColumns = this.getVisibleColumns();
      return visibleColumns.findIndex(col => col.key === key);
   }

   /**
    * Restaura as configurações para o padrão original
    */
   resetToDefault() {
      this.columns = [...this.defaultColumns];
   }

   /**
    * Atualiza a visibilidade de uma coluna específica
    * @param {string} key - Chave da coluna
    * @param {boolean} visible - Se deve estar visível
    */
   updateColumnVisibility(key, visible) {
      const column = this.columns.find(col => col.key === key);
      if (column) column.visible = visible;
   }

   /**
    * Renderiza a lista de colunas no modal de configurações
    * Cria checkboxes e elementos arrastáveis para cada coluna
    */
   renderColumnList() {
      const columnList = document.getElementById('column-list');
      if (!columnList) return;

      // Ordena colunas pela ordem definida
      const sortedColumns = [...this.columns].sort((a, b) => a.order - b.order);

      // Gera HTML para cada coluna
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

      // Vincula eventos e inicializa funcionalidade de arrastar
      this.bindColumnEvents();
      this.initializeSortable();
   }

   /**
    * Vincula eventos dos checkboxes de visibilidade das colunas
    */
   bindColumnEvents() {
      const checkboxes = document.querySelectorAll('.column-visibility-toggle');
      checkboxes.forEach(checkbox => {
         checkbox.addEventListener('change', (e) => {
            const columnKey = e.target.getAttribute('data-column');
            this.updateColumnVisibility(columnKey, e.target.checked);
         });
      });
   }

   /**
    * Inicializa a funcionalidade de reordenação por arrastar e soltar
    * Usa a biblioteca SortableJS se disponível
    */
   initializeSortable() {
      const columnList = document.getElementById('column-list');
      if (!columnList || typeof Sortable === 'undefined') return;

      this.sortable = new Sortable(columnList, {
         animation: 150,                    // Animação de 150ms
         ghostClass: 'sortable-ghost',      // Classe do elemento fantasma
         chosenClass: 'sortable-chosen',    // Classe do elemento escolhido
         handle: '.bi-grip-vertical',       // Só permite arrastar pelo ícone
         onEnd: (evt) => this.handleSortEnd(evt)  // Callback ao terminar
      });
   }

   /**
    * Manipula o evento de fim de reordenação
    * Atualiza a ordem das colunas baseado na nova posição
    * @param {Event} evt - Evento do SortableJS
    */
   handleSortEnd(evt) {
      const columnKey = evt.item.getAttribute('data-column');
      const newIndex = evt.newIndex;    // Nova posição
      const oldIndex = evt.oldIndex;    // Posição anterior

      // Reordena as colunas no array
      const sortedColumns = [...this.columns].sort((a, b) => a.order - b.order);
      const movedColumn = sortedColumns.splice(oldIndex, 1)[0];  // Remove da posição antiga
      sortedColumns.splice(newIndex, 0, movedColumn);            // Insere na nova posição

      // Atualiza a propriedade order de todas as colunas
      sortedColumns.forEach((column, index) => {
         column.order = index;
      });
   }
}

// ===== GERENCIADOR DE FILTROS =====
/**
 * Classe responsável por gerenciar todos os filtros da aplicação
 * Inclui filtros por dropdowns, campos texto e seletor de datas
 */
class FilterManager {
   constructor(data) {
      this.data = data;                 // Dados para extrair opções dos filtros
      this.dateRangePicker = null;      // Instância do Flatpickr para datas
   }

   /**
    * Popula todos os dropdowns de filtro com valores únicos dos dados
    * Extrai valores únicos de cada campo e preenche os selects
    */
   populateFilterOptions() {
      // Extrai valores únicos de cada campo
      const clientes = DataUtils.getUniqueValues(this.data, 'cliente');
      const tiposCarga = DataUtils.getUniqueValues(this.data, 'tipo_carga');
      const tiposFrete = DataUtils.getUniqueValues(this.data, 'tipo_frete');
      const usuarios = DataUtils.getUniqueValues(this.data, 'usuario_responsavel');
      const contratos = DataUtils.getUniqueValues(this.data, 'contrato');

      // Preenche cada dropdown
      this.fillSelectOptions('filter-cliente', clientes);
      this.fillSelectOptions('filter-tipo-carga', tiposCarga);
      this.fillSelectOptions('filter-tipo-frete', tiposFrete);
      this.fillSelectOptions('filter-usuario', usuarios);
      this.fillSelectOptions('filter-contrato', contratos);
   }

   /**
    * Preenche um elemento select com opções
    * @param {string} elementId - ID do elemento select
    * @param {Array} values - Array de valores para as opções
    * @param {string} placeholder - Texto da primeira opção (padrão)
    */
   fillSelectOptions(elementId, values, placeholder = 'Todos') {
      const element = document.getElementById(elementId);
      if (!element) return;

      // Gera HTML das opções (primeira opção vazia + valores)
      element.innerHTML = `<option value="">${placeholder}</option>` +
         values.map(value => `<option value="${value}">${value}</option>`).join('');
   }

   /**
    * Inicializa o seletor de intervalo de datas usando Flatpickr
    * Configura para modo range (intervalo) e localização em português
    */
   initializeDateRangePicker() {
      const dateRangeInput = document.getElementById('filter-date-range');
      if (!dateRangeInput || typeof flatpickr === 'undefined') return;

      // Configura o Flatpickr
      this.dateRangePicker = flatpickr(dateRangeInput, {
         mode: 'range',          // Modo de seleção de intervalo
         dateFormat: 'd/m/Y',    // Formato brasileiro
         locale: 'pt'            // Localização portuguesa
      });

      // Permite clicar no ícone para abrir o calendário
      const iconElement = dateRangeInput.nextElementSibling?.querySelector('i');
      if (iconElement) {
         iconElement.style.cursor = 'pointer';
         iconElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dateRangePicker?.open();  // Abre o calendário
         });
      }
   }

   /**
    * Coleta todos os valores dos filtros ativos
    * @returns {Object} Objeto com todos os valores dos filtros
    */
   getFilterValues() {
      return {
         situacao: document.getElementById('filter-situacao')?.value || '',
         cliente: document.getElementById('filter-cliente')?.value || '',
         tipoCarga: document.getElementById('filter-tipo-carga')?.value || '',
         tipoFrete: document.getElementById('filter-tipo-frete')?.value || '',
         container: document.getElementById('filter-container')?.value || '',
         processoCliente: document.getElementById('filter-processo-cliente')?.value || '',
         cavalo: document.getElementById('filter-cavalo')?.value || '',
         reboque: document.getElementById('filter-reboque')?.value || '',
         usuario: document.getElementById('filter-usuario')?.value || '',
         contrato: document.getElementById('filter-contrato')?.value || '',
         dateRange: document.getElementById('filter-date-range')?.value || ''
      };
   }

   /**
    * Limpa todos os filtros (reseta formulário e filtro de data)
    */
   clearFilters() {
      document.getElementById('filters-form')?.reset();  // Reseta o formulário
      this.clearDateFilter();                            // Remove filtro de data customizado
   }

   /**
    * Remove filtros de data customizados do DataTables
    * Os filtros de data são adicionados ao array global do DataTables
    */
   clearDateFilter() {
      // Remove funções de filtro de data do DataTables
      $.fn.dataTable.ext.search = $.fn.dataTable.ext.search?.filter(fn => !fn.__fluxoDateFilter) || [];
   }

   /**
    * Aplica filtro de data customizado no DataTables
    * @param {string} dateRangeStr - String com intervalo de datas ("dd/mm/yyyy a dd/mm/yyyy")
    */
   applyDateFilter(dateRangeStr) {
      this.clearDateFilter();  // Remove filtros anteriores

      // Verifica se há um intervalo de datas válido
      if (!dateRangeStr || !dateRangeStr.includes(' a ')) return;

      // Parse das datas
      const [startStr, endStr] = dateRangeStr.split(' a ').map(s => s.trim());
      const parseDate = (dateStr) => {
         const [day, month, year] = dateStr.split('/').map(Number);
         return new Date(year, month - 1, day, 0, 0, 0);  // Início do dia
      };

      const startDate = parseDate(startStr);
      // Data fim: final do dia (23:59:59.999)
      const endDate = new Date(parseDate(endStr).getTime() + 24 * 60 * 60 * 1000 - 1);

      // Função de filtro customizada para o DataTables
      const dateFilter = (settings, data, dataIndex) => {
         const item = window.fluxoManager.dataTable.row(dataIndex).data();
         const itemDate = new Date(item.data_inicio);
         return itemDate >= startDate && itemDate <= endDate;
      };

      // Marca a função para identificação posterior
      dateFilter.__fluxoDateFilter = true;
      // Adiciona ao sistema de filtros do DataTables
      $.fn.dataTable.ext.search.push(dateFilter);
   }
}

// ===== GERENCIADOR DA TABELA =====
/**
 * Classe responsável por gerenciar a tabela principal (DataTables)
 * Controla criação, configuração, renderização e aplicação de filtros
 */
class TableManager {
   constructor(data, columnManager) {
      this.data = data;                    // Dados da tabela
      this.columnManager = columnManager;  // Gerenciador de colunas
      this.dataTable = null;              // Instância do DataTables
   }

   /**
    * Inicializa a tabela destruindo qualquer instância existente
    */
   initialize() {
      this.destroyExisting();    // Remove tabela anterior
      this.createDataTable();    // Cria nova instância
      this.bindTableEvents();    // Vincula eventos customizados
   }

   /**
    * Destrói instância existente do DataTables se houver
    */
   destroyExisting() {
      const table = $('#tms-table');
      if ($.fn.DataTable.isDataTable(table)) {
         table.DataTable().destroy();
      }
   }

   /**
    * Cria e configura uma nova instância do DataTables
    */
   createDataTable() {
      const columns = this.buildColumns();           // Constrói configuração das colunas
      const defaultOrderIndex = this.getDefaultOrderIndex();  // Índice para ordenação padrão

      // Configuração completa do DataTables
      this.dataTable = $('#tms-table').DataTable({
         data: this.data,                             // Dados da tabela
         columns,                                     // Configuração das colunas
         pageLength: 10,                              // Registros por página
         lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'Todos']],  // Opções de paginação
         language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json' },  // Localização
         responsive: true,                            // Design responsivo
         scrollX: true,                              // Scroll horizontal
         scrollY: '400px',                           // Scroll vertical com altura fixa
         scrollCollapse: true,                       // Colapsa se menos dados
         // Layout dos controles da tabela
         dom: '<"row"<"col-sm-6"l><"col-sm-6"f>><"row"<"col-sm-12"tr>><"row"<"col-sm-5"i><"col-sm-7"p>>',
         order: defaultOrderIndex !== -1 ? [[defaultOrderIndex, 'desc']] : [],  // Ordenação inicial
         rowCallback: (row, data) => this.styleTableRow(row, data)  // Callback para estilizar linhas
      });
   }

   /**
    * Constrói a configuração das colunas para o DataTables
    * @returns {Array} Array de configurações de coluna
    */
   buildColumns() {
      const visibleColumns = this.columnManager.getVisibleColumns();

      return visibleColumns.map(col => {
         // Coluna de ações tem tratamento especial
         if (col.key === 'acoes') {
            return this.buildActionsColumn(col);
         }
         // Colunas de dados normais
         return this.buildDataColumn(col);
      });
   }

   /**
    * Constrói configuração para a coluna de ações
    * @param {Object} col - Configuração da coluna
    * @returns {Object} Configuração da coluna para DataTables
    */
   buildActionsColumn(col) {
      return {
         data: null,                    // Não vincula a nenhum campo
         title: col.name,               // Título da coluna
         orderable: false,              // Não permite ordenação
         width: '130px',                // Largura fixa
         className: 'text-center',      // Centraliza conteúdo
         // Renderiza botão de ações
         render: (data, type, row) => `
            <button type="button" class="btn btn-outline-primary btn-action"
                    title="Detalhes" onclick="fluxoManager.showDetails('${row.pedido}')">
               <i class="bi bi-list-check"></i>
            </button>
         `
      };
   }

   /**
    * Constrói configuração para colunas de dados normais
    * @param {Object} col - Configuração da coluna
    * @returns {Object} Configuração da coluna para DataTables
    */
   buildDataColumn(col) {
      return {
         data: col.key,                 // Campo dos dados a ser exibido
         title: col.name,               // Título da coluna
         // Função de renderização customizada para cada tipo de dado
         render: (data, type, row) => this.renderColumnData(col.key, data, row)
      };
   }

   /**
    * Renderiza dados das colunas com formatação específica por tipo
    * @param {string} key - Chave da coluna
    * @param {*} data - Dados do campo
    * @param {Object} row - Dados completos da linha
    * @returns {string} HTML renderizado para a célula
    */
   renderColumnData(key, data, row) {
      switch (key) {
         case 'percentual':
            return this.renderPercentage(row.percentual);  // Barra de progresso
         case 'data_inicio':
         case 'data_fim':
            return DataUtils.formatDate(data);             // Formatação de data
         case 'situacao':
            return this.renderSituationBadge(row.situacao); // Badge colorido
         default:
            return data || '-';                            // Valor ou traço se vazio
      }
   }

   /**
    * Renderiza uma barra de progresso para percentuais
    * @param {number} percentual - Valor percentual (0-100)
    * @returns {string} HTML da barra de progresso
    */
   renderPercentage(percentual) {
      const pct = Number(percentual) || 0;  // Garante que seja número
      return `
         <div class="progress" style="height:8px; min-width:90px;">
            <div class="progress-bar" role="progressbar" style="width:${pct}%"
                 aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
         </div>
         <small>${pct}%</small>
      `;
   }

   /**
    * Renderiza badge colorido para situações
    * @param {string} situacao - Situação do fluxo
    * @returns {string} HTML do badge
    */
   renderSituationBadge(situacao) {
      // Mapeamento de situação para classe CSS
      const badgeClasses = {
         'No prazo': 'bg-secondary',
         'Em atenção': 'bg-warning text-dark',
         'Vencida': 'bg-danger',
         'Concluída': 'bg-success'
      };

      const badgeClass = badgeClasses[situacao] || 'bg-secondary';
      return `<span class="badge ${badgeClass}">${situacao}</span>`;
   }

   /**
    * Aplica estilos visuais às linhas da tabela baseado na situação
    * @param {HTMLElement} row - Elemento da linha
    * @param {Object} data - Dados da linha
    */
   styleTableRow(row, data) {
      // Remove classes anteriores
      row.classList.remove('flow-warning', 'flow-overdue');

      // Se concluído, não aplica estilos especiais
      if (data.percentual >= 100) return;

      const now = new Date();
      const inicio = new Date(data.data_inicio);
      const fim = new Date(data.data_fim);
      const metade = new Date(inicio.getTime() + (fim.getTime() - inicio.getTime()) / 2);

      // Aplica classe baseada na situação temporal
      if (now > fim) {
         row.classList.add('flow-overdue');      // Vencida - vermelha
      } else if (now >= metade) {
         row.classList.add('flow-warning');      // Em atenção - amarela
      }
   }

   /**
    * Vincula eventos customizados à tabela
    * Inclui clique na linha e efeitos de hover
    */
   bindTableEvents() {
      const table = $('#tms-table');

      // Clique na linha abre modal de detalhes (exceto em botões)
      table.find('tbody').on('click', 'tr', (e) => {
         // Ignora clique em botões
         if ($(e.target).closest('button').length > 0) return;

         const data = this.dataTable.row(e.currentTarget).data();
         if (data) window.fluxoManager.showDetails(data.pedido);
      });

      // Efeitos de hover nas linhas
      table.find('tbody')
         .on('mouseenter', 'tr', function() {
            $(this).addClass('table-hover-effect');
         })
         .on('mouseleave', 'tr', function() {
            $(this).removeClass('table-hover-effect');
         });
   }

   /**
    * Determina qual coluna usar para ordenação padrão
    * @returns {number} Índice da coluna de pedido (-1 se não encontrada)
    */
   getDefaultOrderIndex() {
      const visibleColumns = this.columnManager.getVisibleColumns();
      return visibleColumns.findIndex(col => col.key === 'pedido');
   }

   /**
    * Aplica todos os filtros à tabela
    * @param {Object} filters - Objeto com valores dos filtros
    * @param {ColumnManager} columnManager - Gerenciador de colunas para mapear índices
    */
   applyFilters(filters, columnManager) {
      // Limpa pesquisas anteriores
      this.dataTable.search('').columns().search('');

      // Mapeia filtros para índices de colunas
      const columnMap = this.buildColumnMap(columnManager);
      // Aplica filtros individuais por coluna
      this.applyColumnFilters(filters, columnMap);
   }

   /**
    * Constrói mapeamento entre nomes de filtros e índices de colunas
    * @param {ColumnManager} columnManager - Gerenciador de colunas
    * @returns {Object} Objeto mapeando filtros para índices
    */
   buildColumnMap(columnManager) {
      return {
         'situacao': columnManager.getColumnIndex('situacao'),
         'cliente': columnManager.getColumnIndex('cliente'),
         'tipo_carga': columnManager.getColumnIndex('tipo_carga'),
         'tipo_frete': columnManager.getColumnIndex('tipo_frete'),
         'container': columnManager.getColumnIndex('container'),
         'processo_cliente': columnManager.getColumnIndex('processo_cliente'),
         'cavalo': columnManager.getColumnIndex('cavalo'),
         'reboque': columnManager.getColumnIndex('reboque'),
         'usuario_responsavel': columnManager.getColumnIndex('usuario_responsavel'),
         'contrato': columnManager.getColumnIndex('contrato')
      };
   }

   /**
    * Aplica filtros específicos a colunas individuais
    * @param {Object} filters - Valores dos filtros
    * @param {Object} columnMap - Mapeamento filtro->índice coluna
    */
   applyColumnFilters(filters, columnMap) {
      // Array de mapeamentos filtro->coluna
      const filterMappings = [
         { filter: filters.situacao, column: columnMap.situacao },
         { filter: filters.cliente, column: columnMap.cliente },
         { filter: filters.tipoCarga, column: columnMap.tipo_carga },
         { filter: filters.tipoFrete, column: columnMap.tipo_frete },
         { filter: filters.container, column: columnMap.container },
         { filter: filters.processoCliente, column: columnMap.processo_cliente },
         { filter: filters.cavalo, column: columnMap.cavalo },
         { filter: filters.reboque, column: columnMap.reboque },
         { filter: filters.usuario, column: columnMap.usuario_responsavel },
         { filter: filters.contrato, column: columnMap.contrato }
      ];

      // Aplica cada filtro à sua respectiva coluna
      filterMappings.forEach(({ filter, column }) => {
         if (filter && column !== -1) {
            this.dataTable.column(column).search(filter);
         }
      });

      // Redesenha a tabela com os filtros aplicados
      this.dataTable.draw();
   }

   /**
    * Retorna quantidade de registros após aplicação dos filtros
    * @returns {number} Número de registros filtrados
    */
   getFilteredCount() {
      return this.dataTable.rows({ search: 'applied' }).count();
   }

   /**
    * Reconstrói completamente a tabela
    * Usado quando há mudanças nas colunas visíveis
    */
   rebuild() {
      this.destroyExisting();  // Destrói instância atual
      // Recria estrutura HTML básica
      const table = document.getElementById('tms-table');
      table.innerHTML = '<thead><tr></tr></thead><tbody></tbody>';
      this.initialize();       // Reinicializa
   }
}

// ===== GERENCIADOR DE MODAL =====
/**
 * Classe responsável pelo modal de detalhes dos itens
 * Exibe informações completas e lista de tarefas
 */
class ModalManager {
   /**
    * Exibe modal com detalhes de um item específico
    * @param {Object} item - Item a ser exibido
    */
   static showDetails(item) {
      // Preenche campos básicos do modal
      document.getElementById('detail-pedido').textContent = item.pedido;
      document.getElementById('detail-cliente').textContent = item.cliente;
      document.getElementById('detail-descricao').textContent = item.descricao_fluxo;

      // Formata período (início → fim)
      document.getElementById('detail-periodo').textContent =
         `${DataUtils.formatDate(item.data_inicio)} → ${DataUtils.formatDate(item.data_fim)}`;

      // Informações de progresso
      document.getElementById('detail-posicao').textContent = item.posicao_fluxo;
      document.getElementById('detail-percentual').textContent = `${item.percentual}%`;

      // Atualiza barra de progresso visual
      const progressBar = document.getElementById('detail-progress-bar');
      progressBar.style.width = `${item.percentual}%`;

      // Renderiza lista de tarefas
      this.renderTasks(item.tarefas || []);

      // Exibe o modal usando Bootstrap
      new bootstrap.Modal(document.getElementById('modal-operation-details')).show();
   }

   /**
    * Renderiza listas de tarefas concluídas e pendentes
    * @param {Array} tarefas - Array de tarefas
    */
   static renderTasks(tarefas) {
      // Elementos das listas
      const concluidas = document.getElementById('detail-tarefas-concluidas');
      const pendentes = document.getElementById('detail-tarefas-pendentes');

      // Limpa listas anteriores
      concluidas.innerHTML = '';
      pendentes.innerHTML = '';

      // Processa cada tarefa
      tarefas.forEach(tarefa => {
         const listItem = document.createElement('li');
         listItem.className = 'list-group-item d-flex align-items-center';

         // Ícone baseado no status (check verde ou círculo cinza)
         const icon = tarefa.concluida
            ? '<i class="bi bi-check2-circle text-success me-2"></i>'
            : '<i class="bi bi-circle text-muted me-2"></i>';

         listItem.innerHTML = `${icon}${tarefa.nome}`;

         // Adiciona à lista apropriada
         const targetList = tarefa.concluida ? concluidas : pendentes;
         targetList.appendChild(listItem);
      });
   }
}

// ===== GERENCIADOR DE NOTIFICAÇÕES =====
/**
 * Classe responsável por exibir notificações toast
 * Sistema de feedback visual para ações do usuário
 */
class NotificationManager {
   /**
    * Exibe uma notificação toast
    * @param {string} message - Mensagem a ser exibida
    * @param {string} type - Tipo da notificação (success, error, warning, info)
    */
   static showToast(message, type = 'info') {
      const container = document.querySelector('.toast-container');
      if (!container) return;

      // Gera ID único para o toast
      const id = 'toast-' + Date.now();
      const bgClass = this.getBgClass(type);  // Classe de cor

      // Insere HTML do toast no container
      container.insertAdjacentHTML('beforeend', `
         <div id="${id}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
            <div class="d-flex">
               <div class="toast-body">${message}</div>
               <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
         </div>
      `);

      // Inicializa e exibe o toast
      const toastElement = document.getElementById(id);
      const toast = new bootstrap.Toast(toastElement, {
         autohide: true,    // Esconde automaticamente
         delay: 3000        // Após 3 segundos
      });
      toast.show();

      // Remove elemento do DOM após esconder
      toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
   }

   /**
    * Retorna classe CSS de cor baseada no tipo de notificação
    * @param {string} type - Tipo da notificação
    * @returns {string} Classe CSS do Bootstrap
    */
   static getBgClass(type) {
      const classes = {
         success: 'bg-success',   // Verde
         error: 'bg-danger',      // Vermelho
         warning: 'bg-warning',   // Amarelo
         info: 'bg-info'          // Azul
      };
      return classes[type] || 'bg-info';
   }
}

// ===== CLASSE PRINCIPAL DO SISTEMA =====
/**
 * Classe principal que coordena todo o sistema
 * Gerencia inicialização e comunicação entre componentes
 */
class FluxoOperacionalManager {
   constructor() {
      // Inicializa dados e gerenciadores
      this.data = DataUtils.getSampleData();                        // Dados de exemplo
      this.columnManager = new ColumnManager();                     // Gerenciador de colunas
      this.filterManager = new FilterManager(this.data);            // Gerenciador de filtros
      this.tableManager = new TableManager(this.data, this.columnManager);  // Gerenciador da tabela
      this.currentItem = null;                                      // Item atualmente selecionado
   }

   /**
    * Inicializa todo o sistema
    * Executa configurações iniciais e vincula eventos
    */
   init() {
      this.filterManager.populateFilterOptions();      // Popula opções dos filtros
      this.filterManager.initializeDateRangePicker();  // Inicializa seletor de datas
      this.tableManager.initialize();                  // Inicializa tabela
      this.bindEvents();                              // Vincula eventos globais
      this.columnManager.renderColumnList();          // Renderiza configurador de colunas

      // Notifica sucesso da inicialização
      NotificationManager.showToast('Fluxo Operacional carregado com sucesso!', 'success');
   }

   /**
    * Vincula todos os eventos dos elementos da interface
    */
   bindEvents() {
      // === BOTÕES PRINCIPAIS ===

      // Botão para abrir sidebar de filtros
      document.getElementById('btn-toggle-filters')?.addEventListener('click',
         () => new bootstrap.Offcanvas(document.getElementById('filters-sidebar')).show());

      // Botão para abrir modal de configuração de colunas
      document.getElementById('btn-column-settings')?.addEventListener('click',
         () => new bootstrap.Modal(document.getElementById('modal-column-settings')).show());

      // === EVENTOS DE FILTROS ===

      // Botão aplicar filtros
      document.getElementById('btn-apply-filters')?.addEventListener('click',
         () => this.applyFilters());

      // Botão limpar filtros
      document.getElementById('btn-clear-filters')?.addEventListener('click',
         () => this.clearFilters());

      // === EVENTOS DE CONFIGURAÇÃO DE COLUNAS ===

      // Botão salvar configurações de colunas
      document.getElementById('btn-save-columns')?.addEventListener('click',
         () => this.saveColumnSettings());

      // Botão restaurar configurações padrão
      document.getElementById('btn-reset-columns')?.addEventListener('click',
         () => this.resetColumnSettings());

      // === EVENTOS DE EXPORTAÇÃO ===

      // Exportação para Excel (placeholder)
      document.getElementById('export-excel')?.addEventListener('click',
         () => NotificationManager.showToast('Exportação para Excel será implementada', 'info'));

      // Exportação para PDF (placeholder)
      document.getElementById('export-pdf')?.addEventListener('click',
         () => NotificationManager.showToast('Exportação para PDF será implementada', 'info'));
   }

   /**
    * Aplica todos os filtros selecionados à tabela
    */
   applyFilters() {
      // Coleta valores dos filtros
      const filters = this.filterManager.getFilterValues();

      // Aplica filtro de data customizado
      this.filterManager.applyDateFilter(filters.dateRange);
      // Aplica demais filtros via DataTables
      this.tableManager.applyFilters(filters, this.columnManager);

      // Esconde sidebar de filtros
      bootstrap.Offcanvas.getInstance(document.getElementById('filters-sidebar'))?.hide();

      // Mostra resultado da filtragem
      const count = this.tableManager.getFilteredCount();
      NotificationManager.showToast(`${count} item(ns) encontrado(s)`, 'success');
   }

   /**
    * Limpa todos os filtros aplicados
    */
   clearFilters() {
      this.filterManager.clearFilters();               // Limpa formulário e filtros customizados
      this.tableManager.dataTable?.search('').columns().search('').draw();  // Limpa filtros da tabela
      NotificationManager.showToast('Filtros limpos', 'info');
   }

   /**
    * Salva configurações de colunas no localStorage
    */
   saveColumnSettings() {
      this.columnManager.saveSettings();               // Persiste no localStorage
      this.updateTable();                             // Atualiza tabela
      // Esconde modal
      bootstrap.Modal.getInstance(document.getElementById('modal-column-settings'))?.hide();
      NotificationManager.showToast('Configurações de colunas salvas!', 'success');
   }

   /**
    * Restaura configurações de colunas para o padrão
    */
   resetColumnSettings() {
      this.columnManager.resetToDefault();            // Volta ao padrão
      this.columnManager.renderColumnList();          // Atualiza interface
      this.updateTable();                            // Reconstrói tabela
      NotificationManager.showToast('Configurações restauradas para o padrão', 'info');
   }

   /**
    * Atualiza completamente a tabela (após mudanças de colunas)
    */
   updateTable() {
      this.tableManager.rebuild();
   }

   /**
    * Exibe modal de detalhes para um pedido específico
    * @param {string} pedido - Código do pedido
    */
   showDetails(pedido) {
      // Busca item nos dados
      const item = this.data.find(i => i.pedido === pedido);
      if (!item) return;

      this.currentItem = item;           // Armazena item atual
      ModalManager.showDetails(item);    // Exibe modal
   }
}

// ===== INICIALIZAÇÃO DO SISTEMA =====
/**
 * Event listener para inicializar o sistema quando o DOM estiver carregado
 * Cria instância global e inicia o sistema
 */
document.addEventListener('DOMContentLoaded', () => {
   // Cria instância global do gerenciador
   window.fluxoManager = new FluxoOperacionalManager();
   // Inicializa todo o sistema
   fluxoManager.init();
});
