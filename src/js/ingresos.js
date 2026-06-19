// ingresos.js — Módulo de gestión de ingresos

const STORAGE_KEY = 'ingresos';

document.addEventListener('DOMContentLoaded', () => {

    // ── Verificar sesión ──
    if (!localStorage.getItem('usuario')) {
        window.location.href = '../index.html';
        return;
    }

    renderTabla();

    document.getElementById('btnLogout')?.addEventListener('click', () => {
        localStorage.removeItem('usuario');
        window.location.href = '../index.html';
    });

    document.getElementById('formIngreso').addEventListener('submit', (e) => {
        e.preventDefault();
        agregarIngreso();
    });
});

// ────────────────────────────────────────────
// Helpers de storage
// ────────────────────────────────────────────
function getIngresos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveIngresos(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ────────────────────────────────────────────
// Formateo moneda
// ────────────────────────────────────────────
function fmt(n) {
    return '$' + parseFloat(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ────────────────────────────────────────────
// Renderizar tabla
// ────────────────────────────────────────────
function renderTabla() {
    const list    = getIngresos();
    const tbody   = document.getElementById('ingresosTable');
    const noData  = document.getElementById('noData');
    const totalEl = document.getElementById('totalIngresos');

    const total = list.reduce((s, i) => s + parseFloat(i.monto || 0), 0);
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
                <td class="text-success fw-bold">${fmt(item.monto)}</td>
                <td class="text-muted">${fechaStr}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarIngreso(${idx})" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
    }).join('');
}

// ────────────────────────────────────────────
// Agregar ingreso (desde modal)
// ────────────────────────────────────────────
function agregarIngreso() {
    const concepto = document.getElementById('inputConcepto').value.trim();
    const monto    = parseFloat(document.getElementById('inputMonto').value);
    const fecha    = document.getElementById('inputFecha').value;

    if (!concepto || isNaN(monto) || monto <= 0) return;

    const list = getIngresos();
    list.unshift({ id: Date.now(), concepto, monto, fecha });
    saveIngresos(list);

    document.getElementById('formIngreso').reset();
    bootstrap.Modal.getInstance(document.getElementById('modalIngreso')).hide();
    renderTabla();
}

// ────────────────────────────────────────────
// Eliminar ingreso
// ────────────────────────────────────────────
function eliminarIngreso(idx) {
    if (!confirm('¿Eliminar este ingreso?')) return;
    const list = getIngresos();
    list.splice(idx, 1);
    saveIngresos(list);
    renderTabla();
}
