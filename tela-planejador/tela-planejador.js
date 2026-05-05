document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. BANCO DE DADOS (LOCALSTORAGE)
    // ==========================================
    const getChamados = () => JSON.parse(localStorage.getItem('chamados')) || [];
    const saveChamados = (chamados) => localStorage.setItem('chamados', JSON.stringify(chamados));
    const equipe = JSON.parse(localStorage.getItem('equipe_servmaster')) || [];

    let chartStatus = null;
    let chartEquipe = null;

    // ==========================================
    // 2. LÓGICA DE EXCLUSÃO (DELETAR CHAMADO)
    // ==========================================
    function excluirChamado(id) {
        if (confirm('Tem certeza que deseja excluir esta requisição permanentemente?')) {
            const chamados = getChamados();
            const novaLista = chamados.filter(c => String(c.id) !== String(id));
            saveChamados(novaLista);
            
            // Recarrega a tela atual
            if (document.getElementById('sec-painel').classList.contains('active')) renderPainel();
            if (document.getElementById('sec-gestao').classList.contains('active')) renderGestao();
            if (document.getElementById('sec-equipe').classList.contains('active')) renderEquipe();
            if (document.getElementById('sec-relatorios').classList.contains('active')) renderRelatorios();
        }
    }

    // ==========================================
    // 3. NAVEGAÇÃO ENTRE TELAS (SPA)
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

            if(targetId === 'painel') renderPainel();
            if(targetId === 'gestao') renderGestao();
            if(targetId === 'equipe') renderEquipe();
            if(targetId === 'relatorios') renderRelatorios();
        });
    });

    const filtroMes = document.getElementById('filtro-mes');
    const filtroDia = document.getElementById('filtro-dia');
    
    if(filtroMes) filtroMes.addEventListener('change', renderRelatorios);
    if(filtroDia) filtroDia.addEventListener('input', renderRelatorios);

    // ==========================================
    // 4. RENDERIZAÇÃO: PAINEL PRINCIPAL
    // ==========================================
    function renderPainel() {
        const listaPainel = document.getElementById('lista-painel');
        const badgePainel = document.getElementById('badge-painel');
        listaPainel.innerHTML = '';
        
        const chamados = getChamados();
        let abertos = 0;

        if (chamados.length === 0) {
            listaPainel.innerHTML = '<p style="color: #A0A0A0; font-weight: 500; text-align: center; margin-top: 20px;">Nenhum chamado registrado no momento.</p>';
        }

        chamados.slice().reverse().forEach(chamado => {
            if(chamado.status === 'aberto' || chamado.status === 'pendente') abertos++;

            // Substituição do "Sem Título" pelo ID
            const tituloFormatado = chamado.tipoServico ? `${chamado.tipoServico.toUpperCase()} - ${chamado.local}` : `Chamado #${chamado.id.substring(0,6)}`;
            const reqFormatado = chamado.requisitante || 'Não informado';
            const dataFormatada = chamado.dataCriacao || '';

            const responsavelNome = chamado.responsavelId 
                ? equipe.find(e => e.id === Number(chamado.responsavelId))?.nome || 'Não atribuído'
                : 'Não atribuído';

            const card = document.createElement('div');
            card.className = 'chamado-card';
            card.innerHTML = `
                <div class="chamado-info">
                    <h3>${tituloFormatado}</h3>
                    <p>Solicitante: ${reqFormatado} • Data: ${dataFormatada} • Resp: ${responsavelNome}</p>
                </div>
                <div class="chamado-actions">
                    <select class="status-select" data-id="${chamado.id}">
                        <option value="pendente" ${chamado.status === 'pendente' ? 'selected' : ''}>Pendente (Aprovar)</option>
                        <option value="aberto" ${chamado.status === 'aberto' ? 'selected' : ''}>Aprovado (Aberto)</option>
                        <option value="andamento" ${chamado.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
                        <option value="concluido" ${chamado.status === 'concluido' ? 'selected' : ''}>Concluído</option>
                    </select>
                    <button class="btn-excluir" data-id="${chamado.id}"><i class="ph ph-trash"></i></button>
                </div>
            `;
            listaPainel.appendChild(card);
        });

        badgePainel.textContent = `${abertos} Pendente/Aberto`;
        aplicarCoresSelects();

        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', (e) => excluirChamado(e.currentTarget.getAttribute('data-id')));
        });
    }

    // ==========================================
    // 5. RENDERIZAÇÃO: GESTÃO E APROVAÇÃO
    // ==========================================
    function renderGestao() {
        const listaGestao = document.getElementById('lista-gestao');
        listaGestao.innerHTML = '';
        const chamados = getChamados();

        chamados.slice().reverse().forEach(chamado => {
            const tituloFormatado = chamado.tipoServico ? `${chamado.tipoServico.toUpperCase()} - ${chamado.local}` : `Chamado #${chamado.id.substring(0,6)}`;
            const dataFormatada = chamado.dataCriacao || '';

            const responsavelAtual = chamado.responsavelId 
                ? equipe.find(e => e.id === Number(chamado.responsavelId))?.nome 
                : '<span style="color:#D9534F; font-weight:700;">Sem responsável</span>';

            // ---- Lógica do Laudo Técnico ----
            const textoLaudo = chamado.respostaTecnico 
                ? chamado.respostaTecnico 
                : '<span style="color:#A0A0A0; font-style:italic;">Aguardando laudo...</span>';
            
            const textoPecas = chamado.pecasUtilizadas 
                ? `<br><small style="color:#E68B5C; font-weight:700;">Peças: ${chamado.pecasUtilizadas}</small>` 
                : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${tituloFormatado}</strong><br><small>${dataFormatada} • Prioridade: ${chamado.urgencia.toUpperCase()}</small></td>
                <td>
                    <select class="status-select" data-id="${chamado.id}" style="width: 100%; border:none; background:transparent; font-weight: bold;">
                        <option value="pendente" ${chamado.status === 'pendente' ? 'selected' : ''}>⏳ Pendente</option>
                        <option value="aberto" ${chamado.status === 'aberto' ? 'selected' : ''}>🟢 Aprovado</option>
                        <option value="andamento" ${chamado.status === 'andamento' ? 'selected' : ''}>🔵 Andamento</option>
                        <option value="concluido" ${chamado.status === 'concluido' ? 'selected' : ''}>✅ Concluído</option>
                    </select>
                </td>
                <td>${responsavelAtual}</td>
                
                <!-- COLUNA DO LAUDO INSERIDA AQUI -->
                <td class="col-laudo">
                    ${textoLaudo}
                    ${textoPecas}
                </td>

                <td>
                    <select class="select-responsavel" data-id="${chamado.id}">
                        <option value="">Atribuir técnico...</option>
                        ${equipe.map(e => `<option value="${e.id}" ${Number(chamado.responsavelId) === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <button class="btn-excluir" data-id="${chamado.id}" style="padding: 8px;"><i class="ph ph-trash"></i></button>
                </td>
            `;
            listaGestao.appendChild(tr);
        });

        aplicarCoresSelects();

        document.querySelectorAll('.select-responsavel').forEach(select => {
            select.addEventListener('change', (e) => {
                const chamadoId = e.target.getAttribute('data-id');
                const novoRespId = e.target.value ? parseInt(e.target.value) : null;
                
                const chamadosAtualizados = getChamados();
                const index = chamadosAtualizados.findIndex(c => String(c.id) === String(chamadoId));
                
                if(index !== -1) {
                    chamadosAtualizados[index].responsavelId = novoRespId;
                    if (novoRespId && chamadosAtualizados[index].status === 'pendente') {
                        chamadosAtualizados[index].status = 'aberto'; // Auto-aprova ao designar técnico
                    }
                    saveChamados(chamadosAtualizados);
                }
                renderGestao(); 
            });
        });

        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', (e) => excluirChamado(e.currentTarget.getAttribute('data-id')));
        });
    }

    // ==========================================
    // 6. RENDERIZAÇÃO: EQUIPE
    // ==========================================
    function renderEquipe() {
        const listaEquipe = document.getElementById('lista-equipe');
        listaEquipe.innerHTML = '';
        const chamados = getChamados();

        equipe.forEach(membro => {
            const tarefas = chamados.filter(c => Number(c.responsavelId) === membro.id);
            
            let tarefasHtml = tarefas.length > 0 
                ? tarefas.map(t => {
                    const titulo = t.tipoServico ? t.tipoServico.toUpperCase() : `ID: ${t.id.substring(0,4)}`;
                    return `<div class="tarefa-item ${t.status}">${titulo} (${t.status})</div>`;
                }).join('') 
                : '<p style="font-size:12px; color:#A0A0A0;">Nenhuma tarefa atribuída.</p>';

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
                    <h4>Tarefas Atribuídas (${tarefas.length}):</h4>
                    ${tarefasHtml}
                </div>
            `;
            listaEquipe.appendChild(card);
        });
    }

    // ==========================================
    // 7. RENDERIZAÇÃO: RELATÓRIOS (COM FILTROS)
    // ==========================================
    function renderRelatorios() {
        const chamadosBrutos = getChamados();
        const mesFiltro = filtroMes ? filtroMes.value : "";
        const diaFiltro = filtroDia ? filtroDia.value : "";

        const chamados = chamadosBrutos.filter(c => {
            if (!c.dataCriacao) return false;
            
            const partesDataEHora = c.dataCriacao.split(' às ');
            const dataPura = partesDataEHora[0];
            const partesData = dataPura.split('/');
            
            if (partesData.length < 3) return false;

            const diaChamado = partesData[0];
            const mesChamado = partesData[1];

            const matchMes = mesFiltro ? (mesChamado === mesFiltro) : true;
            const matchDia = diaFiltro ? (diaChamado === diaFiltro.padStart(2, '0')) : true;

            return matchMes && matchDia;
        });
        
        const contagemStatus = { pendente: 0, aberto: 0, andamento: 0, concluido: 0 };
        chamados.forEach(c => {
            if(contagemStatus[c.status] !== undefined) contagemStatus[c.status]++;
            else contagemStatus[c.status] = 1;
        });

        const labelsEquipe = equipe.map(e => e.nome);
        const dadosEquipe = equipe.map(e => chamados.filter(c => Number(c.responsavelId) === e.id).length);

        if(chartStatus) chartStatus.destroy();
        if(chartEquipe) chartEquipe.destroy();

        const ctxStatus = document.getElementById('graficoStatus').getContext('2d');
        chartStatus = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Aberto', 'Em Andamento', 'Concluído'],
                datasets: [{
                    data: [contagemStatus.pendente || 0, contagemStatus.aberto || 0, contagemStatus.andamento || 0, contagemStatus.concluido || 0],
                    backgroundColor: ['#F5F5F5', '#FFE0B2', '#BBDEFB', '#C8E6C9'],
                    borderColor: ['#9E9E9E', '#E65100', '#1565C0', '#2E7D32'],
                    borderWidth: 1
                }]
            }
        });

        const ctxEquipe = document.getElementById('graficoEquipe').getContext('2d');
        chartEquipe = new Chart(ctxEquipe, {
            type: 'bar',
            data: {
                labels: labelsEquipe,
                datasets: [{
                    label: 'Quantidade de Chamados',
                    data: dadosEquipe,
                    backgroundColor: '#E68B5C',
                    borderRadius: 5
                }]
            },
            options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }

    // ==========================================
    // 8. LÓGICA DE CORES DO SELECT
    // ==========================================
    function aplicarCoresSelects() {
        const selects = document.querySelectorAll('.status-select');
        selects.forEach(select => {
            atualizarCorUnica(select);
            
            const novoSelect = select.cloneNode(true);
            select.parentNode.replaceChild(novoSelect, select);
            
            novoSelect.addEventListener('change', (e) => {
                atualizarCorUnica(e.target);
                
                const chamadoId = e.target.getAttribute('data-id');
                const chamadosAtualizados = getChamados();
                const index = chamadosAtualizados.findIndex(c => String(c.id) === String(chamadoId));
                
                if(index !== -1) {
                    chamadosAtualizados[index].status = e.target.value;
                    saveChamados(chamadosAtualizados);
                }
                
                if (document.getElementById('sec-painel').classList.contains('active')) renderPainel();
                if (document.getElementById('sec-gestao').classList.contains('active')) renderGestao();
            });
        });
    }

    function atualizarCorUnica(select) {
        const valor = select.value;
        if (valor === 'aberto') {
            select.style.backgroundColor = '#FFF3E0'; select.style.color = '#E65100'; select.style.borderColor = '#FFE0B2';
        } else if (valor === 'andamento') {
            select.style.backgroundColor = '#E3F2FD'; select.style.color = '#1565C0'; select.style.borderColor = '#BBDEFB';
        } else if (valor === 'concluido') {
            select.style.backgroundColor = '#E8F5E9'; select.style.color = '#2E7D32'; select.style.borderColor = '#C8E6C9';
        } else if (valor === 'pendente') {
            select.style.backgroundColor = '#F5F5F5'; select.style.color = '#757575'; select.style.borderColor = '#E0E0E0';
        }
    }

    // Inicializa
    renderPainel();
});