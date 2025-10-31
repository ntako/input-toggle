#!/bin/bash
set -e

POLICY_DEST="/usr/share/polkit-1/actions/com.ntako.input-toggle.policy"
RULE_DEST="/etc/polkit-1/rules.d/49-com.ntako.input-toggle.rules"

EXT_PATH_DEFAULT="$HOME/.local/share/gnome-shell/extensions/input-toggle@ntako.com/polkit"
EXT_PATH="$EXT_PATH_DEFAULT"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --ext-path)
            EXT_PATH="$2"
            shift 2
            ;;
        install|remove|enable|disable)
            ACTION="$1"
            shift
            break
            ;;
        *)
            echo "Argomento non valido: $1"
            echo "Uso: $0 [--ext-path /percorso/estensione] {install|remove|enable|disable} [device]"
            exit 1
            ;;
    esac
done

usage() {
    echo "Usage: $0 [--ext-path /path/to/ext] {install|remove|enable <device>|disable <device>}"
    exit 1
}

install_files() {
    echo "Installazione da: $EXT_PATH"

    if [ ! -f "$POLICY_DEST" ]; then
        cp "$EXT_PATH/polkit/com.ntako.input-toggle.policy" "$POLICY_DEST"
    fi

    if [ ! -f "$RULE_DEST" ]; then
        cp "$EXT_PATH/polkit/49-com.ntako.input-toggle.rules" "$RULE_DEST"
    fi

    chown root:root "$POLICY_DEST" "$RULE_DEST"
    chmod 644 "$POLICY_DEST" "$RULE_DEST"

    systemctl restart polkit
    echo "Installazione completata"
}

remove_files() {
    echo "Rimozione dei file di policy e rules..."
    [ -f "$POLICY_DEST" ] && rm -f "$POLICY_DEST"
    [ -f "$RULE_DEST" ] && rm -f "$RULE_DEST"
    systemctl restart polkit
    echo "Rimozione completata"
}

enable_device() {
    local dev="$1"
    if [ -z "$dev" ]; then
        echo "Devi specificare un device PATH"; exit 1
    fi

    if [ -w "$dev" ]; then
        echo "Abilito dispositivo: $dev"
        echo 1 > $dev
        # "/sys/class/input/$dev/device/enabled"
    fi
}

disable_device() {
    local dev="$1"
    if [ -z "$dev" ]; then
        echo "Devi specificare un device PATH"; exit 1
    fi

    if [ -w "$dev" ]; then
        echo "Disabilito dispositivo: $dev"
        echo 0 > $dev 
        # "/sys/class/input/$dev/device/enabled"
    fi
}

case "$ACTION" in
    install)
        install_files
        ;;
    remove)
        remove_files
        ;;
    enable)
        enable_device "$1"
        ;;
    disable)
        disable_device "$1"
        ;;
    *)
        usage
        ;;
esac
