/**
 * Fluxo Operacional - Lista com filtros, gerenciador de colunas e modal de tarefas
 * MM Softwares
 */

class FluxoOperacionalManager {
   constructor() {
      this.data = this.getSampleData();
      this.dataTable = null;
      this.columnSettings = this.getDefaultColumnSettings();
		this.currentItem = null;
   }

   init() {
      this.loadSavedSettings();
      this.populateFilterOptions();
      this.initializeDateRangePicker();
      this.initializeDataTable();
      this.bindEvents();
      this.initializeColumnSettings();
		this.showToast('Fluxo Operacional carregado com sucesso!', 'success');
   }

	// Dados de exemplo
   getSampleData() {
		const build = (overrides) => {
			const item = {
				pedido: 'FLX-0001',
				cliente: 'Cliente Exemplo',
				descricao_fluxo: 'Fluxo padrão de operação',
				processo_cliente: 'PROC-CL-0001',
				container: 'MSKU1234567',
				cavalo: 'ABC-1A23',
				reboque: 'DEF-4B56',
				tipo_frete: 'CIF',
               tipo_carga: 'CONTAINER',
				rota: 'Origem → Destino',
				contrato: 'CTR-2025-001',
				usuario_responsavel: 'Operador 1',
				data_inicio: '2025-01-15T08:00:00',
				data_fim: '2025-01-20T18:00:00',
				tarefas: [
					{ nome: 'Receber pedido', concluida: true },
					{ nome: 'Programar coleta', concluida: true },
					{ nome: 'Vincular veículo', concluida: false },
					{ nome: 'Carregar', concluida: false },
					{ nome: 'Transporte', concluida: false },
					{ nome: 'Entrega', concluida: false }
				]
			};
			return { ...item, ...overrides };
		};

		const data = [
			build({ pedido: 'FLX-0001', cliente: 'ABC Importadora', descricao_fluxo: 'Importação - Porto de Santos', processo_cliente: 'IMP-2025-001', rota: 'Santos/SP → Guarulhos/SP', usuario_responsavel: 'Ana Lima', data_inicio: '2025-01-10T08:00:00', data_fim: '2025-01-20T18:00:00', tarefas: [ {nome: 'Receber pedido', concluida: true},{nome: 'Programar coleta', concluida: true},{nome: 'Vincular veículo', concluida: true},{nome: 'Carregar', concluida: false},{nome: 'Transporte', concluida: false},{nome: 'Entrega', concluida: false} ] }),
			build({ pedido: 'FLX-0002', cliente: 'XYZ Comercial', descricao_fluxo: 'Transferência CD → Loja', processo_cliente: 'TRF-2025-014', container: '', tipo_carga: 'CARGA GERAL', tipo_frete: 'FOB', rota: 'Campinas/SP → São Paulo/SP', usuario_responsavel: 'Bruno Souza', data_inicio: '2025-01-15T08:00:00', data_fim: '2025-01-16T20:00:00', tarefas: [ {nome: 'Separação', concluida: true},{nome: 'Conferência', concluida: true},{nome: 'Carregar', concluida: true},{nome: 'Transporte', concluida: true},{nome: 'Entrega', concluida: false} ] }),
			build({ pedido: 'FLX-0003', cliente: 'Perigosos Express', descricao_fluxo: 'Químicos - Rotas especiais', processo_cliente: 'QMC-2025-007', container: 'HAZM5555555', tipo_carga: 'PERIGOSA', rota: 'Paulínia/SP → Duque de Caxias/RJ', usuario_responsavel: 'Carla Dias', data_inicio: '2025-01-12T07:00:00', data_fim: '2025-01-13T19:00:00' }),
			build({ pedido: 'FLX-0004', cliente: 'Graneleiros Sul', descricao_fluxo: 'Granel sólido', processo_cliente: 'GRN-2025-003', container: '', tipo_carga: 'GRANEL', rota: 'Vitória/ES → Salvador/BA', usuario_responsavel: 'Diego Alves', data_inicio: '2025-01-08T09:00:00', data_fim: '2025-01-25T18:00:00' }),
			build({ pedido: 'FLX-0005', cliente: 'Supermercados Brasil', descricao_fluxo: 'Refrigerados - rota Norte', processo_cliente: 'REF-2025-010', container: 'TCLU9876543', tipo_carga: 'REFRIGERADA', rota: 'Campinas/SP → Brasília/DF', usuario_responsavel: 'Eduardo Lima', data_inicio: '2025-01-17T08:00:00', data_fim: '2025-01-21T18:00:00' })
		];

		// Enriquecer com posicao_fluxo, percentual e situacao
		return data.map((item) => {
			const { concluidas, total, percentual } = this.calculateTasks(item.tarefas);
			const situacao = this.calculateSituacao(item.data_inicio, item.data_fim, percentual);
			return { ...item, posicao_fluxo: `${concluidas}/${total}`, percentual, situacao };
		});
	}

