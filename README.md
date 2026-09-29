# Input Toggle

This is the GNOME Shell extension nobody needed — but since I couldn't find one that actually works on Wayland, I built it myself to save my coworkers' lives. When you work in a team, there's always someone who can't keep their fingers to themselves and keeps poking your monitor. Annoying enough on its own, but when your monitor happens to be a touchscreen... it becomes a matter of life and death!

This extension maps input devices from `/sys/class/input` and uses `pkexec` to inhibit a device via its `enabled` file.

---

## Build and Setup

```bash
sudo apt update && sudo apt install make gettext gnome-shell
make build
make install
```

## Activation

On first activation, pkexec will prompt for the sudo password to install the required scripts and policies. Once installed, they persist across disable/enable cycles (e.g. shell restarts), so you won't be prompted again. Use the **Remove system integration** button in Preferences if you want to uninstall them explicitly.

## Configuration
1. Open extension **Preferences**.  
2. A list will be shown with **all devices detected under `/sys/class/input/event*`**
3. Enable the devices you want to control, they will appear in extension's popup in the GNOME panel.

---

## Usage
- The extension icon will appear in the GNOME panel.  
- By clicking it, you will see toggles for all the selected devices.  
- Toggle them with a single click.
- It will be run `echo 0 > /sys/class/input/eventX/device/enabled` for deactivation or `echo 1 > /sys/class/input/eventX/device/enabled` for activation

---

## Notes
- Devices to show in the panel popup are chosen in Preferences and stored per-device state in `devices-state`; nothing is toggled until a device is selected there.
