/**
 * Validação de Acesso - Sistema de Acompanhamento de Pedidos
 * Responsável por validar códigos de acesso e redirecionar para tela de acompanhamento
 */

class AccessValidationManager {
    /**
     * Inicializa o sistema
     */
    init() {
        this.bindEvents();
        this.applyCompanyBranding();
    }

    /**
     * Vincula eventos da página
     */
    bindEvents() {
        const btnValidate = document.getElementById('btn-validate');
        const accessCodeInput = document.getElementById('access-code');

        // Botão de validação
        btnValidate?.addEventListener('click', () => this.validateAccess());

        // Enter no campo de código
        accessCodeInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.validateAccess();
            }
        });

        // Limpar erro quando o usuário começar a digitar
        accessCodeInput?.addEventListener('input', () => {
            this.clearFieldError(accessCodeInput);
        });
    }

    /**
     * Aplica o branding da empresa
     */
    applyCompanyBranding() {
        // Aplicar branding salvo no localStorage
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
     * Valida o código de acesso
     */
    async validateAccess() {
        const accessCode = document.getElementById('access-code').value.trim();

        // Validação básica
        if (!this.validateForm(accessCode)) {
            return;
        }

        this.showLoading(true);

        try {
            // Primeira tentativa: verificar se já existe no banco MySQL
            const existingAccess = await this.checkExistingAccess(accessCode);

            if (existingAccess.success && existingAccess.data.url) {
                // Código já validado anteriormente, redirecionar
                this.showSuccessToast('Código válido! Redirecionando...');
                setTimeout(() => {
                    window.location.href = `/pages/acompanhamento/${existingAccess.data.url}`;
                }, 1500);
                return;
            }

            // Segunda tentativa: validar no Firebird e criar nova URL
            const validation = await this.validateNewAccess(accessCode);

            if (validation.success && validation.data.url) {
                this.showSuccessToast('Código validado com sucesso! Redirecionando...');
                setTimeout(() => {
                    window.location.href = `/pages/acompanhamento/${validation.data.url}`;
                }, 1500);
            } else {
                this.showFieldError('access-code', validation.message || 'Código de acesso inválido');
            }

        } catch (error) {
            console.error('Erro na validação:', error);
            this.showErrorToast('Erro ao validar código. Tente novamente.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Verifica se o código já existe no banco MySQL
     */
    async checkExistingAccess(accessCode) {
        // Verifica se a função Thefetch está disponível
        if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            throw new Error('Sistema de requisições não disponível');
        }

        return await Thefetch('/api/acompanhamento/check-access', 'POST', { accessCode });
    }

    /**
     * Valida novo código de acesso no Firebird
     */
    async validateNewAccess(accessCode) {
        // Verifica se a função Thefetch está disponível
        if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            throw new Error('Sistema de requisições não disponível');
        }

        return await Thefetch('/api/acompanhamento/validate-access', 'POST', { accessCode });
    }

    /**
     * Valida o formulário
     */
    validateForm(accessCode) {
        let isValid = true;

        if (!accessCode) {
            this.showFieldError('access-code', 'Código de acesso é obrigatório');
            isValid = false;
        } else if (accessCode.length < 6) {
            this.showFieldError('access-code', 'Código deve ter pelo menos 6 caracteres');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Mostra erro em um campo específico
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const feedback = field?.nextElementSibling;

        if (field && feedback) {
            field.classList.add('is-invalid');
            feedback.textContent = message;
            feedback.style.display = 'block';
        }
    }

    /**
     * Limpa erro de um campo específico
     */
    clearFieldError(field) {
        const feedback = field.nextElementSibling;

        if (field && feedback) {
            field.classList.remove('is-invalid');
            feedback.textContent = '';
            feedback.style.display = 'none';
        }
    }

    /**
     * Controla o estado de loading
     */
    showLoading(show) {
        const btnValidate = document.getElementById('btn-validate');
        const btnLoader = document.querySelector('.btn-loader');

        if (show) {
            btnValidate?.classList.add('d-none');
            btnLoader?.classList.remove('d-none');
        } else {
            btnValidate?.classList.remove('d-none');
            btnLoader?.classList.add('d-none');
        }
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
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.accessValidationManager = new AccessValidationManager();
});
