document.addEventListener("DOMContentLoaded", () => {
    // 1. Cria o botão flutuante
    const btnSuporte = document.createElement('button');
    btnSuporte.className = 'btn-suporte-flutuante';
    btnSuporte.innerHTML = '<i class="fa-solid fa-headset"></i>';
    btnSuporte.title = "Precisa de ajuda?";
    document.body.appendChild(btnSuporte);

    // 2. Cria o fundo do modal e o conteúdo do formulário
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'suporte-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="suporte-modal-content">
            <button class="suporte-fechar" title="Fechar"><i class="fa-solid fa-xmark"></i></button>
            <h3 style="color: #2C3E50; margin-bottom: 5px; font-weight: 800; font-size: 22px;">Suporte ServMaster</h3>
            <p style="font-size: 13px; color: #A0A0A0; margin-bottom: 25px;">Encontrou um erro ou tem alguma dúvida? Fale com o administrador do sistema.</p>
            
            <form id="form-suporte">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" style="display: block; font-size: 10px; font-weight: 800; color: #A0A0A0; letter-spacing: 1px; margin-bottom: 8px;">TIPO DE PROBLEMA:</label>
                    <select class="form-select" required>
                        <option value="" disabled selected>Selecione a categoria...</option>
                        <option value="erro">Bug / Erro no sistema</option>
                        <option value="duvida">Dúvida de utilização</option>
                        <option value="sugestao">Sugestão de melhoria</option>
                    </select>
                </div>
                
                <div class="form-group" style="margin-bottom: 25px;">
                    <label class="form-label" style="display: block; font-size: 10px; font-weight: 800; color: #A0A0A0; letter-spacing: 1px; margin-bottom: 8px;">DESCRIÇÃO DO PROBLEMA:</label>
                    <textarea class="form-textarea" rows="4" placeholder="Detalhe o que aconteceu ou a sua dúvida..." required></textarea>
                </div>
                
                <button type="submit" class="btn-submit" style="width: 100%;">Enviar Mensagem</button>
            </form>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    // 3. Lógica para Abrir, Fechar e Enviar
    const btnFechar = modalOverlay.querySelector('.suporte-fechar');
    const formSuporte = modalOverlay.querySelector('#form-suporte');

    btnSuporte.addEventListener('click', () => {
        modalOverlay.style.display = 'flex';
    });

    btnFechar.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });

    formSuporte.addEventListener('submit', (e) => {
        e.preventDefault();
        const btnSubmit = formSuporte.querySelector('.btn-submit');
        
        btnSubmit.textContent = "Enviando...";
        btnSubmit.style.opacity = "0.8";
        btnSubmit.disabled = true;
        
        setTimeout(() => {
            alert("Sua mensagem foi enviada ao suporte com sucesso! Retornaremos em breve.");
            modalOverlay.style.display = 'none';
            btnSubmit.textContent = "Enviar Mensagem";
            btnSubmit.style.opacity = "1";
            btnSubmit.disabled = false;
            formSuporte.reset();
        }, 1200);
    });
});