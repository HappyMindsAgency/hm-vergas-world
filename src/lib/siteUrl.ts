// Origine canonica per i link nelle email (invito + reset password).
// In dev usa l'origine reale della richiesta (qualunque porta serva Astro), così il
// link punta al server effettivamente in ascolto. In produzione preferisce un valore
// stabile (PUBLIC_SITE_URL o il `site` di astro.config) così i link non dipendono
// dall'origine della richiesta e basta allow-listare UN URL su Supabase.
export function siteOrigin(requestUrl: URL): string {
  const configured = import.meta.env.DEV
    ? ""
    : import.meta.env.PUBLIC_SITE_URL || import.meta.env.SITE || "";
  return (configured || requestUrl.origin).replace(/\/+$/, "");
}
