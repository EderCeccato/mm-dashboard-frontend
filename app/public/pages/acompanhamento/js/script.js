/**
 * Acompanhamento de Pedido - Sistema de Gestão de Transporte
 * Tela pública para acompanhamento de pedidos via código de acesso
 */

class TrackingManager {
    constructor() {
        this.map = null;
        this.urlHash = this.getUrlHash();
        this.currentPedido = null;
        this.refreshInterval = null;
        this.init();
    }

    /**
     * Inicializa o sistema
     */
    init() {
        this.applyCompanyBranding();
        this.bindEvents();
        this.loadTrackingData();
        this.setupRefreshInterval();
    }

    /**
     * Obtém o hash da URL
     */
    getUrlHash() {
        const path = window.location.pathname;
        const hash = path.split('/').pop();
        return hash && hash !== 'index.html' ? hash : null;
    }

    /**
     * Vincula eventos da página
     */
    bindEvents() {
        // Botão de atualizar
        document.getElementById('btn-refresh')?.addEventListener('click', () => {
            this.refreshData();
        });

        // Botão de tentar novamente
        document.getElementById('btn-retry')?.addEventListener('click', () => {
            this.loadTrackingData();
        });

        // Event listener para quando mostrar a aba de rastreamento
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

        // Theme switcher
        this.bindThemeSwitcher();
    }

