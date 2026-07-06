// UCE Library Desktop App - Renderer Logic (Vanilla JS + Electron)
let currentUser = null;
let apiUrl = 'https://kleberchiliquingaqa1.distribuidauce.org';

// DOM ELEMENTS
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const inputEmail = document.getElementById('input-email');
const inputPassword = document.getElementById('input-password');
const inputApiUrl = document.getElementById('input-api-url');
const btnToggleSettings = document.getElementById('btn-toggle-settings');
const settingsContent = document.getElementById('settings-content');

const headerUserPanel = document.getElementById('header-user-panel');
const userDisplayName = document.getElementById('user-display-name');
const btnLogout = document.getElementById('btn-logout');

const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

const kioskSearchInput = document.getElementById('kiosk-search-input');
const btnSearchKiosk = document.getElementById('btn-search-kiosk');
const kioskBooksGrid = document.getElementById('kiosk-books-grid');

const loansTableBody = document.getElementById('loans-table-body');
const finesTableBody = document.getElementById('fines-table-body');

const btnRefreshKiosk = document.getElementById('btn-refresh-kiosk');
const btnRefreshLoans = document.getElementById('btn-refresh-loans');
const btnRefreshFines = document.getElementById('btn-refresh-fines');

// TOGGLE API SETTINGS IN LOGIN
btnToggleSettings.addEventListener('click', () => {
  const isHidden = settingsContent.style.display === 'none' || !settingsContent.style.display;
  settingsContent.style.display = isHidden ? 'block' : 'none';
  btnToggleSettings.textContent = isHidden ? '▲ Ocultar Configuración' : '▼ Configurar Servidor API / Gateway';
});

// LOGIN FORM SUBMISSION
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const customUrl = inputApiUrl.value.trim();
  if (customUrl) {
    apiUrl = customUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  const email = inputEmail.value.trim();
  const password = inputPassword.value;

  const btnLogin = document.getElementById('btn-login');
  btnLogin.textContent = '⏳ Autenticando en AWS...';
  btnLogin.disabled = true;

  try {
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error de credenciales');
    }

    currentUser = {
      id: data.user?.id || data.user?.userId || data.id,
      email: data.user?.email || email,
      role: data.user?.role || 'USER',
      token: data.token || data.accessToken,
      name: data.user?.name || data.user?.firstName || email.split('@')[0]
    };

    // Show Dashboard
    showDashboard();

  } catch (error) {
    alert(`❌ Error de Inicio de Sesión:\n${error.message}\n\nVerifica que la URL del servidor (${apiUrl}) y tus credenciales sean correctas.`);
  } finally {
    btnLogin.textContent = 'Iniciar Sesión en Kiosco';
    btnLogin.disabled = false;
  }
});

// LOGOUT
btnLogout.addEventListener('click', () => {
  currentUser = null;
  loginView.style.display = 'flex';
  dashboardView.style.display = 'none';
  headerUserPanel.style.display = 'none';
  inputPassword.value = '';
});

// SHOW DASHBOARD & INITIALIZE DATA
function showDashboard() {
  loginView.style.display = 'none';
  dashboardView.style.display = 'flex';
  headerUserPanel.style.display = 'flex';

  userDisplayName.textContent = `👤 ${currentUser.name} (${currentUser.role})`;

  // Fetch initial data
  fetchBooks();
  fetchLoans();
  fetchFines();
}

// TAB NAVIGATION
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');
  });
});

