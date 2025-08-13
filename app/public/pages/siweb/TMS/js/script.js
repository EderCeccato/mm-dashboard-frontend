/**
 * TMS - Gestão de Transporte
 * Sistema de gerenciamento de pedidos de transporte
 * MM Softwares
 */

class TMSManager {
   constructor() {
      this.data = this.getSampleData();
      this.dataTable = null;
      this.columnSettings = this.getDefaultColumnSettings();
      this.currentPedido = null;
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
      this.showToast('Sistema TMS carregado com sucesso!', 'success');
   }

   /**
    * Dados de exemplo para TMS
    */
   getSampleData() {
      return [
         {
               nomovtra: 'TMS001',
               processo: 'PROC-2024-001',
               tipo_carga: 'CONTAINER',
               container: 'MSKU1234567',
               rota: 'Santos/SP → São Paulo/SP',
               destinatario: 'ABC Importadora Ltda',
               numero_nfe: '000123456',
               volume: '25,5 m³',
               peso_nfe: '15.750 kg',
               data_registro: '15/01/2024',
               previsao_entrega: '18/01/2024',
               entregue: '17/01/2024',
               motorista: 'João Silva Santos',
               tracao: 'ABC-1234',
               reboque: 'DEF-5678',
               valor_frete: 2500.00,
               pedagio: 150.00,
               valor_gris: 75.00,
               seguro: 125.00,
               icms: 300.00,
               outros: 50.00,
               total: 3200.00,
               status: 'Entregue',
               empresa: 'Transportadora ABC',
               follow_up: 'Entrega confirmada',
               ocorrencia: null,
               lat: -23.5505,
               lng: -46.6333
         },
         {
               nomovtra: 'TMS002',
               processo: 'PROC-2024-002',
               tipo_carga: 'CARGA GERAL',
               container: null,
               rota: 'Rio de Janeiro/RJ → Belo Horizonte/MG',
               destinatario: 'XYZ Comercial S.A.',
               numero_nfe: '000987654',
               volume: '18,2 m³',
               peso_nfe: '12.300 kg',
               data_registro: '16/01/2024',
               previsao_entrega: '19/01/2024',
               entregue: null,
               motorista: 'Maria Santos Costa',
               tracao: 'GHI-9876',
               reboque: 'JKL-5432',
               valor_frete: 1800.00,
               pedagio: 120.00,
               valor_gris: 54.00,
               seguro: 90.00,
               icms: 216.00,
               outros: 30.00,
               total: 2310.00,
               status: 'Em trânsito',
               empresa: 'Transportadora XYZ',
               follow_up: 'Saída confirmada',
               ocorrencia: null,
               lat: -22.9068,
               lng: -43.1729
         },
         {
               nomovtra: 'TMS003',
               processo: 'PROC-2024-003',
               tipo_carga: 'REFRIGERADA',
               container: 'TCLU9876543',
               rota: 'Campinas/SP → Brasília/DF',
               destinatario: 'Supermercados Brasil Ltda',
               numero_nfe: '000456789',
               volume: '32,8 m³',
               peso_nfe: '22.150 kg',
               data_registro: '17/01/2024',
               previsao_entrega: '20/01/2024',
               entregue: null,
               motorista: 'Carlos Eduardo Lima',
               tracao: 'MNO-2468',
               reboque: 'PQR-1357',
               valor_frete: 3200.00,
               pedagio: 180.00,
               valor_gris: 96.00,
               seguro: 160.00,
               icms: 384.00,
               outros: 80.00,
               total: 4100.00,
               status: 'Aguardando coleta',
               empresa: 'Refrigerados Trans',
               follow_up: 'Aguardando liberação',
               ocorrencia: 'Atraso na documentação',
               lat: -22.9056,
               lng: -47.0608
         },
         {
               nomovtra: 'TMS004',
               processo: 'PROC-2024-004',
               tipo_carga: 'GRANEL',
               container: null,
               rota: 'Vitória/ES → Salvador/BA',
               destinatario: 'Industria Alimentícia Norte',
               numero_nfe: '000111222',
               volume: '45,0 m³',
               peso_nfe: '28.500 kg',
               data_registro: '18/01/2024',
               previsao_entrega: '22/01/2024',
               entregue: null,
               motorista: 'Roberto Alves Pereira',
               tracao: 'STU-3691',
               reboque: 'VWX-7410',
               valor_frete: 2800.00,
               pedagio: 200.00,
               valor_gris: 84.00,
               seguro: 140.00,
               icms: 336.00,
               outros: 40.00,
               total: 3600.00,
               status: 'Em trânsito',
               empresa: 'Graneleiros Sul',
               follow_up: 'Viagem em andamento',
               ocorrencia: null,
               lat: -20.3155,
               lng: -40.3128
         },
         {
               nomovtra: 'TMS005',
               processo: 'PROC-2024-005',
               tipo_carga: 'PERIGOSA',
               container: 'HAZM5555555',
               rota: 'Paulínia/SP → Duque de Caxias/RJ',
               destinatario: 'Petroquímica Industrial Ltda',
               numero_nfe: '000333444',
               volume: '28,5 m³',
               peso_nfe: '18.750 kg',
               data_registro: '19/01/2024',
               previsao_entrega: '21/01/2024',
               entregue: null,
               motorista: 'Ana Paula Rodrigues',
               tracao: 'YZA-1472',
               reboque: 'BCD-5836',
               valor_frete: 4500.00,
               pedagio: 160.00,
               valor_gris: 135.00,
               seguro: 225.00,
               icms: 540.00,
               outros: 140.00,
               total: 5700.00,
               status: 'Aguardando coleta',
               empresa: 'Perigosos Express',
               follow_up: 'Documentação em análise',
               ocorrencia: null,
               lat: -22.7609,
               lng: -47.1507
         }
      ];
   }

