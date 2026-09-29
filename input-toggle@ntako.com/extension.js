import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension, gettext as _, ngettext, pgettext} from 'resource:///org/gnome/shell/extensions/extension.js';

import SettingsManager from './settingsManager.js';
import DynamicInputButton from './DynamicInputButton.js';
import * as Lib from './lib.js';

export default class InputToggleExtension extends Extension {
    enable() {
        log('[input-toggle] Enabling extension');

        this._settingsManager = new SettingsManager(this.getSettings());
        this._settings = this._settingsManager.settings;

        // Installa la policy pkexec se non presente (una tantum: il flag
        // viene aggiornato solo se l'installazione è andata davvero a buon fine)
        if (!this._settingsManager.getBoolean(Lib.POLICY_KEY)) {
            Lib.installPolicy(this.path, (success) => {
                if (success) {
                    this._settingsManager?.setBoolean(Lib.POLICY_KEY, true);
                    log('[input-toggle] Policy and scripts installed succesfully.');
                } else {
                    log('[input-toggle] Policy installation failed or was cancelled; will retry on next enable.');
                }
            });
        }

        // Ripristina lo stato salvato dei dispositivi (dopo leggero delay)
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
            const devices = this._settingsManager.getJson(Lib.DEVICES_KEY);
            if (devices.length > 0) {
                log(`[input-toggle] Restoring state ${devices.length} devices`);
                for (const dev of devices) {
                    try {
                        Lib.setEnabled(dev.device, dev.enabled);
                    } catch (e) {
                        log(`[input-toggle] Error restoring ${dev.device}: ${e}`);
                    }
                }
            }
            return GLib.SOURCE_REMOVE;
        });

        // Crea e aggiunge il pulsante nel pannello superiore
        this._button = new DynamicInputButton(this._settingsManager);
        Main.panel.addToStatusArea(this.uuid, this._button);

        log('[input-toggle] Extension enabled succesfully.');
    }

    disable() {
        log('[input-toggle] Disabling extension');

        // La policy pkexec resta installata tra un disable/enable e l'altro
        // (es. riavvii della shell, aggiornamenti): rimuoverla ad ogni disable
        // costringerebbe a una nuova autenticazione admin ad ogni enable.
        // La rimozione va fatta esplicitamente dalle Preferenze.

        if (this._button) {
            this._button.destroy();
            this._button = null;
        }

        if (this._settingsManager)
            this._settingsManager.disconnectAll();

        this._settings = null;
        this._settingsManager = null;

        log('[input-toggle] Extension disabled.');
    }
}
