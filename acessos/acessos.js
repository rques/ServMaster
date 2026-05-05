document.getElementById('form-gestao').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const btn = this.querySelector('.btn-submit');
    btn.textContent = 'Autenticando...';
    btn.style.opacity = '0.7';
    btn.disabled = true;
    
    // Simulação de autenticação
    setTimeout(() => {
        // Link para a tela de criação de usuários do ServMaster
        window.location.href = '../cadastro/cadastro.html'; 
    }, 1500);
});