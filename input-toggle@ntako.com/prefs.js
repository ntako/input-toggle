import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
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
        this._buildMaintenanceGroup(page, settingsManager);
        window.add(page);
    }

    _buildMaintenanceGroup(page, settingsManager) {
        const maintenanceGroup = new Adw.PreferencesGroup({ title: _('Maintenance') });

        const removeRow = new Adw.ActionRow({
            title: _('Remove system integration'),
            subtitle: _('Uninstalls the polkit policy and helper script that were installed with admin rights'),
        });

        const removeButton = new Gtk.Button({
            label: _('Remove'),
            valign: Gtk.Align.CENTER,
            css_classes: ['destructive-action'],
        });
        removeButton.connect('clicked', () => {
            removeButton.sensitive = false;
            Lib.removePolicy(this.path, (success) => {
                removeButton.sensitive = true;
                if (success)
                    settingsManager.setBoolean(Lib.POLICY_KEY, false);
                else
                    log('[input-toggle] Failed to remove system policy and scripts.');
            });
        });

        removeRow.add_suffix(removeButton);
        maintenanceGroup.add(removeRow);
        page.add(maintenanceGroup);
    }
}
