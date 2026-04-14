// Initialize Particles Network Background for Tech Vibe
particlesJS("particles-js", {
    "particles": {
      "number": {
        "value": 80,
        "density": {
          "enable": true,
          "value_area": 800
        }
      },
      "color": {
        "value": ["#66fcf1", "#c5a3ff"]
      },
      "shape": {
        "type": "circle",
      },
      "opacity": {
        "value": 0.5,
        "random": true,
      },
      "size": {
        "value": 3,
        "random": true,
      },
      "line_linked": {
        "enable": true,
        "distance": 150,
        "color": "#66fcf1",
        "opacity": 0.2,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 2,
        "direction": "none",
        "random": false,
        "straight": false,
        "out_mode": "out",
        "bounce": false,
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": true,
          "mode": "grab"
        },
        "onclick": {
          "enable": true,
          "mode": "push"
        },
        "resize": true
      },
      "modes": {
        "grab": {
          "distance": 140,
          "line_linked": {
            "opacity": 0.8
          }
        }
      }
    },
    "retina_detect": true
});

// Line numbers logic for textarea
const textarea = document.getElementById('sql-script');
const lineNumbers = document.getElementById('line-numbers');

textarea.addEventListener('input', updateLineNumbers);
textarea.addEventListener('scroll', () => {
    lineNumbers.scrollTop = textarea.scrollTop;
});

function updateLineNumbers() {
    const lines = textarea.value.split('\n').length;
    lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
}

// Trigger Initial Sync
updateLineNumbers();

// Terminal Output Logic
const terminalOutput = document.getElementById('terminal-output');
const form = document.getElementById('analyzer-form');
const scanBtn = document.getElementById('scan-btn');

function appendToTerminal(htmlString) {
    const cursor = document.querySelector('.blink-cursor');
    if (cursor) cursor.remove();
    
    const div = document.createElement('div');
    div.innerHTML = htmlString;
    terminalOutput.appendChild(div);
    
    // Re-add cursor
    const newCursor = document.createElement('div');
    newCursor.className = 'sys-msg blink-cursor';
    newCursor.innerHTML = '_';
    terminalOutput.appendChild(newCursor);
    
    // Auto scroll
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function typeText(text, className, speed = 20, callback = null) {
    const cursor = document.querySelector('.blink-cursor');
    if (cursor) cursor.remove();

    const line = document.createElement('div');
    line.className = className;
    terminalOutput.appendChild(line);
    
    const newCursor = document.createElement('div');
    newCursor.className = 'sys-msg blink-cursor';
    newCursor.innerHTML = '_';
    terminalOutput.appendChild(newCursor);

    let i = 0;
    function typeChar() {
        if (i < text.length) {
            line.innerHTML += text.charAt(i);
            i++;
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
            setTimeout(typeChar, speed);
        } else {
            if (callback) callback();
        }
    }
    typeChar();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fake Scan Simulation
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dialect = document.getElementById('sql-dialect').value;
    const script = textarea.value;
    
    if (!dialect || !script.trim()) return;
    
    // Disable button
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="btn-content"><i class="fa-solid fa-spinner fa-spin"></i> SCANNING...</span>';
    
    terminalOutput.innerHTML = '';
    appendToTerminal(`<div class="sys-msg">> Initializing Anti-Gravity SQL Scan...</div>`);
    
    await sleep(600);
    appendToTerminal(`<div class="log-info">[INFO] Dialect selected: ${dialect}</div>`);
    await sleep(400);
    
    let nolockReplacement = "WITH (NOLOCK)";
    if (dialect === "DB2") nolockReplacement = "WITH UR";
    else if (dialect !== "T-SQL") {
        appendToTerminal(`<div class="log-warning">[WARN] Note: PostgreSQL, MySQL, Oracle, SQLite do not natively use NOLOCK inside FROM. Applying Dialect Mode.</div>`);
    }

    typeText("Analyzing AST structure...", "sys-msg", 30, async () => {
        await sleep(500);
        appendToTerminal(`<div class="log-success">[OK] Syntax Tree Parsed successfully.</div>`);
        await sleep(300);
        
        typeText("Detecting missing table hints...", "sys-msg", 20, async () => {
            await sleep(800);
            
            // Simulate findings
            appendToTerminal(`<div class="log-header">## SUMMARY</div>`);
            appendToTerminal(`<div class="sys-msg">- SQL Dialect     : ${dialect}</div>`);
            appendToTerminal(`<div class="sys-msg">- Total Lines     : ${script.split('\n').length}</div>`);
            appendToTerminal(`<div class="sys-msg">- Missing NOLOCK  : <span style="color:#f85149; font-weight:bold;">1</span></div>`);
            
            await sleep(500);
            appendToTerminal(`<div class="log-header">## FINDINGS</div>`);
            appendToTerminal(`<div class="log-error">Finding #1</div>`);
            appendToTerminal(`<div class="sys-msg">- Severity    : MISSING NOLOCK</div>`);
            appendToTerminal(`<div class="sys-msg">- Suggested Fix :</div>`);
            
            const mockOriginal = "SELECT * FROM Users u";
            const mockFixed = `SELECT * FROM Users u ${nolockReplacement}`; // Simplified mock
            
            appendToTerminal(`<div class="diff-del">- ${mockOriginal}</div>`);
            appendToTerminal(`<div class="diff-add">+ ${mockFixed}</div>`);
            
            await sleep(500);
            appendToTerminal(`<div class="log-header">## STATUS</div>`);
            appendToTerminal(`<div class="log-success">Scan Complete.</div>`);
            
            // Revert button
            scanBtn.disabled = false;
            scanBtn.innerHTML = '<span class="btn-content"><i class="fa-solid fa-radar"></i> INITIATE SCAN</span>';
        });
    });
});
