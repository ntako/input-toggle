import Adw from 'gi://Adw';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import SettingsManager from './settingsManager.js';
import * as Lib from './lib.js';


export default class InputTogglePrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settingsManager = new SettingsManager(this.getSettings());

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({ title: _('Devices') });

        // Recupera i dispositivi disponibili
        const allDevices = Lib.parseInputDevices();
        const selected = new Set(settingsManager.getStrv(Lib.SETTINGS_KEY));

        // Crea uno switch per ogni device
        for (const dev of allDevices) {
            const row = new Adw.SwitchRow({
                title: dev.name,
                active: selected.has(dev.name),
            });

            row.connect('notify::active', (widget) => {
                if (widget.active)
                    selected.add(dev.name);
                else
                    selected.delete(dev.name);

                settingsManager.setStrv(Lib.SETTINGS_KEY, [...selected]);
            });

            group.add(row);
        }

        page.add(group);
        window.add(page);
    }
}
