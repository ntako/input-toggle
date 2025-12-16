import GObject from 'gi://GObject';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension, gettext as _, ngettext, pgettext} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Lib from './lib.js';


const DynamicInputButton = GObject.registerClass(
class DynamicInputButton extends PanelMenu.Button {
    _init(settingsManager) {
        super._init(0.5, 'Input Toggle');
        
        this._settingsManager = settingsManager;
        this._settings = this._settingsManager.settings;

        // Icona barra superiore
        const icon = new St.Icon({
            icon_name: 'input-tablet-symbolic',
            style_class: 'system-status-icon',
        });
        this.add_child(icon);

        // Ricrea il menu all'avvio
        this._reloadDevicesMenu();

        // Reattività: aggiorna menu quando cambiano i device o lo stato
        this._settingsManager.onChange(Lib.SETTINGS_KEY, () => this._reloadDevicesMenu());
        this._settingsManager.onChange('devices-state', () => this._reloadDevicesMenu());
    }

    _reloadDevicesMenu() {
        this.menu.removeAll();

        // Elenco dispositivi rilevati
        const devices = Lib.parseInputDevices();

        // Device visibili scelti in prefs
        const selectedNames = new Set(this._settingsManager.getStrv(Lib.SETTINGS_KEY));

        // Stato salvato in devices-state (JSON)
        const savedStates = this._settingsManager.getJson('devices-state');

        log(`[input-toggle] Devices found: ${devices.length}`);
        log(`[input-toggle] Selected: ${[...selectedNames].join(', ')}`);

        devices
            .filter(dev => selectedNames.has(dev.name))
            .forEach(dev => {
                let active = false;
                const saved = savedStates.find(d => d.device === dev.name);
                if (saved) active = saved.enabled;
                else {
                    try {
                        active = Lib.isEnabled(dev.name);
                    } catch (e) {
                        log(`[input-toggle] Error isEnabled(${dev.name}): ${e}`);
                    }
                }

                // Elemento menu con switch
                const item = new PopupMenu.PopupSwitchMenuItem(dev.name, active);
                item.connect('toggled', (widget, state) => {
                    try {
                        Lib.setEnabled(dev.name, state);
                        this._settingsManager.updateJsonItem('devices-state', 'device', dev.name, { enabled: state });

                        const toast = new Adw.Toast({
                            title: `${dev.name} ${state ? _('enabled') : _('disabled')}`,
                            timeout: 3,
                        });
                        Main.panel.add_toast(toast);
                    } catch (e) {
                        log(`[input-toggle] Errore setEnabled(${dev.name}): ${e}`);
                    }
                });

                this.menu.addMenuItem(item);
            });

        // Separatore + accesso alle impostazioni
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const prefsItem = new PopupMenu.PopupMenuItem(_('Open Preferences'));
        prefsItem.connect('activate', () => {
            try {
                this.openPreferences();
            } catch (e) {
                GLib.spawn_command_line_async('gnome-extensions prefs input-toggle@ntako.com');
            }
        });
        this.menu.addMenuItem(prefsItem);
    }

    destroy() {
        if (this._settingsManager)
            this._settingsManager.disconnectAll();
        super.destroy();
    }
});

export default DynamicInputButton;
