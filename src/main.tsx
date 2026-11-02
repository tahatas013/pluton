import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import './styles/app.css';
import { App } from './App';

// Yeni sürüm yayınlanınca uygulama kendini yeniler. Ana ekrandan açılan uygulama
// arka plandan geri gelince sayfa yenilenmediği için o anda ve saatte bir kontrol edilir.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => {
      if (navigator.onLine) reg.update().catch(() => {});
    };
    setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  },
});

createRoot(document.getElementById('root')!).render(<App />);
