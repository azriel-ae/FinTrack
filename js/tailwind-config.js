/* Konfigurasi Tailwind CSS (CDN) */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#1D4ED8', light: '#DBEAFE' },
        success: { DEFAULT: '#16A34A', light: '#DCFCE7' },
        danger: { DEFAULT: '#DC2626', light: '#FEE2E2' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7' }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  }
};
