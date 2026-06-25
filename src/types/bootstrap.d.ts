// Bootstrap 5 non espone tipi per l'import diretto del bundle JS. Dichiarazione
// minima per il solo Modal usato nei pannelli admin (apertura programmatica).
declare module "bootstrap" {
  export class Modal {
    constructor(element: Element | null, options?: Record<string, unknown>);
    show(): void;
    hide(): void;
    static getOrCreateInstance(element: Element): Modal;
  }
}
