// Email transazionali: link + markup brandizzato in UN solo posto.
// I link NON devono mai puntare al dominio Supabase: invece di usare
// properties.action_link (che fa hop su *.supabase.co), costruiamo a mano un
// link a /auth/confirm sul dominio webapp usando token_hash + type che
// generateLink restituisce. La verifica vera avviene poi su /auth/confirm.

// Sottoinsieme di ciò che supabase.auth.admin.generateLink mette in `properties`.
export interface GenerateLinkProperties {
  hashed_token?: string;
  verification_type?: string;
}

/**
 * Link a /auth/confirm sul dominio della webapp. `next` è il path interno a cui
 * tornare dopo la verifica (es. "/invito" o "/invito?reset=1").
 * Ritorna null se mancano i campi necessari (il chiamante decide il fallback).
 */
export function confirmUrl(
  origin: string,
  props: GenerateLinkProperties | null | undefined,
  next: string,
): string | null {
  const tokenHash = props?.hashed_token;
  const type = props?.verification_type;
  if (!tokenHash || !type) return null;
  const u = new URL("/auth/confirm", origin);
  u.searchParams.set("token_hash", tokenHash);
  u.searchParams.set("type", type);
  u.searchParams.set("next", next);
  return u.toString();
}

export interface EmailContent {
  origin: string; // per gli asset (logo) in URL assoluto
  preheader: string; // testo anteprima nascosto nei client
  title: string;
  /** Paragrafi già in HTML, es. "<p>Ciao Marco,</p><p>…</p>". Testo fidato (no input utente grezzo). */
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  /** Versione testuale completa (fallback client text-only). */
  text: string;
}

// Palette/font allineati al frontend pubblico (src/styles/styles.css).
const C = {
  bg: "#F8F4EC",
  card: "#FFFFFF",
  text: "#352516",
  muted: "#6b5d4f",
  primary: "#E84C35",
  heading: "#4E98CA",
  border: "rgba(53,37,22,.12)",
};
const FONT_BODY = "'Outfit', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";
const FONT_TITLE = "'Fraunces', Georgia, 'Times New Roman', serif";

const PNRR =
  "Finanziato dall'Unione Europea — NextGenerationEU, PNRR Missione 1 Componente 3 " +
  "(M1C3) Investimento 2.1 «Attrattività dei Borghi Storici», gestito dal Ministero della Cultura.";
const FANTASIA =
  "Nomi e personaggi sono di fantasia: la storia è ideata a fini didattici come " +
  "riflessione sui personaggi dell'opera verghiana.";

/** Costruisce HTML email (table layout, CSS inline) + versione testo. */
export function renderEmail(c: EmailContent): { html: string; text: string } {
  const html = `<!-- preheader --><div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};margin:0;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.card};border-radius:16px;overflow:hidden;border:1px solid ${C.border}">
      <tr><td style="padding:28px 32px 8px;text-align:center">
        <span style="font-family:${FONT_TITLE};font-size:26px;font-weight:700;color:${C.primary};letter-spacing:.5px">Verga's World</span>
      </td></tr>
      <tr><td style="padding:8px 32px 0">
        <h1 style="margin:16px 0 12px;font-family:${FONT_TITLE};font-weight:600;font-size:24px;line-height:1.2;color:${C.heading}">${esc(c.title)}</h1>
        <div style="font-family:${FONT_BODY};font-size:16px;line-height:1.6;color:${C.text}">${c.bodyHtml}</div>
      </td></tr>
      <tr><td style="padding:24px 32px 8px" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td bgcolor="${C.primary}" style="border-radius:100px">
            <a href="${esc(c.ctaUrl)}" style="display:inline-block;padding:14px 32px;font-family:${FONT_BODY};font-weight:700;font-size:16px;color:#fff;text-decoration:none">${esc(c.ctaLabel)}</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:8px 32px 28px">
        <p style="margin:12px 0 0;font-family:${FONT_BODY};font-size:13px;line-height:1.5;color:${C.muted}">
          Se il pulsante non funziona, copia e incolla questo indirizzo nel browser:<br>
          <a href="${esc(c.ctaUrl)}" style="color:${C.heading};word-break:break-all">${esc(c.ctaUrl)}</a>
        </p>
      </td></tr>
      <tr><td style="padding:20px 32px;background:${C.bg};border-top:1px solid ${C.border}">
        <p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:12px;line-height:1.5;color:${C.muted}">
          Casa Museo Giovanni Verga · Vizzini (CT), Sicilia.
        </p>
        <p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:11px;line-height:1.5;color:${C.muted}">${PNRR}</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:11px;line-height:1.5;color:${C.muted}">${FANTASIA}</p>
      </td></tr>
    </table>
  </td></tr>
</table>`;

  const text = `${c.text}\n\n${c.ctaUrl}\n\n— Verga's World · Casa Museo Giovanni Verga, Vizzini (CT)`;
  return { html, text };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
