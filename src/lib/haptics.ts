// iPhone'da Safari titreşim API'sini desteklemez; iOS 18+ "switch" kutusuna
// dokunma hissi verdiği için gizli bir switch'e tıklayarak hafif bir titreşim alınır.
// Desteklenmeyen yerde sessizce hiçbir şey yapmaz.
let label: HTMLLabelElement | null = null;

export function haptic() {
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(8);
      return;
    }
    if (!label) {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      input.id = 'pluton-haptic';
      input.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:0;height:0';
      input.setAttribute('aria-hidden', 'true');
      input.tabIndex = -1;
      label = document.createElement('label');
      label.htmlFor = input.id;
      label.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:0;height:0';
      label.setAttribute('aria-hidden', 'true');
      document.body.append(input, label);
    }
    label.click();
  } catch {
    /* dokunma hissi isteğe bağlı */
  }
}
