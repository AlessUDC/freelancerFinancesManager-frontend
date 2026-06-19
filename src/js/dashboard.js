// dashboard.js — Módulo del panel principal

document.addEventListener('DOMContentLoaded', () => {

    // ── Verificar sesión ──
    const usuarioJson = localStorage.getItem('usuario');
    if (!usuarioJson) {
        window.location.href = 'index.html';
        return;
    }

    const usuario = JSON.parse(usuarioJson);

    const welcomeEl = document.getElementById('welcomeMessage');
    if (welcomeEl) {
        welcomeEl.textContent = `Bienvenido, ${usuario.nombre}`;
    }

    // ── Cerrar sesión ──
    document.getElementById('btnLogout')?.addEventListener('click', () => {
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    });

    // ── Cargar datos ──
    cargarResumen();
    cargarRenovaciones();
});

// ────────────────────────────────────────────
// Formatea número como moneda
// ────────────────────────────────────────────
function fmt(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ────────────────────────────────────────────
// Totales de ingresos, gastos y balance
// ────────────────────────────────────────────
function cargarResumen() {
    const ingresos     = JSON.parse(localStorage.getItem('ingresos')     || '[]');
    const gastos       = JSON.parse(localStorage.getItem('gastos')       || '[]');

    const totalIngresos = ingresos.reduce((s, i) => s + parseFloat(i.monto || 0), 0);
    const totalGastos   = gastos.reduce((s, g)   => s + parseFloat(g.monto || 0), 0);
    const balance       = totalIngresos - totalGastos;

    document.getElementById('totalIngresos').textContent = fmt(totalIngresos);
    document.getElementById('totalGastos').textContent   = fmt(totalGastos);

    const balanceEl = document.getElementById('balance');
    balanceEl.textContent = fmt(balance);
    balanceEl.classList.toggle('text-danger', balance < 0);
}

// ────────────────────────────────────────────
// Tabla de próximas renovaciones
// ────────────────────────────────────────────
function cargarRenovaciones() {
    const suscripciones = JSON.parse(localStorage.getItem('suscripciones') || '[]');
    const tbody         = document.getElementById('renewalsTable');
    const noRenewals    = document.getElementById('noRenewals');

    if (suscripciones.length === 0) {
        noRenewals.classList.remove('d-none');
        return;
    }

    noRenewals.classList.add('d-none');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordenadas = suscripciones
        .filter(s => s.renovacion)
        .sort((a, b) => new Date(a.renovacion) - new Date(b.renovacion))
        .slice(0, 6);

    tbody.innerHTML = ordenadas.map(s => {
        const fecha    = new Date(s.renovacion + 'T00:00:00');
        const diffDays = Math.ceil((fecha - today) / (1000 * 60 * 60 * 24));
        const fechaStr = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

        let badge = '';
        if (diffDays <= 3)       badge = `<span class="badge bg-danger ms-2">${diffDays}d</span>`;
        else if (diffDays <= 7)  badge = `<span class="badge bg-warning text-dark ms-2">${diffDays}d</span>`;
        else                     badge = `<span class="badge bg-secondary ms-2">${diffDays}d</span>`;

        return `
            <tr>
                <td class="fw-semibold">${s.servicio}${badge}</td>
                <td class="text-danger fw-bold">$${parseFloat(s.costo).toFixed(2)}</td>
                <td class="text-muted">${fechaStr}</td>
            </tr>`;
    }).join('');
}
