import Component from "@glimmer/component";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import { ajax } from "discourse/lib/ajax";

export default class PluginPage extends Component {
  @service router;
  @tracked loading = true;
  @tracked title = "";
  @tracked cooked = "";

  constructor() {
    super(...arguments);
    // coge el slug actual de la ruta
    const slug = this.currentSlug();
    this.load(slug);
  }

  currentSlug() {
    // router.currentRoute?.params.slug (Ember 4+)
    let params = this.router?.currentRoute?.params;
    return (params && params.slug) || null;
  }

  async load(slug) {
    if (!slug) return;
    this.loading = true;
    try {
      const json = await ajax(`/plugin-pages/${encodeURIComponent(slug)}.json`);
      this.title = json.title || slug;
      this.cooked = json.cooked || "";
      document.title = this.title; // set título
    } catch (e) {
      // deja al router delegar 404 si hiciera falta
      // eslint-disable-next-line no-console
      console.error("[custom-pages] load error", e);
    } finally {
      this.loading = false;
    }
  }

  // por si se navega entre slugs sin recargar
  @action
  didInsert() {
    this._onChange = () => {
      const slug = this.currentSlug();
      this.load(slug);
    };
    // escúchalo al cambiar ruta SPA
    window.addEventListener("discourse-page:changed", this._onChange);
  }

  willDestroy() {
    window.removeEventListener("discourse-page:changed", this._onChange);
    super.willDestroy?.();
  }
}
