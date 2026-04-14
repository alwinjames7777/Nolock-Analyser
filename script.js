// ─── Particles ───────────────────────────────────────────────────────────────
particlesJS("particles-js", {
    particles: {
        number: { value: 60, density: { enable: true, value_area: 900 } },
        color: { value: ["#66fcf1","#c5a3ff"] },
        shape: { type: "circle" },
        opacity: { value: 0.4, random: true },
        size: { value: 2.5, random: true },
        line_linked: { enable: true, distance: 140, color: "#66fcf1", opacity: 0.15, width: 1 },
        move: { enable: true, speed: 1.5, out_mode: "out" }
    },
    interactivity: {
        detect_on: "canvas",
        events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
        modes: { grab: { distance: 140, line_linked: { opacity: 0.7 } } }
    },
    retina_detect: true
});

// ─── Code Editor ─────────────────────────────────────────────────────────────
const hiddenTextarea = document.getElementById('sql-script');
const codeLinesEl    = document.getElementById('code-lines');
const codeGutterEl   = document.getElementById('code-gutter');
const codeEditorEl   = document.getElementById('code-editor');

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderLines(sqlText, highlightLineNum = null, highlightTable = null) {
    const lines = sqlText.split('\n');
    
    codeLinesEl.innerHTML = '';
    codeGutterEl.innerHTML = '';
    
    lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        
        // Gutter number
        const gLine = document.createElement('span');
        gLine.className = 'gutter-line';
        gLine.textContent = lineNum;
        codeGutterEl.appendChild(gLine);
        
        // Code line
        const div = document.createElement('div');
        div.className = 'code-line';
        div.setAttribute('data-line', lineNum);
        
        let lineHtml = escapeHtml(line);
        
        // Highlight the specific table name within this line
        if (highlightLineNum === lineNum && highlightTable) {
            const escaped = escapeHtml(highlightTable);
            // Regex to wrap the exact table name after FROM/JOIN
            const re = new RegExp(`(\\b(?:FROM|JOIN)\\b\\s+)(${escaped})`, 'i');
            lineHtml = lineHtml.replace(re, `$1<span class="table-highlight">$2</span>`);
            div.classList.add('highlighted');
        }
        
        const span = document.createElement('span');
        span.className = 'line-content';
        span.innerHTML = lineHtml || '&nbsp;';
        div.appendChild(span);
        
        codeLinesEl.appendChild(div);
    });
}

// Sync hidden textarea input → rendered lines
hiddenTextarea.addEventListener('input', () => {
    renderLines(hiddenTextarea.value);
    syncGutterScroll();
});

// Sync scrolling between code-lines and gutter
codeLinesEl.addEventListener('scroll', syncGutterScroll);
function syncGutterScroll() {
    codeGutterEl.scrollTop = codeLinesEl.scrollTop;
}

// Clicking on the visible rendered area focuses the hidden textarea
codeEditorEl.addEventListener('click', (e) => {
    if (!e.target.closest('.code-line')) return;
    hiddenTextarea.focus();
});

// Initial render
renderLines(hiddenTextarea.placeholder.replace(/&#10;/g,'\n'));

// ─── File Upload ──────────────────────────────────────────────────────────────
document.getElementById('sql-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        hiddenTextarea.value = ev.target.result;
        renderLines(hiddenTextarea.value);
    };
    reader.readAsText(file);
});

