// ─── Particles ───────────────────────────────────────────────────────────────
particlesJS("particles-js", {
    particles: {
        number: { value: 55, density: { enable: true, value_area: 900 } },
        color: { value: ["#66fcf1","#c5a3ff"] },
        shape: { type: "circle" },
        opacity: { value: 0.4, random: true },
        size:    { value: 2.5, random: true },
        line_linked: { enable: true, distance: 140, color: "#66fcf1", opacity: 0.14, width: 1 },
        move: { enable: true, speed: 1.4, out_mode: "out" }
    },
    interactivity: {
        detect_on: "canvas",
        events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
        modes:  { grab: { distance: 140, line_linked: { opacity: 0.7 } } }
    },
    retina_detect: true
});

// ─── Editor: textarea + line numbers ─────────────────────────────────────────
const sqlInput    = document.getElementById('sqlInput');
const lineNumbers = document.getElementById('lineNumbers');

function updateLineNumbers() {
    const count = sqlInput.value.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: count }, (_, i) => i + 1).join('<br>');
}

// Sync scroll: textarea drives line numbers
sqlInput.addEventListener('scroll', () => {
    lineNumbers.scrollTop = sqlInput.scrollTop;
});
sqlInput.addEventListener('input', updateLineNumbers);

updateLineNumbers(); // init

// ─── File Upload ──────────────────────────────────────────────────────────────
document.getElementById('sql-file').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        sqlInput.value = ev.target.result;
        updateLineNumbers();
    };
    reader.readAsText(file);
});

// ─── Jump & Highlight ─────────────────────────────────────────────────────────
// This uses the EXACT same technique as the reference site:
// 1. Calculate character offsets for the table name inside the textarea value
// 2. Call setSelectionRange(start, end) — browser selects + AUTOMATICALLY scrolls it into view
// 3. Call focus() — selection becomes visible with the browser's selection colour
window.highlightTableFromRef = function (idx) {
    const finding = window.latestFindings && window.latestFindings[idx];
    if (!finding) return;

    const lines = sqlInput.value.split('\n');

    // Build char offset to start of target line
    let lineStart = 0;
    for (let i = 0; i < finding.lineNum - 1; i++) {
        lineStart += lines[i].length + 1; // +1 for \n
    }

    const lineText = lines[finding.lineNum - 1] || '';

    // Find the specific table name after FROM/JOIN within this line
    let selStart = lineStart;
    let selEnd   = lineStart + lineText.length; // fallback: whole line

    const safeTable  = finding.table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tableRegex = new RegExp(`\\b(?:FROM|JOIN)\\b\\s+(${safeTable})`, 'i');
    const match      = lineText.match(tableRegex);

    if (match) {
        const tableOffset = match.index + match[0].length - match[1].length;
        selStart = lineStart + tableOffset;
        selEnd   = selStart + match[1].length;
    }

    // *** THE CORRECT APPROACH (matches reference site) ***
    // focus first so selection is visible, then setSelectionRange.
    // The browser will automatically scroll the selection into view — no manual scrollTop!
    sqlInput.focus();
    sqlInput.setSelectionRange(selStart, selEnd);
};

// ─── Apply Fix ────────────────────────────────────────────────────────────────
window.applySuggestion = function (idx) {
    const finding = window.latestFindings && window.latestFindings[idx];
    if (!finding) return;

    const dialect = document.getElementById('sql-dialect').value;
    const hint    = dialect === 'DB2' ? 'WITH UR' : 'WITH (NOLOCK)';

    const lines = sqlInput.value.split('\n');
    if (finding.lineNum > lines.length) return;

    const safeTable = finding.table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Replace only if the hint isn't already there
    lines[finding.lineNum - 1] = lines[finding.lineNum - 1].replace(
        new RegExp(`(\\b(?:FROM|JOIN)\\b\\s+)(${safeTable})(?!\\s+WITH)`, 'i'),
        `$1$2 ${hint}`
    );

    sqlInput.value = lines.join('\n');
    updateLineNumbers();
    finding.applied = true;

    const btn = document.getElementById(`apply-btn-${idx}`);
    if (btn) {
        btn.classList.add('applied');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> APPLIED';
        btn.disabled  = true;
    }
};

// ─── Terminal helpers ─────────────────────────────────────────────────────────
const terminalOutput = document.getElementById('terminal-output');
const scanBtn        = document.getElementById('scan-btn');