	calculateTasks(tarefas) {
		const total = Array.isArray(tarefas) ? tarefas.length : 0;
		const concluidas = Array.isArray(tarefas) ? tarefas.filter(t => t.concluida).length : 0;
		const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;
		return { concluidas, total, percentual };
	}

	calculateSituacao(dataInicioISO, dataFimISO, percentual) {
		const now = new Date();
		const di = new Date(dataInicioISO);
		const df = new Date(dataFimISO);
		if (percentual >= 100) return 'Concluída';
		if (now > df) return 'Vencida';
		const half = new Date(di.getTime() + (df.getTime() - di.getTime()) / 2);
		if (now >= half) return 'Em atenção';
		return 'No prazo';
	}

	formatDate(dateISO) {
		const d = new Date(dateISO);
		const pad = (n) => String(n).padStart(2, '0');
		return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

   getDefaultColumnSettings() {
		return [
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
			{ key: 'processo_cliente', name: 'Proc. Cliente', visible: false, order: 14 },
			{ key: 'cavalo', name: 'Cavalo', visible: false, order: 15 },
			{ key: 'reboque', name: 'Reboque', visible: false, order: 16 },
			{ key: 'contrato', name: 'Contrato', visible: false, order: 17 }
		];
	}

   initializeDataTable() {
      const table = $('#tms-table');
		if ($.fn.DataTable.isDataTable(table)) table.DataTable().destroy();

		const actionsColumn = this.columnSettings.find(c => c.key === 'acoes');
		if (actionsColumn) {
			const others = this.columnSettings.filter(c => c.key !== 'acoes').sort((a, b) => a.order - b.order);
			actionsColumn.order = 0;
			others.forEach((c, idx) => { c.order = idx + 1; });
		}

		const visibleColumns = this.columnSettings.filter(col => col.visible).sort((a, b) => a.order - b.order);
		const columns = visibleColumns.map(col => {
			if (col.key === 'acoes') {
				return {
					data: null,
					title: col.name,
					orderable: false,
					width: '130px',
					className: 'text-center',
					render: (data, type, row) => {
						return `
							<button type="button" class="btn btn-outline-primary btn-action" title="Detalhes" onclick="fluxoManager.showDetails('${row.pedido}')">
								<i class="bi bi-list-check"></i>
								</button>
						`;
					}
				};
			}

			return {
				data: col.key,
				title: col.name,
				render: (data, type, row) => {
					if (col.key === 'percentual') {
						const pct = Number(row.percentual) || 0;
						return `
							<div class="progress" style="height:8px; min-width:90px;">
								<div class="progress-bar" role="progressbar" style="width:${pct}%" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
							</div>
							<small>${pct}%</small>
						`;
					}
					if (col.key === 'data_inicio' || col.key === 'data_fim') {
						return this.formatDate(data);
					}
					if (col.key === 'situacao') {
						const badge = {
							'No prazo': 'bg-secondary',
							'Em atenção': 'bg-warning text-dark',
							'Vencida': 'bg-danger',
							'Concluída': 'bg-success'
						}[row.situacao] || 'bg-secondary';
						return `<span class="badge ${badge}">${row.situacao}</span>`;
					}
					return data || '-';
				}
			};
		});

		const defaultOrderIndex = visibleColumns.findIndex(c => c.key === 'pedido');
		this.dataTable = table.DataTable({
         data: this.data,
			columns,
         pageLength: 10,
			lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'Todos']],
			language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json' },
         responsive: true,
         scrollX: true,
         scrollY: '400px',
         scrollCollapse: true,
			dom: '<"row"<"col-sm-6"l><"col-sm-6"f>>' + '<"row"<"col-sm-12"tr>>' + '<"row"<"col-sm-5"i><"col-sm-7"p>>',
			order: defaultOrderIndex !== -1 ? [[defaultOrderIndex, 'desc']] : [],
			rowCallback: (row, data) => {
				row.classList.remove('flow-warning', 'flow-overdue');
				const now = new Date();
				const di = new Date(data.data_inicio);
				const df = new Date(data.data_fim);
				const half = new Date(di.getTime() + (df.getTime() - di.getTime()) / 2);
				if (data.percentual < 100) {
					if (now > df) row.classList.add('flow-overdue');
					else if (now >= half) row.classList.add('flow-warning');
				}
			}
		});

