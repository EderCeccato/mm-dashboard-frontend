/**
 * TMS - Gestão de Transporte
 * Sistema de gerenciamento de pedidos de transporte
 * MM Softwares
 */

class TMSManager {
   constructor() {
      this.data = [];
      this.dataTable = null;
      this.columnSettings = this.getDefaultColumnSettings();
      this.currentPedido = null;
      this.map = null;
      this.apiBaseUrl = window.location.origin + '/api/tms';
      this.init();
   }

   async init() {
      this.loadSavedSettings();
      await this.loadProcessosData();
      this.populateFilterOptions();
      this.initializeDataTable();
      this.bindEvents();
      this.initializeColumnSettings();
      this.showTableAfterLoad(); // Mostrar tabela após carregar
      this.updateTotalRecords(this.data.length); // Atualizar contador
      this.updateActiveFiltersCount(); // Inicializar contador de filtros
      this.showToast('Sistema TMS carregado com sucesso!', 'success');
   }

   /**
    * Mostra tabela após carregar dados
    */
   showTableAfterLoad() {
      const tableLoading = document.getElementById('table-loading');
      const tableContainer = document.getElementById('table-container');

      if (tableLoading) tableLoading.style.display = 'none';
      if (tableContainer) tableContainer.style.display = 'block';
   }

   /**
    * Atualiza contador de registros
    */
   updateTotalRecords(count) {
      const badge = document.getElementById('total-records');
      if (badge) {
         badge.textContent = `${count} registro${count !== 1 ? 's' : ''}`;
      }
   }

