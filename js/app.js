/* ==========================================================================
   FinTrack - logika aplikasi
   Data disimpan di localStorage peramban.
   ========================================================================== */

/* ---------- Konstanta ---------- */

const STORAGE_KEYS = {
  transactions: 'fintrack_transactions',
  theme: 'fintrack_theme'
};

const CATEGORIES = {
  expense: ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan & Utilitas', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'],
  income: ['Gaji', 'Bonus', 'Investasi', 'Penjualan', 'Hadiah', 'Lainnya']
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const CHART_COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B'];

const PAGE_TITLES = {
  dashboard: 'Dashboard Keuangan',
  transactions: 'Daftar Transaksi',
  reports: 'Laporan Keuangan',
  settings: 'Pengaturan Data'
};

/* Kelas Tailwind yang dipakai ulang */
const CLASS = {
  navBase: 'nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150',
  navActive: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold',
  navIdle: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white',

  themeBase: 'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg',
  themeActive: 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm',
  themeIdle: 'text-slate-500 dark:text-slate-400',

  typeBase: 'py-2.5 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2',
  typeIdle: 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
  typeExpense: 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
  typeIncome: 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
};

/* ---------- State ---------- */

let transactions = [];
let modalType = 'expense';
let chartMonthly = null;
let chartCategory = null;

/* ---------- Helper ---------- */

const $ = (id) => document.getElementById(id);

function formatRupiah(amount) {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function sortByDateDesc(list) {
  return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function refreshIcons() {
  lucide.createIcons();
}

/* ---------- Penyimpanan ---------- */

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.transactions);
    transactions = stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Gagal membaca data tersimpan:', err);
    transactions = [];
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
}

/* ---------- Inisialisasi ---------- */

window.addEventListener('load', () => {
  loadData();
  initYearSelect();
  initCategoryFilter();
  setTheme(localStorage.getItem(STORAGE_KEYS.theme) || 'light');
  switchTab('dashboard');
  refreshIcons();
});

function initYearSelect() {
  const select = $('period-year-select');
  const currentYear = new Date().getFullYear();
  let options = '<option value="all">Semua Tahun</option>';

  for (let y = currentYear + 1; y >= currentYear - 3; y--) {
    options += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
  }
  select.innerHTML = options;
}

function initCategoryFilter() {
  const all = [...new Set([...CATEGORIES.expense, ...CATEGORIES.income])];
  $('filter-category').innerHTML =
    '<option value="all">Semua Kategori</option>' +
    all.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

/* ---------- Navigasi & tema ---------- */

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach((el) => el.classList.add('hidden'));
  $(`view-${tabId}`).classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.className = `${CLASS.navBase} ${CLASS.navIdle}`;
  });
  const activeBtn = $(`nav-${tabId}`);
  if (activeBtn) activeBtn.className = `${CLASS.navBase} ${CLASS.navActive}`;

  $('page-title').innerText = PAGE_TITLES[tabId] || 'Dashboard';

  renderAll();
  closeMobileSidebar();
}

function setTheme(mode) {
  const isDark = mode === 'dark';
  document.documentElement.classList.toggle('dark', isDark);

  $('theme-light-btn').className = `${CLASS.themeBase} ${isDark ? CLASS.themeIdle : CLASS.themeActive}`;
  $('theme-dark-btn').className = `${CLASS.themeBase} ${isDark ? CLASS.themeActive : CLASS.themeIdle}`;

  localStorage.setItem(STORAGE_KEYS.theme, mode);
  renderCharts();
}

function toggleMobileSidebar() {
  $('sidebar').classList.toggle('-translate-x-full');
  $('sidebar-backdrop').classList.toggle('hidden');
}

function closeMobileSidebar() {
  $('sidebar').classList.add('-translate-x-full');
  $('sidebar-backdrop').classList.add('hidden');
}

/* ---------- Filter periode ---------- */

function getFilteredTransactions() {
  const month = $('period-month-select').value;
  const year = $('period-year-select').value;

  return transactions.filter((t) => {
    const d = new Date(t.date);
    const matchMonth = month === 'all' || d.getMonth() === parseInt(month, 10);
    const matchYear = year === 'all' || d.getFullYear() === parseInt(year, 10);
    return matchMonth && matchYear;
  });
}

