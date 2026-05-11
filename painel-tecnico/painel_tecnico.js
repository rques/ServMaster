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
    const equipeAtual = getEquipe(); // Puxa a lista de funcionários cadastrados
    
    if (!matriculaTecnico) {
        // Se não tiver logado, manda de volta pro index
        window.location.href = "../index.html"; 
    } else {
        // Procura o técnico logado dentro da equipe usando a matrícula
        const tecnicoLogado = equipeAtual.find(e => String(e.matricula) === String(matriculaTecnico));
        
        if (displayElement) {
            if (tecnicoLogado && tecnicoLogado.nome) {
                // Se achou o técnico, exibe o nome dele
                displayElement.textContent = tecnicoLogado.nome;
            } else {
                // Se por acaso não achar, exibe a matrícula como plano B
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

        // Filtra para o Técnico: Pega o ID dele na equipe e exibe apenas o que não está pendente
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
            card.style.flexDirection = 'column'; 
            card.style.alignItems = 'stretch';
            
            const tipoSeguro = chamado.tipoServico ? chamado.tipoServico.toUpperCase() : `CHAMADO #${chamado.id}`;
            const localSeguro = chamado.local || 'Não informado';
            const reqSeguro = chamado.requisitante || 'Não informado';
            const urgSeguro = chamado.urgencia ? chamado.urgencia.toUpperCase() : 'NORMAL';
            const centroCustoSeguro = chamado.centroCusto || 'Não informado';
            const descSegura = chamado.descricao || 'Sem descrição.';
            const dataSegura = chamado.dataCriacao || '';
            const tituloFormatado = `${tipoSeguro} - ${localSeguro}`;
        
            card.innerHTML = `
                <div style="width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="font-size: 16px; font-weight: 700; color: #2C3E50; margin: 0;">${tituloFormatado}</h3>
                        <span style="font-size: 11px; color: #A0A0A0; font-weight: 600;">${dataSegura}</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; background-color: #FAFAFA; border: 1px solid #F0F0F0; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                        <div>
                            <span style="display: block; font-size: 9px; font-weight: 800; color: #A0A0A0; letter-spacing: 1px; margin-bottom: 4px;">REQUISITANTE:</span>
                            <span style="font-size: 12px; font-weight: 600; color: #333;">${reqSeguro}</span>
                        </div>
                        <div>
                            <span style="display: block; font-size: 9px; font-weight: 800; color: #A0A0A0; letter-spacing: 1px; margin-bottom: 4px;">Setor:</span>
                            <span style="font-size: 12px; font-weight: 600; color: #333;">${centroCustoSeguro}</span>
                        </div>
                        <div>
                            <span style="display: block; font-size: 9px; font-weight: 800; color: #A0A0A0; letter-spacing: 1px; margin-bottom: 4px;">URGÊNCIA:</span>
                            <span style="font-size: 12px; font-weight: 800; color: ${chamado.urgencia === 'alta' ? '#D9534F' : (chamado.urgencia === 'media' ? '#E68B5C' : '#A0A0A0')};">${urgSeguro}</span>
                        </div>
                    </div>

                    <div>
                        <span style="display: block; font-size: 9px; font-weight: 800; color: #A0A0A0; letter-spacing: 1px; margin-bottom: 6px;">DESCRIÇÃO DO PROBLEMA:</span>
                        <p style="font-size: 13px; color: #555; line-height: 1.5; margin: 0;">${descSegura}</p>
                    </div>
                </div>

                <div style="margin-top: 20px; border-top: 2px dashed #F0F0F0; padding-top: 20px;">
                    <h4 style="font-size: 12px; color: #E68B5C; margin-bottom: 15px; font-weight: 800; letter-spacing: 1px;"><i class="fa-solid fa-wrench"></i> RELATÓRIO TÉCNICO</h4>
                    
                    <div class="form-row" style="margin-bottom: 15px;">
                        <div class="half-width">
                            <label class="form-label">STATUS ATUAL:</label>
                            <select class="form-select input-status" data-id="${chamado.id}" style="padding: 10px;">
                                <option value="aberto" ${chamado.status === 'aberto' ? 'selected' : ''}>Aberto</option>
                                <option value="andamento" ${chamado.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
                                <option value="concluido" ${chamado.status === 'concluido' ? 'selected' : ''}>Concluído</option>
                            </select>
                        </div>
                        <div class="half-width">
                            <label class="form-label">PEÇAS UTILIZADAS:</label>
                            <input type="text" class="form-input input-pecas" data-id="${chamado.id}" value="${chamado.pecasUtilizadas || ''}" placeholder="Ex: Filtro, Correia..." style="padding: 10px;">
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label class="form-label">OBSERVAÇÕES / LAUDO TÉCNICO:</label>
                        <textarea class="form-textarea input-obs" data-id="${chamado.id}" rows="2" placeholder="Descreva o diagnóstico e os reparos realizados...">${chamado.respostaTecnico || ''}</textarea>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button class="btn-cancel btn-salvar-progresso" data-id="${chamado.id}" style="padding: 8px 16px; font-size: 12px;">Salvar Progresso</button>
                        <button class="btn-submit btn-finalizar-chamado" data-id="${chamado.id}" style="padding: 8px 16px; font-size: 12px; background-color: #2E7D32;">Finalizar Chamado</button>
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
            select.style.backgroundColor = "#E8F5E9"; select.style.color = "#2E7D32"; select.style.borderColor = "#2E7D32";
        } else if (valor === "andamento") {
            select.style.backgroundColor = "#E3F2FD"; select.style.color = "#1565C0"; select.style.borderColor = "#1565C0";
        } else { 
            select.style.backgroundColor = "#FFFFFF"; select.style.color = "#333333"; select.style.borderColor = "#E0E0E0";
        }
    }

    if (containerLista) {
        const salvarDadosDoCard = (id, forcarStatusConcluido = false) => {
            const chamados = getChamados();
            const index = chamados.findIndex(c => String(c.id) === String(id));
            
            if (index !== -1) {
                const selectStatus = document.querySelector(`.input-status[data-id="${id}"]`);
                const inputPecas = document.querySelector(`.input-pecas[data-id="${id}"]`);
                const inputObs = document.querySelector(`.input-obs[data-id="${id}"]`);

                if (forcarStatusConcluido) {
                    chamados[index].status = 'concluido';
                } else if (selectStatus) {
                    chamados[index].status = selectStatus.value;
                }

                if (inputPecas) chamados[index].pecasUtilizadas = inputPecas.value;
                if (inputObs) chamados[index].respostaTecnico = inputObs.value;

                saveChamados(chamados);
            }
        };

        containerLista.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            if (!id) return;

            if (e.target.classList.contains('btn-salvar-progresso')) {
                salvarDadosDoCard(id, false);
                alert("Progresso salvo com sucesso!");
                renderizarLista();
            }

            if (e.target.classList.contains('btn-finalizar-chamado')) {
                if(confirm("Tem certeza que deseja finalizar este chamado?")) {
                    salvarDadosDoCard(id, true);
                    renderizarLista();
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
                matriculaCriador: "TECNICO-" + matriculaTecnico,
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