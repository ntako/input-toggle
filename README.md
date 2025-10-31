# Input Toggle

This extension map input devices from /sys/class/input and with pkexec inhibite the device from enabled file

---

## Build and Setup

```bash
sudo apt update && sudo apt install make gettext gnome-shell
make build
make install
```

## Activation

On extension activation or deactivation, pkexec will prompt for the sudo password to install or remove the required scripts and policies.

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
- In future versions, it would be ideal to add a button for installing and removing scripts and policies in the extension preferences.
