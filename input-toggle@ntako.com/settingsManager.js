export default class SettingsManager {
    constructor(settings) {
        this.settings = settings;
        this._signals = [];
    }

    getString(key) {
        try {
            return this.settings.get_string(key);
        } catch (e) {
            log(`[input-toggle] Error reading string key "${key}": ${e}`);
            return '';
        }
    }

    setString(key, value) {
        try {
            this.settings.set_string(key, value);
        } catch (e) {
            log(`[input-toggle] Error writing string key "${key}": ${e}`);
        }
    }

    getStrv(key) {
        try {
            return this.settings.get_strv(key);
        } catch (e) {
            log(`[input-toggle] Error reading array key "${key}": ${e}`);
            return [];
        }
    }

    setStrv(key, value) {
        try {
            this.settings.set_strv(key, Array.isArray(value) ? value : []);
        } catch (e) {
            log(`[input-toggle] Error writing array key "${key}": ${e}`);
        }
    }

    getBoolean(key) {
        try {
            return this.settings.get_boolean(key);
        } catch (e) {
            log(`[input-toggle] Error reading boolean key "${key}": ${e}`);
            return false;
        }
    }

    setBoolean(key, value) {
        try {
            this.settings.set_boolean(key, !!value);
        } catch (e) {
            log(`[input-toggle] Error writing boolean key "${key}": ${e}`);
        }
    }

    // ============================================================
    //  JSON STORAGE
    // ============================================================

    getJson(key) {
        try {
            const raw = this.settings.get_string(key);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            log(`[input-toggle] Error reading JSON key "${key}": ${e}`);
            return [];
        }
    }

    setJson(key, value) {
        try {
            this.settings.set_string(key, JSON.stringify(value || []));
        } catch (e) {
            log(`[input-toggle] Error writing JSON key "${key}": ${e}`);
        }
    }

    updateJsonItem(key, matchField, matchValue, newData) {
        let data = this.getJson(key);
        const index = data.findIndex(item => item[matchField] === matchValue);
        if (index !== -1)
            data[index] = { ...data[index], ...newData };
        else
            data.push({ [matchField]: matchValue, ...newData });
        this.setJson(key, data);
    }

    // ============================================================
    //  SIGNALS (reattività ai cambiamenti)
    // ============================================================

    onChange(key, callback) {
        try {
            const id = this.settings.connect(`changed::${key}`, () => callback());
            this._signals.push(id);
        } catch (e) {
            log(`[input-toggle] Error connecting signal for "${key}": ${e}`);
        }
    }

    disconnectAll() {
        for (const id of this._signals) {
            try {
                this.settings.disconnect(id);
            } catch (_) {}
        }
        this._signals = [];
    }

    // ============================================================
    //  DEBUG / UTILITIES
    // ============================================================

    dump() {
        const keys = this.settings.list_keys();
        const out = {};
        for (const k of keys) {
            try {
                out[k] = this.settings.get_value(k).deep_unpack();
            } catch (_) {
                out[k] = '(reading error)';
            }
        }
        log(`[input-toggle] Settings dump: ${JSON.stringify(out, null, 2)}`);
        return out;
    }
}