   /**
    * Configurações padrão das colunas
    */
   getDefaultColumnSettings() {
      return [
         { key: 'nomovtra', name: 'Pedido', visible: true, order: 0 },
         { key: 'processo', name: 'Processo', visible: true, order: 1 },
         { key: 'tipo_carga', name: 'Tipo de Carga', visible: true, order: 2 },
         { key: 'container', name: 'Container', visible: true, order: 3 },
         { key: 'rota', name: 'Rota', visible: true, order: 4 },
         { key: 'destinatario', name: 'Destinatário', visible: true, order: 5 },
         { key: 'numero_nfe', name: 'NF-e', visible: true, order: 6 },
         { key: 'volume', name: 'Volume', visible: false, order: 7 },
         { key: 'peso_nfe', name: 'Peso NF-e', visible: false, order: 8 },
         { key: 'status', name: 'Status', visible: true, order: 9 },
         { key: 'data_registro', name: 'Data Reg.', visible: true, order: 10 },
         { key: 'previsao_entrega', name: 'Previsão Entrega', visible: true, order: 11 },
         { key: 'entregue', name: 'Entregue', visible: false, order: 12 },
         { key: 'motorista', name: 'Motorista', visible: true, order: 13 },
         { key: 'tracao', name: 'Tração', visible: true, order: 14 },
         { key: 'reboque', name: 'Reboque', visible: false, order: 15 },
         { key: 'valor_frete', name: 'Valor Frete', visible: true, order: 16 },
         { key: 'pedagio', name: 'Pedágio', visible: false, order: 17 },
         { key: 'valor_gris', name: 'Valor GRIS', visible: false, order: 18 },
         { key: 'seguro', name: 'Seguro', visible: false, order: 19 },
         { key: 'icms', name: 'ICMS', visible: false, order: 20 },
         { key: 'outros', name: 'Outros', visible: false, order: 21 },
         { key: 'total', name: 'Total', visible: true, order: 22 }
      ];
   }