function handlePeriodChange() {
  renderAll();
}

/* ---------- Render ---------- */

function renderAll() {
  renderSummaryCards();
  renderRecentTransactions();
  renderTransactionsTable();
  renderReportsView();
  renderCharts();
  refreshIcons();
}

function renderSummaryCards() {
  const list = getFilteredTransactions();
  let income = 0;
  let expense = 0;

  list.forEach((t) => {
    if (t.type === 'income') income += Number(t.amount);
    else expense += Number(t.amount);
  });

  $('card-saldo').innerText = formatRupiah(income - expense);
  $('card-pemasukan').innerText = formatRupiah(income);
  $('card-pengeluaran').innerText = formatRupiah(expense);
  $('card-count').innerText = list.length;
}

function renderRecentTransactions() {
  const list = sortByDateDesc(getFilteredTransactions()).slice(0, 5);
  const container = $('recent-transactions-list');

  if (list.length === 0) {
    container.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400 text-xs">Belum ada transaksi pada periode ini.</td></tr>';
    return;
  }

  container.innerHTML = list.map((t) => `
    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
      <td class="p-4 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">${escapeHtml(t.date)}</td>
      <td class="p-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">${escapeHtml(t.category)}</span></td>
      <td class="p-4 text-slate-900 dark:text-slate-100 font-medium">${escapeHtml(t.description) || '-'}</td>
      <td class="p-4 text-right font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}">
        ${t.type === 'income' ? '+' : '-'} ${formatRupiah(t.amount)}
      </td>
    </tr>
  `).join('');
}