function appendToTerminal(html) {
    const cursor = terminalOutput.querySelector('.blink-cursor');
    if (cursor) cursor.remove();
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    terminalOutput.appendChild(wrap);
    const cur = document.createElement('div');
    cur.className   = 'sys-msg blink-cursor';
    cur.textContent = '_';
    terminalOutput.appendChild(cur);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function esc(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Scan ─────────────────────────────────────────────────────────────────────
document.getElementById('analyzer-form').addEventListener('submit', async e => {
    e.preventDefault();

    const dialect = document.getElementById('sql-dialect').value;
    const script  = sqlInput.value;
    if (!dialect || !script.trim()) return;

    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="btn-content"><i class="fa-solid fa-spinner fa-spin"></i> SCANNING...</span>';
    terminalOutput.innerHTML = '';

    const hint  = dialect === 'DB2' ? 'WITH UR' : 'WITH (NOLOCK)';
    const lines = script.split('\n');
    const findings = [];
    window.latestFindings = findings;

    // Pre-pass: collect CTE names
    const cteNames = new Set();
    const cteRx    = /\b(?:WITH|,)\s+([a-zA-Z0-9_]+)\s+AS\s*\(/gi;
    let cm;
    while ((cm = cteRx.exec(script)) !== null) cteNames.add(cm[1].toUpperCase());

    for (let i = 0; i < lines.length; i++) {
        const line      = lines[i];
        const lineUpper = line.toUpperCase();
        const trimmed   = line.trim();

        // Skip: comments, UPDATE, DELETE lines
        if (trimmed.startsWith('--') || /\bUPDATE\b/i.test(line) || /\bDELETE\b/i.test(line)) continue;

        // Scan every FROM/JOIN in the line
        const fromJoinRx = /\b(FROM|JOIN)\b\s+([a-zA-Z0-9_\[\]\.]+)/gi;
        let m;
        while ((m = fromJoinRx.exec(line)) !== null) {
            const tbl      = m[2];
            const tblUpper = tbl.toUpperCase();

            // Skip: CTEs, temp tables (#), table vars (@), system schemas
            if (cteNames.has(tblUpper))                            continue;
            if (tbl.startsWith('#') || tbl.startsWith('@'))        continue;
            if (/^(SYS\.|INFORMATION_SCHEMA\.|MSDB\.|MASTER\.)/i.test(tbl)) continue;

            // Skip if WITH (NOLOCK)/WITH UR already right after the table
            const afterTable = line.substring(m.index + m[0].length).trimStart();
            if (/^WITH\s*[\(\b]/i.test(afterTable))               continue;

            // Skip if line already has the hint somewhere
            if (lineUpper.includes('NOLOCK') || lineUpper.includes('WITH UR')) continue;

            findings.push({ lineNum: i + 1, original: line, table: tbl });
        }
    }

    await sleep(300);

    // Summary block
    appendToTerminal(`<div class="log-header">## SUMMARY</div>`);
    appendToTerminal(`<div class="sys-msg">- Dialect      : <span style="color:var(--cyan-glow)">${dialect}</span></div>`);
    appendToTerminal(`<div class="sys-msg">- Total Lines  : ${lines.length}</div>`);
    appendToTerminal(`<div class="sys-msg">- Missing NOLOCK : <span style="color:#f85149;font-weight:bold">${findings.length}</span></div>`);

    // Badge
    const badge = document.getElementById('missing-badge');
    badge.textContent  = `${findings.length} MISSING`;
    badge.style.display = findings.length > 0 ? 'inline-block' : 'none';

    if (findings.length === 0) {
        appendToTerminal(`<div class="log-success" style="margin-top:10px">✓ All tables have NOLOCK hints — no issues found!</div>`);
    } else {
        appendToTerminal(`<div class="log-header">## FINDINGS &nbsp;<small style="color:var(--text-muted);font-weight:normal">— click red line to jump to it in the editor</small></div>`);

        findings.forEach((f, idx) => {
            const safeTable = f.table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const fixedLine = f.original.replace(
                new RegExp(`(\\b(?:FROM|JOIN)\\b\\s+)(${safeTable})(?!\\s+WITH)`, 'i'),
                `$1$2 ${hint}`
            );
            appendToTerminal(`
                <div class="finding-card">
                    <div class="finding-title">Finding #${idx + 1}</div>
                    <div class="finding-meta">
                        Line: <span class="val">${f.lineNum}</span>
                        &nbsp;|&nbsp; Table: <span class="val">${esc(f.table)}</span>
                    </div>
                    <div class="finding-original"
                         onclick="window.highlightTableFromRef(${idx})"
                         title="Click to jump & select the table name in the editor">
                        <i class="fa-solid fa-arrow-right jump-icon"></i>
                        <span>${esc(f.original.trim())}</span>
                    </div>
                    <div class="finding-fix-row">
                        <div class="finding-fix">${esc(fixedLine.trim())}</div>
                        <button class="btn-apply" id="apply-btn-${idx}"
                                onclick="window.applySuggestion(${idx})">
                            <i class="fa-solid fa-wrench"></i> APPLY
                        </button>
                    </div>
                </div>
            `);
        });
    }

    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="btn-content"><i class="fa-solid fa-radar"></i> SCAN</span>';
});
