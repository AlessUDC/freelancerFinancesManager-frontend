// suscripciones.js — Módulo de gestión de suscripciones

const STORAGE_KEY = 'suscripciones';

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

    document.getElementById('formSuscripcion').addEventListener('submit', (e) => {
        e.preventDefault();
        agregarSuscripcion();
    });
});

function getSuscripciones() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveSuscripciones(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function fmt(n) {
    return '$' + parseFloat(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function renderTabla() {
    const list    = getSuscripciones();
    const tbody   = document.getElementById('suscripcionesTable');
    const noData  = document.getElementById('noData');
    const totalEl = document.getElementById('totalSuscripciones');

    const total = list.reduce((s, i) => s + parseFloat(i.costo || 0), 0);
    if (totalEl) totalEl.textContent = fmt(total);

    if (list.length === 0) {
        noData.classList.remove('d-none');
        tbody.innerHTML = '';
        return;
    }

    noData.classList.add('d-none');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tbody.innerHTML = list.map((item, idx) => {
        let fechaStr = '—';
        let badge    = '';

        if (item.renovacion) {
            const fecha    = new Date(item.renovacion + 'T00:00:00');
            const diffDays = Math.ceil((fecha - today) / (1000 * 60 * 60 * 24));
            fechaStr       = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

            if (diffDays <= 3)      badge = `<span class="badge bg-danger ms-2">${diffDays}d</span>`;
            else if (diffDays <= 7) badge = `<span class="badge bg-warning text-dark ms-2">${diffDays}d</span>`;
            else                    badge = `<span class="badge bg-secondary ms-2">${diffDays}d</span>`;
        }

        return `
            <tr>
                <td class="fw-semibold">${item.servicio}</td>
                <td class="text-danger fw-bold">${fmt(item.costo)}</td>
                <td>${fechaStr}${badge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarSuscripcion(${idx})" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
    }).join('');
}

function agregarSuscripcion() {
    const servicio   = document.getElementById('inputServicio').value.trim();
    const costo      = parseFloat(document.getElementById('inputCosto').value);
    const renovacion = document.getElementById('inputRenovacion').value;

    if (!servicio || isNaN(costo) || costo <= 0) return;

    const list = getSuscripciones();
    list.unshift({ id: Date.now(), servicio, costo, renovacion });
    saveSuscripciones(list);

    document.getElementById('formSuscripcion').reset();
    bootstrap.Modal.getInstance(document.getElementById('modalSuscripcion')).hide();
    renderTabla();
}

function eliminarSuscripcion(idx) {
    if (!confirm('¿Eliminar esta suscripción?')) return;
    const list = getSuscripciones();
    list.splice(idx, 1);
    saveSuscripciones(list);
    renderTabla();
}
