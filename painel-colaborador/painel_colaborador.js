document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. BANCO DE DADOS (LOCALSTORAGE)
    // ==========================================
    const getChamados = () => JSON.parse(localStorage.getItem('chamados')) || [];
    const saveChamados = (chamados) => localStorage.setItem('chamados', JSON.stringify(chamados));

    // ==========================================
    // 2. GESTÃO DE PERFIS
    // ==========================================
    const displayElement = document.getElementById("user-display");
    const matriculaColaborador = sessionStorage.getItem("matriculaColaborador");

    if (!matriculaColaborador) {
        window.location.href = "../index.html"; 
    } else if (displayElement) {
        displayElement.textContent = "Matrícula: " + matriculaColaborador;
    }

    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "../index.html";
        });
    }

    // ==========================================
    // 3. NAVEGAÇÃO SPA
    // ==========================================
    const navLista = document.getElementById('nav-lista');
    const navNovo = document.getElementById('nav-novo');
    const viewLista = document.getElementById('view-lista');
    const viewNovo = document.getElementById('view-novo');

    function alternarView(view) {
        if (view === 'lista') {
            viewLista.style.display = 'block';
            viewNovo.style.display = 'none';
            if(navLista) navLista.classList.add('active');
            if(navNovo) navNovo.classList.remove('active');
            renderizarLista();
        } else {
            viewLista.style.display = 'none';
            viewNovo.style.display = 'block';
            if(navLista) navLista.classList.remove('active');
            if(navNovo) navNovo.classList.add('active');
        }
    }

    if(navLista) navLista.addEventListener('click', (e) => { e.preventDefault(); alternarView('lista'); });
    if(navNovo) navNovo.addEventListener('click', (e) => { e.preventDefault(); alternarView('novo'); });
    
    const btnCancelar = document.getElementById('btn-cancelar-novo');
    if(btnCancelar) btnCancelar.addEventListener('click', () => alternarView('lista'));

    // ==========================================
    // 4. RENDERIZAÇÃO DA LISTA (DESIGN NOVO - APENAS LEITURA)
    // ==========================================
    function renderizarLista() {
        const containerLista = document.querySelector('.chamados-list');
        const badgeTotal = document.getElementById('badge-total-element');
        
        if (!containerLista) return; 

        let chamados = getChamados();
        containerLista.innerHTML = ''; 

        // Filtra para mostrar apenas os chamados criados por este colaborador
        chamados = chamados.filter(c => c.matriculaCriador === matriculaColaborador);

        const pendentes = chamados.filter(c => c.status !== 'concluido').length;
        if (badgeTotal) badgeTotal.textContent = `PENDENTES: ${pendentes}`;

        if (chamados.length === 0) {
            containerLista.innerHTML = '<p style="color: #94A3B8; text-align: center; margin-top: 30px; font-weight: 600; font-family: Nunito;">Nenhum chamado aberto.</p>';
            return;
        }

        chamados.slice().reverse().forEach(chamado => {
            const card = document.createElement('div');
            
            // Força o estilo Inline Block (Tela Cheia) ignorando o CSS externo
            card.style.display = 'block';
            card.style.width = '100%';
            card.style.boxSizing = 'border-box';
            card.style.backgroundColor = '#ffffff';
            card.style.padding = '25px';
            card.style.marginBottom = '25px';
            card.style.borderRadius = '8px';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            card.style.border = '1px solid #E2E8F0';

            const tipoSeguro = chamado.tipoServico ? chamado.tipoServico.toUpperCase() : `CHAMADO #${chamado.id}`;
            const localSeguro = chamado.local ? `- ${chamado.local}` : '';
            const reqSeguro = chamado.requisitante || 'Não informado';
            const urgSeguro = chamado.urgencia ? chamado.urgencia.toUpperCase() : 'NORMAL';
            const centroCustoSeguro = chamado.centroCusto || 'Não informado';
            const descSegura = chamado.descricao || 'Sem descrição.';
            const dataSegura = chamado.dataCriacao || '';
            const statusText = chamado.status === 'andamento' ? 'Em Andamento' : chamado.status.charAt(0).toUpperCase() + chamado.status.slice(1);
            
            card.innerHTML = `
                <!-- Cabeçalho -->
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">
                    <h3 style="font-size: 18px; font-weight: 800; color: #111; margin: 0; text-transform: uppercase;">${tipoSeguro} ${localSeguro}</h3>
                    <span style="font-size: 13px; color: #555;">${dataSegura}</span>
                </div>
                
                <!-- Informações Básicas -->
                <div style="display: flex; flex-wrap: wrap; gap: 30px; margin-bottom: 15px; font-size: 13px;">
                    <div><strong style="color: #333;">REQUISITANTE:</strong> <span style="color: #555;">${reqSeguro}</span></div>
                    <div><strong style="color: #333;">SETOR:</strong> <span style="color: #555;">${centroCustoSeguro}</span></div>
                    <div><strong style="color: #333;">URGÊNCIA:</strong> <span style="color: ${chamado.urgencia === 'alta' ? '#DC2626' : (chamado.urgencia === 'media' ? '#EA580C' : '#64748B')}; font-weight: bold;">${urgSeguro}</span></div>
                </div>

                <!-- Descrição do Problema -->
                <div style="margin-bottom: 25px;">
                    <strong style="font-size: 13px; color: #111; display: block; margin-bottom: 5px;">DESCRIÇÃO DO PROBLEMA:</strong>
                    <div style="font-size: 14px; color: #444; line-height: 1.5;">${descSegura}</div>
                </div>

                <!-- Bloco do Relatório Técnico (Apenas Leitura para o Colaborador) -->
                <div style="background-color: #F8F9FA; border: 1px solid #E5E7EB; border-radius: 6px; padding: 20px; box-sizing: border-box; width: 100%;">
                    <h4 style="font-size: 14px; color: #B45309; margin-top: 0; margin-bottom: 15px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-wrench"></i> RELATÓRIO TÉCNICO
                    </h4>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="font-size: 12px; font-weight: 800; color: #111; display: block; margin-bottom: 6px;">STATUS DO CHAMADO:</label>
                        <input type="text" value="${statusText}" disabled style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 14px; background-color: #F1F5F9; color: #334155; font-weight: 700; box-sizing: border-box; cursor: not-allowed; outline: none;">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="font-size: 12px; font-weight: 800; color: #111; display: block; margin-bottom: 6px;">LISTA DE PEÇAS E MATERIAIS UTILIZADOS:</label>
                        <input type="text" value="${chamado.pecasUtilizadas || ''}" placeholder="Nenhuma peça registrada até o momento." disabled style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 14px; background-color: #F1F5F9; color: #334155; box-sizing: border-box; cursor: not-allowed; outline: none;">
                    </div>

                    <div style="margin-bottom: 10px;">
                        <label style="font-size: 12px; font-weight: 800; color: #111; display: block; margin-bottom: 6px;">LAUDO DE MANUTENÇÃO DETALHADO / OBSERVAÇÕES:</label>
                        <textarea rows="3" placeholder="Aguardando avaliação/retorno do técnico..." disabled style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 14px; background-color: #F1F5F9; color: #334155; box-sizing: border-box; resize: vertical; font-family: inherit; cursor: not-allowed; outline: none;">${chamado.respostaTecnico || ''}</textarea>
                    </div>
                    
                    ${chamado.status === 'concluido' ? `
                    <div style="display: flex; justify-content: center; margin-top: 20px;">
                        <span style="color: #15803D; font-weight: 800; font-size: 14px; background: #DCFCE7; padding: 10px 20px; border-radius: 6px; border: 1px solid #BBF7D0;"><i class="fa-solid fa-lock"></i> CHAMADO CONCLUÍDO E BLOQUEADO</span>
                    </div>
                    ` : ''}
                </div>
            `;
            containerLista.appendChild(card);
        });
    }

    // ==========================================
    // 5. ENVIO DO FORMULÁRIO (COM DATA FORMATADA)
    // ==========================================
    const formNovo = document.getElementById("form-novo-chamado");
    if (formNovo) {
        formNovo.addEventListener("submit", (e) => {
            e.preventDefault();
            const btn = document.getElementById("btn-enviar-chamado");
            btn.disabled = true;

            // Formatação correta da data com zeros à esquerda (DD/MM/YYYY às HH:MM)
            const dataAtual = new Date();
            const dia = String(dataAtual.getDate()).padStart(2, '0');
            const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
            const ano = dataAtual.getFullYear();
            const horas = String(dataAtual.getHours()).padStart(2, '0');
            const minutos = String(dataAtual.getMinutes()).padStart(2, '0');
            const dataFormatadaString = `${dia}/${mes}/${ano} às ${horas}:${minutos}`;

            const novoChamado = {
                id: Date.now().toString(),
                matriculaCriador: matriculaColaborador,
                requisitante: document.getElementById('requisitante') ? document.getElementById('requisitante').value : 'Não informado',
                centroCusto: document.getElementById('centro-custo') ? document.getElementById('centro-custo').value : 'Não informado',
                tipoTecnico: document.getElementById('tipo-tecnico') ? document.getElementById('tipo-tecnico').value : '',
                tipoServico: document.getElementById('tipo-servico') ? document.getElementById('tipo-servico').value : 'Manutenção Geral',
                urgencia: document.getElementById('urgencia') ? document.getElementById('urgencia').value : 'normal',
                local: document.getElementById('local') ? document.getElementById('local').value : 'Não informado',
                descricao: document.getElementById('descricao') ? document.getElementById('descricao').value : '',
                
                status: 'pendente', // Entra aguardando planejador
                responsavelId: null, 
                respostaTecnico: '',
                pecasUtilizadas: '',
                dataCriacao: dataFormatadaString // Aplica a data forçada
            };

            const db = getChamados();
            db.push(novoChamado); 
            saveChamados(db);

            setTimeout(() => {
                formNovo.reset();
                btn.disabled = false;
                alert("Chamado aberto com sucesso! Aguardando Planejamento.");
                alternarView('lista');
            }, 500);
        });
    }

    // Inicializa a tela
    renderizarLista();
});