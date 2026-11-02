import { useRef, type ChangeEvent } from 'react';
import { useCatalog } from '../data/catalog';
import { brickVars } from '../data/colors';
import { actions, useStore } from '../data/store';
import { dateTR, num } from '../lib/format';
import { haptic } from '../lib/haptics';
import { ShareIcon, UploadIcon } from '../ui/Icons';
import { showToast } from '../ui/Toast';

export function Settings() {
  const cat = useCatalog();
  const ownedCount = useStore((s) => Object.keys(s.owned).length);
  const wishCount = useStore((s) => Object.keys(s.wish).length);
  const fileRef = useRef<HTMLInputElement>(null);

  async function exportBackup() {
    haptic();
    const name = `pluton-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([actions.exportJSON()], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Plüton yedeği' });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast('Yedek indirildi');
  }

  async function importBackup(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const r = actions.importJSON(await f.text());
      showToast(`${r.owned} set ve ${r.wish} istek yüklendi`);
    } catch (err) {
      showToast((err as Error).message);
    }
  }

  return (
    <div className="settings">
      <header className="title-block tile">
        <div className="eyebrow">Plüton</div>
        <h1>Ayarlar</h1>
      </header>

      <h3 className="label-tile small group-label">Yedek</h3>
      <div className="tile group">
        <button className="row row-btn" onClick={exportBackup}>
          <span className="row-ic brick" style={brickVars('blue')}>
            <ShareIcon size={18} />
          </span>
          <span className="row-text">
            <b>Yedek al</b>
            <small>
              {ownedCount} set ve {wishCount} isteği dosyaya kaydet
            </small>
          </span>
        </button>
        <button className="row row-btn" onClick={() => fileRef.current?.click()}>
          <span className="row-ic brick" style={brickVars('green')}>
            <UploadIcon size={18} />
          </span>
          <span className="row-text">
            <b>Yedeği yükle</b>
            <small>Başka cihazdan aldığın yedeği ekle, hiçbir şey silinmez</small>
          </span>
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
      </div>
      <p className="note-tile tile">
        Veriler bu cihazda saklanır. iPhone'dan Mac'e geçmek için yedeği al, AirDrop ile Mac'e gönder, Mac'te
        “Yedeği yükle”ye dokun.
      </p>

      <h3 className="label-tile small group-label">Katalog</h3>
      <div className="tile group">
        <div className="row info">
          <span>Set sayısı</span>
          <b>{num(cat.sets.length)}</b>
        </div>
        <div className="row info">
          <span>Son güncelleme</span>
          <b>{dateTR(cat.generated)}</b>
        </div>
        <div className="row info">
          <span>Türkiye fiyatları</span>
          <b>{cat.trGenerated ? dateTR(cat.trGenerated) : '—'}</b>
        </div>
        <div className="row info">
          <span>Türkiye'de satışta</span>
          <b>{num(cat.sets.filter((x) => x.avail === 'tr').length)} set</b>
        </div>
        <div className="row info">
          <span>Kaynak</span>
          <b>{cat.source === 'dev-fixture' ? 'Örnek veri' : 'Rebrickable + lego.tr'}</b>
        </div>
      </div>

      <h3 className="label-tile small group-label">Ana ekrana ekle</h3>
      <div className="tile group">
        <div className="row info stacked">
          <b>iPhone</b>
          <span>Safari → Paylaş → Ana Ekrana Ekle</span>
        </div>
        <div className="row info stacked">
          <b>Mac</b>
          <span>Safari → Dosya → Dock'a Ekle</span>
        </div>
      </div>

      <p className="note-tile tile legal">
        Plüton · sürüm {new Date(__BUILD__).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
        <br />
        Katalog her sabah kendiliğinden güncellenir. Set verileri Rebrickable'dan, Türkiye fiyat ve stokları
        resmi LEGO Türkiye mağazası lego.tr'den gelir. LEGO®, LEGO Group'un ticari markasıdır; bu uygulama LEGO
        Group ile bağlantılı değildir.
      </p>
    </div>
  );
}
