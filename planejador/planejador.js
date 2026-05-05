document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const matriculaInput = document.getElementById("matricula");
    const senhaInput = document.getElementById("senha"); // Novo campo de senha
    const errorMsg = document.getElementById("error-msg");
    const submitBtn = document.getElementById("submit-btn");

    // Função para buscar a equipe cadastrada
    const getEquipe = () => JSON.parse(localStorage.getItem('equipe_servmaster')) || [];

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault(); 

        const matricula = matriculaInput.value.trim();
        const senha = senhaInput ? senhaInput.value : '';
        const matriculaValida = /^[0-9]{4,}$/.test(matricula);

        if (!matriculaValida) {
            mostrarErro("A matrícula deve conter apenas números (mínimo 4 dígitos).");
            return;
        }

        // Busca o banco de dados de usuários
        const equipe = getEquipe();
        
        // Procura se existe alguém com a matrícula e senha exatas
        const usuarioValido = equipe.find(m => m.matricula === matricula && m.senha === senha);

        if (!usuarioValido) {
            mostrarErro("Matrícula ou senha incorretos.");
            return;
        }

        // Verifica se o cargo é realmente planejador
        if (usuarioValido.cargo !== 'planejador') {
            mostrarErro("Acesso negado. Este portal é exclusivo para Planejadores.");
            return;
        }

        // Login validado com sucesso
        removerErro();
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Acessando...';
        submitBtn.style.opacity = "0.8";
        submitBtn.disabled = true;

        // Salva os dados na sessão
        sessionStorage.setItem("planejadorLogado", "true");
        sessionStorage.setItem("matriculaPlanejador", matricula);
        sessionStorage.setItem("nomePlanejador", usuarioValido.nome); // Opcional, para usar no painel

        setTimeout(() => {
            window.location.href = "../tela-planejador/tela-planejador.html"; 
        }, 1000);
    });

    // Funções de interface para erros
    function mostrarErro(mensagem) {
        matriculaInput.classList.add("input-error");
        if(senhaInput) senhaInput.classList.add("input-error");
        errorMsg.textContent = mensagem;
        errorMsg.style.display = "block";
    }

    function removerErro() {
        matriculaInput.classList.remove("input-error");
        if(senhaInput) senhaInput.classList.remove("input-error");
        errorMsg.style.display = "none";
    }

    // Limpa os erros quando o usuário começa a digitar novamente
    matriculaInput.addEventListener("input", removerErro);
    if(senhaInput) senhaInput.addEventListener("input", removerErro);
});