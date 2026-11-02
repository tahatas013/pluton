import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { themeLabel, useCatalog } from '../data/catalog';
import { brickVars } from '../data/colors';
import { PRIOS, STATUSES, actions, useStore } from '../data/store';
import { num } from '../lib/format';
import { haptic } from '../lib/haptics';
import { instructionsUrl, rebrickableUrl, shopLinks } from '../lib/links';
import { Burst, Section } from '../ui/Bits';
import { BrickChoice } from '../ui/Choice';
import {
  BookIcon,
  BrickIcon,
  CalendarIcon,
  CheckIcon,
  ExternalIcon,
  FigureIcon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
} from '../ui/Icons';
import { Rail, SetImage } from '../ui/SetBits';
import { useSheetDrag } from '../ui/Sheet';
import { showToast } from '../ui/Toast';

export function SetDetail({ num: setNum }: { num: string }) {
  const cat = useCatalog();
  const s = cat.byNum.get(setNum);
  const owned = useStore((st) => st.owned[setNum]);
  const wish = useStore((st) => st.wish[setNum]);
  const startDrag = useSheetDrag();
  const root = useRef<HTMLDivElement>(null);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    actions.viewed(setNum);
    root.current?.closest('.sheet-scroll')?.scrollTo({ top: 0 });
  }, [setNum]);

  const related = useMemo(() => {
    if (!s) return [];
    return cat.sets
      .filter((x) => x.theme === s.theme && x.num !== s.num)
      .sort((a, b) => Math.abs(a.year - s.year) - Math.abs(b.year - s.year) || b.parts - a.parts)
      .slice(0, 12);
  }, [cat, s]);

  if (!s) return <p className="foot tile">Bu set katalogda bulunamadı.</p>;

  const add = () => {
    haptic();
    const fromWish = !!wish;
    actions.addOwned(s.num);
    setBurst((b) => b + 1);
    showToast(fromWish ? 'İstek listesinden koleksiyona taşındı' : 'Koleksiyona eklendi');
  };

  const remove = () => {
    haptic();
    const prev = actions.removeOwned(s.num);
    if (prev) showToast('Koleksiyondan çıkarıldı', { label: 'Geri al', run: () => actions.restoreOwned(prev) });
  };

  const toggleWish = () => {
    haptic();
    const on = actions.toggleWish(s.num);
    showToast(on ? 'İstek listesine eklendi' : 'İstek listesinden çıkarıldı');
  };

  return (
    <div className="detail" ref={root}>
      <div className="detail-hero tile" onPointerDown={startDrag}>
        <SetImage set={s} className="detail-img" />
      </div>

      <div className="detail-info tile">
        <div className="eyebrow">{themeLabel(cat, s)}</div>
        <h2>{s.name}</h2>
        <span className="chip-num big">{s.base}</span>
      </div>

      <div className="specs">
        <div className="spec brick studs" style={brickVars('blue')}>
          <BrickIcon size={18} />
          <b>{num(s.parts)}</b>
          <small>parça</small>
        </div>
        <div className="spec brick studs" style={brickVars('red')}>
          <FigureIcon size={18} />
          <b>{s.figs}</b>
          <small>minifigür</small>
        </div>
        <div className="spec brick studs" style={brickVars('green')}>
          <CalendarIcon size={18} />
          <b>{s.year}</b>
          <small>çıkış yılı</small>
        </div>
      </div>

      <div className="action-zone">
      <Burst trigger={burst} />
      <AnimatePresence mode="popLayout" initial={false}>
        {owned ? (
          <motion.div
            key="owned"
            className="panel tile owned"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
          >
            <div className="owned-head">
              <span className="owned-check">
                <CheckIcon size={15} />
              </span>
              Koleksiyonunda
            </div>
            <div className="panel-title">Durumu</div>
            <div className="choice-2">
              <BrickChoice
                label="Durumu"
                options={STATUSES}
                value={owned.status}
                onChange={(v) => actions.patchOwned(s.num, { status: v })}
              />
            </div>
            <div className="qty-row">
              <span className="panel-title">Adet</span>
              <div className="stepper">
                <button
                  className="tile press"
                  aria-label="Azalt"
                  disabled={owned.qty <= 1}
                  onClick={() => {
                    haptic();
                    actions.patchOwned(s.num, { qty: Math.max(1, owned.qty - 1) });
                  }}
                >
                  <MinusIcon size={18} />
                </button>
                <b aria-live="polite">{owned.qty}</b>
                <button
                  className="tile press"
                  aria-label="Artır"
                  onClick={() => {
                    haptic();
                    actions.patchOwned(s.num, { qty: Math.min(99, owned.qty + 1) });
                  }}
                >
                  <PlusIcon size={18} />
                </button>
              </div>
            </div>
            <textarea
              className="note"
              placeholder="Not ekle (ör. doğum günü hediyesi, eksik parça…)"
              defaultValue={owned.note ?? ''}
              maxLength={500}
              onBlur={(e) => actions.patchOwned(s.num, { note: e.target.value.trim() || undefined })}
            />
            <button className="text-btn" onClick={remove}>
              Koleksiyondan çıkar
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="add"
            className="actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <button className="brick press btn-primary" style={brickVars('red')} onClick={add}>
              <PlusIcon size={20} /> Koleksiyona ekle
            </button>
            <button
              className={`press btn-square ${wish ? 'brick' : 'tile'}`}
              style={wish ? brickVars('pink') : undefined}
              aria-pressed={!!wish}
              aria-label={wish ? 'İstek listesinden çıkar' : 'İstek listesine ekle'}
              onClick={toggleWish}
            >
              <HeartIcon size={24} filled={!!wish} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {wish && !owned && (
        <div className="panel tile">
          <div className="panel-title">Ne kadar istiyorsun?</div>
          <BrickChoice
            label="Öncelik"
            options={PRIOS}
            value={wish.prio}
            onChange={(v) => actions.setPrio(s.num, v)}
          />
        </div>
      )}

      <div className="panel tile">
        <div className="panel-title">Türkiye'de ara</div>
        <div className="shops">
          {shopLinks(s).map((l) => (
            <a key={l.name} className="shop press" href={l.url} target="_blank" rel="noopener noreferrer">
              {l.name}
              <ExternalIcon size={15} />
            </a>
          ))}
        </div>
        <p className="panel-note">Mağazada “LEGO {s.base}” araması açılır.</p>
      </div>

      <a className="tile press link-row" href={instructionsUrl(s)} target="_blank" rel="noopener noreferrer">
        <BookIcon size={20} /> Montaj talimatları
        <ExternalIcon size={16} />
      </a>
      <a className="tile press link-row" href={rebrickableUrl(s)} target="_blank" rel="noopener noreferrer">
        <BrickIcon size={20} /> Parça listesi
        <ExternalIcon size={16} />
      </a>

      {related.length > 0 && (
        <Section title="Aynı temadan">
          <Rail sets={related} />
        </Section>
      )}
    </div>
  );
}