   /**
    * Carrega dados dos processos da API
    */
   async loadProcessosData() {
      try {
         const response = await fetch(`${this.apiBaseUrl}/processos`, {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
         });

         if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
         }

         const result = await response.json();
         if (result.success) {
            this.data = result.data;
         } else {
            this.showToast('Erro ao carregar processos TMS', 'error');
         }
      } catch (error) {
         console.error('Erro ao carregar processos:', error);
         this.showToast('Erro de conexão com o servidor', 'error');
         // Em caso de erro, usar dados vazios
         this.data = [];
      }
   }

   /**
    * Converte cor baseada no mapeamento do sistema
    * @param {string} colorName - Nome da cor do sistema
    * @returns {Object} Objeto com backgroundColor e textColor
    */
   static status_color(colorName) {
      const colorMap = {
         clBlack: '#000000',
         clMaroon: '#800000',
         clGreen: '#008000',
         clOlive: '#008000',
         clNavy: '#000080',
         clPurple: '#800080',
         clTeal: '#008080',
         clGray: '#808080',
         clSilver: '#C0C0C0',
         clRed: '#FF0000',
         clLime: '#00FF00',
         clYellow: '#ffa600',
         clBlue: '#0000FF',
         clFuchsia: '#FF00FF',
         clAqua: '#00eaff',
         clWhite: '#FFFFFF',
         clMoneyGreen: '#C0DCC0',
         clSkyBlue: '#87CEEB',
         clCream: '#FFFDD0',
         clMedGray: '#A4A0A0',
         clNone: '#000000',
         clActiveBorder: '#B4B4B4',
         clActiveCaption: '#99B4D1',
         clAppWorkSpace: '#ABABAB',
         clBackground: '#000000',
         clBtnFace: '#F0F0F0',
         clBtnHighlight: '#FFFFFF',
         clBtnShadow: '#A0A0A0',
         clBtnText: '#000000',
         clCaptionText: '#000000',
         clDefault: '#000000',
         clGradientActiveCaption: '#B9D1EA',
         clGradientInactiveCaption: '#D7E4F2',
         clGrayText: '#6D6D6D',
         clHighlight: '#0078D7',
         clHighlightText: '#FFFFFF',
         clHotLight: '#0066CC',
         clInactiveBorder: '#F4F7FC',
         clInactiveCaption: '#BFCDDB',
         clInactiveCaptionText: '#000000',
         clInfoBk: '#FFFFE1',
         clInfoText: '#000000',
         clMenu: '#F0F0F0',
         clMenuBar: '#F0F0F0',
         clMenuHighlight: '#3399FF',
         clMenuText: '#000000',
         clScrollBar: '#C8C8C8',
         cl3DDkShadow: '#696969',
         cl3DLight: '#E3E3E3',
         clWindow: '#FFFFFF',
         clWindowFrame: '#646464',
         clWindowText: '#000000',
      };

      const color_without_opacity = colorMap[colorName] || '#000000';
      const color_with_opacity = color_without_opacity + '22';

      return {
         backgroundColor: color_with_opacity,
         textColor: color_without_opacity
      };
   }

   /**
    * Dados de exemplo para TMS (método mantido para compatibilidade)
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
			{ key: 'nomstatusfre', name: 'Status', visible: true, order: 0 },
			{ key: 'nomovtra', name: 'Pedido', visible: true, order: 1 },
			{ key: 'processo', name: 'Processo', visible: true, order: 2 },
			{ key: 'nomtipcarga', name: 'Tipo de Carga', visible: true, order: 3 },
			{ key: 'container', name: 'Container', visible: true, order: 4 },
			{ key: 'rota', name: 'Rota', visible: true, order: 5 },
			{ key: 'destinatario', name: 'Destinatário', visible: true, order: 6 },
			{ key: 'doccliente', name: 'NF-e', visible: true, order: 7 },
			{ key: 'qtdevol', name: 'Vol.', visible: true, order: 8 },
			{ key: 'pesototalnf', name: 'Peso NF-e', visible: true, order: 9 },
			{ key: 'vlrtotalnf', name: 'Total NF-e', visible: true, order: 10 },
			{ key: 'placacav', name: 'Tração', visible: true, order: 11 },
			{ key: 'placacar', name: 'Reboque', visible: true, order: 12 },
			{ key: 'vlrfrete', name: 'Vlr Frete', visible: true, order: 13 },
			{ key: 'vlrped', name: 'Pedágio', visible: true, order: 14 },
			{ key: 'vlrgris', name: 'Gris', visible: true, order: 15 },
			{ key: 'vlrseg', name: 'Seguro', visible: true, order: 16 },
			{ key: 'icmvlr', name: 'ICMS', visible: true, order: 17 },
			{ key: 'vlrout', name: 'Outros', visible: true, order: 18 },
			{ key: 'totalfrete', name: 'Total', visible: true, order: 19 }
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
			// Renderização personalizada por tipo de coluna
			return {
				data: col.key,
				title: col.name,
				render: (data, type, row) => {
					if (col.key === 'nomstatusfre') {
						return this.getStatusBadgeWithColor(data, row.color);
					} else if (col.key.includes('vlr') || col.key === 'totalfrete' ||
						col.key === 'vlrtotalnf' || col.key.includes('icm')) {
						return data ? this.formatCurrency(data) : '-';
					} else if (col.key === 'pesototalnf') {
						return data ? this.formatWeight(data) : '-';
					} else if (col.key === 'container' && !data) {
						return '-';
					} else if (col.key === 'qtdevol') {
						return data ? parseInt(data) : '-';
					}
					return data || '-';
				}
			};
		});

		// Determina a coluna padrão para ordenação (Pedido)
		const defaultOrderIndex = visibleColumns.findIndex(col => col.key === 'nomovtra');

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
         scrollY: false, // Remove scroll vertical
         scrollCollapse: false,
         paging: true,
         dom: '<"row"<"col-sm-6"l><"col-sm-6"f>><"row"<"col-sm-12"tr>><"row"<"col-sm-5"i><"col-sm-7"p>>',
			order: defaultOrderIndex !== -1 ? [[defaultOrderIndex, 'desc']] : []
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
    * Inicializa o date range picker (removido - não necessário com DataTables)
    */
   initializeDateRangePicker() {
      // Removido - filtro de período não necessário pois DataTables já tem pesquisa
      console.log('Date range picker removido - DataTables tem pesquisa nativa');
   }

   /**
    * Popula opções dos filtros
    */
   populateFilterOptions() {
      // Extrair valores únicos dos dados
      const status = [...new Set(this.data.map(item => item.nomstatusfre))].filter(Boolean).sort();
      const tiposCarga = [...new Set(this.data.map(item => item.nomtipcarga))].filter(Boolean).sort();
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
    * Retorna badge HTML para status com cor do sistema
    */
   getStatusBadgeWithColor(status, colorName) {
      if (!status) return '-';

      const colors = TMSManager.status_color(colorName || 'clDefault');

      return `<span class="badge" style="background-color: ${colors.backgroundColor}; color: ${colors.textColor}; border: 1px solid ${colors.textColor}">${status}</span>`;
   }

   /**
    * Retorna badge HTML para status (método legado)
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
    * Formata peso
    */
   formatWeight(value) {
      const num = parseFloat(value);
      if (isNaN(num)) return '-';
      return new Intl.NumberFormat('pt-BR', {
         minimumFractionDigits: 0,
         maximumFractionDigits: 3
      }).format(num) + ' kg';
   }

   /**
    * Mostra detalhes do pedido
    */
   async showDetails(nomovtra) {
      const pedido = this.data.find(item => item.nomovtra === nomovtra);
      if (!pedido) return;

      this.currentPedido = pedido;

      // Preencher informações básicas do modal (dados que já temos)
      this.fillBasicProcessInfo(pedido);

            // Resetar para a aba de informações sempre
      this.resetToInformationTab();

      // Mostrar loading do modal
      this.showModalLoading(true);

      // Mostrar modal IMEDIATAMENTE
      const modalEl = document.getElementById('modal-process-details');
      const modal = new bootstrap.Modal(modalEl);
      modal.show();

      // Carregar dados adicionais em background
      this.loadProcessAdditionalData(nomovtra);
   }

   /**
    * Reseta para a aba de informações
    */
   resetToInformationTab() {
      // Remover classe active de todas as abas
      const tabs = document.querySelectorAll('#process-tabs .nav-link');
      const panes = document.querySelectorAll('#process-tab-content .tab-pane');

      tabs.forEach(tab => {
         tab.classList.remove('active');
         tab.setAttribute('aria-selected', 'false');
      });

      panes.forEach(pane => {
         pane.classList.remove('show', 'active');
      });

      // Ativar aba de informações
      const infoTab = document.getElementById('tab-informacoes');
      const infoPane = document.getElementById('content-informacoes');

      if (infoTab && infoPane) {
         infoTab.classList.add('active');
         infoTab.setAttribute('aria-selected', 'true');
         infoPane.classList.add('show', 'active');
      }
   }

   /**
    * Controla loading do modal
    */
   showModalLoading(show) {
      const loadingOverlay = document.getElementById('modal-loading-overlay');
      if (loadingOverlay) {
         if (show) {
            loadingOverlay.style.display = 'flex';
         } else {
            loadingOverlay.style.setProperty('display', 'none', 'important');
         }
      }
   }

   /**
    * Preenche informações básicas do processo (dados já disponíveis)
    */
   fillBasicProcessInfo(pedido) {
      // Função auxiliar para preencher elemento de forma segura
      const fillElement = (id, value) => {
         const element = document.getElementById(id);
         if (element) {
            if (id === 'process-status') {
               element.innerHTML = value;
            } else {
               element.textContent = value;
            }
         }
      };

      // Atualizar título do modal
      fillElement('modal-process-number', `#${pedido.nomovtra}`);

      // Preencher dados básicos
      fillElement('process-nomovtra', pedido.nomovtra);
      fillElement('process-processo', pedido.processo || '-');
      fillElement('process-container', pedido.container || '-');
      fillElement('process-status', this.getStatusBadgeWithColor(pedido.nomstatusfre, pedido.color));

      fillElement('process-tipo-carga', pedido.nomtipcarga || '-');
      fillElement('process-tipo-frete', pedido.nomtipfre || '-');
      fillElement('process-tipo-container', pedido.nomtipcont || '-');
      fillElement('process-data-registro', this.formatDate(pedido.data) || '-');
      fillElement('process-destinatario', pedido.destinatario || '-');
      fillElement('process-rota', pedido.rota || '-');

      // Transporte
      fillElement('process-motorista', pedido.motorista || '-');
      fillElement('process-tracao', pedido.placacav || '-');
      fillElement('process-reboque', pedido.placacar || '-');
      fillElement('process-reboque2', pedido.placacar2 || '-');

      // Datas
      fillElement('process-data-inicio-viagem', this.formatDate(pedido.datainicioviagem) || '-');
      fillElement('process-data-entregue', this.formatDate(pedido.dataentregue) || '-');

      // Documentos
      fillElement('process-doc-fiscal', pedido.tipodocfiscal || '-');
      fillElement('process-numero-doc-fiscal', pedido.docfiscal || '-');
      fillElement('process-nfe-cliente', pedido.doccliente || '-');
      fillElement('process-volume', pedido.qtdevol ? parseInt(pedido.qtdevol) : '-');
      fillElement('process-peso-nfe', pedido.pesototalnf ? this.formatWeight(pedido.pesototalnf) : '-');
      fillElement('process-vlr-total-nfe', pedido.vlrtotalnf ? this.formatCurrency(pedido.vlrtotalnf) : '-');

      // Valores financeiros
      fillElement('process-vlr-frete', this.formatCurrency(pedido.vlrfrete || 0));
      fillElement('process-pedagio', this.formatCurrency(pedido.vlrped || 0));
      fillElement('process-gris', this.formatCurrency(pedido.vlrgris || 0));
      fillElement('process-seguro', this.formatCurrency(pedido.vlrseg || 0));
      fillElement('process-icms', this.formatCurrency(pedido.icmvlr || 0));
      fillElement('process-outros', this.formatCurrency(pedido.vlrout || 0));
      fillElement('process-total', this.formatCurrency(pedido.totalfrete || 0));

      // Resetar contadores e estados de loading
      this.resetModalStates();
   }

   /**
    * Carrega dados adicionais em background
    */
   async loadProcessAdditionalData(nomovtra) {
      try {
         // Verificar se tem placa para localização - se não tiver, mostrar indisponível imediatamente
         if (!this.currentPedido.placacav) {
            this.showNoLocationAvailable();
         }

         // Carregar detalhes do processo em paralelo
         const promises = [this.loadProcessoDetalhes(nomovtra)];

         // Só adicionar localização se tiver placa
         if (this.currentPedido.placacav) {
            promises.push(this.loadVehicleLocation(this.currentPedido.placacav));
         }

         const results = await Promise.allSettled(promises);

         // Processar detalhes
         if (results[0].status === 'fulfilled') {
            this.fillAdditionalProcessData(results[0].value);
         } else {
            console.error('Erro ao carregar detalhes:', results[0].reason);
            this.showLoadingError('detalhes');
         }

         // Processar localização (se foi requisitada)
         if (results.length > 1) {
            if (results[1].status === 'fulfilled' && results[1].value) {
               this.handleLocationData(results[1].value);
            } else {
               this.showNoLocationAvailable();
            }
         }

         // Esconder loading do modal após carregar tudo
         this.showModalLoading(false);

      } catch (error) {
         console.error('Erro ao carregar dados adicionais:', error);
         this.showToast('Erro ao carregar alguns dados do processo', 'warning');
         // Esconder loading mesmo em caso de erro
         this.showModalLoading(false);
		}
   }

   /**
    * Formata data para exibição
    */
   formatDate(dateStr) {
      if (!dateStr) return null;
      try {
         // Assumindo que a data vem no formato ISO ou similar
         const date = new Date(dateStr);
         return date.toLocaleDateString('pt-BR');
      } catch (error) {
         return dateStr; // Retorna a string original se não conseguir formatar
      }
   }

      /**
    * Reseta estados do modal
    */
   resetModalStates() {
      // Resetar contadores
      document.getElementById('ocorrencias-count').textContent = '0';
      document.getElementById('followups-count').textContent = '0';
      document.getElementById('documentos-count').textContent = '0';
      document.getElementById('comprovantes-count').textContent = '0';

      // Resetar conteúdos das abas
      this.clearTabContents();

      // Resetar estado do rastreamento
      document.getElementById('tracking-status').className = 'badge bg-secondary';
      document.getElementById('tracking-status').textContent = 'Carregando...';
      document.getElementById('location-last-update').textContent = 'Última atualização: -';

            // Mostrar loading do mapa
      const mapLoading = document.getElementById('map-loading');
      const noLocation = document.getElementById('no-location');
      const processMap = document.getElementById('process-map');
      if (mapLoading) mapLoading.style.display = 'flex';
      if (noLocation) noLocation.style.display = 'none';
      if (processMap) processMap.style.display = 'none';
   }

   /**
    * Limpa conteúdo das abas
    */
   clearTabContents() {
      const tabs = ['ocorrencias-list', 'followups-list', 'documentos-list', 'comprovantes-list'];
      tabs.forEach(tabId => {
         const element = document.getElementById(tabId);
         if (element) {
            element.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div><p class="text-muted mt-2">Carregando...</p></div>';
         }
      });
   }

   /**
    * Carrega detalhes do processo da API
    */
   async loadProcessoDetalhes(nomovtra) {
      const response = await fetch(`${this.apiBaseUrl}/processos/${nomovtra}/detalhes`, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
         }
      });

      if (!response.ok) {
         throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
         throw new Error(result.message || 'Erro ao carregar detalhes');
      }

      return result.data;
   }

   /**
    * Carrega localização do veículo
    */
   async loadVehicleLocation(placa) {
      const response = await fetch(`${this.apiBaseUrl}/localizacao/${placa}`, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
         }
      });

      if (!response.ok) {
         throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
         return result.data;
      }

      return null;
   }

      /**
    * Preenche dados adicionais do processo
    */
   fillAdditionalProcessData(detalhes) {
      // Preencher abas com detalhes da API
      this.fillTabComprovantes(detalhes.comprovantes || []);
      this.fillTabFollowUps(detalhes.followUps || []);
      this.fillTabOcorrencias(detalhes.ocorrencias || []);
      this.fillTabDocumentos(detalhes.documentos || []);

            // Atualizar contadores das abas
      this.updateTabCounters(detalhes);
   }

   /**
    * Lida com dados de localização
    */
   handleLocationData(locationData) {
      // Atualizar status do rastreamento
      document.getElementById('tracking-status').className = 'badge bg-success';
      document.getElementById('tracking-status').textContent = 'Online';
      document.getElementById('location-last-update').textContent = `Última atualização: ${locationData.dataposicao || '-'}`;

      // Atualizar mapa
      this.updateMapWithLocation(locationData);
   }

   /**
    * Mostra quando não há localização disponível
    */
   showNoLocationAvailable() {
      // Atualizar status
      document.getElementById('tracking-status').className = 'badge bg-warning';
      document.getElementById('tracking-status').textContent = 'Indisponível';

      // Esconder loading e mostrar mensagem
      const mapLoading = document.getElementById('map-loading');
      const noLocation = document.getElementById('no-location');
      const processMap = document.getElementById('process-map');
      if (mapLoading) mapLoading.style.setProperty('display', 'none', 'important');
      if (noLocation) noLocation.style.display = 'block';
      if (processMap) processMap.style.display = 'none';
   }



   /**
    * Mostra erro de carregamento
    */
   showLoadingError(tipo) {
      this.showToast(`Erro ao carregar ${tipo}`, 'error');
   }

   /**
    * Preenche o modal com dados do processo (método legado - mantido para compatibilidade)
    */
   fillProcessModal(pedido, detalhes) {
      // Preencher aba de informações básicas
      document.getElementById('process-nomovtra').textContent = pedido.nomovtra;
      document.getElementById('process-processo').textContent = pedido.processo || '-';
      document.getElementById('process-container').textContent = pedido.container || '-';
      document.getElementById('process-status').innerHTML = this.getStatusBadgeWithColor(pedido.nomstatusfre, pedido.color);

      document.getElementById('process-tipo-carga').textContent = pedido.nomtipcarga || '-';
      document.getElementById('process-destinatario').textContent = pedido.destinatario || '-';
      document.getElementById('process-rota').textContent = pedido.rota || '-';

      document.getElementById('process-vlr-frete').textContent = this.formatCurrency(pedido.vlrfrete || 0);
      document.getElementById('process-total').textContent = this.formatCurrency(pedido.totalfrete || 0);

      // Atualizar título do modal
      document.getElementById('modal-process-number').textContent = `#${pedido.nomovtra}`;

      // Preencher abas com detalhes da API
      this.fillTabComprovantes(detalhes.comprovantes || []);
      this.fillTabFollowUps(detalhes.followUps || []);
      this.fillTabOcorrencias(detalhes.ocorrencias || []);
      this.fillTabDocumentos(detalhes.documentos || []);

      // Atualizar contadores das abas
      this.updateTabCounters(detalhes);
   }

   /**
    * Preenche aba de comprovantes
    */
   fillTabComprovantes(comprovantes) {
      const container = document.getElementById('comprovantes-list');
      if (!container) return;

      if (comprovantes.length === 0) {
         container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-file-earmark fs-1"></i><p>Nenhum comprovante encontrado</p></div>';
         return;
      }

      container.innerHTML = comprovantes.map(comp => `
         <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
               <i class="bi bi-file-earmark-check text-success me-2"></i>
               <strong>${comp.nomearquivo}</strong>
            </div>
            <a href="${comp.localcompleto}" target="_blank" class="btn btn-sm btn-outline-primary">
               <i class="bi bi-download me-1"></i>Download
            </a>
         </div>
      `).join('');
   }

   /**
    * Preenche aba de follow-ups
    */
   fillTabFollowUps(followUps) {
      const container = document.getElementById('followups-list');
      if (!container) return;

      if (followUps.length === 0) {
         container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-arrow-repeat fs-1"></i><p>Nenhum follow-up encontrado</p></div>';
         return;
      }

      container.innerHTML = followUps.map(follow => `
         <div class="list-group-item">
            <div class="d-flex w-100 justify-content-between">
               <h6 class="mb-1"><i class="bi bi-arrow-repeat text-warning me-2"></i>Status: ${follow.status}</h6>
            </div>
         </div>
      `).join('');
   }

   /**
    * Preenche aba de ocorrências
    */
   fillTabOcorrencias(ocorrencias) {
      const container = document.getElementById('ocorrencias-list');
      if (!container) return;

      if (ocorrencias.length === 0) {
         container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-exclamation-triangle fs-1"></i><p>Nenhuma ocorrência encontrada</p></div>';
         return;
      }

      container.innerHTML = ocorrencias.map(ocr => `
         <div class="list-group-item">
            <div class="d-flex w-100 justify-content-between">
               <h6 class="mb-1"><i class="bi bi-exclamation-triangle text-danger me-2"></i>Item: ${ocr.noitem}</h6>
               <small>${ocr.data} ${ocr.hora}</small>
            </div>
            ${ocr.obs ? `<p class="mb-1">${ocr.obs}</p>` : ''}
         </div>
      `).join('');
   }

   /**
    * Preenche aba de documentos
    */
   fillTabDocumentos(documentos) {
      const container = document.getElementById('documentos-list');
      if (!container) return;

      if (documentos.length === 0) {
         container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-file-earmark-text fs-1"></i><p>Nenhum documento encontrado</p></div>';
         return;
      }

      container.innerHTML = documentos.map(doc => `
         <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
               <i class="bi bi-file-earmark-text text-info me-2"></i>
               <strong>${doc.nomearquivo}</strong>
               <small class="text-muted d-block">Tipo: ${doc.tipoarquivo}</small>
               ${doc.chave ? `<small class="text-muted d-block">Chave: ${doc.chave}</small>` : ''}
            </div>
            <button class="btn btn-sm btn-outline-primary">
               <i class="bi bi-eye me-1"></i>Visualizar
            </button>
         </div>
      `).join('');
   }

      /**
    * Atualiza mapa com localização
    */
   updateMapWithLocation(locationData) {
      const mapContainer = document.getElementById('process-map');
      if (!mapContainer || !locationData.latitude || !locationData.longitude) {
         this.showNoLocationAvailable();
         return;
      }

      // Esconder loading
      const mapLoading = document.getElementById('map-loading');
      const noLocation = document.getElementById('no-location');
      const processMap = document.getElementById('process-map');
      if (mapLoading) mapLoading.style.setProperty('display', 'none', 'important');
      if (noLocation) noLocation.style.display = 'none';
      if (processMap) processMap.style.display = 'block';

      // Remover mapa anterior se existir
         if (this.map) {
               this.map.remove();
         }

      // Criar novo mapa
      this.map = L.map('process-map').setView([locationData.latitude, locationData.longitude], 13);

         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
               attribution: '© OpenStreetMap contributors'
         }).addTo(this.map);

      // Adicionar marcador
      const popupContent = `
         <div class="text-center">
            <strong>Placa: ${locationData.placa}</strong><br>
            <small>Última atualização: ${locationData.dataposicao}</small><br>
            ${locationData.cidade ? `<small>${locationData.cidade}/${locationData.uf}</small><br>` : ''}
            ${locationData.rua ? `<small>${locationData.rua}</small>` : ''}
         </div>
      `;

      L.marker([locationData.latitude, locationData.longitude])
               .addTo(this.map)
         .bindPopup(popupContent)
               .openPopup();

         // Redimensionar mapa após 100ms
         setTimeout(() => {
               this.map.invalidateSize();
         }, 100);
      }

   /**
    * Atualiza contadores das abas
    */
   updateTabCounters(detalhes) {
      document.getElementById('ocorrencias-count').textContent = detalhes.ocorrencias?.length || 0;
      document.getElementById('followups-count').textContent = detalhes.followUps?.length || 0;
      document.getElementById('documentos-count').textContent = detalhes.documentos?.length || 0;
      document.getElementById('comprovantes-count').textContent = detalhes.comprovantes?.length || 0;
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

      // Event listener para lazy loading quando mudar de aba
      this.bindTabEvents();

      // Exportar
      this.bindExportEvents();
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
    * Vincula eventos das abas para lazy loading
    */
   bindTabEvents() {
      // Event listener para quando mudar de aba do rastreamento
      const rastreamentoTab = document.getElementById('tab-rastreamento');
      if (rastreamentoTab) {
         rastreamentoTab.addEventListener('shown.bs.tab', () => {
            // Redesenhar mapa quando mostrar a aba de rastreamento
            if (this.map) {
               setTimeout(() => {
                  this.map.invalidateSize();
               }, 100);
            }
         });
      }
   }

   /**
    * Obtém valores dos filtros
    */
   getFilterValues() {
      return {
         status: document.getElementById('filter-status')?.value || '',
         tipoCarga: document.getElementById('filter-tipo-carga')?.value || '',
         motorista: document.getElementById('filter-motorista')?.value || '',
         destinatario: document.getElementById('filter-destinatario')?.value || ''
      };
   }

   /**
    * Atualiza contador de filtros ativos
    */
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

   /**
    * Aplica filtros
    */
   applyFilters() {
      if (!this.dataTable) return;

      const filters = this.getFilterValues();

      // Limpar todos os filtros primeiro
      this.dataTable.search('').columns().search('').draw();

      // Aplicar filtros por coluna usando os novos nomes
      const columnMap = {
         'nomstatusfre': this.getColumnIndex('nomstatusfre'),
         'nomtipcarga': this.getColumnIndex('nomtipcarga'),
         'motorista': this.getColumnIndex('motorista'),
         'destinatario': this.getColumnIndex('destinatario')
      };

      if (filters.status && columnMap.nomstatusfre !== -1) {
         this.dataTable.column(columnMap.nomstatusfre).search(filters.status);
      }
      if (filters.tipoCarga && columnMap.nomtipcarga !== -1) {
         this.dataTable.column(columnMap.nomtipcarga).search(filters.tipoCarga);
      }
      if (filters.motorista && columnMap.motorista !== -1) {
         this.dataTable.column(columnMap.motorista).search(filters.motorista);
      }
      if (filters.destinatario && columnMap.destinatario !== -1) {
         this.dataTable.column(columnMap.destinatario).search(filters.destinatario);
      }

      this.dataTable.draw();

      // Atualizar contador de registros filtrados
      const info = this.dataTable.page.info();
      this.updateTotalRecords(info.recordsDisplay);

      // Atualizar contador de filtros ativos
      this.updateActiveFiltersCount();

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
         // Atualizar contador após limpar filtros
         this.updateTotalRecords(this.data.length);
      }

      // Atualizar contador de filtros ativos
      this.updateActiveFiltersCount();

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