   /**
    * Inicializa DataTables
    */
   initializeDataTable() {
      const table = $('#tms-table');

      if ($.fn.DataTable.isDataTable(table)) {
         table.DataTable().destroy();
      }

      // Definir colunas baseado nas configurações
      const visibleColumns = this.columnSettings
         .filter(col => col.visible)
         .sort((a, b) => a.order - b.order);

      const columns = visibleColumns.map(col => {
         return {
               data: col.key,
               title: col.name,
               render: (data, type, row) => {
                  if (col.key === 'status') {
                     return this.getStatusBadge(data);
                  } else if (col.key.includes('valor') || col.key === 'total' ||
                     col.key === 'pedagio' || col.key === 'seguro' ||
                     col.key === 'icms' || col.key === 'outros') {
                     return data ? this.formatCurrency(data) : '-';
                  } else if (col.key === 'container' && !data) {
                     return '-';
                  } else if (col.key === 'entregue' && !data) {
                     return '-';
                  }
                  return data || '-';
               }
         };
      });

      // Adicionar coluna de ações
      columns.push({
         data: null,
         title: 'Ações',
         orderable: false,
         width: '200px',
         className: 'text-center',
         render: (data, type, row) => {
               return `
                  <div class="btn-group btn-group-sm" role="group">
                     <button type="button" class="btn btn-outline-primary btn-action"
                              onclick="tmsManager.handleAction('comprovante', '${row.nomovtra}')"
                              title="Comprovante">
                           <i class="bi bi-file-earmark-check"></i>
                     </button>
                     <button type="button" class="btn btn-outline-warning btn-action"
                              onclick="tmsManager.handleAction('follow-up', '${row.nomovtra}')"
                              title="Follow Up">
                           <i class="bi bi-arrow-repeat"></i>
                     </button>
                     <button type="button" class="btn btn-outline-danger btn-action"
                              onclick="tmsManager.handleAction('ocorrencia', '${row.nomovtra}')"
                              title="Ocorrência">
                           <i class="bi bi-exclamation-triangle"></i>
                     </button>
                     <button type="button" class="btn btn-outline-info btn-action"
                              onclick="tmsManager.handleAction('documento', '${row.nomovtra}')"
                              title="Documento">
                           <i class="bi bi-file-earmark-text"></i>
                     </button>
                     <button type="button" class="btn btn-outline-success btn-action"
                              onclick="tmsManager.handleAction('mapa', '${row.nomovtra}')"
                              title="Localização">
                           <i class="bi bi-geo-alt"></i>
                     </button>
                  </div>
               `;
         }
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

         const data = tmsManager.dataTable.row(this).data();
         if (data) {
               tmsManager.showDetails(data.nomovtra);
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
      const tiposCarga = [...new Set(this.data.map(item => item.tipo_carga))].filter(Boolean).sort();
      const empresas = [...new Set(this.data.map(item => item.empresa))].filter(Boolean).sort();
      const destinatarios = [...new Set(this.data.map(item => item.destinatario))].filter(Boolean).sort();
      const motoristas = [...new Set(this.data.map(item => item.motorista))].filter(Boolean).sort();

      // Popular select de status
      const statusSelect = document.getElementById('filter-status');
      if (statusSelect) {
         const statusOptions = status.map(st =>
               `<option value="${st}">${st}</option>`
         ).join('');
         statusSelect.innerHTML = '<option value="">Todos os status</option>' + statusOptions;
      }

      // Popular select de tipo de carga
      const tipoCargaSelect = document.getElementById('filter-tipo-carga');
      if (tipoCargaSelect) {
         const tipoCargaOptions = tiposCarga.map(tipo =>
               `<option value="${tipo}">${tipo}</option>`
         ).join('');
         tipoCargaSelect.innerHTML = '<option value="">Todos os tipos</option>' + tipoCargaOptions;
      }

      // Popular select de empresas
      const empresaSelect = document.getElementById('filter-empresa');
      if (empresaSelect) {
         const empresaOptions = empresas.map(empresa =>
               `<option value="${empresa}">${empresa}</option>`
         ).join('');
         empresaSelect.innerHTML = '<option value="">Todas as empresas</option>' + empresaOptions;
      }

      // Popular select de destinatários
      const destinatarioSelect = document.getElementById('filter-destinatario');
      if (destinatarioSelect) {
         const destinatarioOptions = destinatarios.map(destinatario =>
               `<option value="${destinatario}">${destinatario}</option>`
         ).join('');
         destinatarioSelect.innerHTML = '<option value="">Todos os destinatários</option>' + destinatarioOptions;
      }

      // Popular select de motoristas
      const motoristaSelect = document.getElementById('filter-motorista');
      if (motoristaSelect) {
         const motoristaOptions = motoristas.map(motorista =>
               `<option value="${motorista}">${motorista}</option>`
         ).join('');
         motoristaSelect.innerHTML = '<option value="">Todos os motoristas</option>' + motoristaOptions;
      }
   }

   /**
    * Manipula ações dos botões
    */
   handleAction(action, nomovtra) {
      const pedido = this.data.find(item => item.nomovtra === nomovtra);
      if (!pedido) return;

      this.currentPedido = pedido;

      switch(action) {
         case 'comprovante':
               this.showToast('Funcionalidade de comprovante será implementada', 'info');
               break;
         case 'follow-up':
               this.showToast('Funcionalidade de follow-up será implementada', 'info');
               break;
         case 'ocorrencia':
               this.showToast('Funcionalidade de ocorrência será implementada', 'info');
               break;
         case 'documento':
               this.showToast('Funcionalidade de documento será implementada', 'info');
               break;
         case 'mapa':
               this.showMap();
               break;
      }
   }

   /**
    * Carrega configurações salvas
    */
   loadSavedSettings() {
      // FORÇA RESET DAS CONFIGURAÇÕES PARA GARANTIR QUE STATUS APAREÇA
      localStorage.removeItem('tms-column-settings');
      this.columnSettings = this.getDefaultColumnSettings();

      // DEBUG: Verificar se status está nas configurações padrão
      const statusColumn = this.columnSettings.find(col => col.key === 'status');

      const savedColumns = localStorage.getItem('tms-column-settings');
      if (savedColumns) {
         try {
               this.columnSettings = JSON.parse(savedColumns);
         } catch (e) {
               console.error('Erro ao carregar configurações de colunas:', e);
         }
      }
   }

   /**
    * Atualiza a tabela com base nas configurações de colunas
    */
   updateTableColumns() {
      if (this.dataTable) {
         // Salvar dados atuais
         const currentData = this.dataTable.data().toArray();

         // Destruir tabela
         this.dataTable.destroy();

         // Limpar completamente o HTML da tabela
         const table = document.getElementById('tms-table');
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
    * Retorna badge HTML para status (usando padrão da operação portuária)
    */
   getStatusBadge(status) {
      const badges = {
         'Em trânsito': 'bg-primary',
         'Em operação': 'bg-primary',
         'Entregue': 'bg-success',
         'Concluída': 'bg-success',
         'Aguardando coleta': 'bg-warning text-dark',
         'Pendente': 'bg-warning text-dark',
         'Cancelado': 'bg-danger',
         'Cancelada': 'bg-danger'
      };
      const badgeClass = badges[status] || 'bg-secondary';
      const result = `<span class="badge ${badgeClass}">${status}</span>`;
      return result;
   }

   /**
    * Formata valor monetário
    */
   formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
         style: 'currency',
         currency: 'BRL'
      }).format(value);
   }

   /**
    * Mostra detalhes do pedido
    */
   showDetails(nomovtra) {
      const pedido = this.data.find(item => item.nomovtra === nomovtra);
      if (!pedido) return;

      this.currentPedido = pedido;

      // Preencher informações no modal
      document.getElementById('detail-nomovtra').textContent = pedido.nomovtra;
      document.getElementById('detail-processo').textContent = pedido.processo;
      document.getElementById('detail-container').textContent = pedido.container || '-';
      document.getElementById('detail-status').innerHTML = this.getStatusBadge(pedido.status);

      document.getElementById('detail-tipo-carga').textContent = pedido.tipo_carga;
      document.getElementById('detail-volume').textContent = pedido.volume;
      document.getElementById('detail-peso-nfe').textContent = pedido.peso_nfe;
      document.getElementById('detail-numero-nfe').textContent = pedido.numero_nfe;

      document.getElementById('detail-data-registro').textContent = pedido.data_registro;
      document.getElementById('detail-previsao-entrega').textContent = pedido.previsao_entrega;
      document.getElementById('detail-entregue').textContent = pedido.entregue || '-';

      document.getElementById('detail-motorista').textContent = pedido.motorista;
      document.getElementById('detail-tracao').textContent = pedido.tracao;
      document.getElementById('detail-reboque').textContent = pedido.reboque;
      document.getElementById('detail-destinatario').textContent = pedido.destinatario;
      document.getElementById('detail-rota').textContent = pedido.rota;

      document.getElementById('detail-valor-frete').textContent = this.formatCurrency(pedido.valor_frete);
      document.getElementById('detail-pedagio').textContent = this.formatCurrency(pedido.pedagio);
      document.getElementById('detail-valor-gris').textContent = this.formatCurrency(pedido.valor_gris);
      document.getElementById('detail-seguro').textContent = this.formatCurrency(pedido.seguro);
      document.getElementById('detail-icms').textContent = this.formatCurrency(pedido.icms);
      document.getElementById('detail-outros').textContent = this.formatCurrency(pedido.outros);
      document.getElementById('detail-total').textContent = this.formatCurrency(pedido.total);

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById('modal-operation-details'));
      modal.show();
   }



   /**
    * Vincula eventos
    */
   bindEvents() {
      // Botões de filtros
      const btnToggleFilters = document.getElementById('btn-toggle-filters');
      if (btnToggleFilters) {
         btnToggleFilters.addEventListener('click', () => {
               const filtersSidebar = new bootstrap.Offcanvas(document.getElementById('filters-sidebar'));
               filtersSidebar.show();
         });
      }

      // Aplicar filtros
      const btnApplyFilters = document.getElementById('btn-apply-filters');
      if (btnApplyFilters) {
         btnApplyFilters.addEventListener('click', () => this.applyFilters());
      }

      // Limpar filtros
      const btnClearFilters = document.getElementById('btn-clear-filters');
      if (btnClearFilters) {
         btnClearFilters.addEventListener('click', () => this.clearFilters());
      }

      // Configuração de colunas
      const btnColumnSettings = document.getElementById('btn-column-settings');
      if (btnColumnSettings) {
         btnColumnSettings.addEventListener('click', () => {
               const modal = new bootstrap.Modal(document.getElementById('modal-column-settings'));
               modal.show();
         });
      }

      // Ícones de ação no modal
      this.bindActionButtons();

      // Exportar
      this.bindExportEvents();
   }

   /**
    * Vincula eventos dos ícones de ação
    */
   bindActionButtons() {
      document.getElementById('btn-comprovante')?.addEventListener('click', () => {
         this.showToast('Funcionalidade de comprovante será implementada', 'info');
      });

      document.getElementById('btn-follow-up')?.addEventListener('click', () => {
         this.showToast('Funcionalidade de follow-up será implementada', 'info');
      });

      document.getElementById('btn-ocorrencia')?.addEventListener('click', () => {
         this.showToast('Funcionalidade de ocorrência será implementada', 'info');
      });

      document.getElementById('btn-documento')?.addEventListener('click', () => {
         this.showToast('Funcionalidade de documento será implementada', 'info');
      });

      document.getElementById('btn-mapa')?.addEventListener('click', () => {
         this.showMap();
      });
   }

   /**
    * Mostra mapa com localização
    */
   showMap() {
      if (!this.currentPedido) return;

      const mapContainer = document.getElementById('operation-map');
      const locationContent = document.getElementById('location-content');

      if (mapContainer && locationContent) {
         locationContent.style.display = 'none';
         mapContainer.style.display = 'block';

         // Inicializar mapa Leaflet
         if (this.map) {
               this.map.remove();
         }

         this.map = L.map('operation-map').setView([this.currentPedido.lat, this.currentPedido.lng], 13);

         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
               attribution: '© OpenStreetMap contributors'
         }).addTo(this.map);

         L.marker([this.currentPedido.lat, this.currentPedido.lng])
               .addTo(this.map)
               .bindPopup(`<b>${this.currentPedido.nomovtra}</b><br>${this.currentPedido.rota}`)
               .openPopup();

         // Redimensionar mapa após 100ms
         setTimeout(() => {
               this.map.invalidateSize();
         }, 100);
      }
   }

   /**
    * Vincula eventos de exportação
    */
   bindExportEvents() {
      document.getElementById('export-excel')?.addEventListener('click', () => {
         this.showToast('Exportação para Excel será implementada', 'info');
      });

      document.getElementById('export-csv')?.addEventListener('click', () => {
         this.showToast('Exportação para CSV será implementada', 'info');
      });

      document.getElementById('export-pdf')?.addEventListener('click', () => {
         this.showToast('Exportação para PDF será implementada', 'info');
      });
   }

   /**
    * Aplica filtros
    */
   applyFilters() {
      if (!this.dataTable) return;

      const search = document.getElementById('filter-search')?.value || '';
      const status = document.getElementById('filter-status')?.value || '';
      const tipoCarga = document.getElementById('filter-tipo-carga')?.value || '';
      const motorista = document.getElementById('filter-motorista')?.value || '';
      const container = document.getElementById('filter-container')?.value || '';
      const processo = document.getElementById('filter-processo')?.value || '';
      const empresa = document.getElementById('filter-empresa')?.value || '';
      const destinatario = document.getElementById('filter-destinatario')?.value || '';

      // Limpar todos os filtros primeiro
      this.dataTable.search('').columns().search('').draw();

      // Aplicar filtros individuais
      if (search) {
         this.dataTable.search(search);
      }

      // Aplicar filtros por coluna (pode precisar ajustar os índices)
      const columnMap = {
         'status': this.getColumnIndex('status'),
         'tipo_carga': this.getColumnIndex('tipo_carga'),
         'motorista': this.getColumnIndex('motorista'),
         'container': this.getColumnIndex('container'),
         'processo': this.getColumnIndex('processo'),
         'empresa': this.getColumnIndex('empresa'),
         'destinatario': this.getColumnIndex('destinatario')
      };

      if (status && columnMap.status !== -1) {
         this.dataTable.column(columnMap.status).search(status);
      }
      if (tipoCarga && columnMap.tipo_carga !== -1) {
         this.dataTable.column(columnMap.tipo_carga).search(tipoCarga);
      }
      if (motorista && columnMap.motorista !== -1) {
         this.dataTable.column(columnMap.motorista).search(motorista);
      }
      if (container && columnMap.container !== -1) {
         this.dataTable.column(columnMap.container).search(container);
      }
      if (processo && columnMap.processo !== -1) {
         this.dataTable.column(columnMap.processo).search(processo);
      }
      if (empresa && columnMap.empresa !== -1) {
         this.dataTable.column(columnMap.empresa).search(empresa);
      }
      if (destinatario && columnMap.destinatario !== -1) {
         this.dataTable.column(columnMap.destinatario).search(destinatario);
      }

      this.dataTable.draw();

      const filtersSidebar = bootstrap.Offcanvas.getInstance(document.getElementById('filters-sidebar'));
      if (filtersSidebar) {
         filtersSidebar.hide();
      }

      const filteredCount = this.dataTable.rows({search: 'applied'}).count();
      this.showToast(`${filteredCount} pedido(s) encontrado(s)`, 'success');
   }

   /**
    * Obtém o índice da coluna por chave
    */
   getColumnIndex(key) {
      const visibleColumns = this.columnSettings
         .filter(col => col.visible)
         .sort((a, b) => a.order - b.order);

      const index = visibleColumns.findIndex(col => col.key === key);
      return index;
   }

   /**
    * Limpa filtros
    */
   clearFilters() {
      const filterForm = document.getElementById('filters-form');
      if (filterForm) {
         filterForm.reset();
      }

      if (this.dataTable) {
         this.dataTable.search('').columns().search('').draw();
      }

      this.showToast('Filtros limpos', 'info');
   }

   /**
    * Inicializa configuração de colunas
    */
   initializeColumnSettings() {
      this.renderColumnList();
      this.initializeSortable();
   }

   /**
    * Renderiza lista de colunas
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
               if (column) {
                  column.visible = e.target.checked;
                  // Não atualizar tabela imediatamente, apenas quando salvar
               }
         });
      });

      // Bind save button
      const saveButton = document.getElementById('btn-save-columns');
      if (saveButton) {
         saveButton.addEventListener('click', () => {
               this.saveSettings();
               this.updateTableColumns();

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
         resetButton.addEventListener('click', () => {
               this.columnSettings = this.getDefaultColumnSettings();
               this.renderColumnList();
               this.updateTableColumns();
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
         handle: '.bi-grip-vertical', // Apenas o ícone de grip pode arrastar
         onEnd: (evt) => {
               const movedItem = evt.item;
               const columnKey = movedItem.getAttribute('data-column');
               const newIndex = evt.newIndex;
               const oldIndex = evt.oldIndex;

               // Reordenar as configurações de colunas
               this.reorderColumns(columnKey, oldIndex, newIndex);

               // Atualizar números de ordem visualmente
               this.updateColumnOrderNumbers();
         }
      });
   }

   /**
    * Reordena as colunas baseado no movimento
    */
   reorderColumns(movedColumnKey, oldIndex, newIndex) {
      // Obter array ordenado atual
      const sortedColumns = [...this.columnSettings].sort((a, b) => a.order - b.order);

      // Remover o item movido
      const movedColumn = sortedColumns.splice(oldIndex, 1)[0];

      // Inserir na nova posição
      sortedColumns.splice(newIndex, 0, movedColumn);

      // Atualizar todos os orders
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
    * Salva configurações
    */
   saveSettings() {
      localStorage.setItem('tms-column-settings', JSON.stringify(this.columnSettings));
   }

   /**
    * Mostra toast
    */
   showToast(message, type = 'info') {
      const toastContainer = document.querySelector('.toast-container');
      if (!toastContainer) return;

      const toastId = 'toast-' + Date.now();
      const bgClass = {
         'success': 'bg-success',
         'error': 'bg-danger',
         'warning': 'bg-warning',
         'info': 'bg-info'
      }[type] || 'bg-info';

      const toastHtml = `
         <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
               <div class="d-flex">
                  <div class="toast-body">${message}</div>
                  <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
               </div>
         </div>
      `;

      toastContainer.insertAdjacentHTML('beforeend', toastHtml);

      const toastElement = document.getElementById(toastId);
      const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
      toast.show();

      toastElement.addEventListener('hidden.bs.toast', () => {
         toastElement.remove();
      });
   }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
   window.tmsManager = new TMSManager();
});
