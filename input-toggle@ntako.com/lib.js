import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export const DEVICES_KEY = 'devices-state';
export const POLICY_KEY = 'policy-installed';
const POLICY_NAME = 'com.ntako.input-toggle.policy';
const RULE_NAME = '49-com.ntako.input-toggle.rules';
const SCRIPT_NAME = 'com.ntako.input-toggle.sh';
const POLICY_DEST = `/usr/share/polkit-1/actions/${POLICY_NAME}`;
const RULE_DEST = `/etc/polkit-1/rules.d/${RULE_NAME}`;
const SCRIPT_DEST = `/usr/local/bin/${SCRIPT_NAME}`;



export function getDevicesState(settingsManager) {
    try {
        return settingsManager.getJson(DEVICES_KEY);
    } catch (e) {
        log(`[input-toggle] Error parsing devices-state: ${e}`);
        return [];
    }
}

export function setDevicesState(settingsManager, devices) {
    settingsManager.setJson(DEVICES_KEY, devices);
}

export function updateDeviceState(settingsManager, name, enabled) {
    let devices = getDevicesState(settingsManager);
    const index = devices.findIndex(d => d.device === name);
    if (index !== -1)
        devices[index].enabled = enabled;
    else
        devices.push({ device: name, enabled });
    setDevicesState(settingsManager, devices);
}

export function isPolicyInstalled(settingsManager) {
    return settingsManager.getBoolean(POLICY_KEY);
}

export function setPolicyInstalled(settingsManager, value) {
    settingsManager.setBoolean(POLICY_KEY, value);
}

// ============================================================
//  SYSTEM & POLICY MANAGEMENT
// ============================================================

function runCommand(cmd) {
    try {
        GLib.spawn_command_line_async(cmd);
    } catch (e) {
        log(`[input-toggle] Error running command: ${cmd} — ${e}`);
    }
}

export function installPolicy(extPath) {
    const cmd = `
        pkexec bash -c '
        [ ! -f "${POLICY_DEST}" ] && cp "${extPath}/polkit/${POLICY_NAME}" "${POLICY_DEST}";
        [ ! -f "${RULE_DEST}" ] && cp "${extPath}/polkit/${RULE_NAME}" "${RULE_DEST}";
        [ ! -f "${SCRIPT_DEST}" ] && cp "${extPath}/scripts/${SCRIPT_NAME}" "${SCRIPT_DEST}" && chmod +x "${SCRIPT_DEST}";
        '
    `;
    runCommand(cmd);
}

export function removePolicy(extPath) {
    const cmd = `pkexec bash -c 'rm -f ${POLICY_DEST} ${RULE_DEST} ${SCRIPT_DEST}'`;
    log(`[input-toggle] Removing policy and scripts`);
    runCommand(cmd);
}

// ============================================================
//  DEVICES MANAGEMENT
// ============================================================

export function parseInputDevices() {
    const devices = [];
    const dir = Gio.File.new_for_path('/sys/class/input');
    try {
        const enumerator = dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);
        let info;
        while ((info = enumerator.next_file(null)) !== null) {
            const name = info.get_name();
            if (!name.startsWith('event')) continue;

            const namePath = `/sys/class/input/${name}/device/name`;
            try {
                const [ok, outB] = GLib.file_get_contents(namePath);
                if (ok) {
                    const devName = imports.byteArray.toString(outB).trim();
                    devices.push({ name: devName, id: name });
                }
            } catch (e) {
                log(`[input-toggle] Error reading ${namePath}: ${e}`);
            }
        }
    } catch (e) {
        log(`[input-toggle] Error enumerating /sys/class/input: ${e}`);
    }

    return devices;
}

export function findDeviceIdByName(deviceName) {
    const dir = Gio.File.new_for_path('/sys/class/input');
    try {
        const enumerator = dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);
        let info;
        while ((info = enumerator.next_file(null)) !== null) {
            const name = info.get_name();
            if (!name.startsWith('event')) continue;

            const namePath = `/sys/class/input/${name}/device/name`;
            try {
                const [ok, outB] = GLib.file_get_contents(namePath);
                if (ok) {
                    const devName = imports.byteArray.toString(outB).trim();
                    if (devName === deviceName) return name; // es: "event6"
                }
            } catch (_) {}
        }
    } catch (e) {
        log(`[input-toggle] Error lookup device name: ${e}`);
    }
    return null;
}

function getSysfsPath(deviceId) {
    const inhibitedPath = `/sys/class/input/${deviceId}/device/inhibited`;
    const enabledPath = `/sys/class/input/${deviceId}/device/enabled`;
    if (GLib.file_test(inhibitedPath, GLib.FileTest.EXISTS)) return inhibitedPath;
    if (GLib.file_test(enabledPath, GLib.FileTest.EXISTS)) return enabledPath;
    return null;
}

export function isEnabled(deviceName) {
    const deviceId = findDeviceIdByName(deviceName);
    if (!deviceId) {
        log(`[input-toggle] Device not found: ${deviceName}`);
        return false;
    }

    const sysfsPath = getSysfsPath(deviceId);
    if (sysfsPath) {
        const [ok, outB] = GLib.file_get_contents(sysfsPath);
        if (ok) {
            const val = imports.byteArray.toString(outB).trim();
            return sysfsPath.endsWith('inhibited') ? val === '0' : val === '1';
        }
    }

    return false;
}

export function setEnabled(deviceName, enabled) {
    const deviceId = findDeviceIdByName(deviceName);
    if (!deviceId) {
        log(`[input-toggle] Device not found: ${deviceName}`);
        return false;
    }

    const sysfsPath = getSysfsPath(deviceId);
    if (sysfsPath) {
        const value = sysfsPath.endsWith('inhibited')
            ? (enabled ? 'disable' : 'enable')
            : (enabled ? 'enable' : 'disable');

        const cmd = `pkexec /usr/local/bin/${SCRIPT_NAME} ${value} ${sysfsPath}`;
        GLib.spawn_command_line_async(cmd);
        return true;
    }

    log(`[input-toggle] Method not found for device ${deviceId}`);
    return false;
}
