# qjs-md — Makefile
# Compiles src/compiler.js into a standalone native binary using qjsc.
#
# Targets:
#   make           — build dist/mdc (or dist/mdc.exe on Windows)
#   make install   — install the binary to INSTALL_DIR
#   make clean     — remove dist/
#   make test      — build and run the integration test suite

# ── OS detection ─────────────────────────────────────────────────────────────
# Check Windows_NT first (set by cmd.exe and PowerShell).
# Then fall back to uname for Linux, macOS, and MSYS2/MinGW on Windows.
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
else
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Darwin)
        DETECTED_OS := macOS
    else ifneq ($(filter MINGW% MSYS% CYGWIN%,$(UNAME_S)),)
        DETECTED_OS := Windows
    else
        DETECTED_OS := Linux
    endif
endif

# ── Per-platform variables ────────────────────────────────────────────────────
ifeq ($(DETECTED_OS),Windows)
    BIN         := dist\mdc.exe
    DIST        := dist
    MKDIR       := cmd /c if not exist "$(DIST)" mkdir "$(DIST)"
    RM_DIST     := cmd /c if exist "$(DIST)" rmdir /S /Q "$(DIST)"
    INSTALL_DIR ?= $(LOCALAPPDATA)\Programs\mdc
    INSTALL_CMD  = cmd /c if not exist "$(INSTALL_DIR)" mkdir "$(INSTALL_DIR)" && \
                   copy /Y $(BIN) "$(INSTALL_DIR)\mdc.exe"
else
    BIN         := dist/mdc
    DIST        := dist
    MKDIR       := mkdir -p $(DIST)
    RM_DIST     := rm -rf $(DIST)
    INSTALL_DIR ?= /usr/local/bin
    INSTALL_CMD  = install -m 755 $(BIN) $(INSTALL_DIR)/mdc
endif

# ── Sources ───────────────────────────────────────────────────────────────────
ENTRY   := src/compiler.js
LIBRARY_ENTRY := src/library.js

SOURCES := \
    $(wildcard lib/*.js)            \
    $(wildcard src/*.js)            \
    $(wildcard src/assets/*.js)     \
    $(wildcard src/commands/*.js)   \
    $(wildcard src/content/*.js)    \
    $(wildcard src/generators/*.js) \
    $(wildcard src/plugins/*.js)    \
    $(wildcard src/templates/*.js)  \
    $(wildcard src/utils/*.js)

LIBRARY := dist/qjs-md.js

# ── Targets ───────────────────────────────────────────────────────────────────
.PHONY: all install clean test library test-library

all: $(BIN)
	@echo "Built $(BIN) for $(DETECTED_OS)"

$(BIN): $(SOURCES)
	$(MKDIR)
	qjsc -o $@ $(ENTRY)

install: $(BIN)
	$(INSTALL_CMD)
	@echo "Installed mdc to $(INSTALL_DIR)"

clean:
	$(RM_DIST)

test: $(BIN)
	@bash scripts/test/test.sh

# ── Library bundle ────────────────────────────────────────────────────────────

library: $(LIBRARY)
	@qjs scripts/generate-readme.js
	@echo "Library: $(LIBRARY)"
	@echo "README:  dist/README.md"

$(LIBRARY): $(SOURCES) $(LIBRARY_ENTRY)
	$(MKDIR)
	npx rollup $(LIBRARY_ENTRY) --file $(LIBRARY) --format esm --external os --external std

test-library: $(LIBRARY)
	@bash scripts/test/test-library.sh