    /**
     * Vincula o seletor de tema
     */
    bindThemeSwitcher() {
        const themeLinks = document.querySelectorAll('[data-theme-mode]');

        themeLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const theme = link.getAttribute('data-theme-mode');
                this.setTheme(theme);
            });
        });

        // Carregar tema salvo
        const savedTheme = localStorage.getItem('theme-mode') || 'light';
        this.setTheme(savedTheme);
    }

    /**
     * Define o tema
     */
    setTheme(theme) {
        const html = document.documentElement;
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');

        // Aplicar tema
        html.setAttribute('data-theme-mode', theme);
        localStorage.setItem('theme-mode', theme);

        // Atualizar ícone e texto
        switch (theme) {
            case 'dark':
                themeIcon?.setAttribute('class', 'bi bi-moon-fill');
                if (themeText) themeText.textContent = 'Escuro';
                break;
            case 'auto':
                themeIcon?.setAttribute('class', 'bi bi-circle-half');
                if (themeText) themeText.textContent = 'Auto';
                break;
            default: // light
                themeIcon?.setAttribute('class', 'bi bi-sun-fill');
                if (themeText) themeText.textContent = 'Claro';
        }
    }

    /**
     * Aplica o branding da empresa
     */
    applyCompanyBranding() {
        const companyBranding = this.getCompanyBranding();

        if (companyBranding) {
            this.applyBrandingStyles(companyBranding);
        }
    }

    /**
     * Obtém o branding da empresa do localStorage
     */
    getCompanyBranding() {
        try {
            const branding = localStorage.getItem('companyBranding');
            return branding ? JSON.parse(branding) : null;
        } catch (error) {
            console.error('Erro ao obter branding da empresa:', error);
            return null;
        }
    }

    /**
     * Aplica os estilos de branding
     */
    applyBrandingStyles(branding) {
        const root = document.documentElement;

        // Aplicar cor primária
        if (branding.primaryColor) {
            root.style.setProperty('--primary-color', branding.primaryColor);

            // Calcular cor hover (mais escura)
            const hoverColor = this.adjustBrightness(branding.primaryColor, -20);
            root.style.setProperty('--primary-color-hover', hoverColor);

            // Converter para RGB para uso em rgba
            const rgb = this.hexToRgb(branding.primaryColor);
            if (rgb) {
                root.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            }
        }

        // Aplicar logo
        if (branding.logo) {
            const logoContainer = document.getElementById('company-logo-container');
            if (logoContainer) {
                logoContainer.innerHTML = `
                    <img src="${branding.logo}" alt="Logo da Empresa" class="img-fluid">
                `;
            }
        }
    }

    /**
     * Converte hex para rgb
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Ajusta o brilho de uma cor hex
     */
    adjustBrightness(hex, percent) {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Carrega dados de rastreamento
     */
    async loadTrackingData() {
        if (!this.urlHash) {
            this.showError('URL inválida. Verifique o link de acesso.');
            return;
        }

        try {
            this.showState('loading');

            // Verifica se a função Thefetch está disponível
            if (typeof Thefetch !== 'function') {
                console.error('❌ Função Thefetch não encontrada');
                throw new Error('Sistema de requisições não disponível');
            }

            const result = await Thefetch(`/api/acompanhamento/tracking/${this.urlHash}`, 'GET');

            if (result.success && result.data) {
                this.currentPedido = result.data.pedido;
                this.fillTrackingData(result.data);
                this.loadAdditionalData();
                this.showState('content');
            } else {
                this.showError(result.message || 'Dados não encontrados');
            }

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados do pedido. Tente novamente.');
        }
    }

    /**
     * Carrega dados adicionais (localização, documentos, etc.)
     */
    async loadAdditionalData() {
        if (!this.currentPedido) return;

        const promises = [
            this.loadProcessDetails(this.currentPedido.nomovtra),
        ];

        // Só carregar localização se tiver placa
        if (this.currentPedido.placacav) {
            promises.push(this.loadVehicleLocation(this.currentPedido.placacav));
        }

        try {
            const results = await Promise.allSettled(promises);

            // Processar detalhes
            if (results[0].status === 'fulfilled') {
                this.fillAdditionalData(results[0].value);
            }

            // Processar localização (se foi requisitada)
            if (results.length > 1) {
                if (results[1].status === 'fulfilled' && results[1].value) {
                    this.handleLocationData(results[1].value);
                } else {
                    this.showNoLocationAvailable();
                }
            } else {
                this.showNoLocationAvailable();
            }

        } catch (error) {
            console.error('Erro ao carregar dados adicionais:', error);
        }
    }

    /**
     * Carrega detalhes do processo
     */
    async loadProcessDetails(nomovtra) {
        // Verifica se a função Thefetch está disponível
        if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            throw new Error('Sistema de requisições não disponível');
        }

        const result = await Thefetch(`/api/tms/processo/${nomovtra}/detalhes`, 'GET');
        if (result.success && result.data) {
            return result.data;
        }

        return null;
    }

    /**
     * Carrega localização do veículo
     */
    async loadVehicleLocation(placa) {
        const response = await Thefetch(`/api/tms/localizacao/${placa}`, 'GET');

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
     * Preenche dados básicos do pedido
     */
    fillTrackingData(data) {
        const pedido = data.pedido;
        const fillElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value || '-';
        };

        // Header do pedido
        fillElement('pedido-numero', pedido.nomovtra);
        fillElement('pedido-destinatario', pedido.destinatario);
        fillElement('pedido-rota', pedido.rota);

        const statusElement = document.getElementById('pedido-status');
        if (statusElement && pedido.nomstatusfre) {
            statusElement.innerHTML = this.getStatusBadgeWithColor(pedido.nomstatusfre, pedido.color);
        }

        // Informações principais
        fillElement('info-nomovtra', pedido.nomovtra);
        fillElement('info-processo', pedido.processo);
        fillElement('info-container', pedido.container);

        const infoStatusElement = document.getElementById('info-status');
        if (infoStatusElement && pedido.nomstatusfre) {
            infoStatusElement.innerHTML = this.getStatusBadgeWithColor(pedido.nomstatusfre, pedido.color);
        }

        fillElement('info-tipo-carga', pedido.nomtipcarga);
        fillElement('info-destinatario', pedido.destinatario);
        fillElement('info-rota', pedido.rota);

        // Transporte
        fillElement('info-motorista', pedido.motorista);
        fillElement('info-tracao', pedido.placacav);
        fillElement('info-reboque', pedido.placacar);
        fillElement('info-tipo-frete', pedido.nomtipfre);
        fillElement('info-tipo-container', pedido.nomtipcont);
        fillElement('info-data-registro', this.formatDate(pedido.data));
        fillElement('info-data-entrega', this.formatDate(pedido.dataentregue));

        // Valores
        fillElement('info-vlr-frete', this.formatCurrency(pedido.vlrfrete || 0));
        fillElement('info-pedagio', this.formatCurrency(pedido.vlrped || 0));
        fillElement('info-gris', this.formatCurrency(pedido.vlrgris || 0));
        fillElement('info-seguro', this.formatCurrency(pedido.vlrseg || 0));
        fillElement('info-icms', this.formatCurrency(pedido.icmvlr || 0));
        fillElement('info-outros', this.formatCurrency(pedido.vlrout || 0));
        fillElement('info-total', this.formatCurrency(pedido.totalfrete || 0));

        // Atualizar timestamp
        document.getElementById('last-update').textContent = new Date().toLocaleString('pt-BR');
    }

    /**
     * Preenche dados adicionais
     */
    fillAdditionalData(detalhes) {
        if (!detalhes) return;

        // Preencher abas
        this.fillTabOcorrencias(detalhes.ocorrencias || []);
        this.fillTabFollowUps(detalhes.followUps || []);
        this.fillTabDocumentos(detalhes.documentos || []);
        this.fillTabComprovantes(detalhes.comprovantes || []);

        // Atualizar contadores das abas
        this.updateTabCounters(detalhes);
    }

    /**
     * Preenche aba de ocorrências
     */
    fillTabOcorrencias(ocorrencias) {
        const container = document.getElementById('ocorrencias-list');
        if (!container) return;

        if (ocorrencias.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-exclamation-triangle fs-1"></i><p class="mt-3">Nenhuma ocorrência encontrada</p></div>';
            return;
        }

        container.innerHTML = ocorrencias.map(ocr => `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1"><i class="bi bi-exclamation-triangle text-danger me-2"></i>Item: ${ocr.noitem}</h6>
                    <small class="text-muted">${ocr.data} ${ocr.hora}</small>
                </div>
                ${ocr.obs ? `<p class="mb-1">${ocr.obs}</p>` : ''}
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
            container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-arrow-repeat fs-1"></i><p class="mt-3">Nenhum follow-up encontrado</p></div>';
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
     * Preenche aba de documentos
     */
    fillTabDocumentos(documentos) {
        const container = document.getElementById('documentos-list');
        if (!container) return;

        if (documentos.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-file-earmark-text fs-1"></i><p class="mt-3">Nenhum documento encontrado</p></div>';
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
     * Preenche aba de comprovantes
     */
    fillTabComprovantes(comprovantes) {
        const container = document.getElementById('comprovantes-list');
        if (!container) return;

        if (comprovantes.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-file-earmark-check fs-1"></i><p class="mt-3">Nenhum comprovante encontrado</p></div>';
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
     * Atualiza contadores das abas
     */
    updateTabCounters(detalhes) {
        document.getElementById('ocorrencias-count').textContent = detalhes.ocorrencias?.length || 0;
        document.getElementById('followups-count').textContent = detalhes.followUps?.length || 0;
        document.getElementById('documentos-count').textContent = detalhes.documentos?.length || 0;
        document.getElementById('comprovantes-count').textContent = detalhes.comprovantes?.length || 0;
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
     * Atualiza mapa com localização
     */
    updateMapWithLocation(locationData) {
        const mapContainer = document.getElementById('tracking-map');
        if (!mapContainer || !locationData.latitude || !locationData.longitude) {
            this.showNoLocationAvailable();
            return;
        }

        // Esconder loading
        const mapLoading = document.getElementById('map-loading');
        const noLocation = document.getElementById('no-location');
        if (mapLoading) mapLoading.style.setProperty('display', 'none', 'important');
        if (noLocation) noLocation.style.display = 'none';
        if (mapContainer) mapContainer.style.display = 'block';

        // Remover mapa anterior se existir
        if (this.map) {
            this.map.remove();
        }

        // Criar novo mapa
        this.map = L.map('tracking-map').setView([locationData.latitude, locationData.longitude], 13);

        // Adicionar tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Adicionar marcador
        const marker = L.marker([locationData.latitude, locationData.longitude]).addTo(this.map);

        if (locationData.endereco || locationData.dataposicao) {
            const popupContent = `
                <div class="text-center">
                    <strong>Localização Atual</strong><br>
                    ${locationData.endereco || 'Endereço não disponível'}<br>
                    <small class="text-muted">${locationData.dataposicao || '-'}</small>
                </div>
            `;
            marker.bindPopup(popupContent).openPopup();
        }
    }

    /**
     * Mostra quando não há localização disponível
     */
    showNoLocationAvailable() {
        const mapLoading = document.getElementById('map-loading');
        const noLocation = document.getElementById('no-location');
        const processMap = document.getElementById('tracking-map');

        if (mapLoading) mapLoading.style.setProperty('display', 'none', 'important');
        if (noLocation) noLocation.style.display = 'block';
        if (processMap) processMap.style.display = 'none';

        // Atualizar status
        document.getElementById('tracking-status').className = 'badge bg-secondary';
        document.getElementById('tracking-status').textContent = 'Offline';
    }

    /**
     * Gera badge de status com cor
     */
    getStatusBadgeWithColor(status, color) {
        const badgeColor = color || '#6c757d';
        return `<span class="badge" style="background-color: ${badgeColor}; color: white;">${status}</span>`;
    }

    /**
     * Formata data para exibição
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            return dateStr;
        }
    }

    /**
     * Formata moeda
     */
    formatCurrency(value) {
        if (!value && value !== 0) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    /**
     * Controla estado da página
     */
    showState(state) {
        const loading = document.getElementById('initial-loading');
        const content = document.getElementById('main-content');
        const error = document.getElementById('error-state');

        // Esconder todos
        loading?.classList.add('d-none');
        content?.classList.add('d-none');
        error?.classList.add('d-none');

        // Mostrar o estado atual
        switch (state) {
            case 'loading':
                loading?.classList.remove('d-none');
                break;
            case 'content':
                content?.classList.remove('d-none');
                break;
            case 'error':
                error?.classList.remove('d-none');
                break;
        }
    }

    /**
     * Mostra erro
     */
    showError(message) {
        this.showState('error');
        this.showErrorToast(message);
    }

    /**
     * Atualiza dados
     */
    async refreshData() {
        this.showSuccessToast('Atualizando dados...');
        await this.loadTrackingData();
    }

    /**
     * Configura intervalo de atualização
     */
    setupRefreshInterval() {
        // Atualizar a cada 5 minutos
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 5 * 60 * 1000);
    }

    /**
     * Mostra toast de sucesso
     */
    showSuccessToast(message) {
        this.showToast(message, 'success', 'Sucesso');
    }

    /**
     * Mostra toast de erro
     */
    showErrorToast(message) {
        this.showToast(message, 'danger', 'Erro');
    }

    /**
     * Cria e exibe um toast
     */
    showToast(message, type, title) {
        const toastContainer = document.querySelector('.toast-container');
        const toastId = 'toast-' + Date.now();

        const toastHTML = `
            <div id="${toastId}" class="toast colored-toast bg-${type} text-fixed-white fade" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-${type} text-fixed-white">
                    <strong class="me-auto">${title}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('afterbegin', toastHTML);

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            delay: type === 'success' ? 3000 : 5000,
            autohide: true
        });

        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });

        toast.show();
    }

    /**
     * Cleanup quando sair da página
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        if (this.map) {
            this.map.remove();
        }
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.trackingManager = new TrackingManager();
});

// Cleanup ao sair da página
window.addEventListener('beforeunload', () => {
    if (window.trackingManager) {
        window.trackingManager.destroy();
    }
});
