// gastos.js — Módulo de gestión de gastos

const STORAGE_KEY = 'gastos';

document.addEventListener('DOMContentLoaded', () => {

    if (!localStorage.getItem('usuario')) {
        window.location.href = '../index.html';
        return;
    }

    renderTabla();

    document.getElementById('btnLogout')?.addEventListener('click', () => {
        localStorage.removeItem('usuario');
        window.location.href = '../index.html';
    });

    document.getElementById('formGasto').addEventListener('submit', (e) => {
        e.preventDefault();
        agregarGasto();
    });
});

function getGastos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveGastos(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function fmt(n) {
    return '$' + parseFloat(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function renderTabla() {
    const list    = getGastos();
    const tbody   = document.getElementById('gastosTable');
    const noData  = document.getElementById('noData');
    const totalEl = document.getElementById('totalGastos');

    const total = list.reduce((s, g) => s + parseFloat(g.monto || 0), 0);
    if (totalEl) totalEl.textContent = fmt(total);

    if (list.length === 0) {
        noData.classList.remove('d-none');
        tbody.innerHTML = '';
        return;
    }

    noData.classList.add('d-none');

    tbody.innerHTML = list.map((item, idx) => {
        const fechaStr = item.fecha
            ? new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';
        return `
            <tr>
                <td class="fw-semibold">${item.concepto}</td>
                <td class="text-danger fw-bold">${fmt(item.monto)}</td>
                <td class="text-muted">${fechaStr}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarGasto(${idx})" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
    }).join('');
}

function agregarGasto() {
    const concepto = document.getElementById('inputConcepto').value.trim();
    const monto    = parseFloat(document.getElementById('inputMonto').value);
    const fecha    = document.getElementById('inputFecha').value;

    if (!concepto || isNaN(monto) || monto <= 0) return;

    const list = getGastos();
    list.unshift({ id: Date.now(), concepto, monto, fecha });
    saveGastos(list);

    document.getElementById('formGasto').reset();
    bootstrap.Modal.getInstance(document.getElementById('modalGasto')).hide();
    renderTabla();
}

function eliminarGasto(idx) {
    if (!confirm('¿Eliminar este gasto?')) return;
    const list = getGastos();
    list.splice(idx, 1);
    saveGastos(list);
    renderTabla();
}
