/**
 * Operações Portuárias - DataTables Implementation
 * Usando DataTables igual ao TMS
 */

class OperacoesPortuarias {
    constructor() {
        this.data = this.getSampleData();
        this.dataTable = null;
        this.columnSettings = this.getDefaultColumnSettings();
        this.currentOperation = null;
        this.map = null;
        this.init();
    }

    init() {
        this.loadSavedSettings();
        this.populateFilterOptions();
        this.initializeDateRangePicker();
        this.initializeDataTable();
        this.bindEvents();
        this.initializeColumnSettings();
        this.showToast('Sistema de Operações Portuárias carregado com sucesso!', 'success');
    }

    /**
     * Dados de exemplo para Operações Portuárias
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
     * Configurações padrão das colunas
     */
    getDefaultColumnSettings() {
        return [
            { key: 'id', name: 'Pedido', visible: true, order: 0, required: true },
            { key: 'status', name: 'Status', visible: true, order: 1, required: true },
            { key: 'navio', name: 'Navio', visible: true, order: 2, required: true },
            { key: 'tipo_frete', name: 'Tipo de Frete', visible: true, order: 3, required: true },
            { key: 'tipo_carga', name: 'Tipo de Carga', visible: true, order: 4, required: true },
            { key: 'data_registro', name: 'Data Reg.', visible: true, order: 5, required: true },
            { key: 'inicio_operacao', name: 'Início Operação', visible: true, order: 6, required: true },
            { key: 'fim_operacao', name: 'Fim Operação', visible: true, order: 7, required: true },
            { key: 'empresa', name: 'Empresa', visible: true, order: 8, required: true },
            { key: 'cliente', name: 'Cliente', visible: true, order: 9, required: true }
        ];
    }

    /**
     * Carrega configurações salvas
     */
    loadSavedSettings() {
        const savedColumns = localStorage.getItem('operacoes-column-settings');
        if (savedColumns) {
            try {
                this.columnSettings = JSON.parse(savedColumns);
                // Garantir que colunas obrigatórias estejam sempre visíveis
                this.columnSettings.forEach(col => {
                    if (col.required) {
                        col.visible = true;
                    }
                });
            } catch (e) {
                console.error('Erro ao carregar configurações de colunas:', e);
                this.columnSettings = this.getDefaultColumnSettings();
            }
        }
    }

    /**
     * Inicializa DataTables
     */
    initializeDataTable() {
        const table = $('#operacoes-table');

        if ($.fn.DataTable.isDataTable(table)) {
            table.DataTable().destroy();
        }

        // Garantir que colunas obrigatórias estejam sempre visíveis
        this.columnSettings.forEach(col => {
            if (col.required) {
                col.visible = true;
            }
        });

        // Definir colunas baseado nas configurações
        const visibleColumns = this.columnSettings
            .filter(col => col.visible)
            .sort((a, b) => a.order - b.order);

        const columns = visibleColumns.map(col => {
            return {
                data: col.key,
                title: col.name,
                className: this.getColumnClass(col.key),
                render: (data, type, row) => {
                    if (col.key === 'status') {
                        return this.getStatusBadge(data);
                    }
                    return data || '-';
                }
            };
        });



        this.dataTable = table.DataTable({
            data: this.data,
            columns: columns,
            pageLength: 10,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
            },
            responsive: true,
            scrollX: true,
            scrollY: '400px',
            scrollCollapse: true,
            dom: '<"row"<"col-sm-6"l><"col-sm-6"f>>' +
                 '<"row"<"col-sm-12"tr>>' +
                 '<"row"<"col-sm-5"i><"col-sm-7"p>>',
            order: [[0, 'desc']]
        });

        // Evento de clique na linha para abrir modal
        table.find('tbody').on('click', 'tr', function(e) {
            // Não abrir modal se clicou em um botão
            if ($(e.target).closest('button').length > 0) {
                return;
            }

            const data = operacoesPortuarias.dataTable.row(this).data();
            if (data) {
                operacoesPortuarias.showDetails(data.id);
            }
        });

