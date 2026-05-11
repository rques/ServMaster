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
    // 4. RENDERIZAÇÃO DA LISTA
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
            card.className = 'chamado-card-novo'; 

            const tipoSeguro = chamado.tipoServico ? chamado.tipoServico.toUpperCase() : `CHAMADO #${chamado.id}`;
            const idSeguro = chamado.id ? chamado.id.substring(0, 5) : '00000';
            const reqSeguro = chamado.requisitante || 'Não informado';
            const urgSeguro = chamado.urgencia ? chamado.urgencia.toUpperCase() : 'NORMAL';
            const urgClass = chamado.urgencia ? chamado.urgencia.toLowerCase() : 'baixa';
            const centroCustoSeguro = chamado.centroCusto || 'Não informado';
            const descSegura = chamado.descricao || 'Sem descrição.';
            const dataSegura = chamado.dataCriacao || '';
            const matriculaSegura = chamado.matriculaCriador || 'Desconhecida';

            const statusText = chamado.status === 'andamento' ? 'Em Andamento' : chamado.status.charAt(0).toUpperCase() + chamado.status.slice(1);
            
            card.innerHTML = `
                <div class="card-header-top">
                    <h3 class="card-main-title">${tipoSeguro} - ${idSeguro}</h3>
                    <span class="card-date-text">${dataSegura}</span>
                </div>

                <div class="card-info-caixa">
                    <div class="info-col">
                        <p class="info-lbl">REQUISITANTE:</p>
                        <p class="info-val">${reqSeguro}</p>
                    </div>
                    <div class="info-col">
                        <p class="info-lbl">MATRÍCULA:</p>
                        <p class="info-val">${matriculaSegura}</p>
                    </div>
                    <div class="info-col">
                        <p class="info-lbl">Setor:</p>
                        <p class="info-val">${centroCustoSeguro}</p>
                    </div>
                    <div class="info-col">
                        <p class="info-lbl">URGÊNCIA:</p>
                        <p class="info-val urg-${urgClass}">${urgSeguro}</p>
                    </div>
                </div>

                <div>
                    <p class="info-lbl">DESCRIÇÃO DO PROBLEMA:</p>
                    <p class="desc-texto">${descSegura}</p>
                </div>

                <hr class="card-divisor">

                <div class="card-footer-section">
                    <h4 class="tecnico-title"><i class="fa-solid fa-wrench"></i> RETORNO TÉCNICO</h4>
                    <div style="margin-bottom: 16px; max-width: 250px;">
                        <p class="info-lbl">STATUS ATUAL:</p>
                        <div class="readonly-box style-status-${chamado.status}">${statusText}</div>
                    </div>
                    <div>
                        <p class="info-lbl">OBSERVAÇÕES / LAUDO TÉCNICO:</p>
                        <div class="readonly-box-large ${!chamado.respostaTecnico ? 'txt-muted' : ''}">
                            ${chamado.respostaTecnico || 'Aguardando avaliação do técnico...'}
                        </div>
                    </div>
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