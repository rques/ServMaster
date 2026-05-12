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
    // EXCLUSÃO COM TRAVA DE SEGURANÇA
    // ==========================================
    window.excluirChamado = function(id) {
        const confirmar1 = confirm('Tem certeza que deseja excluir esta requisição permanentemente? Esta ação não pode ser desfeita.');
        
        if (confirmar1) {
            const confirmacaoMatricula = prompt("Confirme sua matrícula de Planejador para autorizar a exclusão:");
            const matriculaLogada = sessionStorage.getItem("matriculaPlanejador") || sessionStorage.getItem("matricula");

            if (confirmacaoMatricula === matriculaLogada) {
                const chamados = getChamados();
                saveChamados(chamados.filter(c => String(c.id) !== String(id)));
                
                alert("Requisição excluída com segurança!");

                const activeSection = document.querySelector('.page-section.active')?.id;
                if (activeSection === 'sec-gestao') renderGestao();
                if (activeSection === 'sec-equipe') renderEquipe();
                if (activeSection === 'sec-relatorios') renderRelatorios();
                if (activeSection === 'sec-historico') renderHistorico();
            } else if (confirmacaoMatricula !== null) {
                alert("Matrícula incorreta. Ação de exclusão cancelada.");
            }
        }
    };

    // ==========================================
    // EXPORTAÇÃO E LIMPEZA DE DADOS (ARQUIVAMENTO)
    // ==========================================
    window.exportarELimparMes = function() {
        const mes = document.getElementById('export-mes').value;
        const ano = document.getElementById('export-ano').value;
        
        if(!mes || !ano) {
            alert("Selecione o mês e digite o ano."); return;
        }

        const confirmar = confirm(`Atenção: Isso vai exportar todos os chamados CONCLUÍDOS do mês ${mes}/${ano} para o Excel e APAGÁ-LOS permanentemente do sistema para liberar espaço. Deseja continuar?`);
        
        if (!confirmar) return;

        let chamados = getChamados();
        
        // A data foi salva no formato "DD/MM/YYYY às HH:MM". Vamos buscar pelo trecho "/MM/YYYY"
        const tagData = `/${mes}/${ano}`;
        
        // Pega só os que estão concluídos E que a data de criação contenha o mês/ano escolhido
        const paraExportar = chamados.filter(c => 
            c.status === 'concluido' && 
            c.dataCriacao && c.dataCriacao.includes(tagData)
        );

        if (paraExportar.length === 0) {
            alert(`Nenhum chamado CONCLUÍDO encontrado para ${mes}/${ano}.`);
            return;
        }

        // 1. Montar o arquivo CSV para o Excel Brasileiro (\uFEFF força o UTF-8 para acentos)
        let csvContent = "\uFEFF"; 
        csvContent += "ID do Chamado;Data de Abertura;Data de Conclusão;Requisitante;Matrícula;Setor;Tipo de Serviço;Urgência;Peças Utilizadas;Laudo Técnico\n";

        paraExportar.forEach(c => {
            const limparTexto = (str) => {
                if (!str) return '""';
                return `"${String(str).replace(/"/g, '""').replace(/\n/g, ' ')}"`;
            };

            const linha = [
                limparTexto(c.id),
                limparTexto(c.dataCriacao),
                limparTexto(c.dataConclusao || 'N/A'),
                limparTexto(c.requisitante),
                limparTexto(c.matriculaCriador),
                limparTexto(c.centroCusto),
                limparTexto(c.tipoServico),
                limparTexto(c.urgencia),
                limparTexto(c.pecasUtilizadas),
                limparTexto(c.respostaTecnico)
            ].join(";");
            
            csvContent += linha + "\n";
        });

        // 2. Fazer o Download do Arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Backup_ServMaster_${mes}_${ano}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 3. Limpar o Sistema (Salva de volta só os que NÃO foram exportados)
        const chamadosRestantes = chamados.filter(c => !paraExportar.includes(c));
        saveChamados(chamadosRestantes);

        alert(`Sucesso! ${paraExportar.length} chamados foram exportados e removidos do banco de dados.`);
        renderRelatorios();
    };

    // ==========================================
    // RENDER: GESTÃO (FILTRADA - SÓ ATIVOS)
    // ==========================================
    function renderGestao() {
        const listaGestao = document.getElementById('lista-gestao');
        if (!listaGestao) return;
        
        listaGestao.innerHTML = '';
        
        const possibleTable = listaGestao.closest('table');
        if (possibleTable) {
            const thead = possibleTable.querySelector('thead');
            if (thead) thead.style.display = 'none';
            possibleTable.style.border = 'none';
            possibleTable.style.background = 'transparent';
        }

        const isTable = listaGestao.tagName === 'TBODY';
        let chamados = getChamados();
        
        // FILTRO: Esconde os concluídos da tela principal de gestão
        chamados = chamados.filter(c => c.status !== 'concluido');
        
        const apenasTecnicos = equipe.filter(m => m.cargo.toLowerCase() !== 'planejador');

        if (chamados.length === 0) {
            listaGestao.innerHTML = `<p style="color: #64748B; font-size: 15px; font-weight: 600; text-align: center; margin-top: 30px; width: 100%;">Nenhuma requisição pendente no momento.</p>`;
            return;
        }

        chamados.slice().reverse().forEach(chamado => {
            const card = document.createElement('div');
            card.style.display = 'block';
            card.style.width = '100%';
            card.style.boxSizing = 'border-box';
            card.style.backgroundColor = '#ffffff';
            card.style.padding = '25px';
            card.style.marginBottom = '25px';
            card.style.borderRadius = '8px';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            card.style.border = '1px solid #E2E8F0';

            const titulo = chamado.tipoServico ? chamado.tipoServico.toUpperCase() : `CHAMADO #${chamado.id.substring(0,6)}`;
            const localSeguro = chamado.local ? `- ${chamado.local}` : '';
            const matriculaCriador = chamado.matriculaCriador || 'N/A';
            const reqSeguro = chamado.requisitante || 'Não informado';
            const centroCustoSeguro = chamado.centroCusto || 'Não informado';
            const urgSeguro = chamado.urgencia ? chamado.urgencia.toUpperCase() : 'NORMAL';
            const dataSegura = chamado.dataCriacao || '';
            const descSegura = chamado.descricao || 'Sem descrição.';
            
            const laudo = chamado.respostaTecnico || 'Aguardando avaliação técnica...';
            const pecas = chamado.pecasUtilizadas ? `<strong>Peças Solicitadas/Utilizadas:</strong> ${chamado.pecasUtilizadas}` : '';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">
                    <h3 style="font-size: 18px; font-weight: 800; color: #111; margin: 0; text-transform: uppercase;">${titulo} ${localSeguro}</h3>
                    <span style="font-size: 13px; color: #555;">${dataSegura}</span>
                </div>
                
                <div style="display: flex; flex-wrap: wrap; gap: 30px; margin-bottom: 15px; font-size: 13px;">
                    <div><strong style="color: #333;">REQUISITANTE:</strong> <span style="color: #555;">${reqSeguro}</span></div>
                    <div><strong style="color: #333;">MATRÍCULA:</strong> <span style="color: #555;">${matriculaCriador}</span></div>
                    <div><strong style="color: #333;">SETOR:</strong> <span style="color: #555;">${centroCustoSeguro}</span></div>
                    <div><strong style="color: #333;">URGÊNCIA:</strong> <span style="color: ${chamado.urgencia === 'alta' ? '#DC2626' : (chamado.urgencia === 'media' ? '#EA580C' : '#64748B')}; font-weight: bold;">${urgSeguro}</span></div>
                </div>

                <div style="margin-bottom: 20px;">
                    <strong style="font-size: 13px; color: #111; display: block; margin-bottom: 5px;">DESCRIÇÃO DO PROBLEMA:</strong>
                    <div style="font-size: 14px; color: #444; line-height: 1.5; background: #F8FAFC; padding: 12px; border-radius: 4px; border: 1px solid #E2E8F0;">${descSegura}</div>
                </div>

                <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                    <h4 style="font-size: 13px; color: #B45309; margin-top: 0; margin-bottom: 10px; font-weight: 800;">📋 RELATÓRIO DO TÉCNICO</h4>
                    <div style="font-size: 14px; color: #334155; margin-bottom: ${pecas ? '8px' : '0'};">${laudo}</div>
                    ${pecas ? `<div style="font-size: 13px; color: #EA580C; font-weight: 600;">${pecas}</div>` : ''}
                </div>

                <div style="background-color: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 6px; padding: 15px; display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end; justify-content: space-between;">
                    <div style="display: flex; gap: 20px; flex: 1; min-width: 300px;">
                        <div style="flex: 1;">
                            <label style="font-size: 11px; font-weight: 800; color: #475569; display: block; margin-bottom: 6px; text-transform: uppercase;">Aprovar / Status</label>
                            <select class="status-select" data-id="${chamado.id}" style="width: 100%; padding: 10px 12px; border-radius: 4px; font-size: 13px; font-weight: 700; outline: none; cursor: pointer; box-sizing: border-box;">
                                <option value="pendente" ${chamado.status === 'pendente' ? 'selected' : ''}>⏳ Pendente</option>
                                <option value="aberto" ${chamado.status === 'aberto' ? 'selected' : ''}>🟢 Aprovado</option>
                                <option value="andamento" ${chamado.status === 'andamento' ? 'selected' : ''}>🔵 Andamento</option>
                                <option value="concluido" ${chamado.status === 'concluido' ? 'selected' : ''}>✅ Concluir Chamado</option>
                            </select>
                        </div>
                        <div style="flex: 1;">
                            <label style="font-size: 11px; font-weight: 800; color: #475569; display: block; margin-bottom: 6px; text-transform: uppercase;">Atribuir Responsável</label>
                            <select class="select-responsavel" data-id="${chamado.id}" style="width: 100%; padding: 10px 12px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 13px; font-weight: 600; outline: none; cursor: pointer; background: #FFF; color: #0F172A; box-sizing: border-box;">
                                <option value="">Nenhum Técnico...</option>
                                ${apenasTecnicos.map(e => `<option value="${e.id}" ${Number(chamado.responsavelId) === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div>
                        <button onclick="excluirChamado('${chamado.id}')" style="background-color: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; padding: 10px 16px; border-radius: 4px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                            <i class="ph ph-trash" style="font-size: 15px;"></i> Excluir
                        </button>
                    </div>
                </div>
            `;

            if (isTable) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.style.padding = '0'; td.style.border = 'none'; td.style.background = 'transparent';
                td.colSpan = 100;
                td.appendChild(card);
                tr.appendChild(td);
                listaGestao.appendChild(tr);
            } else {
                listaGestao.appendChild(card);
            }
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
    // RENDER: HISTÓRICO COM PESQUISA (APENAS CONCLUÍDOS)
    // ==========================================
    function renderHistorico(filtroMatricula = '') {
        const lista = document.getElementById('lista-historico');
        const badge = document.getElementById('badge-historico');
        if (!lista) return;
        
        lista.innerHTML = ''; 
        let chamados = getChamados();

        // Filtro Principal
        chamados = chamados.filter(c => c.status === 'concluido');

        const divPesquisa = document.createElement('div');
        divPesquisa.style.display = 'flex';
        divPesquisa.style.gap = '10px';
        divPesquisa.style.marginBottom = '25px';
        divPesquisa.style.alignItems = 'center';
        divPesquisa.style.backgroundColor = '#F8FAFC';
        divPesquisa.style.padding = '15px';
        divPesquisa.style.borderRadius = '8px';
        divPesquisa.style.border = '1px solid #E2E8F0';

        divPesquisa.innerHTML = `
            <div style="flex: 1; max-width: 400px; display: flex; gap: 10px;">
                <input type="text" id="input-pesquisa-historico" value="${filtroMatricula}" placeholder="Filtrar por Matrícula..." style="flex: 1; padding: 10px 15px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 14px; outline: none;">
                <button id="btn-pesquisa-historico" style="padding: 10px 20px; background-color: #0F172A; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 700;">Pesquisar</button>
            </div>
            ${filtroMatricula ? `<button id="btn-limpar-historico" style="padding: 10px 15px; background-color: #FFF; color: #475569; border: 1px solid #CBD5E1; border-radius: 6px; cursor: pointer; font-weight: 600;">Limpar Filtro</button>` : ''}
        `;
        lista.appendChild(divPesquisa);

        const btnPesquisa = divPesquisa.querySelector('#btn-pesquisa-historico');
        const inputPesquisa = divPesquisa.querySelector('#input-pesquisa-historico');
        const btnLimpar = divPesquisa.querySelector('#btn-limpar-historico');

        const realizarPesquisa = () => renderHistorico(inputPesquisa.value.trim());
        btnPesquisa.addEventListener('click', realizarPesquisa);
        inputPesquisa.addEventListener('keypress', (e) => { if (e.key === 'Enter') realizarPesquisa(); });
        if (btnLimpar) btnLimpar.addEventListener('click', () => renderHistorico(''));

        if (filtroMatricula) {
            chamados = chamados.filter(c => String(c.matriculaCriador) === String(filtroMatricula));
        }

        if (badge) badge.textContent = `${chamados.length} Registros Concluídos Encontrados`;

        const cardsContainer = document.createElement('div');

        if (chamados.length === 0) {
            cardsContainer.innerHTML = `<p style="color: #64748B; font-size: 15px; font-weight: 600; text-align: center; margin-top: 30px;">Nenhum registro concluído encontrado ${filtroMatricula ? 'para esta matrícula' : ''}.</p>`;
        }

        chamados.slice().reverse().forEach(chamado => {
            const card = document.createElement('div');
            card.style.display = 'block';
            card.style.width = '100%';
            card.style.boxSizing = 'border-box';
            card.style.backgroundColor = '#ffffff';
            card.style.padding = '25px';
            card.style.marginBottom = '25px';
            card.style.borderRadius = '8px';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            card.style.border = '1px solid #E2E8F0';

            const titulo = chamado.tipoServico ? chamado.tipoServico.toUpperCase() : `CHAMADO #${chamado.id.substring(0,6)}`;
            const localSeguro = chamado.local ? `- ${chamado.local}` : '';
            const matriculaCriador = chamado.matriculaCriador || 'N/A';
            const reqSeguro = chamado.requisitante || 'Não informado';
            const centroCustoSeguro = chamado.centroCusto || 'Não informado';
            const urgSeguro = chamado.urgencia ? chamado.urgencia.toUpperCase() : 'NORMAL';
            const dataSegura = chamado.dataCriacao || '';
            const descSegura = chamado.descricao || 'Sem descrição.';
            const laudo = chamado.respostaTecnico || 'Sem avaliação técnica registrada.';
            const pecas = chamado.pecasUtilizadas ? `<strong>Peças Utilizadas:</strong> ${chamado.pecasUtilizadas}` : '';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">
                    <h3 style="font-size: 18px; font-weight: 800; color: #111; margin: 0; text-transform: uppercase;">${titulo} ${localSeguro}</h3>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="background-color: #F3F4F6; color: #4B5563; font-weight: 800; padding: 4px 10px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">CONCLUÍDO</span>
                        <span style="font-size: 13px; color: #555;">${dataSegura}</span>
                    </div>
                </div>
                
                <div style="display: flex; flex-wrap: wrap; gap: 30px; margin-bottom: 15px; font-size: 13px;">
                    <div><strong style="color: #333;">REQUISITANTE:</strong> <span style="color: #555;">${reqSeguro}</span></div>
                    <div><strong style="color: #333;">MATRÍCULA:</strong> <span style="color: #555;">${matriculaCriador}</span></div>
                    <div><strong style="color: #333;">SETOR:</strong> <span style="color: #555;">${centroCustoSeguro}</span></div>
                    <div><strong style="color: #333;">URGÊNCIA:</strong> <span style="color: ${chamado.urgencia === 'alta' ? '#DC2626' : (chamado.urgencia === 'media' ? '#EA580C' : '#64748B')}; font-weight: bold;">${urgSeguro}</span></div>
                </div>

                <div style="margin-bottom: 20px;">
                    <strong style="font-size: 13px; color: #111; display: block; margin-bottom: 5px;">DESCRIÇÃO DO PROBLEMA:</strong>
                    <div style="font-size: 14px; color: #444; line-height: 1.5; background: #F8FAFC; padding: 12px; border-radius: 4px; border: 1px solid #E2E8F0;">${descSegura}</div>
                </div>

                <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 15px;">
                    <h4 style="font-size: 13px; color: #B45309; margin-top: 0; margin-bottom: 10px; font-weight: 800;">📋 RELATÓRIO DO TÉCNICO</h4>
                    <div style="font-size: 14px; color: #334155; margin-bottom: ${pecas ? '8px' : '0'};">${laudo}</div>
                    ${pecas ? `<div style="font-size: 13px; color: #EA580C; font-weight: 600;">${pecas}</div>` : ''}
                </div>
            `;
            cardsContainer.appendChild(card);
        });

        lista.appendChild(cardsContainer);
    }

    // ==========================================
    // GRÁFICOS (RELATÓRIOS) COM PAINEL DE EXPORTAÇÃO
    // ==========================================
    function renderRelatorios() {
        const filtrados = getChamados(); 
        const stats = { pendente: 0, aberto: 0, andamento: 0, concluido: 0 };
        filtrados.forEach(c => stats[c.status]++);

        const containerExportacao = document.getElementById('painel-exportacao');
        if (!containerExportacao) {
            const secRelatorios = document.getElementById('sec-relatorios');
            const painelHTML = document.createElement('div');
            painelHTML.id = 'painel-exportacao';
            painelHTML.style.backgroundColor = '#F8FAFC';
            painelHTML.style.border = '1px solid #E2E8F0';
            painelHTML.style.borderRadius = '8px';
            painelHTML.style.padding = '20px';
            painelHTML.style.marginBottom = '30px';
            
            const dataAtual = new Date();
            const anoAtual = dataAtual.getFullYear();
            
            painelHTML.innerHTML = `
                <h3 style="font-size: 16px; color: #0F172A; margin-top: 0; margin-bottom: 15px; font-weight: 800;"><i class="fa-solid fa-file-export"></i> Fechamento e Limpeza do Banco de Dados</h3>
                <p style="font-size: 13px; color: #64748B; margin-bottom: 15px;">Selecione o mês para exportar as manutenções <strong>Concluídas</strong> para o Excel. Após a exportação, os dados serão excluídos do sistema para manter o ServMaster leve e rápido.</p>
                
                <div style="display: flex; gap: 15px; align-items: flex-end;">
                    <div>
                        <label style="font-size: 11px; font-weight: 800; color: #475569; display: block; margin-bottom: 5px;">MÊS</label>
                        <select id="export-mes" style="padding: 10px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 14px; outline: none;">
                            <option value="01">01 - Janeiro</option><option value="02">02 - Fevereiro</option>
                            <option value="03">03 - Março</option><option value="04">04 - Abril</option>
                            <option value="05">05 - Maio</option><option value="06">06 - Junho</option>
                            <option value="07">07 - Julho</option><option value="08">08 - Agosto</option>
                            <option value="09">09 - Setembro</option><option value="10">10 - Outubro</option>
                            <option value="11">11 - Novembro</option><option value="12">12 - Dezembro</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 11px; font-weight: 800; color: #475569; display: block; margin-bottom: 5px;">ANO</label>
                        <input type="number" id="export-ano" value="${anoAtual}" style="padding: 10px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 14px; outline: none; width: 100px;">
                    </div>
                    <div>
                        <button onclick="exportarELimparMes()" style="background-color: #0F172A; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: 700; cursor: pointer;">
                            Gerar Planilha e Limpar
                        </button>
                    </div>
                </div>
            `;
            secRelatorios.insertBefore(painelHTML, secRelatorios.firstChild);
        }

        if(chartStatus) chartStatus.destroy();
        const ctxS = document.getElementById('graficoStatus')?.getContext('2d');
        if(ctxS) chartStatus = new Chart(ctxS, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Aprovado', 'Andamento', 'Concluído'],
                datasets: [{ data: Object.values(stats), backgroundColor: ['#F5F5F5', '#FFE0B2', '#BBDEFB', '#C8E6C9'] }]
            }
        });

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

    // ==========================================
    // CONTROLES E TRAVA DE CONCLUSÃO DO PLANEJADOR
    // ==========================================
    function aplicarCoresEEventos() {
        document.querySelectorAll('.status-select').forEach(select => {
            select.dataset.oldValue = select.value; 
            atualizarCor(select);
            
            select.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const novoValor = e.target.value;
                const chamados = getChamados();
                const idx = chamados.findIndex(c => String(c.id) === String(id));
                
                if(idx !== -1) {
                    // SE TENTAR CONCLUIR: Pede Confirmação + Matrícula
                    if (novoValor === 'concluido') {
                        const confirmar = confirm("Tem certeza que deseja concluir esta requisição? Ela será bloqueada para edição e movida para o Histórico.");
                        
                        if (confirmar) {
                            const confirmacaoMatricula = prompt("Confirme sua matrícula de Planejador para finalizar o chamado:");
                            const matriculaLogada = sessionStorage.getItem("matriculaPlanejador") || sessionStorage.getItem("matricula");

                            if (confirmacaoMatricula === matriculaLogada) {
                                chamados[idx].status = 'concluido';
                                
                                const dt = new Date();
                                const dtStr = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()} às ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
                                chamados[idx].dataConclusao = dtStr;

                                saveChamados(chamados);
                                alert("Chamado concluído, bloqueado e movido para o Histórico!");
                                renderGestao(); 
                                return; 
                            } else if (confirmacaoMatricula !== null) {
                                alert("Matrícula incorreta. Ação cancelada.");
                            }
                        }
                        
                        e.target.value = e.target.dataset.oldValue;
                        atualizarCor(e.target);
                        return;
                    }

                    chamados[idx].status = novoValor;
                    saveChamados(chamados);
                    e.target.dataset.oldValue = novoValor; 
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
                    if(e.target.value && chamados[idx].status === 'pendente') {
                        chamados[idx].status = 'aberto';
                    }
                    saveChamados(chamados);
                    renderGestao();
                }
            });
        });
    }

    function atualizarCor(el) {
        const cores = {
            aberto: {bg:'#DCFCE7', text:'#15803D', border:'#15803D'},
            andamento: {bg:'#EFF6FF', text:'#1D4ED8', border:'#1D4ED8'},
            concluido: {bg:'#F3F4F6', text:'#4B5563', border:'#9CA3AF'},
            pendente: {bg:'#FEF9C3', text:'#A16207', border:'#A16207'}
        };
        const c = cores[el.value];
        if(c) { 
            el.style.backgroundColor = c.bg; 
            el.style.color = c.text; 
            el.style.borderColor = c.border;
        }
    }

    // Inicialização da primeira tela
    renderGestao();
});