// KIOSK: FETCH BOOKS & PHYSICAL INVENTORY STOCK
async function fetchBooks(query = '') {
  kioskBooksGrid.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <div class="empty-icon">⏳</div>
      <div class="empty-title">Consultando Catálogo e Inventario Físico...</div>
      <div class="empty-subtitle">Conectando con microservicios en ${apiUrl}</div>
    </div>
  `;

  try {
    let url = `${apiUrl}/api/catalog/books`;
    if (query.trim() !== '') {
      url = `${apiUrl}/api/search?q=${encodeURIComponent(query.trim())}`;
    }

    const response = await fetch(url, {
      headers: currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {}
    });

    if (!response.ok) throw new Error('Error al consultar libros del catálogo');

    const result = await response.json();
    let books = Array.isArray(result) ? result : (result.data?.hits || result.books || []);

    // Consultar stock físico real para cada libro en el inventory-service
    const booksWithRealStock = await Promise.all(books.map(async (book) => {
      if (!book.isbn) return { ...book, realStock: book.available !== false ? 1 : 0 };
      try {
        const stockRes = await fetch(`${apiUrl}/api/inventory/${book.isbn}`, {
          headers: currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {}
        });
        if (stockRes.ok) {
          const stockData = await stockRes.json();
          const copies = stockData.availableCopies !== undefined ? stockData.availableCopies : (stockData.totalCopies !== undefined ? stockData.totalCopies : 1);
          return { ...book, realStock: copies };
        }
      } catch (err) {
        console.warn(`No se pudo obtener stock para ISBN ${book.isbn}:`, err);
      }
      return { ...book, realStock: book.available !== false ? 1 : 0 };
    }));

    renderBooks(booksWithRealStock);
  } catch (error) {
    kioskBooksGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">❌</div>
        <div class="empty-title">Error de Conexión</div>
        <div class="empty-subtitle">No se pudo obtener el catálogo de libros: ${error.message}</div>
      </div>
    `;
  }
}

