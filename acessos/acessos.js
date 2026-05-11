document.getElementById('form-gestao').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Captura os valores dos inputs (certifique-se de que os IDs sejam 'matricula' e 'senha')
    const matricula = document.getElementById('matricula').value;
    const senha = document.getElementById('senha').value;
    const btn = this.querySelector('.btn-submit');

    // Validação da matrícula e senha padrão
    if (matricula === "1234" && senha === "1234") {
        btn.textContent = 'Autenticando...';
        btn.style.opacity = '0.7';
        btn.disabled = true;
        
        // Simulação de autenticação
        setTimeout(() => {
            // Link para a tela de criação de usuários do ServMaster
            window.location.href = '../cadastro/cadastro.html'; 
        }, 1500);
    } else {
        alert("Matrícula ou senha incorretos. Tente novamente.");
    }
});