/**
 * Operações Portuárias - Sistema de Gestão
 * Sistema completo com DataTables, filtros avançados, configuração de colunas e localização
 */

class OperacoesPortuarias {
    constructor() {
        this.table = null;
        this.filterChoices = {};
        this.columnSettings = this.getDefaultColumnSettings();
        this.currentOperation = null;
        this.map = null;

        this.init();
    }

    /**
     * Inicializa o sistema
     */
    init() {
        this.initializeDataTable();
        this.initializeFilters();
        this.initializeColumnSettings();
        this.bindEvents();
        this.loadSavedSettings();
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
            { key: 'cliente', name: 'Cliente', visible: false, order: 9 },
        ];
    }

    /**
     * Dados de exemplo para demonstração
     */
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

    /**
     * Inicializa o DataTable
     */
    initializeDataTable() {
        const self = this;

        this.table = $('#operacoes-table').DataTable({
            data: this.getSampleData(),
            columns: [
                {
                    data: 'id',
                    title: 'ID',
                    className: 'text-center'
                },
                {
                    data: 'status',
                    title: 'Status',
                    className: 'text-center',
                    render: function(data) {
                        const badges = {
                            'Em operação': 'bg-primary',
                            'Concluída': 'bg-success',
                            'Pendente': 'bg-warning',
                            'Cancelada': 'bg-danger'
                        };
                        return `<span class="badge ${badges[data] || 'bg-secondary'}">${data}</span>`;
                    }
                },
                { data: 'navio', title: 'Navio' },
                {
                    data: 'tipo_frete',
                    title: 'Tipo de Frete',
                    className: 'text-center'
                },
                {
                    data: 'tipo_carga',
                    title: 'Tipo de Carga',
                    className: 'text-center'
                },
                {
                    data: 'data_registro',
                    title: 'Data Reg.',
                    className: 'text-center'
                },
                {
                    data: 'inicio_operacao',
                    title: 'Início Operação',
                    className: 'text-center'
                },
                {
                    data: 'fim_operacao',
                    title: 'Fim Operação',
                    className: 'text-center'
                },
                { data: 'empresa', title: 'Empresa' },
                { data: 'cliente', title: 'Cliente' },
                {
                    data: null,
                    title: 'Ações',
                    orderable: false,
                    searchable: false,
                    className: 'text-center',
                }
            ],
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
            },
            responsive: true,
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rtip',
            colReorder: true,
            stateSave: true,
            stateDuration: 60 * 60 * 24 * 30, // 30 dias
            drawCallback: function() {
                self.bindTableEvents();
            }
        });

        // Aplicar configurações salvas das colunas
        this.applyColumnSettings();
    }

    /**
     * Inicializa os filtros
     */
    initializeFilters() {
        // Inicializar Choices.js para selects múltiplos
        const multiSelects = ['filter-status', 'filter-tipo-frete', 'filter-tipo-carga', 'filter-empresa', 'filter-cliente'];

        multiSelects.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.filterChoices[id] = new Choices(element, {
                    removeItemButton: true,
                    placeholder: true,
                    placeholderValue: 'Selecione...',
                    searchPlaceholderValue: 'Digite para buscar...',
                    noResultsText: 'Nenhum resultado encontrado',
                    noChoicesText: 'Sem opções disponíveis'
                });
            }
        });

        // Carregar opções dos filtros
        this.loadFilterOptions();
    }

    /**
     * Carrega opções para os filtros
     */
    loadFilterOptions() {
        const data = this.getSampleData();

        // Empresas únicas
        const empresas = [...new Set(data.map(item => item.empresa))];
        const empresaChoices = empresas.map(empresa => ({ value: empresa, label: empresa }));
        this.filterChoices['filter-empresa'].setChoices(empresaChoices, 'value', 'label', true);

        // Clientes únicos
        const clientes = [...new Set(data.map(item => item.cliente))];
        const clienteChoices = clientes.map(cliente => ({ value: cliente, label: cliente }));
        this.filterChoices['filter-cliente'].setChoices(clienteChoices, 'value', 'label', true);
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
     * Inicializa o Sortable para arrastar colunas
     */
    initializeSortable() {
        const columnList = document.getElementById('column-list');
        if (!columnList) return;

        new Sortable(columnList, {
            handle: '.drag-handle',
            animation: 150,
            onEnd: (evt) => {
                this.updateColumnOrder();
            }
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

    /**
     * Aplica configurações de colunas ao DataTable
     */
    applyColumnSettings() {
        if (!this.table) return;

        // Ordenar colunas pela configuração
        const sortedColumns = [...this.columnSettings].sort((a, b) => a.order - b.order);

        sortedColumns.forEach((column, index) => {
            const columnIndex = this.getColumnIndexByKey(column.key);
            if (columnIndex !== -1) {
                // Mostrar/ocultar coluna
                this.table.column(columnIndex).visible(column.visible);
            }
        });
    }

    /**
     * Obtém o índice da coluna pela chave
     */
    getColumnIndexByKey(key) {
        const columns = ['id', 'status', 'navio', 'tipo_frete', 'tipo_carga', 'data_registro',
                        'inicio_operacao', 'fim_operacao', 'empresa', 'cliente', 'acoes'];
        return columns.indexOf(key);
    }

    /**
     * Vincula eventos
     */
    bindEvents() {
        // Botão toggle filtros
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
        document.getElementById('export-excel')?.addEventListener('click', () => this.exportTable('excel'));
        document.getElementById('export-csv')?.addEventListener('click', () => this.exportTable('csv'));
        document.getElementById('export-pdf')?.addEventListener('click', () => this.exportTable('pdf'));

        // Ver localização
        document.getElementById('btn-show-location')?.addEventListener('click', () => {
            this.showLocationOnMap();
        });
    }

    /**
     * Vincula eventos da tabela
     */
    bindTableEvents() {
        // Ver detalhes
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.showOperationDetails(id);
            });
        });

        // Editar operação
        document.querySelectorAll('.edit-operation').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.editOperation(id);
            });
        });

        // Excluir operação
        document.querySelectorAll('.delete-operation').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.deleteOperation(id);
            });
        });

        // Clique na linha para abrir detalhes
        document.querySelectorAll('#operacoes-table tbody tr').forEach(row => {
            row.addEventListener('click', (e) => {
                // Não abrir detalhes se clicou em um botão
                if (e.target.closest('button')) return;

                const id = parseInt(row.querySelector('.view-details')?.dataset.id);
                if (id) {
                    this.showOperationDetails(id);
                }
            });
        });
    }

    /**
     * Aplica filtros à tabela
     */
    applyFilters() {
        if (!this.table) return;

        // Pesquisa geral
        const search = document.getElementById('filter-search')?.value || '';
        this.table.search(search);

        // Filtros por coluna
        const filters = {
            status: this.filterChoices['filter-status']?.getValue(true) || [],
            tipo_frete: this.filterChoices['filter-tipo-frete']?.getValue(true) || [],
            tipo_carga: this.filterChoices['filter-tipo-carga']?.getValue(true) || [],
            empresa: this.filterChoices['filter-empresa']?.getValue(true) || [],
            cliente: this.filterChoices['filter-cliente']?.getValue(true) || []
        };

        // Aplicar filtros customizados
        $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
            // Status
            if (filters.status.length > 0 && !filters.status.includes(data[1])) {
                return false;
            }

            // Tipo de Frete
            if (filters.tipo_frete.length > 0 && !filters.tipo_frete.includes(data[3])) {
                return false;
            }

            // Tipo de Carga
            if (filters.tipo_carga.length > 0 && !filters.tipo_carga.includes(data[4])) {
                return false;
            }

            // Empresa
            if (filters.empresa.length > 0 && !filters.empresa.includes(data[8])) {
                return false;
            }

            // Cliente
            if (filters.cliente.length > 0 && !filters.cliente.includes(data[9])) {
                return false;
            }

            return true;
        });

        this.table.draw();

        // Fechar sidebar
        const sidebar = bootstrap.Offcanvas.getInstance(document.getElementById('filters-sidebar'));
        if (sidebar) sidebar.hide();

        // Salvar filtros
        this.saveFilters(filters);

        // Toast de sucesso
        this.showToast('Filtros aplicados com sucesso!', 'success');
    }

    /**
     * Limpa todos os filtros
     */
    clearFilters() {
        // Limpar pesquisa geral
        document.getElementById('filter-search').value = '';

        // Limpar selects múltiplos
        Object.values(this.filterChoices).forEach(choice => {
            choice.removeActiveItems();
        });

        // Limpar datas
        document.getElementById('filter-data-inicio').value = '';
        document.getElementById('filter-data-fim').value = '';

        // Remover filtros customizados
        $.fn.dataTable.ext.search.pop();

        // Redesenhar tabela
        this.table.search('').draw();

        // Limpar localStorage
        localStorage.removeItem('operacoes-filters');

        this.showToast('Filtros limpos com sucesso!', 'info');
    }

    /**
     * Mostra detalhes da operação
     */
    showOperationDetails(id) {
        const data = this.getSampleData();
        const operation = data.find(op => op.id === id);

        if (!operation) return;

        this.currentOperation = operation;

        // Preencher modal com dados
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

    /**
     * Mostra localização no mapa
     */
    showLocationOnMap() {
        if (!this.currentOperation) return;

        const locationContent = document.getElementById('location-content');
        const mapContainer = document.getElementById('operation-map');
        const spinner = document.querySelector('#location-info .spinner-border');

        // Mostrar loading
        locationContent.style.display = 'none';
        spinner.style.display = 'block';

        setTimeout(() => {
            // Ocultar loading
            spinner.style.display = 'none';
            mapContainer.style.display = 'block';

            // Inicializar mapa se não existir
            if (!this.map) {
                this.map = L.map('operation-map').setView([this.currentOperation.latitude, this.currentOperation.longitude], 15);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(this.map);
            } else {
                // Atualizar posição do mapa
                this.map.setView([this.currentOperation.latitude, this.currentOperation.longitude], 15);
            }

            // Adicionar marcador
            L.marker([this.currentOperation.latitude, this.currentOperation.longitude])
                .addTo(this.map)
                .bindPopup(`
                    <div class="text-center">
                        <strong>${this.currentOperation.navio}</strong><br>
                        <small class="text-muted">Operação #${this.currentOperation.id}</small><br>
                        <span class="badge ${this.getStatusBadgeClass(this.currentOperation.status)} mt-1">${this.currentOperation.status}</span>
                    </div>
                `)
                .openPopup();

            // Forçar redimensionamento do mapa
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }, 1000);
    }

    /**
     * Retorna classe CSS do badge do status
     */
    getStatusBadgeClass(status) {
        const classes = {
            'Em operação': 'bg-primary',
            'Concluída': 'bg-success',
            'Pendente': 'bg-warning',
            'Cancelada': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    /**
     * Edita operação
     */
    editOperation(id) {
        this.showToast(`Edição da operação #${id} em desenvolvimento`, 'info');
    }

    /**
     * Exclui operação
     */
    deleteOperation(id) {
        Swal.fire({
            title: 'Confirmar Exclusão',
            text: `Deseja realmente excluir a operação #${id}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Aqui você faria a exclusão real
                this.showToast(`Operação #${id} excluída com sucesso!`, 'success');
            }
        });
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

        // Carregar filtros salvos
        const savedFilters = localStorage.getItem('operacoes-filters');
        if (savedFilters) {
            try {
                const filters = JSON.parse(savedFilters);
                this.restoreFilters(filters);
            } catch (e) {
                console.error('Erro ao carregar filtros:', e);
            }
        }
    }

    /**
     * Salva filtros no localStorage
     */
    saveFilters(filters) {
        localStorage.setItem('operacoes-filters', JSON.stringify(filters));
    }

    /**
     * Restaura filtros salvos
     */
    restoreFilters(filters) {
        // Implementar restauração de filtros se necessário
        console.log('Restaurando filtros:', filters);
    }

    /**
     * Exporta tabela
     */
    exportTable(format) {
        const filename = `operacoes-portuarias-${new Date().toISOString().split('T')[0]}`;

        switch (format) {
            case 'excel':
                this.table.button('.buttons-excel').trigger();
                break;
            case 'csv':
                this.table.button('.buttons-csv').trigger();
                break;
            case 'pdf':
                this.table.button('.buttons-pdf').trigger();
                break;
        }

        this.showToast(`Exportação ${format.toUpperCase()} iniciada!`, 'info');
    }

    /**
     * Mostra toast de notificação
     */
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

        // Remover toast após ser ocultado
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Verificar se jQuery está carregado
if (typeof jQuery === 'undefined') {
    console.error('jQuery não está carregado! DataTables não funcionará.');
    document.body.innerHTML = '<div class="alert alert-danger m-4">Erro: jQuery não está carregado. Recarregue a página.</div>';
} else {
    console.log('jQuery carregado com sucesso:', jQuery.fn.jquery);
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que todos os scripts carregaram
    setTimeout(() => {
        if (typeof $ !== 'undefined' && $.fn.dataTable) {
            new OperacoesPortuarias();
        } else {
            console.error('DataTables não está disponível');
            document.querySelector('.card-body').innerHTML = '<div class="alert alert-warning">Carregando recursos... Aguarde.</div>';
            // Tentar novamente em 2 segundos
            setTimeout(() => {
                if (typeof $ !== 'undefined' && $.fn.dataTable) {
                    new OperacoesPortuarias();
                } else {
                    document.querySelector('.card-body').innerHTML = '<div class="alert alert-danger">Erro ao carregar recursos. Recarregue a página.</div>';
                }
            }, 2000);
        }
    }, 100);
});
