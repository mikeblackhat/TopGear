// ------------------------------------------------------------
// custom bindings configuration
// ------------------------------------------------------------
const BINDINGS = {
  keyboard: {
    left: "ArrowLeft",
    right: "ArrowRight",
    accelerate: "ArrowUp",
    brake: "ArrowDown",
    coin: "KeyC",
    mute: "KeyM"
  },
  gamepad: {
    left: { type: "button", index: 4 }, // L1 Bumper
    right: { type: "button", index: 5 }, // R1 Bumper
    accelerate: { type: "button", index: 12 }, // D-pad Up
    brake: { type: "button", index: 13 }, // D-pad Down
    coin: { type: "button", index: 9 }, // Start
    mute: { type: "button", index: 8 } // Select
  }
};

const ACTION_NAMES = {
  left: "Girar Izquierda",
  right: "Girar Derecha",
  accelerate: "Acelerar",
  brake: "Frenar",
  coin: "Iniciar / Moneda",
  mute: "Silenciar Sonido"
};

let activeRebind = null; // { type: "keyboard" | "gamepad", action: "left" | ... }
let prevGamepadState = {};
window.paused = false;
window.pauseStart = 0;

function togglePause() {
  if (!inGame) return;
  window.paused = !window.paused;
  const pauseOverlay = document.getElementById("pause-overlay");
  if (pauseOverlay) {
    pauseOverlay.style.display = window.paused ? "block" : "none";
  }
  if (window.paused) {
    window.pauseStart = timestamp();
    if (audio) {
      audio._prePauseVolume = audio.volume;
      audio.volume = 0;
    }
  } else {
    if (window.pauseStart) {
      const duration = timestamp() - window.pauseStart;
      start += duration;
    }
    if (audio) {
      audio.volume = audio._prePauseVolume !== undefined ? audio._prePauseVolume : 1;
    }
  }
}

window.togglePause = togglePause;

function loadBindings() {
  const saved = localStorage.getItem('topgear_bindings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.keyboard) Object.assign(BINDINGS.keyboard, parsed.keyboard);
      if (parsed.gamepad) Object.assign(BINDINGS.gamepad, parsed.gamepad);
    } catch (e) {
      console.error("Failed to load bindings", e);
    }
  }
}

function saveBindings() {
  localStorage.setItem('topgear_bindings', JSON.stringify(BINDINGS));
}

// ------------------------------------------------------------
// keyboard input listeners
// ------------------------------------------------------------
const KEYS = {};
const KEYBOARD_KEYS = {};

const keyUpdate = (e) => {
  // If actively rebinding keyboard, intercept the key
  if (activeRebind && activeRebind.type === "keyboard") {
    BINDINGS.keyboard[activeRebind.action] = e.code || e.key;
    saveBindings();
    stopRebinding();
    e.preventDefault();
    return;
  }

  const code = e.code || e.key;
  KEYBOARD_KEYS[code] = e.type === `keydown`;

  // Prevent default scroll behaviors for bound game keys
  const isBoundKey = Object.values(BINDINGS.keyboard).includes(e.code) || Object.values(BINDINGS.keyboard).includes(e.key) || e.key === "Escape";
  if (isBoundKey) {
    e.preventDefault();
  }
};

addEventListener(`keydown`, keyUpdate);
addEventListener(`keyup`, keyUpdate);

let startCountdownActive = false;
function startGame() {
  if (inGame || startCountdownActive) return;
  startCountdownActive = true;
  sleep(0)
    .then((_) => {
      text.classList.remove("blink");
      text.innerText = 3;
      audio.play("beep");
      return sleep(1000);
    })
    .then((_) => {
      text.innerText = 2;
      audio.play("beep");
      return sleep(1000);
    })
    .then((_) => {
      reset();

      home.style.display = "none";

      road.style.opacity = 1;
      hero.style.display = "block";
      hud.style.display = "block";

      audio.play("beep", 500);

      inGame = true;
      startCountdownActive = false;
    });
}

addEventListener(`keyup`, function (e) {
  // If config overlay is open or rebinding, ignore normal actions
  const overlay = document.getElementById("config-overlay");
  const isConfigOpen = overlay && overlay.style.display === "block";
  if (activeRebind || isConfigOpen) return;

  if (e.code === BINDINGS.keyboard.mute || e.key === BINDINGS.keyboard.mute) {
    e.preventDefault();
    audio.volume = audio.volume === 0 ? 1 : 0;
    return;
  }

  if (e.code === BINDINGS.keyboard.coin || e.key === BINDINGS.keyboard.coin) {
    e.preventDefault();
    startGame();
    return;
  }

  if (e.code === "Escape" || e.key === "Escape") {
    e.preventDefault();
    if (inGame) {
      togglePause();
    } else {
      reset();
    }
  }
});

