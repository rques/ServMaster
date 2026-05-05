document.addEventListener("DOMContentLoaded", () => {
    const cadastroForm = document.getElementById("cadastro-form");
    const matriculaInput = document.getElementById("matricula");
    const nomeInput = document.getElementById("nome"); 
    const cargoInput = document.getElementById("cargo"); 
    const senhaInput = document.getElementById("senha"); 
    
    const errorMsg = document.getElementById("error-msg");
    const submitBtn = document.getElementById("submit-btn");
    const listaUsuarios = document.getElementById("lista-usuarios");
    const totalUsersBadge = document.getElementById("total-users");

    // ==========================================
    // 1. BANCO DE DADOS (LOCALSTORAGE)
    // ==========================================
    const getEquipe = () => JSON.parse(localStorage.getItem('equipe_servmaster')) || [];
    const saveEquipe = (equipe) => localStorage.setItem('equipe_servmaster', JSON.stringify(equipe));

    // ==========================================
    // 2. RENDERIZAR LISTA DE USUÁRIOS
    // ==========================================
    function renderizarEquipe() {
        const equipe = getEquipe();
        listaUsuarios.innerHTML = '';
        totalUsersBadge.textContent = equipe.length;

        if (equipe.length === 0) {
            listaUsuarios.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-inbox"></i>
                    <p>Nenhum usuário cadastrado no sistema.</p>
                </div>
            `;
            return;
        }

        // Inverte para mostrar o mais recente primeiro
        equipe.slice().reverse().forEach(membro => {
            const roleClass = membro.cargo === 'planejador' ? 'badge-planejador' : 'badge-tecnico';
            const roleName = membro.cargo === 'planejador' ? 'Planejador' : 'Técnico';

            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">
                        <i class="fa-solid fa-user-tie"></i>
                    </div>
                    <div class="user-details">
                        <h4>${membro.nome}</h4>
                        <p>Matrícula: <strong>${membro.matricula}</strong></p>
                        <span class="role-badge ${roleClass}">${roleName}</span>
                    </div>
                </div>
                <button class="btn-delete" data-id="${membro.id}" title="Excluir Usuário">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            listaUsuarios.appendChild(userCard);
        });

        // Adiciona evento de clique nos botões de lixeira
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                excluirUsuario(id);
            });
        });
    }

    // ==========================================
    // 3. EXCLUIR USUÁRIO
    // ==========================================
    function excluirUsuario(id) {
        if (confirm('Tem certeza que deseja remover este colaborador do sistema?')) {
            const equipe = getEquipe();
            const novaEquipe = equipe.filter(membro => String(membro.id) !== String(id));
            saveEquipe(novaEquipe);
            renderizarEquipe();
        }
    }

    // ==========================================
    // 4. CADASTRAR NOVO USUÁRIO
    // ==========================================
    cadastroForm.addEventListener("submit", (e) => {
        e.preventDefault(); 

        const matricula = matriculaInput.value.trim();
        const matriculaValida = /^[0-9]{4,}$/.test(matricula);

        if (!matriculaValida) {
            matriculaInput.classList.add("input-error");
            errorMsg.style.display = "block";
            matriculaInput.focus();
            return; 
        } 
        
        matriculaInput.classList.remove("input-error");
        errorMsg.style.display = "none";

        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;

        const novoFuncionario = {
            id: Date.now(), 
            matricula: matricula,
            nome: nomeInput.value,
            cargo: cargoInput.value,
            senha: senhaInput.value // Em um sistema real, isso seria criptografado
        };

        const equipeAtual = getEquipe();
        
        // Verifica se a matrícula já existe
        const matriculaExiste = equipeAtual.find(m => m.matricula === matricula);
        if (matriculaExiste) {
            alert("Esta matrícula já está cadastrada no sistema!");
            submitBtn.textContent = "Cadastrar Usuário";
            submitBtn.disabled = false;
            return;
        }

        equipeAtual.push(novoFuncionario);
        saveEquipe(equipeAtual);

        setTimeout(() => {
            cadastroForm.reset();
            submitBtn.textContent = "Cadastrar Usuário";
            submitBtn.disabled = false;
            renderizarEquipe(); // Atualiza a lista lateral na hora
        }, 600);
    });

    // Remove erro ao digitar
    matriculaInput.addEventListener("input", () => {
        matriculaInput.classList.remove("input-error");
        errorMsg.style.display = "none";
    });

    // Inicializa a tela carregando a lista
    renderizarEquipe();
});