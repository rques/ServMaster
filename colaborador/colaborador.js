document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const matriculaInput = document.getElementById("matricula");
    const errorMsg = document.getElementById("error-msg");
    const submitBtn = document.getElementById("submit-btn");

    loginForm.addEventListener("submit", (e) => {
        // Previne que a página recarregue ao clicar no botão
        e.preventDefault(); 

        // Pega o valor digitado e remove espaços em branco das pontas
        const matricula = matriculaInput.value.trim();

        // Regex para validação: verifica se tem apenas números e pelo menos 4 dígitos
        const matriculaValida = /^[0-9]{4,}$/.test(matricula);

        if (!matriculaValida) {
            // Se for inválido, mostra o erro visual
            matriculaInput.classList.add("input-error");
            errorMsg.style.display = "block";
            
            // Foca no input novamente
            matriculaInput.focus();
        } else {
            // Se for válido, limpa qualquer erro anterior
            matriculaInput.classList.remove("input-error");
            errorMsg.style.display = "none";

            // Muda o texto do botão para dar feedback visual de carregamento
            submitBtn.textContent = "Validando...";
            submitBtn.style.opacity = "0.8";
            submitBtn.disabled = true;

            // Salva os dados na sessão do navegador para simular um usuário logado
            sessionStorage.setItem("usuarioLogado", "true");
            sessionStorage.setItem("matriculaColaborador", matricula);

            // Simula um tempo de conexão com o banco de dados (1 segundo)
            setTimeout(() => {
                // Redireciona para o painel principal do colaborador (você precisará criar esta página)
                window.location.href = "../painel-colaborador/painel-colaborador.html"; 
            }, 1000);
        }
    });

    // Remove a mensagem de erro assim que o usuário começar a digitar de novo
    matriculaInput.addEventListener("input", () => {
        if (matriculaInput.classList.contains("input-error")) {
            matriculaInput.classList.remove("input-error");
            errorMsg.style.display = "none";
        }
    });
});