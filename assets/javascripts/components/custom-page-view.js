import Component from "@glimmer/component";
import { service } from '@ember/service';
import { action } from "@ember/object";

export default class CustomPageView extends Component {
  @service("custom-pages") customPages;
  @service appEvents;

  // Cuando se inserta, nos suscribimos para rerenders manuales
  @action
  didInsert(element) {
    this._rerender = () => {
      // tocar una propiedad para refrescar si fuese necesario
      element.dataset.ts = Date.now();
    };
    this.appEvents?.on?.("custom-pages:rerender", this._rerender);
  }

  willDestroy() {
    this.appEvents?.off?.("custom-pages:rerender", this._rerender);
    super.willDestroy?.();
  }

  get isActive() {
    return this.customPages?.active;
  }

  get isLoading() {
    return this.customPages?.loading;
  }

  get title() {
    return this.customPages?.title || this.customPages?.slug;
  }

  get cooked() {
    return this.customPages?.cooked || "";
  }
}