function renderBooks(books) {
  if (!books || books.length === 0) {
    kioskBooksGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">📭</div>
        <div class="empty-title">No se encontraron libros</div>
        <div class="empty-subtitle">Intenta buscar con otra palabra clave o autor en el catálogo de la UCE.</div>
      </div>
    `;
    return;
  }

  kioskBooksGrid.innerHTML = books.map(book => {
    const stock = book.realStock !== undefined ? book.realStock : (book.available !== false ? 1 : 0);
    const isZero = stock <= 0;
    const stockClass = isZero ? 'stock-zero' : '';
    const stockText = isZero ? 'Agotado (0 disp.)' : `✔ Disponible (${stock} ejemp.)`;
    const faculty = book.category || book.faculty || 'Biblioteca Central UCE';

    return `
      <div class="book-card">
        <div>
          <span class="book-category-badge">${faculty}</span>
          <h3 class="book-title">${book.title || 'Libro sin título'}</h3>
          <p class="book-author">Por: ${book.author || 'Autor Desconocido'}</p>
        </div>
        <div class="book-footer">
          <span>ISBN: ${book.isbn || 'N/A'}</span>
          <span class="stock-badge ${stockClass}">${stockText}</span>
        </div>
      </div>
    `;
  }).join('');
}

btnSearchKiosk.addEventListener('click', () => {
  fetchBooks(kioskSearchInput.value);
});

kioskSearchInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    fetchBooks(kioskSearchInput.value);
  }
});

btnRefreshKiosk.addEventListener('click', () => {
  kioskSearchInput.value = '';
  fetchBooks();
});

// LOANS: FETCH LOANS (USER OR ADMIN)
async function fetchLoans() {
  if (!currentUser?.id) return;

  loansTableBody.innerHTML = `
    <tr><td colSpan="5" style="text-align: center; padding: 30px; color: #94a3b8;">⏳ Cargando préstamos desde AWS...</td></tr>
  `;

  try {
    const isAdminOrLibrarian = currentUser.role === 'ADMIN' || currentUser.role === 'LIBRARIAN';
    const url = isAdminOrLibrarian
      ? `${apiUrl}/api/loans/?activeOnly=false&page=1&limit=50`
      : `${apiUrl}/api/loans/user/${currentUser.id}?page=1&limit=50`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `HTTP ${response.status}: Error al consultar préstamos`);
    }

    const result = await response.json();
    const loansList = Array.isArray(result) ? result : (result.data || result.loans || []);
    renderLoans(loansList);
  } catch (error) {
    loansTableBody.innerHTML = `
      <tr><td colSpan="5" style="text-align: center; padding: 30px; color: #f87171;">❌ Error: ${error.message}</td></tr>
    `;
  }
}

function renderLoans(loans) {
  if (!loans || !Array.isArray(loans) || loans.length === 0) {
    loansTableBody.innerHTML = `
      <tr>
        <td colSpan="5">
          <div class="empty-state">
            <div class="empty-icon">📖</div>
            <div class="empty-title">Sin Préstamos Registrados</div>
            <div class="empty-subtitle">Actualmente no hay libros retirados en esta consulta.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  loansTableBody.innerHTML = loans.map(loan => {
    const loanId = loan.id ? `${loan.id.substring(0, 8)}...` : 'N/A';
    const title = loan.bookTitle || loan.book?.title || `Libro ISBN: ${loan.isbn || 'Desconocido'}`;
    const loanDate = loan.borrowDate ? new Date(loan.borrowDate).toLocaleDateString() : 'N/A';
    const dueDate = loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A';
    
    let statusClass = 'status-active';
    let statusText = 'ACTIVO';
    if (loan.status === 'RETURNED') {
      statusClass = 'status-returned';
      statusText = 'DEVUELTO';
    } else if (loan.status === 'OVERDUE') {
      statusClass = 'status-fine';
      statusText = 'VENCIDO';
    }

    return `
      <tr>
        <td style="font-family: monospace; font-weight: 600; color: #818cf8;">#${loanId}</td>
        <td style="font-weight: 600;">${title}</td>
        <td>${loanDate}</td>
        <td>${dueDate}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  }).join('');
}

btnRefreshLoans.addEventListener('click', fetchLoans);

// FINES: FETCH FINES (USER OR ADMIN)
async function fetchFines() {
  if (!currentUser?.id) return;

  finesTableBody.innerHTML = `
    <tr><td colSpan="5" style="text-align: center; padding: 30px; color: #94a3b8;">⏳ Verificando recargos en base de datos...</td></tr>
  `;

  try {
    const isAdminOrLibrarian = currentUser.role === 'ADMIN' || currentUser.role === 'LIBRARIAN';
    const url = isAdminOrLibrarian
      ? `${apiUrl}/api/fines/?page=1&limit=50`
      : `${apiUrl}/api/fines/user/${currentUser.id}?page=1&limit=50`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `HTTP ${response.status}: Error al consultar multas`);
    }

    const result = await response.json();
    const finesList = Array.isArray(result) ? result : (result.data || result.fines || []);
    renderFines(finesList);
  } catch (error) {
    finesTableBody.innerHTML = `
      <tr><td colSpan="5" style="text-align: center; padding: 30px; color: #f87171;">❌ Error: ${error.message}</td></tr>
    `;
  }
}

function renderFines(fines) {
  if (!fines || !Array.isArray(fines) || fines.length === 0) {
    finesTableBody.innerHTML = `
      <tr>
        <td colSpan="5">
          <div class="empty-state">
            <div class="empty-icon">🎉</div>
            <div class="empty-title">¡Todo al Día!</div>
            <div class="empty-subtitle">No hay ninguna multa ni recargo pendiente en esta consulta.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  finesTableBody.innerHTML = fines.map(fine => {
    const fineId = fine.id ? `${fine.id.substring(0, 8)}...` : 'N/A';
    const reason = fine.reason || 'Retraso en devolución';
    const amount = fine.amount !== undefined ? `$${Number(fine.amount).toFixed(2)}` : '$0.00';
    const date = fine.createdAt ? new Date(fine.createdAt).toLocaleDateString() : 'N/A';
    
    const isPaid = fine.status === 'PAID';
    const statusClass = isPaid ? 'status-returned' : 'status-fine';
    const statusText = isPaid ? 'PAGADA' : 'PENDIENTE';

    return `
      <tr>
        <td style="font-family: monospace; font-weight: 600; color: #818cf8;">#${fineId}</td>
        <td>${reason}</td>
        <td style="font-weight: 700; color: #f87171;">${amount}</td>
        <td>${date}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  }).join('');
}

btnRefreshFines.addEventListener('click', fetchFines);
