document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // SESSÃO E BANCO DE DADOS
    // ==========================================
    const displayNome = document.getElementById("nome-planejador-display");
    const nomePlanejador = sessionStorage.getItem("nomePlanejador"); 
    if (displayNome) displayNome.textContent = nomePlanejador || "Planejador Logado";

    const getChamados = () => JSON.parse(localStorage.getItem('chamados')) || [];
    const saveChamados = (chamados) => localStorage.setItem('chamados', JSON.stringify(chamados));
    const equipe = JSON.parse(localStorage.getItem('equipe_servmaster')) || [];

    let chartStatus = null;
    let chartEquipe = null;

    // ==========================================
    // NAVEGAÇÃO SPA
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.page-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById(`sec-${targetId}`).classList.add('active');

            if(targetId === 'gestao') renderGestao();
            if(targetId === 'equipe') renderEquipe();
            if(targetId === 'relatorios') renderRelatorios();
            if(targetId === 'historico') renderHistorico();
        });
    });

    // ==========================================
    // EXCLUSÃO
    // ==========================================
    window.excluirChamado = function(id) {
        if (confirm('Deseja excluir esta requisição permanentemente?')) {
            const chamados = getChamados();
            saveChamados(chamados.filter(c => String(c.id) !== String(id)));
            
            const activeSection = document.querySelector('.page-section.active')?.id;
            if (activeSection === 'sec-gestao') renderGestao();
            if (activeSection === 'sec-equipe') renderEquipe();
            if (activeSection === 'sec-relatorios') renderRelatorios();
            if (activeSection === 'sec-historico') renderHistorico();
        }
    };

    // ==========================================
    // RENDER: GESTÃO (TABELA)
    // ==========================================
    function renderGestao() {
        const listaGestao = document.getElementById('lista-gestao');
        if (!listaGestao) return;
        listaGestao.innerHTML = '';
        
        const chamados = getChamados();
        const apenasTecnicos = equipe.filter(m => m.cargo.toLowerCase() !== 'planejador');

        chamados.slice().reverse().forEach(chamado => {
            const titulo = chamado.tipoServico ? chamado.tipoServico.toUpperCase() : `ID: ${chamado.id.substring(0,6)}`;
            const respNome = chamado.responsavelId 
                ? equipe.find(e => e.id === Number(chamado.responsavelId))?.nome 
                : '<span style="color:#D9534F;">Sem técnico</span>';
            
            const laudo = chamado.respostaTecnico || '<span style="color:#A0A0A0;">Aguardando...</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${titulo}</strong><br><small>${chamado.dataCriacao || ''}</small></td>
                <td>
                    <select class="status-select" data-id="${chamado.id}">
                        <option value="pendente" ${chamado.status === 'pendente' ? 'selected' : ''}>⏳ Pendente</option>
                        <option value="aberto" ${chamado.status === 'aberto' ? 'selected' : ''}>🟢 Aprovado</option>
                        <option value="andamento" ${chamado.status === 'andamento' ? 'selected' : ''}>🔵 Andamento</option>
                        <option value="concluido" ${chamado.status === 'concluido' ? 'selected' : ''}>✅ Concluído</option>
                    </select>
                </td>
                <td>${respNome}</td>
                <td class="col-laudo">${laudo}</td>
                <td>
                    <select class="select-responsavel" data-id="${chamado.id}">
                        <option value="">Atribuir...</option>
                        ${apenasTecnicos.map(e => `<option value="${e.id}" ${Number(chamado.responsavelId) === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <button onclick="excluirChamado('${chamado.id}')" class="btn-excluir"><i class="ph ph-trash"></i></button>
                </td>
            `;
            listaGestao.appendChild(tr);
        });
        aplicarCoresEEventos();
    }

    // ==========================================
    // RENDER: EQUIPE
    // ==========================================
    function renderEquipe() {
        const container = document.getElementById('lista-equipe');
        if (!container) return;
        container.innerHTML = '';
        const chamados = getChamados();
        const equipeTecnica = equipe.filter(m => m.cargo.toLowerCase() !== 'planejador');

        equipeTecnica.forEach(membro => {
            const tarefas = chamados.filter(c => Number(c.responsavelId) === membro.id);
            const card = document.createElement('div');
            card.className = 'equipe-card';
            card.innerHTML = `
                <div class="equipe-card-header">
                    <div class="equipe-avatar"><i class="ph ph-user"></i></div>
                    <div class="equipe-info">
                        <h3>${membro.nome}</h3>
                        <p>${membro.cargo}</p>
                    </div>
                </div>
                <div class="equipe-tarefas">
                    <h4>Ativas (${tarefas.filter(t => t.status !== 'concluido').length}):</h4>
                    ${tarefas.map(t => `<div class="tarefa-item ${t.status}">${t.tipoServico?.toUpperCase() || 'CHAMADO'}</div>`).join('') || '<p>Vazio</p>'}
                </div>
            `;
            container.appendChild(card);
        });
    }

    // ==========================================
    // RENDER: HISTÓRICO (NOVA TELA)
    // ==========================================
    function renderHistorico() {
        const lista = document.getElementById('lista-historico');
        const badge = document.getElementById('badge-historico');
        if (!lista) return;
        
        const chamados = getChamados();
        lista.innerHTML = '';
        badge.textContent = `${chamados.length} Registros Totais`;

        chamados.slice().reverse().forEach(c => {
            const card = document.createElement('div');
            card.className = 'chamado-card';
            card.innerHTML = `
                <div class="chamado-info">
                    <h3>${c.tipoServico?.toUpperCase() || 'CHAMADO'} - ${c.local || 'S/L'}</h3>
                    <p>Requisitante: ${c.requisitante} • Status: <strong>${c.status.toUpperCase()}</strong></p>
                    <small>Criado em: ${c.dataCriacao}</small>
                </div>
                <button onclick="excluirChamado('${c.id}')" class="btn-excluir"><i class="ph ph-trash"></i></button>
            `;
            lista.appendChild(card);
        });
    }

    // ==========================================
    // GRÁFICOS (RELATÓRIOS)
    // ==========================================
    function renderRelatorios() {
        const filtrados = getChamados(); // Adicione lógica de filtro de data aqui se necessário
        const stats = { pendente: 0, aberto: 0, andamento: 0, concluido: 0 };
        filtrados.forEach(c => stats[c.status]++);

        if(chartStatus) chartStatus.destroy();
        const ctxS = document.getElementById('graficoStatus')?.getContext('2d');
        if(ctxS) chartStatus = new Chart(ctxS, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Aprovado', 'Andamento', 'Concluído'],
                datasets: [{ data: Object.values(stats), backgroundColor: ['#F5F5F5', '#FFE0B2', '#BBDEFB', '#C8E6C9'] }]
            }
        });

        // Gráfico Equipe
        const tecs = equipe.filter(m => m.cargo.toLowerCase() !== 'planejador');
        if(chartEquipe) chartEquipe.destroy();
        const ctxE = document.getElementById('graficoEquipe')?.getContext('2d');
        if(ctxE) chartEquipe = new Chart(ctxE, {
            type: 'bar',
            data: {
                labels: tecs.map(t => t.nome),
                datasets: [{ label: 'Chamados', data: tecs.map(t => filtrados.filter(c => Number(c.responsavelId) === t.id).length), backgroundColor: '#E68B5C' }]
            }
        });
    }

    function aplicarCoresEEventos() {
        document.querySelectorAll('.status-select').forEach(select => {
            atualizarCor(select);
            select.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const chamados = getChamados();
                const idx = chamados.findIndex(c => String(c.id) === String(id));
                if(idx !== -1) {
                    chamados[idx].status = e.target.value;
                    saveChamados(chamados);
                    atualizarCor(e.target);
                }
            });
        });

        document.querySelectorAll('.select-responsavel').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const chamados = getChamados();
                const idx = chamados.findIndex(c => String(c.id) === String(id));
                if(idx !== -1) {
                    chamados[idx].responsavelId = e.target.value;
                    if(e.target.value && chamados[idx].status === 'pendente') chamados[idx].status = 'aberto';
                    saveChamados(chamados);
                    renderGestao();
                }
            });
        });
    }

    function atualizarCor(el) {
        const cores = {
            aberto: {bg:'#FFF3E0', text:'#E65100'},
            andamento: {bg:'#E3F2FD', text:'#1565C0'},
            concluido: {bg:'#E8F5E9', text:'#2E7D32'},
            pendente: {bg:'#F5F5F5', text:'#757575'}
        };
        const c = cores[el.value];
        if(c) { el.style.backgroundColor = c.bg; el.style.color = c.text; }
    }

    // Inicialização
    renderGestao();
});