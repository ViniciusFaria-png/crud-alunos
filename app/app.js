'use strict';

const formCadastro = document.getElementById('aluno-form');
const inputNome = document.getElementById('nome');
const inputEmail = document.getElementById('email');
const inputCelular = document.getElementById('celular');
const inputCidade = document.getElementById('cidade');
const inputEstado = document.getElementById('estado');
const inputCep = document.getElementById('cep');
const btnSalvar = document.getElementById('btn-salvar');

const modalEditar = document.getElementById('modal-editar');
const formEditar = document.getElementById('form-editar');
const editId = document.getElementById('edit-id');
const editNome = document.getElementById('edit-nome');
const editEmail = document.getElementById('edit-email');
const editCelular = document.getElementById('edit-celular');
const editCidade = document.getElementById('edit-cidade');
const editEstado = document.getElementById('edit-estado');
const editCep = document.getElementById('edit-cep');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const btnCancelarModal = document.getElementById('btn-cancelar-modal');
const btnSalvarModal = document.getElementById('btn-salvar-modal');

const dialogExcluir = document.getElementById('delete-confirmation-dialog');
const btnConfirmarDelete = document.getElementById('confirm-delete');
const btnCancelarDelete = document.getElementById('cancel-delete');
let alunoIdParaExcluir = null;

const tableBody = document.getElementById('alunos-table-body');
const searchInput = document.getElementById('search-input');

let listaAlunos = [];

const renderizarTabela = (alunos) => {
    tableBody.innerHTML = '';

    if (!alunos || alunos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="empty">Nenhum aluno encontrado.</td></tr>';
        return;
    }

    alunos.forEach(aluno => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${aluno.nome || '-'}</strong></td>
            <td>${aluno.email || '-'}</td>
            <td>${aluno.celular || '-'}</td>
            <td>${aluno.cidade || '-'}</td>
            <td>${aluno.estado || '-'}</td>
            <td>${aluno.cep || '-'}</td>
            <td class="action-buttons">
                <button type="button" class="btn-action edit" data-id="${aluno.id}">Editar</button>
                <button type="button" class="btn-action delete" data-id="${aluno.id}">Excluir</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
};

const carregarAlunos = async () => {
    tableBody.innerHTML = '<tr><td colspan="7" class="loading">Carregando alunos...</td></tr>';
    try {
        const dados = await getAlunos();
        listaAlunos = Array.isArray(dados) ? dados : (dados.value || []);
        filtrarAlunos();
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="7" class="error">Erro ao carregar dados da API.</td></tr>';
        console.error('Erro ao buscar alunos:', error);
    }
};

const filtrarAlunos = () => {
    const termo = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (!termo) {
        renderizarTabela(listaAlunos);
        return;
    }
    const filtrados = listaAlunos.filter(aluno => {
        const nome = (aluno.nome || '').toLowerCase();
        return nome.includes(termo);
    });
    renderizarTabela(filtrados);
};

if (searchInput) {
    searchInput.addEventListener('input', filtrarAlunos);
}

formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const novoAluno = {
        nome: inputNome.value.trim(),
        email: inputEmail.value.trim(),
        celular: inputCelular.value.trim(),
        cidade: inputCidade.value.trim(),
        estado: inputEstado.value.trim().toUpperCase(),
        cep: inputCep.value.trim()
    };

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Cadastrando...';

    try {
        await postAluno(novoAluno);
        alert('Aluno cadastrado com sucesso!');
        formCadastro.reset();
        await carregarAlunos();
    } catch (error) {
        alert('Erro ao cadastrar aluno.');
        console.error(error);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar';
    }
});

tableBody.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.getAttribute('data-id');
    if (!id) return;

    if (target.classList.contains('delete')) {
        alunoIdParaExcluir = id;
        if (dialogExcluir) {
            dialogExcluir.showModal();
        } else if (confirm(`Deseja realmente excluir o aluno #${id}?`)) {
            executarExclusao(id);
        }
    }

    if (target.classList.contains('edit')) {
        try {
            const tr = target.closest('tr');
            const colunas = tr.querySelectorAll('td');

            let aluno = null;
            try {
                aluno = await getAluno(id);
            } catch (err) {
                console.warn('Não foi possível obter aluno por id na API, usando dados locais.');
            }

            editId.value = id;
            editNome.value = (aluno && aluno.nome) ? aluno.nome : colunas[0].innerText.trim();
            editEmail.value = (aluno && aluno.email) ? aluno.email : (colunas[1].innerText !== '-' ? colunas[1].innerText.trim() : '');
            editCelular.value = (aluno && aluno.celular) ? aluno.celular : (colunas[2].innerText !== '-' ? colunas[2].innerText.trim() : '');
            editCidade.value = (aluno && aluno.cidade) ? aluno.cidade : (colunas[3].innerText !== '-' ? colunas[3].innerText.trim() : '');
            editEstado.value = (aluno && aluno.estado) ? aluno.estado : (colunas[4].innerText !== '-' ? colunas[4].innerText.trim() : '');
            editCep.value = (aluno && aluno.cep) ? aluno.cep : (colunas[5].innerText !== '-' ? colunas[5].innerText.trim() : '');

            modalEditar.showModal();
        } catch (error) {
            alert('Erro ao abrir dados para edição.');
            console.error(error);
        }
    }
});

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const alunoAtualizado = {
        id: editId.value,
        nome: editNome.value.trim(),
        email: editEmail.value.trim(),
        celular: editCelular.value.trim(),
        cidade: editCidade.value.trim(),
        estado: editEstado.value.trim().toUpperCase(),
        cep: editCep.value.trim()
    };

    btnSalvarModal.disabled = true;
    btnSalvarModal.textContent = 'Salvando...';

    try {
        await putAluno(alunoAtualizado);
        alert('Aluno atualizado com sucesso!');
        modalEditar.close();
        await carregarAlunos();
    } catch (error) {
        alert('Erro ao atualizar aluno.');
        console.error(error);
    } finally {
        btnSalvarModal.disabled = false;
        btnSalvarModal.textContent = 'Salvar Alterações';
    }
});

if (btnFecharModal) btnFecharModal.addEventListener('click', () => modalEditar.close());
if (btnCancelarModal) btnCancelarModal.addEventListener('click', () => modalEditar.close());

modalEditar.addEventListener('click', (e) => {
    if (e.target === modalEditar) modalEditar.close();
});

const executarExclusao = async (id) => {
    try {
        await deleteAluno(id);
        alert('Aluno excluído com sucesso!');
        await carregarAlunos();
    } catch (error) {
        alert('Erro ao excluir aluno.');
        console.error(error);
    }
};

if (btnConfirmarDelete) {
    btnConfirmarDelete.addEventListener('click', async () => {
        if (alunoIdParaExcluir) {
            dialogExcluir.close();
            await executarExclusao(alunoIdParaExcluir);
            alunoIdParaExcluir = null;
        }
    });
}

if (btnCancelarDelete) {
    btnCancelarDelete.addEventListener('click', () => {
        dialogExcluir.close();
        alunoIdParaExcluir = null;
    });
}

if (dialogExcluir) {
    dialogExcluir.addEventListener('click', (e) => {
        if (e.target === dialogExcluir) {
            dialogExcluir.close();
            alunoIdParaExcluir = null;
        }
    });
}

carregarAlunos();
