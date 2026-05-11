document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // GESTÃO DE SESSÃO DO PLANEJADOR
    // ==========================================
    const displayNome = document.getElementById("nome-planejador-display");
    
    // Puxa o nome salvo no login (ajuste a chave "nomePlanejador" para a que você usa no seu script de login)
    const nomePlanejador = sessionStorage.getItem("nomePlanejador"); 

    if (displayNome) {
        if (nomePlanejador) {
            displayNome.textContent = nomePlanejador;
        } else {
            displayNome.textContent = "Planejador Logado"; // Nome genérico caso dê erro no login
        }
    }

    // Lógica para o botão de sair (se ainda não tiver)
    const btnSair = document.querySelector(".btn-logout");
    if (btnSair) {
        btnSair.addEventListener("click", (e) => {
            // Opcional: e.preventDefault() se quiser tratar o redirecionamento via JS em vez do href do <a>
            sessionStorage.clear();
        });
    }

    // ... (o resto do seu código de banco de dados, filtros e renderização continua aqui para baixo) ...document.addEventListener('DOMContentLoaded', () => {
    

    
    // ==========================================
    // 1. BANCO DE DADOS E ESTADOS
    // ==========================================
    const getChamados = () => JSON.parse(localStorage.getItem('chamados')) || [];
    const saveChamados = (chamados) => localStorage.setItem('chamados', JSON.stringify(chamados));
    const equipe = JSON.parse(localStorage.getItem('equipe_servmaster')) || [];

    let chartStatus = null;
    let chartEquipe = null;

    // ==========================================
    // 2. NAVEGAÇÃO ENTRE TELAS (SPA)
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.page-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove a classe active de todos
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Adiciona a classe active no clicado
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById(`sec-${targetId}`).classList.add('active');

            // Renderiza a tela correspondente
            if(targetId === 'painel') renderPainel();
            if(targetId === 'gestao') renderGestao();
            if(targetId === 'equipe') renderEquipe();
            if(targetId === 'relatorios') renderRelatorios();
        });
    });

    // ==========================================
    // 3. EXCLUSÃO DE CHAMADOS GLOBAL
    // ==========================================
    window.excluirChamado = function(id) {
        if (confirm('Tem certeza que deseja excluir esta requisição permanentemente?')) {
            const chamados = getChamados();
            const novaLista = chamados.filter(c => String(c.id) !== String(id));
            saveChamados(novaLista);
            
            // Atualiza a tela que estiver aberta no momento
            const activeSection = document.querySelector('.page-section.active')?.id;
            if (activeSection === 'sec-painel') renderPainel();
            if (activeSection === 'sec-gestao') renderGestao();
            if (activeSection === 'sec-equipe') renderEquipe();
            if (activeSection === 'sec-relatorios') renderRelatorios();
        }
    };

    // ==========================================
    // 4. FILTROS DE DATA
    // ==========================================
    const filtroMes = document.getElementById('filtro-mes');
    const filtroDia = document.getElementById('filtro-dia');
    
    if(filtroMes) filtroMes.addEventListener('change', renderRelatorios);
    if(filtroDia) filtroDia.addEventListener('input', renderRelatorios);

    // ==========================================
    // 5. RENDERIZAÇÃO: PAINEL PRINCIPAL
    // ==========================================
    function renderPainel() {
        const listaPainel = document.getElementById('lista-painel');
        const badgePainel = document.getElementById('badge-painel');
        if (!listaPainel) return;
        
        listaPainel.innerHTML = '';
        const chamados = getChamados();
        let abertos = 0;

        if (chamados.length === 0) {
            listaPainel.innerHTML = '<p style="color: #A0A0A0; font-weight: 500; text-align: center; padding: 20px;">Nenhum chamado registrado no momento.</p>';
        }

        chamados.slice().reverse().forEach(chamado => {
            if(chamado.status === 'aberto' || chamado.status === 'pendente') abertos++;

            const tituloFormatado = chamado.tipoServico ? `${chamado.tipoServico.toUpperCase()} - ${chamado.local}` : `Chamado #${chamado.id.substring(0,6)}`;
            const responsavelNome = chamado.responsavelId 
                ? equipe.find(e => e.id === Number(chamado.responsavelId))?.nome || 'Não atribuído'
                : 'Não atribuído';

            const card = document.createElement('div');
            card.className = 'chamado-card';
            card.innerHTML = `
                <div class="chamado-info">
                    <h3>${tituloFormatado}</h3>
                    <p>Solicitante: ${chamado.requisitante || 'Não informado'} • Data: ${chamado.dataCriacao || ''} • Resp: ${responsavelNome}</p>
                </div>
                <div class="chamado-actions">
                    <select class="status-select" data-id="${chamado.id}">
                        <option value="pendente" ${chamado.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="aberto" ${chamado.status === 'aberto' ? 'selected' : ''}>Aprovado</option>
                        <option value="andamento" ${chamado.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
                        <option value="concluido" ${chamado.status === 'concluido' ? 'selected' : ''}>Concluído</option>
                    </select>
                    <button onclick="excluirChamado('${chamado.id}')" class="btn-excluir"><i class="ph ph-trash"></i></button>
                </div>
            `;
            listaPainel.appendChild(card);
        });

        if(badgePainel) badgePainel.textContent = `${abertos} Chamados Abertos/Pendentes`;
        aplicarCoresSelects();
    }

    // ==========================================
    // 6. RENDERIZAÇÃO: GESTÃO E APROVAÇÃO
    // ==========================================
    function renderGestao() {
        const listaGestao = document.getElementById('lista-gestao');
        if (!listaGestao) return;
        listaGestao.innerHTML = '';
        
        const chamados = getChamados();
        // Filtra para mostrar apenas técnicos na lista de seleção
        const apenasTecnicos = equipe.filter(m => m.cargo.toLowerCase() !== 'planejador');

        chamados.slice().reverse().forEach(chamado => {
            const tituloFormatado = chamado.tipoServico ? `${chamado.tipoServico.toUpperCase()}` : `Chamado #${chamado.id.substring(0,6)}`;
            const responsavelAtual = chamado.responsavelId 
                ? equipe.find(e => e.id === Number(chamado.responsavelId))?.nome 
                : '<span style="color:#D9534F; font-weight:700;">Sem responsável</span>';
            
            const laudo = chamado.respostaTecnico || '<span style="color:#A0A0A0; font-style:italic;">Aguardando...</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${tituloFormatado}</strong><br><small>${chamado.dataCriacao || ''}</small></td>
                <td>
                    <select class="status-select" data-id="${chamado.id}" style="width: 100%; border:none; background:transparent; font-weight: bold;">
                        <option value="pendente" ${chamado.status === 'pendente' ? 'selected' : ''}>⏳ Pendente</option>
                        <option value="aberto" ${chamado.status === 'aberto' ? 'selected' : ''}>🟢 Aprovado</option>
                        <option value="andamento" ${chamado.status === 'andamento' ? 'selected' : ''}>🔵 Andamento</option>
                        <option value="concluido" ${chamado.status === 'concluido' ? 'selected' : ''}>✅ Concluído</option>
                    </select>
                </td>
                <td>${responsavelAtual}</td>
                <td class="col-laudo">${laudo}</td>
                <td>
                    <select class="select-responsavel" data-id="${chamado.id}">
                        <option value="">Atribuir técnico...</option>
                        ${apenasTecnicos.map(e => `<option value="${e.id}" ${Number(chamado.responsavelId) === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <button onclick="excluirChamado('${chamado.id}')" class="btn-excluir" style="padding: 8px;"><i class="ph ph-trash"></i></button>
                </td>
            `;
            listaGestao.appendChild(tr);
        });

        aplicarCoresSelects();

        // Atribuição de responsável
        document.querySelectorAll('.select-responsavel').forEach(select => {
            select.addEventListener('change', (e) => {
                const chamadoId = e.target.getAttribute('data-id');
                const novoRespId = e.target.value ? parseInt(e.target.value) : null;
                const chamadosAtualizados = getChamados();
                const index = chamadosAtualizados.findIndex(c => String(c.id) === String(chamadoId));
                
                if(index !== -1) {
                    chamadosAtualizados[index].responsavelId = novoRespId;
                    if (novoRespId && chamadosAtualizados[index].status === 'pendente') {
                        chamadosAtualizados[index].status = 'aberto'; // Aprova automático
                    }
                    saveChamados(chamadosAtualizados);
                }
                renderGestao(); 
            });
        });
    }

    // ==========================================
    // 7. RENDERIZAÇÃO: EQUIPE
    // ==========================================
    function renderEquipe() {
        const listaEquipe = document.getElementById('lista-equipe');
        if (!listaEquipe) return;
        listaEquipe.innerHTML = '';
        const chamados = getChamados();

        // Mostra apenas quem não é planejador
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
                    <h4>Tarefas Atribuídas (${tarefas.length}):</h4>
                    ${tarefas.length > 0 ? tarefas.map(t => `<div class="tarefa-item ${t.status}">${t.tipoServico?.toUpperCase() || 'CHAMADO'} (${t.status})</div>`).join('') : '<p style="font-size:12px; color:#A0A0A0;">Nenhuma tarefa atribuída.</p>'}
                </div>
            `;
            listaEquipe.appendChild(card);
        });
    }

    // ==========================================
    // 8. RENDERIZAÇÃO: RELATÓRIOS (COM GRÁFICO PERSONALIZADO)
    // ==========================================
    function renderRelatorios() {
        const chamadosBrutos = getChamados();
        const mesFiltro = filtroMes ? filtroMes.value : "";
        const diaFiltro = filtroDia ? filtroDia.value : "";

        // Aplicação dos filtros de data
        const filtrados = chamadosBrutos.filter(c => {
            if (!c.dataCriacao) return false;
            const dataPura = c.dataCriacao.split(' às ')[0];
            const partesData = dataPura.split('/');
            if (partesData.length < 3) return false;

            const matchMes = mesFiltro ? (partesData[1] === mesFiltro) : true;
            const matchDia = diaFiltro ? (partesData[0] === diaFiltro.padStart(2, '0')) : true;

            return matchMes && matchDia;
        });
        
        // Dados do gráfico de Status
        const contagemStatus = { pendente: 0, aberto: 0, andamento: 0, concluido: 0 };
        filtrados.forEach(c => {
            if(contagemStatus[c.status] !== undefined) contagemStatus[c.status]++;
        });

        // Dados do Gráfico da Equipe (Excluindo Planejador)
        const equipeTecnica = equipe.filter(m => m.cargo.toLowerCase() !== 'planejador');
        const labelsEquipe = equipeTecnica.map(e => e.nome);
        const dadosEquipe = equipeTecnica.map(e => filtrados.filter(c => Number(c.responsavelId) === e.id).length);

        if(chartStatus) chartStatus.destroy();
        if(chartEquipe) chartEquipe.destroy();

        // 1. Gráfico de Rosca (Status)
        const ctxStatus = document.getElementById('graficoStatus')?.getContext('2d');
        if (ctxStatus) {
            chartStatus = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Pendente', 'Aberto', 'Em Andamento', 'Concluído'],
                    datasets: [{
                        data: [contagemStatus.pendente, contagemStatus.aberto, contagemStatus.andamento, contagemStatus.concluido],
                        backgroundColor: ['#F5F5F5', '#FFE0B2', '#BBDEFB', '#C8E6C9'],
                        borderColor: ['#9E9E9E', '#E65100', '#1565C0', '#2E7D32'],
                        borderWidth: 1
                    }]
                }
            });
        }

        // 2. Gráfico de Barras Personalizado (Equipe)
        const ctxEquipe = document.getElementById('graficoEquipe')?.getContext('2d');
        if (ctxEquipe) {
            chartEquipe = new Chart(ctxEquipe, {
                type: 'bar',
                data: {
                    labels: labelsEquipe,
                    datasets: [{
                        label: 'Chamados por Técnico',
                        data: dadosEquipe,
                        backgroundColor: '#E68B5C',
                        // Borda arredondada superior
                        borderRadius: {
                            topLeft: 5,
                            topRight: 5,
                            bottomLeft: 0,
                            bottomRight: 0
                        }
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        // TÍTULO REMOVIDO PARA EVITAR DUPLICIDADE COM O HTML
                        title: {
                            display: false,
                            text: 'Carga de Trabalho por Técnico'
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { color: '#616161' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { 
                                stepSize: 1, // Pula de 1 em 1 (números inteiros para chamados)
                                color: '#616161',
                                font: { family: 'sans-serif' }
                            },
                            grid: {
                                color: '#e0e0e0',
                                drawBorder: false
                            }
                        },
                        x: {
                            ticks: { 
                                color: '#616161',
                                font: { family: 'sans-serif' }
                            },
                            grid: {
                                display: false // Esconde as linhas verticais
                            }
                        }
                    }
                }
            });
        }
    }

    // ==========================================
    // 9. LÓGICA DE CORES DO SELECT
    // ==========================================
    function aplicarCoresSelects() {
        const selects = document.querySelectorAll('.status-select');
        selects.forEach(select => {
            atualizarCorUnica(select);
            
            // Remove listeners duplicados clonando o elemento
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
                
                // Recarrega relatórios por trás, caso a tela esteja ativa
                if (document.getElementById('sec-painel').classList.contains('active')) renderPainel();
                if (document.getElementById('sec-gestao').classList.contains('active')) renderGestao();
                if (document.getElementById('sec-relatorios').classList.contains('active')) renderRelatorios();
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

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================
    renderPainel();
    renderRelatorios(); // Inicializa os gráficos no fundo para quando clicar na aba já estarem prontos
});