        // Estilo para hover da linha
        table.find('tbody').on('mouseenter', 'tr', function() {
            $(this).addClass('table-hover-effect');
        }).on('mouseleave', 'tr', function() {
            $(this).removeClass('table-hover-effect');
        });
    }

    /**
     * Inicializa o date range picker
     */
    initializeDateRangePicker() {
        const dateRangeInput = document.getElementById('filter-date-range');
        if (!dateRangeInput) return;

        if (typeof flatpickr !== 'undefined') {
            this.dateRangePicker = flatpickr(dateRangeInput, {
                mode: "range",
                dateFormat: "d/m/Y",
                locale: "pt",
                minDate: "2020-01-01",
                maxDate: "today",
                allowInput: false,
                clickOpens: true,
                appendTo: document.body,
                static: false,
                position: "auto"
            });

            const iconElement = dateRangeInput.nextElementSibling?.querySelector('i');
            if (iconElement) {
                iconElement.style.cursor = 'pointer';
                iconElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.dateRangePicker) {
                        this.dateRangePicker.open();
                    }
                });
            }
        }
    }

    /**
     * Popula opções dos filtros
     */
    populateFilterOptions() {
        // Extrair valores únicos dos dados
        const status = [...new Set(this.data.map(item => item.status))].filter(Boolean).sort();
        const tiposFrete = [...new Set(this.data.map(item => item.tipo_frete))].filter(Boolean).sort();
        const tiposCarga = [...new Set(this.data.map(item => item.tipo_carga))].filter(Boolean).sort();
        const empresas = [...new Set(this.data.map(item => item.empresa))].filter(Boolean).sort();
        const clientes = [...new Set(this.data.map(item => item.cliente))].filter(Boolean).sort();

        // Popular select de status
        const statusSelect = document.getElementById('filter-status');
        if (statusSelect) {
            const statusOptions = status.map(s => `<option value="${s}">${s}</option>`).join('');
            statusSelect.innerHTML = '<option value="">Todos os status</option>' + statusOptions;
        }

        // Popular select de tipos de frete
        const tipoFreteSelect = document.getElementById('filter-tipo-frete');
        if (tipoFreteSelect) {
            const tipoFreteOptions = tiposFrete.map(t => `<option value="${t}">${t}</option>`).join('');
            tipoFreteSelect.innerHTML = '<option value="">Todos os tipos</option>' + tipoFreteOptions;
        }

        // Popular select de tipos de carga
        const tipoCargaSelect = document.getElementById('filter-tipo-carga');
        if (tipoCargaSelect) {
            const tipoCargaOptions = tiposCarga.map(t => `<option value="${t}">${t}</option>`).join('');
            tipoCargaSelect.innerHTML = '<option value="">Todos os tipos</option>' + tipoCargaOptions;
        }

        // Popular select de empresas
        const empresaSelect = document.getElementById('filter-empresa');
        if (empresaSelect) {
            const empresaOptions = empresas.map(e => `<option value="${e}">${e}</option>`).join('');
            empresaSelect.innerHTML = '<option value="">Todas as empresas</option>' + empresaOptions;
        }

        // Popular select de clientes
        const clienteSelect = document.getElementById('filter-cliente');
        if (clienteSelect) {
            const clienteOptions = clientes.map(c => `<option value="${c}">${c}</option>`).join('');
            clienteSelect.innerHTML = '<option value="">Todos os clientes</option>' + clienteOptions;
        }
    }

    /**
     * Vincula eventos
     */
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
     * Aplica filtros
     */
    applyFilters() {
        const searchTerm = document.getElementById('filter-search')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('filter-status')?.value || '';
        const tipoFreteFilter = document.getElementById('filter-tipo-frete')?.value || '';
        const tipoCargoFilter = document.getElementById('filter-tipo-carga')?.value || '';
        const empresaFilter = document.getElementById('filter-empresa')?.value || '';
        const clienteFilter = document.getElementById('filter-cliente')?.value || '';

        // Aplicar filtros no DataTable
        this.dataTable.draw();

        // Filtro customizado
        $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
            const row = this.data[dataIndex];

            // Filtro de busca geral
            if (searchTerm) {
                const searchableText = `${row.navio} ${row.tipo_frete} ${row.tipo_carga} ${row.empresa} ${row.cliente} ${row.status}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            // Filtro de status
            if (statusFilter && row.status !== statusFilter) {
                return false;
            }

            // Filtro de tipo de frete
            if (tipoFreteFilter && row.tipo_frete !== tipoFreteFilter) {
                return false;
            }

            // Filtro de tipo de carga
            if (tipoCargoFilter && row.tipo_carga !== tipoCargoFilter) {
                return false;
            }

            // Filtro de empresa
            if (empresaFilter && row.empresa !== empresaFilter) {
                return false;
            }

            // Filtro de cliente
            if (clienteFilter && row.cliente !== clienteFilter) {
                return false;
            }

            return true;
        });

        this.dataTable.draw();

        const sidebar = bootstrap.Offcanvas.getInstance(document.getElementById('filters-sidebar'));
        if (sidebar) sidebar.hide();

        this.showToast('Filtros aplicados!', 'success');
    }

    /**
     * Limpa filtros
     */
    clearFilters() {
        // Limpar campos
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-tipo-frete').value = '';
        document.getElementById('filter-tipo-carga').value = '';
        document.getElementById('filter-empresa').value = '';
        document.getElementById('filter-cliente').value = '';

        // Limpar date range picker
        if (this.dateRangePicker) {
            this.dateRangePicker.clear();
        }

        // Remover filtros customizados
        $.fn.dataTable.ext.search.pop();

        // Redesenhar tabela
        this.dataTable.draw();

        this.showToast('Filtros limpos!', 'info');
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

        const sortedColumns = [...this.columnSettings].sort((a, b) => a.order - b.order);

        columnList.innerHTML = sortedColumns.map(column => `
            <div class="list-group-item column-item d-flex align-items-center" data-column="${column.key}">
                <div class="form-check me-3">
                    <input class="form-check-input column-visibility-toggle"
                           type="checkbox"
                           ${column.visible ? 'checked' : ''}
                           ${column.required ? 'disabled' : ''}
                           data-column="${column.key}">
                </div>
                <div class="flex-grow-1">
                    <i class="bi bi-grip-vertical me-2 text-muted"></i>
                    ${column.name}
                </div>
                <small class="text-muted">${column.key}</small>
            </div>
        `).join('');

        // Bind toggle events
        columnList.querySelectorAll('.column-visibility-toggle').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const columnKey = e.target.getAttribute('data-column');
                const column = this.columnSettings.find(col => col.key === columnKey);
                if (column && !column.required) {
                    column.visible = e.target.checked;
                }
            });
        });

        // Bind save button
        const saveButton = document.getElementById('btn-save-columns');
        if (saveButton) {
            saveButton.replaceWith(saveButton.cloneNode(true));
            const newSaveButton = document.getElementById('btn-save-columns');

            newSaveButton.addEventListener('click', () => {
                this.saveColumnSettings();
                this.applyColumnSettings();

                const modal = bootstrap.Modal.getInstance(document.getElementById('modal-column-settings'));
                if (modal) {
                    modal.hide();
                }

                this.showToast('Configurações de colunas salvas!', 'success');
            });
        }

        // Bind reset button
        const resetButton = document.getElementById('btn-reset-columns');
        if (resetButton) {
            resetButton.replaceWith(resetButton.cloneNode(true));
            const newResetButton = document.getElementById('btn-reset-columns');

            newResetButton.addEventListener('click', () => {
                this.resetColumnSettings();
                this.applyColumnSettings();
                this.showToast('Configurações restauradas para o padrão', 'info');
            });
        }
    }

    /**
     * Inicializa sortable para colunas
     */
    initializeSortable() {
        const columnList = document.getElementById('column-list');
        if (!columnList || typeof Sortable === 'undefined') return;

        new Sortable(columnList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            handle: '.bi-grip-vertical',
            onEnd: (evt) => {
                const movedItem = evt.item;
                const columnKey = movedItem.getAttribute('data-column');
                const newIndex = evt.newIndex;
                const oldIndex = evt.oldIndex;

                this.reorderColumns(columnKey, oldIndex, newIndex);
                this.updateColumnOrderNumbers();
            }
        });
    }

    /**
     * Reordena as colunas baseado no movimento
     */
    reorderColumns(movedColumnKey, oldIndex, newIndex) {
        const sortedColumns = [...this.columnSettings].sort((a, b) => a.order - b.order);
        const movedColumn = sortedColumns.splice(oldIndex, 1)[0];
        sortedColumns.splice(newIndex, 0, movedColumn);

        sortedColumns.forEach((col, index) => {
            col.order = index;
        });
    }

    /**
     * Atualiza os números de ordem nas colunas
     */
    updateColumnOrderNumbers() {
        const columnList = document.getElementById('column-list');
        if (!columnList) return;

        const items = columnList.querySelectorAll('.column-item');
        items.forEach((item, index) => {
            const columnKey = item.getAttribute('data-column');
            const column = this.columnSettings.find(col => col.key === columnKey);
            if (column) {
                column.order = index;
            }
        });
    }

    /**
     * Salva configurações das colunas
     */
    saveColumnSettings() {
        // Garantir que colunas obrigatórias estejam sempre visíveis antes de salvar
        this.columnSettings.forEach(col => {
            if (col.required) {
                col.visible = true;
            }
        });

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
        localStorage.removeItem('operacoes-column-settings');
        this.showToast('Configurações restauradas para o padrão', 'info');
    }

    /**
     * Aplica configurações de colunas à tabela
     */
    applyColumnSettings() {
        this.initializeDataTable();
    }

    /**
     * Retorna classe de alinhamento para a coluna
     */
    getColumnClass(columnKey) {
        const alignments = {
            'id': 'text-center', // ID centralizado
            'status': 'text-center', // Status centralizado
            'navio': 'text-start', // Navio alinhado à esquerda
            'tipo_frete': 'text-center', // Tipo de frete centralizado
            'tipo_carga': 'text-center', // Tipo de carga centralizado
            'data_registro': 'text-center', // Data centralizada
            'inicio_operacao': 'text-center', // Início centralizado
            'fim_operacao': 'text-center', // Fim centralizado
            'empresa': 'text-start', // Empresa alinhada à esquerda
            'cliente': 'text-start' // Cliente alinhado à esquerda
        };
        return alignments[columnKey] || 'text-start';
    }

    /**
     * Retorna badge de status
     */
    getStatusBadge(status) {
        const badges = {
            'Em operação': 'bg-primary',
            'Concluída': 'bg-success',
            'Pendente': 'bg-warning text-dark',
            'Cancelada': 'bg-danger'
        };
        return `<span class="badge ${badges[status] || 'bg-secondary'}">${status}</span>`;
    }



    /**
     * Mostra detalhes da operação
     */
    showDetails(id) {
        const operation = this.data.find(op => op.id === id);
        if (!operation) return;

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

    /**
     * Mostra localização no mapa
     */
    showLocationOnMap(id) {
        const operation = id ? this.data.find(op => op.id === id) : this.currentOperation;
        if (!operation) {
            this.showToast('Nenhuma operação selecionada!', 'error');
            return;
        }

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
        this.initializeMap(operation);
    }

    /**
     * Inicializa o mapa usando Leaflet
     */
    initializeMap(operation) {
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
     * Retorna classe do badge de status
     */
    getStatusBadgeClass(status) {
        const classes = {
            'Em operação': 'bg-primary',
            'Concluída': 'bg-success',
            'Pendente': 'bg-warning text-dark',
            'Cancelada': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    /**
     * Exporta tabela
     */
    exportTable(format) {
        this.showToast(`Exportação ${format.toUpperCase()} em desenvolvimento`, 'info');
    }

    /**
     * Mostra toast
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

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Instância global
let operacoesPortuarias = null;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    operacoesPortuarias = new OperacoesPortuarias();
});