function renderTransactionsTable() {
  const search = $('filter-search').value.toLowerCase();
  const type = $('filter-type').value;
  const category = $('filter-category').value;

  const filtered = sortByDateDesc(transactions.filter((t) => {
    const matchSearch =
      (t.description || '').toLowerCase().includes(search) ||
      (t.category || '').toLowerCase().includes(search);
    const matchType = type === 'all' || t.type === type;
    const matchCategory = category === 'all' || t.category === category;
    return matchSearch && matchType && matchCategory;
  }));

  const tbody = $('transactions-table-body');

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-400 text-sm">Tidak ditemukan transaksi yang sesuai.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((t) => `
    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
      <td class="p-4 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">${escapeHtml(t.date)}</td>
      <td class="p-4">
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${t.type === 'income' ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'}">
          ${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
        </span>
      </td>
      <td class="p-4 font-medium text-slate-700 dark:text-slate-300">${escapeHtml(t.category)}</td>
      <td class="p-4 text-slate-900 dark:text-white font-medium">${escapeHtml(t.description) || '-'}</td>
      <td class="p-4 text-right font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}">
        ${formatRupiah(t.amount)}
      </td>
      <td class="p-4 text-center">
        <div class="flex items-center justify-center gap-2">
          <button onclick="editTransaction('${escapeHtml(t.id)}')" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteTransaction('${escapeHtml(t.id)}')" class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <i data-lucide="trash" class="w-4 h-4"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderReportsView() {
  const list = getFilteredTransactions();
  let income = 0;
  let expense = 0;
  const categoryTotals = {};

  list.forEach((t) => {
    const amount = Number(t.amount);
    if (t.type === 'income') {
      income += amount;
    } else {
      expense += amount;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
    }
  });

  // Rincian per kategori
  const container = $('reports-category-breakdown');
  const categories = Object.keys(categoryTotals);

  if (categories.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 py-4">Belum ada pengeluaran dicatat.</p>';
  } else {
    container.innerHTML = categories.map((cat) => {
      const amount = categoryTotals[cat];
      const pct = expense > 0 ? Math.round((amount / expense) * 100) : 0;
      return `
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>${escapeHtml(cat)}</span>
            <span>${formatRupiah(amount)} (${pct}%)</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div class="bg-blue-600 h-full rounded-full" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Rasio pengeluaran terhadap pemasukan
  const ratio = income > 0
    ? Math.min(Math.round((expense / income) * 100), 100)
    : (expense > 0 ? 100 : 0);

  $('report-ratio-text').innerText = `${ratio}%`;
  $('report-ratio-bar').style.width = `${ratio}%`;

  const advice = $('report-financial-advice');
  if (ratio > 80) {
    advice.innerText = 'Peringatan: Pengeluaran Anda melebihi 80% dari total pemasukan. Pertimbangkan untuk mengurangi pengeluaran sekunder.';
    advice.className = 'p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300 text-xs font-medium';
  } else {
    advice.innerText = 'Kondisi keuangan sehat. Pengeluaran Anda terkendali di bawah 80% dari pemasukan.';
    advice.className = 'p-4 rounded-xl border border-green-200 bg-green-50 text-green-800 dark:bg-green-950/30 dark:border-green-900 dark:text-green-300 text-xs font-medium';
  }
}

/* ---------- Grafik ---------- */

function renderCharts() {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  renderMonthlyChart(textColor, gridColor);
  renderCategoryChart(isDark, textColor);
}

function renderMonthlyChart(textColor, gridColor) {
  const income = Array(12).fill(0);
  const expense = Array(12).fill(0);

  transactions.forEach((t) => {
    const month = new Date(t.date).getMonth();
    if (t.type === 'income') income[month] += Number(t.amount);
    else expense[month] += Number(t.amount);
  });

  if (chartMonthly) chartMonthly.destroy();

  chartMonthly = new Chart($('chart-monthly').getContext('2d'), {
    type: 'bar',
    data: {
      labels: MONTH_LABELS,
      datasets: [
        { label: 'Pemasukan', data: income, backgroundColor: '#16A34A', borderRadius: 6 },
        { label: 'Pengeluaran', data: expense, backgroundColor: '#DC2626', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor, font: { family: 'Inter' } } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      }
    }
  });
}

function renderCategoryChart(isDark, textColor) {
  const totals = {};
  getFilteredTransactions()
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
    });

  const labels = Object.keys(totals);

  if (chartCategory) chartCategory.destroy();

  const ctx = $('chart-category').getContext('2d');

  if (labels.length === 0) {
    chartCategory = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Belum Ada Data'],
        datasets: [{ data: [1], backgroundColor: [isDark ? '#334155' : '#E2E8F0'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    return;
  }

  chartCategory = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: Object.values(totals), backgroundColor: CHART_COLORS.slice(0, labels.length) }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Inter', size: 11 } } }
      }
    }
  });
}

/* ---------- Modal transaksi ---------- */

function setModalType(type) {
  modalType = type;
  const isExpense = type === 'expense';

  $('btn-type-expense').className = `${CLASS.typeBase} ${isExpense ? CLASS.typeExpense : CLASS.typeIdle}`;
  $('btn-type-income').className = `${CLASS.typeBase} ${isExpense ? CLASS.typeIdle : CLASS.typeIncome}`;

  $('tx-category').innerHTML = CATEGORIES[type]
    .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join('');
}

function openModal(editId = null) {
  $('modal-transaction').classList.remove('hidden');

  const item = editId ? transactions.find((t) => t.id === editId) : null;

  if (item) {
    $('modal-title').innerText = 'Edit Transaksi';
    $('tx-id').value = item.id;
    $('tx-date').value = item.date;
    $('tx-amount').value = item.amount;
    $('tx-description').value = item.description || '';
    setModalType(item.type);
    $('tx-category').value = item.category;
    return;
  }

  $('modal-title').innerText = 'Tambah Transaksi';
  $('tx-id').value = '';
  $('tx-date').value = new Date().toISOString().split('T')[0];
  $('tx-amount').value = '';
  $('tx-description').value = '';
  setModalType('expense');
}

function closeModal() {
  $('modal-transaction').classList.add('hidden');
}

function handleSaveTransaction(e) {
  e.preventDefault();

  const id = $('tx-id').value;
  const date = $('tx-date').value;
  const amount = parseFloat($('tx-amount').value);
  const category = $('tx-category').value;
  const description = $('tx-description').value;

  if (!date || isNaN(amount) || amount <= 0) {
    showToast('Harap isi tanggal dan jumlah dengan benar', 'warning');
    return;
  }

  if (id) {
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx !== -1) {
      transactions[idx] = { id, date, type: modalType, category, amount, description };
      showToast('Transaksi berhasil diperbarui!', 'success');
    }
  } else {
    transactions.unshift({ id: 'tx_' + Date.now(), date, type: modalType, category, amount, description });
    showToast('Transaksi baru ditambahkan!', 'success');
  }

  saveData();
  renderAll();
  closeModal();
}

function editTransaction(id) {
  openModal(id);
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveData();
  renderAll();
  showToast('Transaksi berhasil dihapus', 'info');
}

/* ---------- Ekspor / impor CSV ---------- */

function exportToCSV() {
  if (transactions.length === 0) {
    showToast('Tidak ada transaksi untuk diekspor', 'warning');
    return;
  }

  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Keterangan'];
  const rows = transactions.map((t) => [
    t.id, t.date, t.type, quote(t.category), t.amount, quote(t.description)
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `fintrack_cadangan_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('File CSV berhasil diunduh!', 'success');
}

/** Memecah satu baris CSV dengan memperhatikan tanda kutip. */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function importFromCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const lines = e.target.result.split(/\r\n|\n/).filter((line) => line.trim() !== '');

      if (lines.length < 2) {
        showToast('File CSV kosong atau format tidak valid', 'danger');
        return;
      }

      const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
      const find = (...keys) => header.findIndex((h) => keys.some((k) => h.includes(k)));

      const idIdx = find('id');
      const dateIdx = find('tanggal', 'date');
      const typeIdx = find('tipe', 'type');
      const catIdx = find('kategori', 'category');
      const amountIdx = find('jumlah', 'amount');
      const descIdx = find('keterangan', 'description', 'note');

      if ([dateIdx, typeIdx, catIdx, amountIdx].includes(-1)) {
        showToast('Format CSV tidak sesuai (diperlukan kolom: Tanggal, Tipe, Kategori, Jumlah)', 'danger');
        return;
      }

      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 4) continue;

        const typeRaw = (cols[typeIdx] || '').toLowerCase();
        const type = (typeRaw.includes('masuk') || typeRaw === 'income') ? 'income' : 'expense';
        const amount = parseFloat((cols[amountIdx] || '').replace(/[^0-9.-]+/g, '')) || 0;
        const date = cols[dateIdx] || '';

        if (amount > 0 && date) {
          imported.push({
            id: (idIdx !== -1 && cols[idIdx]) ? cols[idIdx] : `tx_${Date.now()}_${i}`,
            date,
            type,
            category: cols[catIdx] || 'Lainnya',
            amount,
            description: descIdx !== -1 ? cols[descIdx] : ''
          });
        }
      }

      if (imported.length === 0) {
        showToast('Tidak ada transaksi valid yang dapat diimpor dari file CSV', 'warning');
        return;
      }

      transactions = imported;
      saveData();
      renderAll();
      showToast(`Berhasil mengimpor ${imported.length} transaksi dari CSV!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal membaca file CSV: ' + err.message, 'danger');
    }
  };

  reader.readAsText(file);
  event.target.value = ''; // reset agar file yang sama bisa dipilih lagi
}

/* ---------- Hapus semua data ---------- */

function promptResetData() {
  $('modal-confirm').classList.remove('hidden');
}

function closeConfirmModal() {
  $('modal-confirm').classList.add('hidden');
}

function executeResetData() {
  transactions = [];
  saveData();
  renderAll();
  closeConfirmModal();
  showToast('Seluruh data berhasil dihapus!', 'info');
}

/* ---------- Notifikasi toast ---------- */

function showToast(message, type = 'info') {
  const colors = {
    success: 'bg-green-600 text-white',
    danger: 'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-slate-800 text-white'
  };

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto px-4 py-3 rounded-xl shadow-lg font-medium text-xs flex items-center gap-2 transform transition-all duration-300 ${colors[type] || colors.info}`;
  toast.textContent = message;

  $('toast-container').appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