// ------------------------------------------------------------
// gamepad input processing
// ------------------------------------------------------------
function updateGamepadState() {
  try {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        gp = gamepads[i];
        break;
      }
    }

    // Map keyboard state back to KEYS based on bindings
    KEYS.ArrowLeft = !!KEYBOARD_KEYS[BINDINGS.keyboard.left];
    KEYS.ArrowRight = !!KEYBOARD_KEYS[BINDINGS.keyboard.right];
    KEYS.ArrowUp = !!KEYBOARD_KEYS[BINDINGS.keyboard.accelerate];
    KEYS.ArrowDown = !!KEYBOARD_KEYS[BINDINGS.keyboard.brake];

    const debugDiv = document.getElementById("gamepad-debug");
    const overlay = document.getElementById("config-overlay");
    const isConfigOpen = overlay && overlay.style.display === "block";

    if (!gp) {
      if (debugDiv) debugDiv.style.display = "none";
      return;
    }

    const axes = gp.axes || [];
    const buttons = gp.buttons || [];

    // Render debug panel only if config is open
    if (debugDiv) {
      if (isConfigOpen) {
        debugDiv.style.display = "block";
        let html = `<div style="font-weight:bold;margin-bottom:5px;border-bottom:1px solid #00ff00;">PANEL DE CONTROL</div>`;
        html += `<div style="color:#88ff88;font-size:9px;margin-bottom:8px;">${gp.id}</div>`;
        
        html += `<b>Ejes (Sticks/Dirección):</b><br>`;
        axes.forEach((val, idx) => {
          html += `Eje ${idx}: <span style="color:${Math.abs(val) > 0.2 ? '#ffff00' : '#00ff00'}">${val.toFixed(3)}</span> ${Math.abs(val) > 0.2 ? '⭐' : ''}<br>`;
        });

        html += `<br><b>Botones:</b><br>`;
        buttons.forEach((btn, idx) => {
          if (btn && btn.pressed) {
            html += `Botón ${idx}: <span style="color:#ff55ff;font-weight:bold;">PRESIONADO ⭐</span><br>`;
          } else if (btn) {
            if (idx < 16) {
              html += `<span style="color:#666;">Botón ${idx}: libre</span><br>`;
            }
          }
        });
        debugDiv.innerHTML = html;
      } else {
        debugDiv.style.display = "none";
      }
    }

    // Capture gamepad inputs for active rebinding
    if (activeRebind && activeRebind.type === "gamepad") {
      // Check buttons
      buttons.forEach((btn, idx) => {
        if (!activeRebind) return;
        if (btn && btn.pressed) {
          BINDINGS.gamepad[activeRebind.action] = { type: "button", index: idx };
          saveBindings();
          stopRebinding();
        }
      });

      // Check axes
      axes.forEach((val, idx) => {
        if (!activeRebind) return;
        if (Math.abs(val) > 0.6) {
          const direction = val < 0 ? -1 : 1;
          BINDINGS.gamepad[activeRebind.action] = { type: "axis", index: idx, direction: direction };
          saveBindings();
          stopRebinding();
        }
      });
      return; // Stop processing normal gameplay inputs while rebinding
    }

    // Helper to evaluate a custom gamepad binding
    function checkGamepadInput(binding) {
      if (!binding) return false;
      if (binding.type === "button") {
        return !!buttons[binding.index]?.pressed;
      } else if (binding.type === "axis") {
        const val = axes[binding.index] || 0;
        if (binding.direction < 0) {
          return val < -threshold;
        } else {
          return val > threshold;
        }
      }
      return false;
    }

    // IF CONFIG IS OPEN, DO NOT PROCESS GAMEPLAY TRIGGERS OR STEERING!
    if (isConfigOpen) {
      KEYS.ArrowLeft = false;
      KEYS.ArrowRight = false;
      KEYS.ArrowUp = false;
      KEYS.ArrowDown = false;
      
      prevGamepadState.coin = checkGamepadInput(BINDINGS.gamepad.coin);
      prevGamepadState.mute = checkGamepadInput(BINDINGS.gamepad.mute);
      return;
    }

    const threshold = 0.3;

    // Map bound gamepad inputs to standard KEYS
    if (checkGamepadInput(BINDINGS.gamepad.left)) KEYS.ArrowLeft = true;
    if (checkGamepadInput(BINDINGS.gamepad.right)) KEYS.ArrowRight = true;
    if (checkGamepadInput(BINDINGS.gamepad.accelerate)) KEYS.ArrowUp = true;
    if (checkGamepadInput(BINDINGS.gamepad.brake)) KEYS.ArrowDown = true;

    // Hardcoded safety fallbacks for standard gamepad layouts (Analog Stick & standard D-pad Left/Right)
    const axisX = axes[0] || 0;
    if (axisX < -threshold) KEYS.ArrowLeft = true;
    if (axisX > threshold) KEYS.ArrowRight = true;
    if (buttons[14]?.pressed) KEYS.ArrowLeft = true;
    if (buttons[15]?.pressed) KEYS.ArrowRight = true;

    // Start Game / Pause debouncer
    const coinPressed = checkGamepadInput(BINDINGS.gamepad.coin);
    if (coinPressed && !prevGamepadState.coin) {
      if (!inGame) {
        startGame();
      } else {
        togglePause();
      }
    }
    prevGamepadState.coin = coinPressed;

    // Mute sound debouncer
    const mutePressed = checkGamepadInput(BINDINGS.gamepad.mute);
    if (mutePressed && !prevGamepadState.mute) {
      audio.volume = audio.volume === 0 ? 1 : 0;
    }
    prevGamepadState.mute = mutePressed;

  } catch (e) {
    console.error("Error updating gamepad state:", e);
  }
}