// ─── Highlight & Jump ─────────────────────────────────────────────────────────
window.highlightTableFromRef = function(idx) {
    if (!window.latestFindings) return;
    const finding = window.latestFindings[idx];
    if (!finding) return;
    
    // Re-render with that line highlighted
    renderLines(hiddenTextarea.value, finding.lineNum, finding.table);
    
    // Get the DOM element for that line and scroll it into center view
    const lineEl = codeLinesEl.querySelector(`[data-line="${finding.lineNum}"]`);
    if (lineEl) {
        lineEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
};

// ─── Apply Fix ────────────────────────────────────────────────────────────────
window.applySuggestion = function(idx) {
    if (!window.latestFindings) return;
    const finding = window.latestFindings[idx];
    if (!finding) return;
    
    const dialect = document.getElementById('sql-dialect').value;
    const hint = dialect === 'DB2' ? 'WITH UR' : 'WITH (NOLOCK)';
    
    const lines = hiddenTextarea.value.split('\n');
    if (finding.lineNum > lines.length) return;
    
    // Only replace the first occurrence of exact table name in that line
    lines[finding.lineNum - 1] = lines[finding.lineNum - 1].replace(
        new RegExp(`(\\b(?:FROM|JOIN)\\b\\s+)(${finding.table.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})(?!\\s+WITH)`, 'i'),
        `$1$2 ${hint}`
    );
    hiddenTextarea.value = lines.join('\n');
    
    // Mark finding as applied and re-render
    finding.applied = true;
    renderLines(hiddenTextarea.value);
    
    const btn = document.getElementById(`apply-btn-${idx}`);
    if (btn) {
        btn.classList.add('applied');
        btn.textContent = '✓ APPLIED';
        btn.disabled = true;
    }
};

// ─── Scan Logic ───────────────────────────────────────────────────────────────
const terminalOutput = document.getElementById('terminal-output');
const form    = document.getElementById('analyzer-form');
const scanBtn = document.getElementById('scan-btn');

function appendToTerminal(html) {
    const cursor = terminalOutput.querySelector('.blink-cursor');
    if (cursor) cursor.remove();
    const div = document.createElement('div');
    div.innerHTML = html;
    terminalOutput.appendChild(div);
    const cur = document.createElement('div');
    cur.className = 'sys-msg blink-cursor';
    cur.textContent = '_';
    terminalOutput.appendChild(cur);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dialect = document.getElementById('sql-dialect').value;
    const script  = hiddenTextarea.value;
    if (!dialect || !script.trim()) return;
    
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="btn-content"><i class="fa-solid fa-spinner fa-spin"></i> SCANNING...</span>';
    
    terminalOutput.innerHTML = '';
    
    const hint = dialect === 'DB2' ? 'WITH UR' : 'WITH (NOLOCK)';
    const lines = script.split('\n');
    const findings = [];
    window.latestFindings = findings;
    
    // Pre-pass: collect CTE names to exclude
    const cteNames = new Set();
    const cteRegex = /\b(?:WITH|,)\s+([a-zA-Z0-9_]+)\s+AS\s*\(/gi;
    let m;
    while ((m = cteRegex.exec(script)) !== null) {
        cteNames.add(m[1].toUpperCase());
    }
    
    for (let i = 0; i < lines.length; i++) {
        const line      = lines[i];
        const lineUpper = line.toUpperCase();
        const trimmed   = line.trim();
        
        // Skip comments, UPDATE, DELETE
        if (trimmed.startsWith('--') || lineUpper.includes('UPDATE ') || lineUpper.includes('DELETE ')) continue;
        
        // Find FROM/JOIN + table (whole word only)
        const re = /\b(FROM|JOIN)\b\s+([a-zA-Z0-9_\[\]\.]+)/ig;
        let match;
        while ((match = re.exec(line)) !== null) {
            const tbl      = match[2];
            const tblUpper = tbl.toUpperCase();
            
            // Skip: CTEs, temp tables, table vars, system tables
            if (cteNames.has(tblUpper)) continue;
            if (tblUpper.startsWith('#') || tblUpper.startsWith('@')) continue;
            if (/^(SYS|INFORMATION_SCHEMA|MSDB|MASTER)\b/i.test(tbl)) continue;
            
            // Skip if line already has the hint
            if (lineUpper.includes('NOLOCK') || lineUpper.includes('WITH UR')) continue;
            
            // Check if hint immediately follows: "table WITH (...)" — alias check
            const afterTable = line.substring(match.index + match[0].length).trimStart();
            if (/^WITH\s*\(/i.test(afterTable)) continue;
            
            findings.push({ lineNum: i + 1, original: line, table: tbl });
        }
    }
    
    await sleep(300);
    
    // Summary
    appendToTerminal(`<div class="log-header">## SUMMARY</div>`);
    appendToTerminal(`<div class="sys-msg">- Dialect      : <span style="color:var(--cyan-glow)">${dialect}</span></div>`);
    appendToTerminal(`<div class="sys-msg">- Total Lines  : ${lines.length}</div>`);
    appendToTerminal(`<div class="sys-msg">- Missing NOLOCK : <span style="color:#f85149;font-weight:bold">${findings.length}</span></div>`);
    
    // Update badge
    const badge = document.getElementById('missing-badge');
    if (findings.length > 0) {
        badge.textContent = `${findings.length} MISSING`;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
    
    if (findings.length > 0) {
        appendToTerminal(`<div class="log-header">## FINDINGS — click red line to jump</div>`);
        
        findings.forEach((f, idx) => {
            const fixedLine = f.original.replace(
                new RegExp(`(\\b(?:FROM|JOIN)\\b\\s+)(${f.table.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})(?!\\s+WITH)`, 'i'),
                `$1$2 ${hint}`
            );
            appendToTerminal(`
                <div class="finding-card">
                    <div class="finding-title">Finding #${idx + 1}</div>
                    <div class="finding-meta">Line: <span>${f.lineNum}</span> &nbsp; Table: <span>${f.table}</span></div>
                    <div class="finding-original" onclick="window.highlightTableFromRef(${idx})" title="Click to jump & highlight table in editor">
                        ${escapeHtmlTerminal(f.original.trim())}
                    </div>
                    <div class="finding-fix-row">
                        <div class="finding-fix">${escapeHtmlTerminal(fixedLine.trim())}</div>
                        <button class="btn-apply" id="apply-btn-${idx}" onclick="window.applySuggestion(${idx})">⚡ APPLY</button>
                    </div>
                </div>
            `);
        });
    } else {
        appendToTerminal(`<div class="log-success" style="margin-top:12px">✓ All tables have NOLOCK hints — no issues found!</div>`);
    }
    
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="btn-content"><i class="fa-solid fa-radar"></i> SCAN</span>';
    
    // Re-render editor back to plain (clear highlights)
    renderLines(hiddenTextarea.value);
});

function escapeHtmlTerminal(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
