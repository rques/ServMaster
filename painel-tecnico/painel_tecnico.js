document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. BANCO DE DADOS (LOCALSTORAGE)
    // ==========================================
    const getChamados = () => JSON.parse(localStorage.getItem('chamados')) || [];
    const saveChamados = (chamados) => localStorage.setItem('chamados', JSON.stringify(chamados));
    const getEquipe = () => JSON.parse(localStorage.getItem('equipe_servmaster')) || [];

    // ==========================================
    // 2. GESTÃO DE SESSÃO
    // ==========================================
    const displayElement = document.getElementById("user-display");
    const matriculaTecnico = sessionStorage.getItem("matriculaTecnico");
    const equipeAtual = getEquipe();
    
    if (!matriculaTecnico) {
        window.location.href = "../index.html";
    } else {
        const tecnicoLogado = equipeAtual.find(e => String(e.matricula) === String(matriculaTecnico));
        
        if (displayElement) {
            if (tecnicoLogado && tecnicoLogado.nome) {
                displayElement.textContent = tecnicoLogado.nome;
            } else {
                displayElement.textContent = "Técnico: " + matriculaTecnico;
            }
        }
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
        } else if (view === 'novo') {
            viewLista.style.display = 'none';
            viewNovo.style.display = 'block';
            if(navLista) navLista.classList.remove('active');
            if(navNovo) navNovo.classList.add('active');
        }
    }

    if(navLista) navLista.addEventListener('click', (e) => { e.preventDefault(); alternarView('lista'); });
    if(navNovo) navNovo.addEventListener('click', (e) => { e.preventDefault(); alternarView('novo'); });
    
    const btnCancelarNovo = document.getElementById('btn-cancelar-novo');
    if (btnCancelarNovo) btnCancelarNovo.addEventListener('click', () => { alternarView('lista'); });

    // ==========================================
    // 4. RENDERIZAÇÃO DA LISTA DE CHAMADOS
    // ==========================================
    const containerLista = document.querySelector('.chamados-list');
    const badgeTotal = document.getElementById('badge-total-element');

    function renderizarLista() {
        if (!containerLista) return;

        let chamados = getChamados();
        const equipe = getEquipe();
        containerLista.innerHTML = '';

        const tecnicoLogado = equipe.find(e => String(e.matricula) === String(matriculaTecnico));
        const idDoTecnico = tecnicoLogado ? tecnicoLogado.id : matriculaTecnico;

        chamados = chamados.filter(c => String(c.responsavelId) === String(idDoTecnico) && c.status !== 'pendente');

        const chamadosAbertos = chamados.filter(c => c.status !== 'concluido').length;
        if (badgeTotal) badgeTotal.textContent = `PENDENTES: ${chamadosAbertos}`;

        if (chamados.length === 0) {
            containerLista.innerHTML = '<p style="color: #A0A0A0; font-weight: 500; text-align: center; margin-top: 20px;">Nenhuma tarefa atribuída a você no momento.</p>';
            return;
        }

        chamados.slice().reverse().forEach(chamado => {
            const card = document.createElement('div');
            card.className = 'chamado-card';
            
            // CSS INLINE ESTRITO: Força o display: block para não herdar colunas do seu arquivo CSS
            card.style.display = 'block';
            card.style.width = '100%';
            card.style.boxSizing = 'border-box';
            card.style.backgroundColor = '#ffffff';
            card.style.padding = '25px';
            card.style.marginBottom = '25px';
            card.style.borderRadius = '8px';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            card.style.border = '1px solid #E2E8F0';

            const isConcluido = chamado.status === 'concluido';
            const tipoSeguro = chamado.tipoServico ? chamado.tipoServico.toUpperCase() : `CHAMADO #${chamado.id}`;
            const localSeguro = chamado.local ? `- ${chamado.local}` : '';
            const reqSeguro = chamado.requisitante || 'Não informado';
            const centroCustoSeguro = chamado.centroCusto || 'Não informado';
            const descSegura = chamado.descricao || 'Sem descrição.';
            const dataSegura = chamado.dataCriacao || '';
            const urgSeguro = chamado.urgencia ? chamado.urgencia.toUpperCase() : 'NORMAL';

            card.innerHTML = `
                <!-- Cabeçalho -->
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">
                    <h3 style="font-size: 18px; font-weight: 800; color: #111; margin: 0; text-transform: uppercase;">${tipoSeguro} ${localSeguro}</h3>
                    <span style="font-size: 13px; color: #555;">${dataSegura}</span>
                </div>
                
                <!-- Informações Básicas (Requisitante, Setor, Urgência) -->
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

                <!-- Bloco do Relatório Técnico -->
                <div style="background-color: #F8F9FA; border: 1px solid #E5E7EB; border-radius: 6px; padding: 20px; box-sizing: border-box; width: 100%;">
                    <h4 style="font-size: 14px; color: #B45309; margin-top: 0; margin-bottom: 15px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-wrench"></i> RELATÓRIO TÉCNICO
                    </h4>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="font-size: 12px; font-weight: 800; color: #111; display: block; margin-bottom: 6px;">STATUS DO CHAMADO:</label>
                        <select class="form-select input-status" data-id="${chamado.id}" ${isConcluido ? 'disabled' : ''} style="width: 100%; padding: 10px; border: 1px solid #CCC; border-radius: 4px; font-size: 14px; background-color: #FFF; outline: none; appearance: auto; box-sizing: border-box;">
                            <option value="aberto" ${chamado.status === 'aberto' ? 'selected' : ''}>Aberto</option>
                            <option value="andamento" ${chamado.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
                            ${isConcluido ? `<option value="concluido" selected>Concluído</option>` : ''}
                        </select>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="font-size: 12px; font-weight: 800; color: #111; display: block; margin-bottom: 6px;">LISTA DE PEÇAS E MATERIAIS UTILIZADOS:</label>
                        <input type="text" class="form-input input-pecas" data-id="${chamado.id}" value="${chamado.pecasUtilizadas || ''}" ${isConcluido ? 'disabled' : ''} style="width: 100%; padding: 10px; border: 1px solid #CCC; border-radius: 4px; font-size: 14px; box-sizing: border-box; outline: none;">
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="font-size: 12px; font-weight: 800; color: #111; display: block; margin-bottom: 6px;">LAUDO DE MANUTENÇÃO DETALHADO / OBSERVAÇÕES:</label>
                        <textarea class="form-textarea input-obs" data-id="${chamado.id}" rows="3" ${isConcluido ? 'disabled' : ''} style="width: 100%; padding: 10px; border: 1px solid #CCC; border-radius: 4px; font-size: 14px; box-sizing: border-box; resize: vertical; font-family: inherit; outline: none;">${chamado.respostaTecnico || ''}</textarea>
                    </div>

                    <!-- Botões -->
                    <div style="display: flex; justify-content: center; gap: 15px; align-items: center; margin-top: 10px;">
                        ${isConcluido
                            ? '<span style="color: #15803D; font-weight: 800; font-size: 14px; background: #DCFCE7; padding: 10px 20px; border-radius: 6px; border: 1px solid #BBF7D0;"><i class="fa-solid fa-lock"></i> CHAMADO FINALIZADO E BLOQUEADO</span>'
                            : `
                                <button class="btn-salvar-progresso" data-id="${chamado.id}" style="padding: 10px 20px; font-size: 14px; font-weight: 700; cursor: pointer; border-radius: 4px; background: #FFF; border: 1px solid #333; color: #111;">Salvar Progresso</button>
                                <button class="btn-finalizar-chamado" data-id="${chamado.id}" style="padding: 10px 20px; font-size: 14px; font-weight: 700; background-color: #2E7D32; color: white; border: none; border-radius: 4px; cursor: pointer;">Finalizar Chamado</button>
                            `
                        }
                    </div>
                </div>
            `;
            containerLista.appendChild(card);
        });

        aplicarCoresDosSelects();
    }

    renderizarLista();

    // ==========================================
    // 5. LÓGICA DE ATUALIZAÇÃO PELO TÉCNICO
    // ==========================================
    function aplicarCoresDosSelects() {
        document.querySelectorAll('.input-status').forEach(select => {
            atualizarCorSelect(select);
            select.addEventListener('change', (e) => atualizarCorSelect(e.target));
        });
    }

    function atualizarCorSelect(select) {
        const valor = select.value;
        if (valor === "concluido") {
            select.style.backgroundColor = "#DCFCE7"; select.style.color = "#15803D"; select.style.borderColor = "#15803D";
        } else if (valor === "andamento") {
            select.style.backgroundColor = "#EFF6FF"; select.style.color = "#1D4ED8"; select.style.borderColor = "#1D4ED8";
        } else {
            select.style.backgroundColor = "#FFFFFF"; select.style.color = "#111"; select.style.borderColor = "#CCC";
        }
    }

    if (containerLista) {
        const salvarDadosDoCard = (id, forcarStatusConcluido = false) => {
            const chamados = getChamados();
            const index = chamados.findIndex(c => String(c.id) === String(id));
            
            if (index !== -1) {
                if (chamados[index].status === 'concluido') return;

                const selectStatus = document.querySelector(`.input-status[data-id="${id}"]`);
                const inputPecas = document.querySelector(`.input-pecas[data-id="${id}"]`);
                const inputObs = document.querySelector(`.input-obs[data-id="${id}"]`);

                if (forcarStatusConcluido) {
                    chamados[index].status = 'concluido';
                    chamados[index].dataConclusao = new Date().toLocaleString();
                } else {
                    if (selectStatus && selectStatus.value === 'concluido') {
                        alert("Erro de Segurança: Você só pode concluir o chamado através do botão 'Finalizar Chamado' confirmando a matrícula.");
                        return; 
                    }
                    if (selectStatus) chamados[index].status = selectStatus.value;
                }

                if (inputPecas) chamados[index].pecasUtilizadas = inputPecas.value;
                if (inputObs) chamados[index].respostaTecnico = inputObs.value;

                saveChamados(chamados);
            }
        };

        containerLista.addEventListener('click', (e) => {
            const target = e.target;
            const id = target.getAttribute('data-id');
            if (!id) return;

            if (target.classList.contains('btn-salvar-progresso')) {
                salvarDadosDoCard(id, false);
                alert("Progresso salvo com sucesso!");
                renderizarLista();
            }

            if (target.classList.contains('btn-finalizar-chamado')) {
                const confirmar1 = confirm("Tem certeza que deseja finalizar? Não será possível editar este chamado após a conclusão.");
                
                if (confirmar1) {
                    const confirmacaoMatricula = prompt("Confirme sua matrícula para finalizar:");
                    const matriculaLogada = sessionStorage.getItem("matriculaTecnico");

                    if (confirmacaoMatricula === matriculaLogada) {
                        salvarDadosDoCard(id, true); 
                        alert("Chamado concluído e bloqueado!");
                        renderizarLista();
                    } else if (confirmacaoMatricula !== null) {
                        alert("Matrícula incorreta. Ação cancelada.");
                    }
                }
            }
        });
    }

    // ==========================================
    // 6. ENVIO DO FORMULÁRIO (CRIAR NOVO)
    // ==========================================
    const formNovoChamado = document.getElementById("form-novo-chamado");
    if (formNovoChamado) {
        formNovoChamado.addEventListener("submit", (e) => {
            e.preventDefault();
            const btnEnviarChamado = document.getElementById("btn-enviar-chamado");
            btnEnviarChamado.textContent = "Processando...";
            btnEnviarChamado.disabled = true;

            const dataAtual = new Date();
            const dataFormatadaString = dataAtual.toLocaleString('pt-BR');

            const novoChamado = {
                id: Date.now().toString(),
                matricula: matriculaTecnico,
                matriculaCriador: matriculaTecnico,
                requisitante: document.getElementById('requisitante')?.value || 'Não informado',
                centroCusto: document.getElementById('centro-custo')?.value || 'Não informado',
                tipoServico: document.getElementById('tipo-servico')?.value || 'Manutenção Geral',
                urgencia: document.getElementById('urgencia')?.value || 'normal',
                local: document.getElementById('local')?.value || 'Não informado',
                descricao: document.getElementById('descricao')?.value || '',
                status: 'pendente',
                responsavelId: null,
                respostaTecnico: '',
                pecasUtilizadas: '',
                dataCriacao: dataFormatadaString
            };

            const chamados = getChamados();
            chamados.push(novoChamado);
            saveChamados(chamados);

            setTimeout(() => {
                formNovoChamado.reset();
                btnEnviarChamado.textContent = "Abrir Requisição";
                btnEnviarChamado.disabled = false;
                alert("Requisição enviada! Aguardando aprovação do Planejador.");
                alternarView('lista');
            }, 500);
        });
    }
});