// ------------------------------------------------------------
// controls rebinding UI logic
// ------------------------------------------------------------
function renderConfigTable() {
  const tbody = document.getElementById("config-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  Object.keys(ACTION_NAMES).forEach(action => {
    const kbVal = BINDINGS.keyboard[action] || "Ninguno";
    
    let gpVal = "Ninguno";
    const gpBinding = BINDINGS.gamepad[action];
    if (gpBinding) {
      if (gpBinding.type === "button") {
        gpVal = `Botón ${gpBinding.index}`;
      } else if (gpBinding.type === "axis") {
        const dir = gpBinding.direction < 0 ? "-" : "+";
        gpVal = `Eje ${gpBinding.index} ${dir}`;
      }
    }
    
    const isRebindingKb = activeRebind && activeRebind.action === action && activeRebind.type === "keyboard";
    const isRebindingGp = activeRebind && activeRebind.action === action && activeRebind.type === "gamepad";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="color:#00ff00; font-weight:bold; text-align:left; padding: 12px 8px;">${ACTION_NAMES[action]}</td>
      <td>
        <button class="config-btn-small ${isRebindingKb ? 'binding-prompt' : ''}" onclick="startRebind('keyboard', '${action}')">
          ${isRebindingKb ? 'PRESIONA TECLA...' : kbVal.replace("Arrow", "").replace("Key", "").toUpperCase()}
        </button>
      </td>
      <td>
        <button class="config-btn-small ${isRebindingGp ? 'binding-prompt' : ''}" onclick="startRebind('gamepad', '${action}')">
          ${isRebindingGp ? 'MUEVE O PULSA...' : gpVal}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function startRebind(type, action) {
  activeRebind = { type, action };
  renderConfigTable();
}

function stopRebinding() {
  activeRebind = null;
  renderConfigTable();
}

function updateControlsText() {
  const controlsDiv = document.getElementById("controls");
  if (!controlsDiv) return;

  const getKeyLabel = (action) => {
    const val = BINDINGS.keyboard[action];
    if (!val) return "";
    return val.replace("Arrow", "").replace("Key", "").toUpperCase();
  };

  const coinKey = getKeyLabel("coin");
  const muteKey = getKeyLabel("mute");
  const leftKey = getKeyLabel("left");
  const rightKey = getKeyLabel("right");
  const upKey = getKeyLabel("accelerate");
  const downKey = getKeyLabel("brake");

  controlsDiv.innerHTML = `
    <span><span>${coinKey} / START</span>insert coin</span>
    <span><span>${muteKey}</span>mute</span>
    <span><span>${leftKey} ${rightKey} / L-STICK</span>move</span>
    <span><span>${upKey} ${downKey} / A / RT</span>drive</span>
  `;
}

const DEFAULT_BINDINGS = {
  keyboard: {
    left: "ArrowLeft",
    right: "ArrowRight",
    accelerate: "ArrowUp",
    brake: "ArrowDown",
    coin: "KeyC",
    mute: "KeyM"
  },
  gamepad: {
    left: { type: "button", index: 4 }, // L1
    right: { type: "button", index: 5 }, // R1
    accelerate: { type: "button", index: 12 }, // Up
    brake: { type: "button", index: 13 }, // Down
    coin: { type: "button", index: 9 }, // Start
    mute: { type: "button", index: 8 } // Select
  }
};

function resetToDefaults() {
  BINDINGS.keyboard = JSON.parse(JSON.stringify(DEFAULT_BINDINGS.keyboard));
  BINDINGS.gamepad = JSON.parse(JSON.stringify(DEFAULT_BINDINGS.gamepad));
  saveBindings();
  renderConfigTable();
  updateControlsText();
}

// Expose UI functions to global window scope
window.startRebind = startRebind;
window.stopRebinding = stopRebinding;
window.resetToDefaults = resetToDefaults;

document.addEventListener("DOMContentLoaded", () => {
  loadBindings();
  updateControlsText();

  const configBtn = document.getElementById("config-btn");
  const closeConfigBtn = document.getElementById("close-config-btn");
  const overlay = document.getElementById("config-overlay");

  if (configBtn) {
    configBtn.addEventListener("click", () => {
      overlay.style.display = "block";
      renderConfigTable();
    });
  }

  if (closeConfigBtn) {
    closeConfigBtn.addEventListener("click", () => {
      overlay.style.display = "none";
      activeRebind = null;
      updateControlsText();
    });
  }
});