		// Clique na linha abre modal
		const self = this;
		table.find('tbody').on('click', 'tr', function(e) {
			if ($(e.target).closest('button').length > 0) return;
			const data = self.dataTable.row(this).data();
			if (data) self.showDetails(data.pedido);
		});

		// Hover style
		table.find('tbody').on('mouseenter', 'tr', function() { $(this).addClass('table-hover-effect'); }).on('mouseleave', 'tr', function() { $(this).removeClass('table-hover-effect'); });
	}

   initializeDateRangePicker() {
      const dateRangeInput = document.getElementById('filter-date-range');
		if (!dateRangeInput || typeof flatpickr === 'undefined') return;
		this.dateRangePicker = flatpickr(dateRangeInput, { mode: 'range', dateFormat: 'd/m/Y', locale: 'pt' });
         const iconElement = dateRangeInput.nextElementSibling?.querySelector('i');
         if (iconElement) {
               iconElement.style.cursor = 'pointer';
			iconElement.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.dateRangePicker?.open(); });
		}
	}

   populateFilterOptions() {
		const unique = (arr) => [...new Set(arr)].filter(Boolean).sort();
		const clientes = unique(this.data.map(i => i.cliente));
		const tiposCarga = unique(this.data.map(i => i.tipo_carga));
		const tiposFrete = unique(this.data.map(i => i.tipo_frete));
		const usuarios = unique(this.data.map(i => i.usuario_responsavel));
		const contratos = unique(this.data.map(i => i.contrato));

		const fill = (id, values, placeholder = 'Todos') => {
			const el = document.getElementById(id);
			if (!el) return;
			el.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option value="${v}">${v}</option>`).join('');
		};

		fill('filter-cliente', clientes, 'Todos');
		fill('filter-tipo-carga', tiposCarga, 'Todos');
		fill('filter-tipo-frete', tiposFrete, 'Todos');
		fill('filter-usuario', usuarios, 'Todos');
		fill('filter-contrato', contratos, 'Todos');
	}

   bindEvents() {
		document.getElementById('btn-toggle-filters')?.addEventListener('click', () => new bootstrap.Offcanvas(document.getElementById('filters-sidebar')).show());
		document.getElementById('btn-apply-filters')?.addEventListener('click', () => this.applyFilters());
		document.getElementById('btn-clear-filters')?.addEventListener('click', () => this.clearFilters());
		document.getElementById('btn-column-settings')?.addEventListener('click', () => new bootstrap.Modal(document.getElementById('modal-column-settings')).show());
      this.bindExportEvents();
	}

   bindExportEvents() {
		document.getElementById('export-excel')?.addEventListener('click', () => this.showToast('Exportação para Excel será implementada', 'info'));
		document.getElementById('export-pdf')?.addEventListener('click', () => this.showToast('Exportação para PDF será implementada', 'info'));
	}

   applyFilters() {
      if (!this.dataTable) return;

		const situacao = document.getElementById('filter-situacao')?.value || '';
		const cliente = document.getElementById('filter-cliente')?.value || '';
      const tipoCarga = document.getElementById('filter-tipo-carga')?.value || '';
		const tipoFrete = document.getElementById('filter-tipo-frete')?.value || '';
      const container = document.getElementById('filter-container')?.value || '';
		const processoCliente = document.getElementById('filter-processo-cliente')?.value || '';
		const cavalo = document.getElementById('filter-cavalo')?.value || '';
		const reboque = document.getElementById('filter-reboque')?.value || '';
		const usuario = document.getElementById('filter-usuario')?.value || '';
		const contrato = document.getElementById('filter-contrato')?.value || '';
		const dateRangeStr = document.getElementById('filter-date-range')?.value || '';

		this.dataTable.search('').columns().search('');

      const columnMap = {
			'situacao': this.getColumnIndex('situacao'),
			'cliente': this.getColumnIndex('cliente'),
         'tipo_carga': this.getColumnIndex('tipo_carga'),
			'tipo_frete': this.getColumnIndex('tipo_frete'),
         'container': this.getColumnIndex('container'),
			'processo_cliente': this.getColumnIndex('processo_cliente'),
			'cavalo': this.getColumnIndex('cavalo'),
			'reboque': this.getColumnIndex('reboque'),
			'usuario_responsavel': this.getColumnIndex('usuario_responsavel'),
			'contrato': this.getColumnIndex('contrato')
		};

		if (situacao && columnMap.situacao !== -1) this.dataTable.column(columnMap.situacao).search(situacao);
		if (cliente && columnMap.cliente !== -1) this.dataTable.column(columnMap.cliente).search(cliente);
		if (tipoCarga && columnMap.tipo_carga !== -1) this.dataTable.column(columnMap.tipo_carga).search(tipoCarga);
		if (tipoFrete && columnMap.tipo_frete !== -1) this.dataTable.column(columnMap.tipo_frete).search(tipoFrete);
		if (container && columnMap.container !== -1) this.dataTable.column(columnMap.container).search(container);
		if (processoCliente && columnMap.processo_cliente !== -1) this.dataTable.column(columnMap.processo_cliente).search(processoCliente);
		if (cavalo && columnMap.cavalo !== -1) this.dataTable.column(columnMap.cavalo).search(cavalo);
		if (reboque && columnMap.reboque !== -1) this.dataTable.column(columnMap.reboque).search(reboque);
		if (usuario && columnMap.usuario_responsavel !== -1) this.dataTable.column(columnMap.usuario_responsavel).search(usuario);
		if (contrato && columnMap.contrato !== -1) this.dataTable.column(columnMap.contrato).search(contrato);

		// Filtro por período (data_inicio dentro do range)
		$.fn.dataTable.ext.search = $.fn.dataTable.ext.search || [];
		$.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(fn => !fn.__fluxoDateFilter);
		if (dateRangeStr && dateRangeStr.includes(' a ')) {
			const [d1, d2] = dateRangeStr.split(' a ').map(s => s.trim());
			const parseBR = (s) => { const [dd, mm, yyyy] = s.split('/').map(Number); return new Date(yyyy, mm-1, dd, 0, 0, 0); };
			const start = parseBR(d1);
			const end = new Date(parseBR(d2).getTime() + 24*60*60*1000 - 1);
			const dateFilter = (settings, data, dataIndex) => {
				const item = fluxoManager.dataTable.row(dataIndex).data();
				const di = new Date(item.data_inicio);
				return di >= start && di <= end;
			};
			dateFilter.__fluxoDateFilter = true;
			$.fn.dataTable.ext.search.push(dateFilter);
      }

      this.dataTable.draw();
		bootstrap.Offcanvas.getInstance(document.getElementById('filters-sidebar'))?.hide();
		this.showToast(`${this.dataTable.rows({ search: 'applied' }).count()} item(ns) encontrado(s)`, 'success');
	}

   getColumnIndex(key) {
		const visibleColumns = this.columnSettings.filter(col => col.visible).sort((a, b) => a.order - b.order);
		return visibleColumns.findIndex(col => col.key === key);
	}

   clearFilters() {
		document.getElementById('filters-form')?.reset();
		$.fn.dataTable.ext.search = $.fn.dataTable.ext.search?.filter(fn => !fn.__fluxoDateFilter) || [];
		this.dataTable?.search('').columns().search('').draw();
      this.showToast('Filtros limpos', 'info');
   }

   initializeColumnSettings() {
      this.renderColumnList();
      this.initializeSortable();
   }

   renderColumnList() {
      const columnList = document.getElementById('column-list');
      if (!columnList) return;
      const sortedColumns = [...this.columnSettings].sort((a, b) => a.order - b.order);
		columnList.innerHTML = sortedColumns.map(column => `
         <div class="list-group-item column-item d-flex align-items-center" data-column="${column.key}">
               <div class="form-check me-3">
					<input class="form-check-input column-visibility-toggle" type="checkbox" ${column.visible ? 'checked' : ''} data-column="${column.key}">
               </div>
               <div class="flex-grow-1">
                  <i class="bi bi-grip-vertical me-2 text-muted"></i>
                  ${column.name}
               </div>
               <small class="text-muted">${column.key}</small>
         </div>
		`).join('');

		// Bind toggles
		columnList.querySelectorAll('.column-visibility-toggle').forEach(cb => {
			cb.addEventListener('change', (e) => {
               const columnKey = e.target.getAttribute('data-column');
               const column = this.columnSettings.find(col => col.key === columnKey);
				if (column) column.visible = e.target.checked;
         });
      });

		document.getElementById('btn-save-columns')?.addEventListener('click', () => {
               this.saveSettings();
               this.updateTableColumns();
			bootstrap.Modal.getInstance(document.getElementById('modal-column-settings'))?.hide();
               this.showToast('Configurações de colunas salvas!', 'success');
         });

		document.getElementById('btn-reset-columns')?.addEventListener('click', () => {
               this.columnSettings = this.getDefaultColumnSettings();
               this.renderColumnList();
               this.updateTableColumns();
               this.showToast('Configurações restauradas para o padrão', 'info');
         });
   }

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
				const sorted = [...this.columnSettings].sort((a, b) => a.order - b.order);
				const moved = sorted.splice(oldIndex, 1)[0];
				sorted.splice(newIndex, 0, moved);
				sorted.forEach((c, i) => c.order = i);
         }
      });
   }

	updateTableColumns() {
		if (!this.dataTable) return;
		this.dataTable.destroy();
		const table = document.getElementById('tms-table');
		table.innerHTML = `<thead><tr></tr></thead><tbody></tbody>`;
		this.initializeDataTable();
	}

	saveSettings() {
		localStorage.setItem('fluxo-column-settings', JSON.stringify(this.columnSettings));
	}

	loadSavedSettings() {
		const saved = localStorage.getItem('fluxo-column-settings');
		this.columnSettings = saved ? JSON.parse(saved) : this.getDefaultColumnSettings();
	}

	showDetails(pedido) {
		const item = this.data.find(i => i.pedido === pedido);
		if (!item) return;
		this.currentItem = item;

		document.getElementById('detail-pedido').textContent = item.pedido;
		document.getElementById('detail-cliente').textContent = item.cliente;
		document.getElementById('detail-descricao').textContent = item.descricao_fluxo;
		document.getElementById('detail-periodo').textContent = `${this.formatDate(item.data_inicio)} → ${this.formatDate(item.data_fim)}`;
		document.getElementById('detail-posicao').textContent = item.posicao_fluxo;
		document.getElementById('detail-percentual').textContent = `${item.percentual}%`;
		const bar = document.getElementById('detail-progress-bar');
		bar.style.width = `${item.percentual}%`;

		const ulConcl = document.getElementById('detail-tarefas-concluidas');
		const ulPend = document.getElementById('detail-tarefas-pendentes');
		ulConcl.innerHTML = '';
		ulPend.innerHTML = '';
		(item.tarefas || []).forEach(t => {
			const li = document.createElement('li');
			li.className = 'list-group-item d-flex align-items-center';
			li.innerHTML = `${t.concluida ? '<i class="bi bi-check2-circle text-success me-2"></i>' : '<i class=\"bi bi-circle text-muted me-2\"></i>'}${t.nome}`;
			(t.concluida ? ulConcl : ulPend).appendChild(li);
		});

		new bootstrap.Modal(document.getElementById('modal-operation-details')).show();
	}

   showToast(message, type = 'info') {
		const container = document.querySelector('.toast-container');
		if (!container) return;
		const id = 'toast-' + Date.now();
		const bg = { success: 'bg-success', error: 'bg-danger', warning: 'bg-warning', info: 'bg-info' }[type] || 'bg-info';
		container.insertAdjacentHTML('beforeend', `
			<div id="${id}" class="toast align-items-center text-white ${bg} border-0" role="alert">
               <div class="d-flex">
                  <div class="toast-body">${message}</div>
                  <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
               </div>
         </div>
		`);
		const el = document.getElementById(id);
		const toast = new bootstrap.Toast(el, { autohide: true, delay: 3000 });
      toast.show();
		el.addEventListener('hidden.bs.toast', () => el.remove());
   }
}

document.addEventListener('DOMContentLoaded', () => {
	window.fluxoManager = new FluxoOperacionalManager();
	fluxoManager.init();
});


