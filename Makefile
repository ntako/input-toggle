BUNDLE_PATH = input-toggle@ntako.com.zip
EXTENSION_DIR = input-toggle@ntako.com
MSGSRC = $(wildcard po/*.po)

all: compileschema potfile build install enable

.PHONY: compileschema potfile build

test: compileschema potfile build install enable run

compileschema:
	@echo "Compiling GSettings schemas..."
	glib-compile-schemas ./$(EXTENSION_DIR)/schemas/


potfile:
	@echo "Generating POT file..."
	cd $(EXTENSION_DIR); \
	mkdir -p ./po; \
	xgettext --keyword=__ --keyword=N__ --add-comments='Translators:' -o ./po/input-toggle.pot --package-name "Input Toggle" --from-code=utf-8 ./*.js


build:
	@echo "Building extension bundle..."
	rm -f $(BUNDLE_PATH); \
	cd $(EXTENSION_DIR); \
	gnome-extensions pack --force --podir=po \
	                      --extra-source=scripts/ \
	                      --extra-source=polkit/ \
	                      --extra-source=DynamicInputButton.js \
	                      --extra-source=lib.js \
	                      --extra-source=settingsManager.js; \
	mv $(EXTENSION_DIR).shell-extension.zip ../$(BUNDLE_PATH)

install:
	@echo "Installing extension..."
	gnome-extensions install $(BUNDLE_PATH) --force

enable:
	@echo "Enabling extension..."
	dbus-run-session -- gnome-extensions enable input-toggle@ntako.com

run:
	@echo "Running GNOME Shell with Wayland nested session..."
	dbus-run-session -- gnome-shell --nested --wayland

clean:
	@echo "Cleaning up..."
	rm -f ./$(EXTENSION_DIR)/schemas/gschemas.compiled
	@rm -fv $(BUNDLE_PATH)
