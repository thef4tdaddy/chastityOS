// File: src/pages/HotjarScript.jsx
import { useEffect } from 'react';

const HotjarScript = ({ isTrackingAllowed }) => {
  useEffect(() => {
    if (!isTrackingAllowed || typeof window === 'undefined') return;

    if (!window.hj) {
      (function(h, o, t, j, a, r) {
        h.hj = h.hj || function() {
          (h.hj.q = h.hj.q || []).push(arguments);
        };
        h._hjSettings = { hjid: 6424571, hjsv: 6 };
        a = o.getElementsByTagName('head')[0];
        r = o.createElement('script'); r.async = 1;
        r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
        a.appendChild(r);
      })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

      console.log('[Hotjar Debug] Injected Hotjar script.');
    } else {
      console.log('[Hotjar Debug] Hotjar already initialized.');
    }
  }, [isTrackingAllowed]);

  return null;
};

export default HotjarScript;
