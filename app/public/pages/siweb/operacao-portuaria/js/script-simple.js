/**
 * Versão Simplificada - Operações Portuárias
 * Usando apenas HTML/CSS/JS vanilla para teste inicial
 */

class OperacoesPortuariasSimple {
    constructor() {
        this.data = this.getSampleData();
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.columnSettings = this.getDefaultColumnSettings();
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.currentOperation = null;
        this.map = null;
        this.init();
    }

    init() {
        this.loadSavedSettings();
        this.populateFilterOptions();
        this.initializeDateRangePicker();
        this.applyInitialStatusFilter(); // Aplicar filtro inicial de status "Em operação"
        this.renderTable();
        this.bindEvents();
        this.bindSortEvents();
        this.initializeColumnSettings();
        this.applyColumnSettings();
        this.showToast('Sistema carregado com sucesso!', 'success');
    }

    /**
     * Inicializa o date range picker usando Flatpickr
     */
    initializeDateRangePicker() {
        const dateRangeInput = document.getElementById('filter-date-range');
        if (!dateRangeInput) return;

        // Verificar se Flatpickr está disponível
        if (typeof flatpickr !== 'undefined') {
            // Configuração do Range Calendar seguindo a documentação oficial
            this.dateRangePicker = flatpickr(dateRangeInput, {
                mode: "range",
                dateFormat: "d/m/Y",
                locale: "pt", // Usar localização portuguesa carregada
                minDate: "2020-01-01",
                maxDate: "today",
                allowInput: false,
                clickOpens: true,
                // Configurações para funcionar dentro de sidebar
                appendTo: document.body, // Anexar ao body em vez do container pai
                static: false,
                position: "auto",
                // Callbacks para debug
                onOpen: function() {
                    console.log('Flatpickr aberto');
                },
                onClose: function() {
                    console.log('Flatpickr fechado');
                }
            });

            // Adicionar evento de clique no ícone do calendário
            const iconElement = dateRangeInput.nextElementSibling?.querySelector('i');
            if (iconElement) {
                iconElement.style.cursor = 'pointer';
                iconElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Ícone clicado, tentando abrir Flatpickr');
                    if (this.dateRangePicker) {
                        this.dateRangePicker.open();
                    }
                });
            }

