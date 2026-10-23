# FinTrack

Aplikasi pencatat keuangan pribadi (pemasukan & pengeluaran) berbasis web. Data disimpan di `localStorage` peramban, tanpa server.

## Fitur
- Dashboard ringkasan + grafik arus kas & kategori
- Tambah, ubah, hapus, dan cari transaksi
- Laporan rasio pengeluaran per kategori
- Ekspor / impor CSV
- Mode terang & gelap

## Struktur
```
fintrack/
├── index.html
├── css/style.css
└── js/
    ├── tailwind-config.js
    └── app.js
```

## Menjalankan
Buka `index.html` di peramban. Butuh internet untuk memuat Tailwind, Chart.js, Lucide, dan font Inter lewat CDN.
