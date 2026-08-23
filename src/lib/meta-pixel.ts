declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

const pixelsInicializados = new Set<string>();

/**
 * Inicializa o Meta Pixel no navegador do cliente
 */
export function initMetaPixel(pixelId?: string | null) {
  if (!pixelId || typeof window === 'undefined') return;

  // Evita inicializar o Meta Pixel dentro de iframes de preview (como o AI Studio)
  // onde o navegador impõe regras rígidas de segurança de sandbox, tornando o window.fetch um getter-only não configurável.
  const isIframe = window.self !== window.top;
  if (isIframe) {
    console.info('[Meta Pixel] Ignorando inicialização do Meta Pixel dentro do iframe de preview do AI Studio.');
    return;
  }

  const cleanId = pixelId.trim();
  if (!cleanId || pixelsInicializados.has(cleanId)) return;

  try {
    if (!window.fbq) {
      /* eslint-disable */
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
    }

    window.fbq('init', cleanId);
    window.fbq('track', 'PageView');
    pixelsInicializados.add(cleanId);
    console.log(`[Meta Pixel] Pixel ${cleanId} inicializado no navegador.`);
  } catch (err) {
    console.warn('[Meta Pixel] Erro ao inicializar Pixel:', err);
  }
}

/**
 * Evento ViewContent - ao visualizar a rifa
 */
export function trackViewContent(pixelId: string | null | undefined, data: {
  contentIds: string[];
  contentName: string;
  value?: number;
  currency?: string;
}) {
  if (!pixelId || typeof window === 'undefined') return;
  initMetaPixel(pixelId);
  try {
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: data.contentIds,
        content_name: data.contentName,
        content_type: 'product',
        value: data.value || 0,
        currency: data.currency || 'BRL'
      });
    }
  } catch (e) {}
}

/**
 * Evento InitiateCheckout - ao abrir a caixa de seleção / checkout
 */
export function trackInitiateCheckout(pixelId: string | null | undefined, data: {
  contentIds: string[];
  value: number;
  numItems: number;
  currency?: string;
}, eventId?: string) {
  if (!pixelId || typeof window === 'undefined') return;
  initMetaPixel(pixelId);
  try {
    if (window.fbq) {
      const opts = eventId ? { eventID: eventId } : undefined;
      window.fbq('track', 'InitiateCheckout', {
        content_ids: data.contentIds,
        content_type: 'product',
        value: data.value,
        num_items: data.numItems,
        currency: data.currency || 'BRL'
      }, opts);
    }
  } catch (e) {}
}

/**
 * Evento AddPaymentInfo - ao selecionar o método de pagamento
 */
export function trackAddPaymentInfo(pixelId: string | null | undefined, data: {
  contentIds: string[];
  value: number;
  currency?: string;
}) {
  if (!pixelId || typeof window === 'undefined') return;
  initMetaPixel(pixelId);
  try {
    if (window.fbq) {
      window.fbq('track', 'AddPaymentInfo', {
        content_ids: data.contentIds,
        content_type: 'product',
        value: data.value,
        currency: data.currency || 'BRL'
      });
    }
  } catch (e) {}
}

/**
 * Evento Purchase - quando a compra é confirmada no frontend
 * eventId deve ser idêntico ao pedido.id enviado no CAPI para DEDUPLICAÇÃO
 */
export function trackPurchase(pixelId: string | null | undefined, data: {
  contentIds: string[];
  value: number;
  numItems: number;
  currency?: string;
}, eventId: string) {
  if (!pixelId || typeof window === 'undefined') return;
  initMetaPixel(pixelId);
  try {
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        content_ids: data.contentIds,
        content_type: 'product',
        value: data.value,
        num_items: data.numItems,
        currency: data.currency || 'BRL'
      }, { eventID: eventId });
      console.log(`[Meta Pixel] Evento Purchase disparado no browser (Event ID: ${eventId}, Valor: R$ ${data.value})`);
    }
  } catch (e) {}
}