            // Adicionar evento de clique no próprio input também
            dateRangeInput.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Input clicado, tentando abrir Flatpickr');
                if (this.dateRangePicker) {
                    this.dateRangePicker.open();
                }
            });
        } else {
            console.warn('Flatpickr não está disponível. Tentando carregar...');
            // Tentar novamente após um delay
            setTimeout(() => {
                this.initializeDateRangePicker();
            }, 1000);
        }
    }



    /**
     * Popula opções dos filtros
     */
    populateFilterOptions() {
        // Obter valores únicos dos dados
        const empresas = [...new Set(this.data.map(item => item.empresa))].sort();
        const clientes = [...new Set(this.data.map(item => item.cliente))].sort();

                // Popular select de empresas
        const empresaSelect = document.getElementById('filter-empresa');
        if (empresaSelect) {
            const empresaOptions = empresas.map(empresa =>
                `<option value="${empresa}">${empresa}</option>`
            ).join('');
            empresaSelect.innerHTML = '<option value="">Todas as empresas</option>' + empresaOptions;
        }

        // Popular select de clientes
        const clienteSelect = document.getElementById('filter-cliente');
        if (clienteSelect) {
            const clienteOptions = clientes.map(cliente =>
                `<option value="${cliente}">${cliente}</option>`
            ).join('');
            clienteSelect.innerHTML = '<option value="">Todos os clientes</option>' + clienteOptions;
        }
    }

    /**
     * Aplica filtro inicial de status "Em operação"
     */
    applyInitialStatusFilter() {
        // Definir o valor do select de status como "Em operação"
        const statusSelect = document.getElementById('filter-status');
        if (statusSelect) {
            statusSelect.value = 'Em operação';
        }

        // Filtrar dados para mostrar apenas operações com status "Em operação"
        this.filteredData = this.data.filter(item => item.status === 'Em operação');

        // Resetar para primeira página
        this.currentPage = 1;

        // Mostrar mensagem informativa sobre o filtro inicial
        const operacoesEmAndamento = this.filteredData.length;
        if (operacoesEmAndamento > 0) {
            this.showToast(`Filtro inicial aplicado: ${operacoesEmAndamento} operação(ões) em andamento carregada(s).`, 'info');
        } else {
            this.showToast('Filtro inicial aplicado: Nenhuma operação em andamento encontrada.', 'warning');
        }
    }

    /**
     * Carrega configurações salvas
     */
    loadSavedSettings() {
        // Carregar configurações de colunas
        const savedColumns = localStorage.getItem('operacoes-column-settings');
        if (savedColumns) {
            try {
                this.columnSettings = JSON.parse(savedColumns);
            } catch (e) {
                console.error('Erro ao carregar configurações de colunas:', e);
            }
        }
    }

    /**
     * Configurações padrão das colunas
     */
    getDefaultColumnSettings() {
        return [
            { key: 'id', name: 'ID', visible: true, order: 0 },
            { key: 'status', name: 'Status', visible: true, order: 1 },
            { key: 'navio', name: 'Navio', visible: true, order: 2 },
            { key: 'tipo_frete', name: 'Tipo de Frete', visible: true, order: 3 },
            { key: 'tipo_carga', name: 'Tipo de Carga', visible: true, order: 4 },
            { key: 'data_registro', name: 'Data Reg.', visible: true, order: 5 },
            { key: 'inicio_operacao', name: 'Início Operação', visible: true, order: 6 },
            { key: 'fim_operacao', name: 'Fim Operação', visible: true, order: 7 },
            { key: 'empresa', name: 'Empresa', visible: true, order: 8 },
            { key: 'cliente', name: 'Cliente', visible: false, order: 9 }
        ];
    }

    /**
     * Inicializa configuração de colunas
     */
    initializeColumnSettings() {
        this.renderColumnList();
        this.initializeSortable();
    }

    /**
     * Renderiza a lista de colunas no modal
     */
    renderColumnList() {
        const columnList = document.getElementById('column-list');
        if (!columnList) return;

        // Ordenar colunas pela ordem atual
        const sortedColumns = [...this.columnSettings].sort((a, b) => a.order - b.order);

        columnList.innerHTML = sortedColumns.map(column => `
            <div class="list-group-item d-flex justify-content-between align-items-center" data-column="${column.key}">
                <div class="d-flex align-items-center">
                    <i class="bi bi-grip-vertical me-3 text-muted drag-handle" style="cursor: move;"></i>
                    <div class="form-check">
                        <input class="form-check-input column-toggle" type="checkbox"
                               id="col-${column.key}" ${column.visible ? 'checked' : ''}>
                        <label class="form-check-label" for="col-${column.key}">
                            ${column.name}
                        </label>
                    </div>
                </div>
                <span class="badge bg-secondary">${column.order + 1}</span>
            </div>
        `).join('');
    }

    /**
     * Inicializa o Sortable para arrastar colunas (versão simples)
     */
    initializeSortable() {
        const columnList = document.getElementById('column-list');
        if (!columnList) return;

        // Implementação simples de drag & drop
        let draggedElement = null;

        columnList.addEventListener('dragstart', (e) => {
            if (e.target.closest('.drag-handle')) {
                draggedElement = e.target.closest('.list-group-item');
                draggedElement.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        columnList.addEventListener('dragend', (e) => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                // Remover classes de todos os elementos
                columnList.querySelectorAll('.list-group-item').forEach(item => {
                    item.classList.remove('drag-over');
                });
                draggedElement = null;
            }
        });

        columnList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const targetElement = e.target.closest('.list-group-item');
            if (targetElement && targetElement !== draggedElement) {
                // Remover classe de todos os elementos
                columnList.querySelectorAll('.list-group-item').forEach(item => {
                    item.classList.remove('drag-over');
                });
                // Adicionar classe ao elemento atual
                targetElement.classList.add('drag-over');
            }
        });

        columnList.addEventListener('dragleave', (e) => {
            const targetElement = e.target.closest('.list-group-item');
            if (targetElement) {
                targetElement.classList.remove('drag-over');
            }
        });

        columnList.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetElement = e.target.closest('.list-group-item');

            if (draggedElement && targetElement && draggedElement !== targetElement) {
                const rect = targetElement.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;

                if (e.clientY < midpoint) {
                    columnList.insertBefore(draggedElement, targetElement);
                } else {
                    columnList.insertBefore(draggedElement, targetElement.nextSibling);
                }

                this.updateColumnOrder();
            }
        });

        // Tornar elementos arrastáveis
        columnList.querySelectorAll('.list-group-item').forEach(item => {
            item.draggable = true;
        });
    }

    /**
     * Atualiza a ordem das colunas após arrastar
     */
    updateColumnOrder() {
        const columnList = document.getElementById('column-list');
        const items = columnList.querySelectorAll('.list-group-item');

        items.forEach((item, index) => {
            const columnKey = item.dataset.column;
            const column = this.columnSettings.find(col => col.key === columnKey);
            if (column) {
                column.order = index;
            }

            // Atualizar badge de ordem
            const badge = item.querySelector('.badge');
            badge.textContent = index + 1;
        });
    }

    getSampleData() {
        return [
            {
                id: 38,
                status: 'Em operação',
                navio: 'MSC MEDITERRANEAN',
                tipo_frete: 'IMPORTAÇÃO',
                tipo_carga: 'CARGA SOLTA',
                data_registro: '18/06/2025',
                inicio_operacao: '16/06/2025 00:00',
                fim_operacao: '20/06/2025 00:00',
                empresa: '1 - NOME FANTASIA EMPRESA LTDA',
                cliente: 'CLIENTE IMPORTADOR LTDA',
                latitude: -23.5505,
                longitude: -46.6333
            },
            {
                id: 39,
                status: 'Concluída',
                navio: 'MAERSK ESSEX',
                tipo_frete: 'EXPORTAÇÃO',
                tipo_carga: 'CONTÊINER',
                data_registro: '15/06/2025',
                inicio_operacao: '14/06/2025 08:00',
                fim_operacao: '16/06/2025 18:00',
                empresa: '2 - EXPORTADORA BRASIL S/A',
                cliente: 'GLOBAL TRADING CO.',
                latitude: -23.5489,
                longitude: -46.6388
            },
            {
                id: 40,
                status: 'Pendente',
                navio: 'COSCO SHIPPING',
                tipo_frete: 'CABOTAGEM',
                tipo_carga: 'GRANEL SÓLIDO',
                data_registro: '20/06/2025',
                inicio_operacao: '22/06/2025 06:00',
                fim_operacao: '25/06/2025 14:00',
                empresa: '3 - PORTOS DO BRASIL LTDA',
                cliente: 'MINERAÇÃO NACIONAL',
                latitude: -23.5520,
                longitude: -46.6311
            },
            {
                id: 41,
                status: 'Em operação',
                navio: 'EVERGREEN HARMONY',
                tipo_frete: 'TRANSBORDO',
                tipo_carga: 'GRANEL LÍQUIDO',
                data_registro: '19/06/2025',
                inicio_operacao: '18/06/2025 12:00',
                fim_operacao: '21/06/2025 20:00',
                empresa: '1 - NOME FANTASIA EMPRESA LTDA',
                cliente: 'PETROQUÍMICA SUL',
                latitude: -23.5470,
                longitude: -46.6350
            },
            {
                id: 42,
                status: 'Cancelada',
                navio: 'CMA CGM MARCO POLO',
                tipo_frete: 'IMPORTAÇÃO',
                tipo_carga: 'ROLL ON/ROLL OFF',
                data_registro: '17/06/2025',
                inicio_operacao: '20/06/2025 10:00',
                fim_operacao: '23/06/2025 16:00',
                empresa: '4 - LOGÍSTICA AVANÇADA LTDA',
                cliente: 'AUTOMOTIVE IMPORTS',
                latitude: -23.5530,
                longitude: -46.6280
            }
        ];
    }

    renderTable() {
        const tbody = document.querySelector('#operacoes-table tbody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(item => `
            <tr data-id="${item.id}" class="table-row">
                <td class="text-center">${item.id}</td>
                <td class="text-center">${this.getStatusBadge(item.status)}</td>
                <td>${item.navio}</td>
                <td class="text-center">${item.tipo_frete}</td>
                <td class="text-center">${item.tipo_carga}</td>
                <td class="text-center">${item.data_registro}</td>
                <td class="text-center">${item.inicio_operacao}</td>
                <td class="text-center">${item.fim_operacao}</td>
                <td>${item.empresa}</td>
                <td>${item.cliente}</td>
            </tr>
        `).join('');

        this.renderPagination();
        this.bindTableEvents();
        this.bindSortEvents();
    }

    getStatusBadge(status) {
        const badges = {
            'Em operação': 'bg-primary',
            'Concluída': 'bg-success',
            'Pendente': 'bg-warning text-dark',
            'Cancelada': 'bg-danger'
        };
        return `<span class="badge ${badges[status] || 'bg-secondary'}">${status}</span>`;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const paginationContainer = document.querySelector('.pagination-container');

        if (!paginationContainer) {
            // Criar container de paginação se não existir
            const cardBody = document.querySelector('#operacoes-table').closest('.card-body');
            const paginationDiv = document.createElement('div');
            paginationDiv.className = 'pagination-container d-flex justify-content-between align-items-center mt-3';
            paginationDiv.innerHTML = `
                <div class="pagination-info">
                    Mostrando <span id="showing-start">0</span> até <span id="showing-end">0</span> de <span id="total-records">0</span> registros
                </div>
                <nav>
                    <ul class="pagination pagination-sm mb-0" id="pagination-list">
                    </ul>
                </nav>
            `;
            cardBody.appendChild(paginationDiv);
        }

        // Atualizar informações
        const startRecord = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endRecord = Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);

        document.getElementById('showing-start').textContent = this.filteredData.length > 0 ? startRecord : 0;
        document.getElementById('showing-end').textContent = endRecord;
        document.getElementById('total-records').textContent = this.filteredData.length;

        // Gerar paginação
        const paginationList = document.getElementById('pagination-list');
        let paginationHTML = '';

        // Botão Anterior
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">Anterior</a>
            </li>
        `;

        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Botão Próximo
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">Próximo</a>
            </li>
        `;

        paginationList.innerHTML = paginationHTML;
        this.bindPaginationEvents();
    }

    bindEvents() {
        // Botão filtros
        document.getElementById('btn-toggle-filters')?.addEventListener('click', () => {
            const sidebar = new bootstrap.Offcanvas(document.getElementById('filters-sidebar'));
            sidebar.show();
        });

        // Botão configurar colunas
        document.getElementById('btn-column-settings')?.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('modal-column-settings'));
            modal.show();
        });

        // Aplicar filtros
        document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
            this.applyFilters();
        });

        // Limpar filtros
        document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Salvar configuração de colunas
        document.getElementById('btn-save-columns')?.addEventListener('click', () => {
            this.saveColumnSettings();
        });

        // Resetar colunas
        document.getElementById('btn-reset-columns')?.addEventListener('click', () => {
            this.resetColumnSettings();
        });

        // Toggle de colunas
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('column-toggle')) {
                const columnKey = e.target.id.replace('col-', '');
                const column = this.columnSettings.find(col => col.key === columnKey);
                if (column) {
                    column.visible = e.target.checked;
                }
            }
        });

        // Exportações
        document.getElementById('export-excel')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportTable('excel');
        });
        document.getElementById('export-csv')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportTable('csv');
        });
        document.getElementById('export-pdf')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportTable('pdf');
        });

        // Ver localização
        document.getElementById('btn-show-location')?.addEventListener('click', () => {
            this.showLocationOnMap();
        });
    }

    /**
     * Vincula eventos de ordenação nos cabeçalhos da tabela
     */
    bindSortEvents() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                this.sortTable(column);
            });
        });
    }

    /**
     * Ordena a tabela por coluna
     */
    sortTable(column) {
        // Se é a mesma coluna, inverte a direção
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Ordenar dados
        this.filteredData.sort((a, b) => {
            let valueA = a[column];
            let valueB = b[column];

            // Tratamento especial para datas
            if (column.includes('data') || column.includes('operacao')) {
                valueA = this.parseDateTime(valueA);
                valueB = this.parseDateTime(valueB);
            }
            // Tratamento especial para números
            else if (column === 'id') {
                valueA = parseInt(valueA);
                valueB = parseInt(valueB);
            }
            // Tratamento para strings (ordenação alfabética)
            else {
                valueA = (valueA || '').toString().toLowerCase();
                valueB = (valueB || '').toString().toLowerCase();
            }

            let comparison = 0;
            if (valueA > valueB) {
                comparison = 1;
            } else if (valueA < valueB) {
                comparison = -1;
            }

            return this.sortDirection === 'desc' ? comparison * -1 : comparison;
        });

        // Atualizar indicadores visuais
        this.updateSortIndicators();

        // Re-renderizar tabela
        this.currentPage = 1;
        this.renderTable();
    }

    /**
     * Atualiza os indicadores visuais de ordenação
     */
    updateSortIndicators() {
        // Resetar todos os indicadores
        document.querySelectorAll('.sort-icon').forEach(icon => {
            icon.className = 'bi bi-arrow-down-up ms-1 sort-icon';
        });

        // Aplicar indicador da coluna atual
        if (this.sortColumn) {
            const header = document.querySelector(`[data-column="${this.sortColumn}"] .sort-icon`);
            if (header) {
                const iconClass = this.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
                header.className = `bi ${iconClass} ms-1 sort-icon`;
            }
        }
    }

    /**
     * Parse de data e hora no formato brasileiro
     */
    parseDateTime(dateTimeStr) {
        if (!dateTimeStr) return new Date(0);

        // Se contém hora (formato: dd/mm/yyyy hh:mm)
        if (dateTimeStr.includes(' ')) {
            const [datePart, timePart] = dateTimeStr.split(' ');
            const [day, month, year] = datePart.split('/');
            const [hours, minutes] = timePart.split(':');
            return new Date(year, month - 1, day, hours, minutes);
        }
        // Apenas data (formato: dd/mm/yyyy)
        else {
            const [day, month, year] = dateTimeStr.split('/');
            return new Date(year, month - 1, day);
        }
    }

    bindTableEvents() {
        // Clique nas linhas
        document.querySelectorAll('.table-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const id = parseInt(row.dataset.id);
                    this.showOperationDetails(id);
                }
            });
        });

        // Botões de ação
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.dataset.id);
                this.showOperationDetails(id);
            });
        });

        document.querySelectorAll('.edit-operation').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.dataset.id);
                this.showToast(`Edição da operação #${id} em desenvolvimento`, 'info');
            });
        });

        document.querySelectorAll('.delete-operation').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.dataset.id);
                if (confirm(`Deseja realmente excluir a operação #${id}?`)) {
                    this.showToast(`Operação #${id} excluída com sucesso!`, 'success');
                }
            });
        });
    }

    bindPaginationEvents() {
        document.querySelectorAll('#pagination-list .page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.renderTable();
                }
            });
        });
    }

        applyFilters() {
        const searchTerm = document.getElementById('filter-search')?.value.toLowerCase() || '';

        // Obter valores dos selects simples
        const statusFilter = document.getElementById('filter-status')?.value || '';
        const tipoFreteFilter = document.getElementById('filter-tipo-frete')?.value || '';
        const tipoCargoFilter = document.getElementById('filter-tipo-carga')?.value || '';
        const empresaFilter = document.getElementById('filter-empresa')?.value || '';
        const clienteFilter = document.getElementById('filter-cliente')?.value || '';

        // Obter período de datas do Flatpickr
        let dateRangeFilter = null;
        if (this.dateRangePicker && this.dateRangePicker.selectedDates.length === 2) {
            dateRangeFilter = {
                start: this.dateRangePicker.selectedDates[0],
                end: this.dateRangePicker.selectedDates[1]
            };
        }

        this.filteredData = this.data.filter(item => {
            // Filtro de busca geral
            if (searchTerm && !this.searchInItem(item, searchTerm)) {
                return false;
            }

            // Filtro de status
            if (statusFilter && item.status !== statusFilter) {
                return false;
            }

            // Filtro de tipo de frete
            if (tipoFreteFilter && item.tipo_frete !== tipoFreteFilter) {
                return false;
            }

            // Filtro de tipo de carga
            if (tipoCargoFilter && item.tipo_carga !== tipoCargoFilter) {
                return false;
            }

            // Filtro de empresa
            if (empresaFilter && item.empresa !== empresaFilter) {
                return false;
            }

            // Filtro de cliente
            if (clienteFilter && item.cliente !== clienteFilter) {
                return false;
            }

            // Filtro de período de datas (se implementado)
            if (dateRangeFilter) {
                const itemDate = this.parseDate(item.data_registro);
                if (itemDate && (itemDate < dateRangeFilter.start || itemDate > dateRangeFilter.end)) {
                    return false;
                }
            }

            return true;
        });

        // Aplicar ordenação se existir
        if (this.sortColumn) {
            this.sortTable(this.sortColumn);
        } else {
        this.currentPage = 1;
        this.renderTable();
        }

        const sidebar = bootstrap.Offcanvas.getInstance(document.getElementById('filters-sidebar'));
        if (sidebar) sidebar.hide();

        this.showToast(`Filtros aplicados! ${this.filteredData.length} registro(s) encontrado(s).`, 'success');
    }

    /**
     * Parse de data no formato brasileiro
     */
    parseDate(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }

    searchInItem(item, searchTerm) {
        const searchableFields = ['navio', 'tipo_frete', 'tipo_carga', 'empresa', 'cliente', 'status'];
        return searchableFields.some(field =>
            item[field]?.toString().toLowerCase().includes(searchTerm)
        );
    }

    clearFilters() {
        // Limpar campo de busca
        const searchInput = document.getElementById('filter-search');
        if (searchInput) searchInput.value = '';

        // Limpar todos os selects simples, exceto status que deve voltar para "Em operação"
        const selects = ['filter-tipo-frete', 'filter-tipo-carga', 'filter-empresa', 'filter-cliente'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.value = '';
            }
        });

        // Manter status como "Em operação"
        const statusSelect = document.getElementById('filter-status');
        if (statusSelect) {
            statusSelect.value = 'Em operação';
        }

        // Limpar date range picker (Flatpickr)
        if (this.dateRangePicker) {
            this.dateRangePicker.clear();
        }

        // Resetar dados filtrados para mostrar apenas "Em operação"
        this.filteredData = this.data.filter(item => item.status === 'Em operação');
        this.currentPage = 1;
        this.renderTable();
        this.showToast('Filtros limpos! Mostrando apenas operações em andamento.', 'info');
    }

    /**
     * Salva configurações das colunas
     */
    saveColumnSettings() {
        localStorage.setItem('operacoes-column-settings', JSON.stringify(this.columnSettings));
        this.applyColumnSettings();

        const modal = bootstrap.Modal.getInstance(document.getElementById('modal-column-settings'));
        if (modal) modal.hide();

        this.showToast('Configurações de colunas salvas!', 'success');
    }

    /**
     * Reseta configurações das colunas
     */
    resetColumnSettings() {
        this.columnSettings = this.getDefaultColumnSettings();
        this.renderColumnList();
        this.initializeSortable();
        this.showToast('Configurações resetadas para o padrão!', 'info');
    }

    /**
     * Aplica configurações de colunas à tabela
     */
    applyColumnSettings() {
        // Reordenar cabeçalhos da tabela
        const thead = document.querySelector('#operacoes-table thead tr');
        if (!thead) return;

        // Obter configurações ordenadas
        const sortedColumns = [...this.columnSettings].sort((a, b) => a.order - b.order);

        // Mostrar/ocultar colunas
        sortedColumns.forEach((column, index) => {
            const th = thead.children[index];
            if (th) {
                th.style.display = column.visible ? '' : 'none';
            }

            // Aplicar também às células do corpo da tabela
            document.querySelectorAll(`#operacoes-table tbody tr`).forEach(row => {
                const td = row.children[index];
                if (td) {
                    td.style.display = column.visible ? '' : 'none';
                }
            });
        });
    }

    /**
     * Exporta tabela (versão simplificada)
     */
    exportTable(format) {
        this.showToast(`Exportação ${format.toUpperCase()} em desenvolvimento`, 'info');
    }

    /**
     * Mostra localização no mapa usando Google Maps
     */
    showLocationOnMap() {
        if (!this.currentOperation) {
            this.showToast('Nenhuma operação selecionada!', 'error');
            return;
        }

        const operation = this.currentOperation;

        // Verificar se tem coordenadas
        if (!operation.latitude || !operation.longitude) {
            this.showToast('Coordenadas não disponíveis para esta operação!', 'warning');
            return;
        }

        // Mostrar spinner
        const locationInfo = document.getElementById('location-info');
        const mapContainer = document.getElementById('operation-map');
        const spinner = locationInfo.querySelector('.spinner-border');

        locationInfo.style.display = 'none';
        mapContainer.style.display = 'block';

        if (spinner) {
            spinner.style.display = 'block';
        }

        // Inicializar mapa
        this.initializeGoogleMap(operation);
    }

        /**
     * Inicializa o mapa usando Leaflet (OpenStreetMap)
     */
    initializeGoogleMap(operation) {
        // Verificar se Leaflet está disponível
        if (typeof L === 'undefined') {
            this.showToast('Sistema de mapas não está disponível. Verifique sua conexão.', 'error');
            document.getElementById('location-info').style.display = 'block';
            document.getElementById('operation-map').style.display = 'none';
            return;
        }

        try {
            const mapContainer = document.getElementById('operation-map');

            // Limpar mapa anterior se existir
            if (this.map) {
                this.map.remove();
            }

            // Coordenadas da operação
            const lat = parseFloat(operation.latitude);
            const lng = parseFloat(operation.longitude);

            // Criar mapa com Leaflet
            this.map = L.map(mapContainer, {
                center: [lat, lng],
                zoom: 15,
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                boxZoom: true,
                keyboard: true,
                dragging: true,
                touchZoom: true
            });

            // Adicionar camada do OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.map);

            // Criar ícone personalizado para o marcador
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `
                    <div style="
                        background: #dc3545;
                        border: 3px solid white;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        color: white;
                        font-size: 14px;
                        font-weight: bold;
                    ">
                        <i class="bi bi-ship" style="font-size: 12px;"></i>
                    </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            // Adicionar marcador
            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);

            // Conteúdo do popup
            const popupContent = `
                <div style="padding: 10px; min-width: 200px; text-align: center;">
                    <h6 style="margin: 0 0 10px 0; color: #0d6efd; font-size: 14px;">
                        <i class="bi bi-ship"></i> Operação #${operation.id}
                    </h6>
                    <div style="text-align: left; font-size: 12px;">
                        <p style="margin: 4px 0;"><strong>Navio:</strong> ${operation.navio}</p>
                        <p style="margin: 4px 0;"><strong>Status:</strong>
                            <span class="badge ${this.getStatusBadgeClass(operation.status)}" style="font-size: 10px;">
                                ${operation.status}
                            </span>
                        </p>
                        <p style="margin: 4px 0;"><strong>Tipo:</strong> ${operation.tipo_frete}</p>
                        <p style="margin: 4px 0;"><strong>Empresa:</strong> ${operation.empresa}</p>
                    </div>
                    <small style="color: #6c757d; font-style: italic;">
                        Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}
                    </small>
                </div>
            `;

            // Adicionar popup ao marcador
            marker.bindPopup(popupContent, {
                maxWidth: 250,
                className: 'custom-popup'
            });

            // Abrir popup automaticamente
            setTimeout(() => {
                marker.openPopup();
            }, 500);

            // Adicionar círculo de destaque
            const circle = L.circle([lat, lng], {
                color: '#0d6efd',
                fillColor: '#0d6efd',
                fillOpacity: 0.1,
                radius: 200
            }).addTo(this.map);

            // Ajustar visualização para mostrar marcador e círculo
            const group = new L.featureGroup([marker, circle]);
            this.map.fitBounds(group.getBounds().pad(0.1));

            // Ocultar spinner
            const spinner = document.querySelector('#location-info .spinner-border');
            if (spinner) {
                spinner.style.display = 'none';
            }

            // Adicionar controles extras
            this.addMapControls();

            this.showToast('Localização carregada no mapa!', 'success');

        } catch (error) {
            console.error('Erro ao carregar mapa:', error);
            this.showToast('Erro ao carregar o mapa. Verifique sua conexão.', 'error');

            // Voltar ao estado inicial
            document.getElementById('location-info').style.display = 'block';
            document.getElementById('operation-map').style.display = 'none';
        }
    }

    /**
     * Adiciona controles extras ao mapa
     */
    addMapControls() {
        // Controle de escala
        L.control.scale({
            position: 'bottomleft',
            metric: true,
            imperial: false
        }).addTo(this.map);

        // Botão de localização atual (simulado)
        const self = this; // Capturar contexto
        const locationControl = L.control({ position: 'topright' });
        locationControl.onAdd = function() {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            div.innerHTML = `
                <a href="#" title="Centralizar no marcador" style="
                    background: white;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    color: #333;
                    border-radius: 2px;
                ">
                    <i class="bi bi-geo-alt-fill" style="font-size: 16px;"></i>
                </a>
            `;

            div.onclick = (e) => {
                e.preventDefault();
                if (self.map && self.currentOperation) {
                    const lat = parseFloat(self.currentOperation.latitude);
                    const lng = parseFloat(self.currentOperation.longitude);
                    self.map.setView([lat, lng], 15);
                    self.showToast('Mapa centralizado na operação!', 'info');
                }
            };

            return div;
        };
        locationControl.addTo(this.map);
    }

    showOperationDetails(id) {
        const operation = this.data.find(op => op.id === id);
        if (!operation) return;

        // Armazenar operação atual
        this.currentOperation = operation;

        // Resetar estado do mapa
        document.getElementById('location-info').style.display = 'block';
        document.getElementById('operation-map').style.display = 'none';
        const spinner = document.querySelector('#location-info .spinner-border');
        if (spinner) {
            spinner.style.display = 'none';
        }

        // Preencher modal
        document.getElementById('detail-id').textContent = operation.id;
        document.getElementById('detail-status').textContent = operation.status;
        document.getElementById('detail-status').className = `badge ${this.getStatusBadgeClass(operation.status)}`;
        document.getElementById('detail-navio').textContent = operation.navio;
        document.getElementById('detail-tipo-frete').textContent = operation.tipo_frete;
        document.getElementById('detail-tipo-carga').textContent = operation.tipo_carga;
        document.getElementById('detail-data-registro').textContent = operation.data_registro;
        document.getElementById('detail-inicio-operacao').textContent = operation.inicio_operacao;
        document.getElementById('detail-fim-operacao').textContent = operation.fim_operacao;
        document.getElementById('detail-empresa').textContent = operation.empresa;
        document.getElementById('detail-cliente').textContent = operation.cliente;

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modal-operation-details'));
        modal.show();
    }

    getStatusBadgeClass(status) {
        const classes = {
            'Em operação': 'bg-primary',
            'Concluída': 'bg-success',
            'Pendente': 'bg-warning text-dark',
            'Cancelada': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        const toastId = 'toast-' + Date.now();

        const iconMap = {
            success: 'bi-check-circle-fill',
            error: 'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };

        const colorMap = {
            success: 'text-success',
            error: 'text-danger',
            warning: 'text-warning',
            info: 'text-primary'
        };

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-header">
                <i class="bi ${iconMap[type]} ${colorMap[type]} me-2"></i>
                <strong class="me-auto">Sistema</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Instância global para facilitar debugging
let operacoesPortuariasInstance = null;

// Inicializar versão simples
document.addEventListener('DOMContentLoaded', () => {
    operacoesPortuariasInstance = new OperacoesPortuariasSimple();
});
