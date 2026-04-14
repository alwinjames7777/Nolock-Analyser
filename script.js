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

// File Upload Logic
document.getElementById('sql-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        textarea.value = e.target.result;
        updateLineNumbers();
    };
    reader.readAsText(file);
});

// Line Jumping Logic
window.scrollToLine = function(lineNum) {
    const lines = textarea.value.split('\n');
    let startPos = 0;
    for (let i = 0; i < lineNum - 1; i++) {
        startPos += lines[i].length + 1;
    }
    let endPos = startPos + lines[lineNum - 1].length;
    
    textarea.focus();
    textarea.setSelectionRange(startPos, endPos);
    
    // Crude scroll height calculation
    const lineHeight = 24;
    textarea.scrollTop = Math.max(0, (lineNum - 3) * lineHeight);
};

// Real Scan Logic
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dialect = document.getElementById('sql-dialect').value;
    const script = textarea.value;
    
    if (!dialect || !script.trim()) return;
    
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="btn-content"><i class="fa-solid fa-spinner fa-spin"></i> SCANNING...</span>';
    
    terminalOutput.innerHTML = '';
    
    let nolockReplacement = "WITH (NOLOCK)";
    if (dialect === "DB2") nolockReplacement = "WITH UR";
    
    const lines = script.split('\n');
    let findings = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let lineUpper = line.toUpperCase();
        
        // Basic skip conditions
        if (line.trim().startsWith('--') || lineUpper.includes('UPDATE ') || lineUpper.includes('DELETE ')) {
            continue;
        }
        
        // Regex to find FROM or JOIN followed by table name
        const regex = /(?:FROM|JOIN)\s+([a-zA-Z0-9_\[\]\.]+)/i;
        const match = line.match(regex);
        
        if (match) {
            // If it DOESN'T contain NOLOCK or similar valid hint already
            if (!lineUpper.includes('NOLOCK') && !lineUpper.includes('WITH UR') && dialect !== 'Oracle' && dialect !== 'SQLite') {
                findings.push({
                    lineNum: i + 1,
                    original: line,
                    table: match[1]
                });
            }
        }
    }
    
    await sleep(400); // Tiny pause for effect
    
    appendToTerminal(`<div class="log-header">## SUMMARY</div>`);
    appendToTerminal(`<div class="sys-msg">- SQL Dialect     : ${dialect}</div>`);
    appendToTerminal(`<div class="sys-msg">- Total Lines     : ${lines.length}</div>`);
    appendToTerminal(`<div class="sys-msg">- Missing NOLOCK  : <span style="color:#f85149; font-weight:bold;">${findings.length}</span></div>`);
    
    if (findings.length > 0) {
        appendToTerminal(`<div class="log-header">## FINDINGS</div>`);
        findings.forEach((finding, idx) => {
            appendToTerminal(`<div class="log-error">Finding #${idx + 1}</div>`);
            appendToTerminal(`<div class="sys-msg">- Line        : ${finding.lineNum}</div>`);
            appendToTerminal(`<div class="sys-msg">- Table       : ${finding.table}</div>`);
            appendToTerminal(`<div class="sys-msg">- Severity    : MISSING NOLOCK</div>`);
            appendToTerminal(`<div class="sys-msg">- Suggested Fix :</div>`);
            
            // Suggestion: just append the hint roughly after table name
            const fixedLine = finding.original.replace(finding.table, `${finding.table} ${nolockReplacement}`);
            
            // Make the old line clickable!
            appendToTerminal(`<div class="diff-del" style="cursor:pointer;" onclick="window.scrollToLine(${finding.lineNum})" title="Click to highlight line in editor">- ${finding.original}</div>`);
            appendToTerminal(`<div class="diff-add">+ ${fixedLine}</div><br>`);
        });
    } else {
        appendToTerminal(`<div class="log-success" style="margin-top:20px">[OK] No missing NOLOCK hints detected!</div>`);
    }
    
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="btn-content"><i class="fa-solid fa-radar"></i> INITIATE SCAN</span>';
});
