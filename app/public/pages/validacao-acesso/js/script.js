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
    }

    /**
     * Vincula eventos da página
     */
    bindEvents() {
        const btnValidate = document.getElementById('btn-validate');
        const codeAccessInput = document.getElementById('access-code');

        // Botão de validação
        btnValidate?.addEventListener('click', () => this.validateAccess());

        // Enter no campo de código
        codeAccessInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.validateAccess();
            }
        });

        // Limpar erro quando o usuário começar a digitar
        codeAccessInput?.addEventListener('input', () => {
            this.clearFieldError(codeAccessInput);
        });
    }

    /**
     * Valida o código de acesso
     */
    async validateAccess() {
        const codeAccess = document.getElementById('access-code').value.trim();

        // Validação básica
        if (!this.validateForm(codeAccess)) {
            return;
        }

        this.showLoading(true);

        try {
            // Primeira tentativa: verificar se já existe no banco MySQL
            const existingAccess = await this.checkExistingAccess(codeAccess);
            console.log(existingAccess);


            // if (existingAccess.success && existingAccess.data.url) {
            //     // Código já validado anteriormente, redirecionar
            //     this.showSuccessToast('Código válido! Redirecionando...');
            //     setTimeout(() => {
            //         window.location.href = `/pages/acompanhamento/${existingAccess.data.url}`;
            //     }, 1500);
            //     return;
            // }

            // // Segunda tentativa: validar no Firebird e criar nova URL
            // const validation = await this.validateNewAccess(codeAccess);

            // if (validation.success && validation.data.url) {
            //     this.showSuccessToast('Código validado com sucesso! Redirecionando...');
            //     setTimeout(() => {
            //         window.location.href = `/pages/acompanhamento/${validation.data.url}`;
            //     }, 1500);
            // } else {
            //     this.showFieldError('access-code', validation.message || 'Código de acesso inválido');
            // }

        } catch (error) {
            console.error('Erro na validação:', error);
            this.showErrorToast('Erro ao validar código. Tente novamente.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Verifica se o código já existe no banco
     */
    async checkExistingAccess(codeAccess) {
        // Verifica se a função Thefetch está disponível
        if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            throw new Error('Sistema de requisições não disponível');
        }

        return await Thefetch('/api/access-validation/code-access', 'POST', { codeAccess: codeAccess });
    }

    /**
     * Valida o formulário
     */
    validateForm(codeAccess) {
        let isValid = true;

        if (!codeAccess) {
            this.showFieldError('access-code', 'Código de acesso é obrigatório');
            isValid = false;
        } else if (codeAccess.length < 6) {
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
    window.accessvalidationmanager = new AccessValidationManager();
    window.accessvalidationmanager.init();
});
