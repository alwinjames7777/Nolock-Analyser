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
window.highlightTable = function(lineNum, tableName) {
    const lines = textarea.value.split('\n');
    if (lineNum < 1 || lineNum > lines.length) return;
    
    let startPos = 0;
    for (let i = 0; i < lineNum - 1; i++) {
        startPos += lines[i].length + 1;
    }
    
    const lineText = lines[lineNum - 1];
    
    let tableStart = startPos;
    let tableEnd = startPos + lineText.length;
    
    if (tableName) {
        const safeTableForRegex = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const tableRegex = new RegExp(`\\b(?:FROM|JOIN)\\b\\s+(${safeTableForRegex})`, 'i');
        const match = lineText.match(tableRegex);
        
        if (match) {
            tableStart = startPos + match.index + match[0].lastIndexOf(match[1]);
            tableEnd = tableStart + match[1].length;
        } else {
            const fallbackIdx = lineText.toUpperCase().indexOf(tableName.toUpperCase());
            if(fallbackIdx !== -1) {
                tableStart = startPos + fallbackIdx;
                tableEnd = tableStart + tableName.length;
            }
        }
    }
    
    textarea.focus({preventScroll: true});
    textarea.setSelectionRange(tableStart, tableEnd);
    
    // Perfectly center the found line vertically in the editor
    const exactLinePos = (lineNum - 1) * 24;
    textarea.scrollTop = Math.max(0, exactLinePos - (textarea.clientHeight / 2) + 12);
    
    // Sync line numbers immediately so they don't break
    document.getElementById('line-numbers').scrollTop = textarea.scrollTop;
};

window.highlightTableFromRef = function(idx) {
    if (!window.latestFindings || !window.latestFindings[idx]) return;
    const finding = window.latestFindings[idx];
    window.highlightTable(finding.lineNum, finding.table);
};

window.applySuggestion = function(idx) {
    if (!window.latestFindings || !window.latestFindings[idx]) return;
    const finding = window.latestFindings[idx];
    
    const lines = textarea.value.split('\n');
    if (finding.lineNum > lines.length) return;
    
    let dialect = document.getElementById('sql-dialect').value;
    let nolockReplacement = dialect === "DB2" ? "WITH UR" : "WITH (NOLOCK)";
    
    // Replace the specific table exactly to avoid breaking changes
    let lineToFix = lines[finding.lineNum - 1];
    lines[finding.lineNum - 1] = lineToFix.replace(finding.table, `${finding.table} ${nolockReplacement}`);
    
    textarea.value = lines.join('\n');
    updateLineNumbers();
    
    const btn = document.getElementById(`apply-btn-${idx}`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> APPLIED';
        btn.style.background = 'rgba(63, 185, 80, 0.2)';
        btn.style.color = '#4ade80';
        btn.style.borderColor = '#4ade80';
    }
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
    window.latestFindings = findings;
    
    // Pre-pass: extract CTE definitions to skip them
    let cteNames = new Set();
    const cteRegex = /\b(?:WITH|,)\s+([a-zA-Z0-9_]+)\s+AS\s*\(/gi;
    let cteMatch;
    while ((cteMatch = cteRegex.exec(script)) !== null) {
        cteNames.add(cteMatch[1].toUpperCase());
    }
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let lineUpper = line.toUpperCase();
        
        // Basic skip conditions
        if (line.trim().startsWith('--') || lineUpper.includes('UPDATE ') || lineUpper.includes('DELETE ')) {
            continue;
        }
        
        // Regex to find FROM or JOIN followed by table name (ensuring FROM/JOIN is a distinct word)
        const regex = /\b(?:FROM|JOIN)\b\s+([a-zA-Z0-9_\[\]\.]+)/i;
        const match = line.match(regex);
        
        if (match) {
            const potentialTable = match[1];
            const potTableUpper = potentialTable.toUpperCase();
            
            // Skip if table name is a CTE, a temp table (#), or table var (@)
            if (cteNames.has(potTableUpper) || potTableUpper.startsWith('#') || potTableUpper.startsWith('@')) {
                continue;
            }
            
            // If it DOESN'T contain NOLOCK or similar valid hint already
            if (!lineUpper.includes('NOLOCK') && !lineUpper.includes('WITH UR') && dialect !== 'Oracle' && dialect !== 'SQLite') {
                findings.push({
                    lineNum: i + 1,
                    original: line,
                    table: potentialTable
                });
            }
        }
    }
    
    await sleep(400);
    
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
            
            const fixedLine = finding.original.replace(finding.table, `${finding.table} ${nolockReplacement}`);
            
            // Exact Table Highlighting!
            appendToTerminal(`<div class="diff-del" style="cursor:pointer;" onclick="window.highlightTableFromRef(${idx})" title="Click to highlight exactly the missing table">- ${finding.original}</div>`);
            appendToTerminal(`
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px;">
                    <div class="diff-add" style="flex: 1;">+ ${fixedLine}</div>
                    <button class="btn-scan" style="margin-top: 0; margin-left: 10px; padding: 5px 10px; font-size: 0.8rem; flex-shrink: 0;" id="apply-btn-${idx}" onclick="window.applySuggestion(${idx})"><i class="fa-solid fa-wrench"></i> APPLY</button>
                </div>
            `);
        });
    } else {
        appendToTerminal(`<div class="log-success" style="margin-top:20px">[OK] No missing NOLOCK hints detected!</div>`);
    }
    
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="btn-content"><i class="fa-solid fa-radar"></i> SCAN</span>';
});
