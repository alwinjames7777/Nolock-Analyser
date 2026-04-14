// ═══════════════════════════════════════════════════════
//  3D DATABASE BACKGROUND ANIMATION
// ═══════════════════════════════════════════════════════
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

// Sky blue palette
const SKY   = 'rgba(56,189,248,';
const SKY2  = 'rgba(125,211,252,';
const WHITE = 'rgba(224,238,255,';

// ── Database cylinders ──────────────────────────────────
class DbCylinder {
    constructor() { this.reset(true); }
    reset(init = false) {
        this.x  = Math.random() * canvas.width;
        this.y  = init ? Math.random() * canvas.height : canvas.height + 80;
        this.w  = 50 + Math.random() * 60;
        this.h  = 14 + Math.random() * 10;
        this.body = this.w * 0.55;
        this.vy = -(0.15 + Math.random() * 0.25);
        this.alpha = 0.1 + Math.random() * 0.2;
        this.rot = (Math.random() - 0.5) * 0.008;
        this.angle = Math.random() * Math.PI * 2;
        this.scale = 0.7 + Math.random() * 0.9;
        this.lineCount = 2 + Math.floor(Math.random() * 3);
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.scale(this.scale, this.scale);
        const a = this.alpha;
        const w = this.w, h = this.h, b = this.body;

        // Bottom ellipse
        ctx.beginPath();
        ctx.ellipse(0, b / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = SKY + a + ')';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Side walls
        ctx.beginPath();
        ctx.moveTo(-w / 2, -b / 2);
        ctx.lineTo(-w / 2, b / 2);
        ctx.moveTo(w / 2, -b / 2);
        ctx.lineTo(w / 2, b / 2);
        ctx.strokeStyle = SKY + (a * 0.6) + ')';
        ctx.stroke();

        // Top ellipse (bright)
        ctx.beginPath();
        ctx.ellipse(0, -b / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = SKY2 + a + ')';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = SKY + (a * 0.15) + ')';
        ctx.fill();

        // Data lines (horizontal stripes inside cylinder)
        for (let i = 0; i < this.lineCount; i++) {
            const ly = -b / 2 + (b / (this.lineCount + 1)) * (i + 1);
            ctx.beginPath();
            ctx.ellipse(0, ly, w / 2 * 0.85, h / 2 * 0.6, 0, 0, Math.PI * 2);
            ctx.strokeStyle = SKY + (a * 0.4) + ')';
            ctx.lineWidth = 0.7;
            ctx.stroke();
        }

        ctx.restore();
    }
    update() {
        this.y += this.vy;
        this.angle += this.rot;
        if (this.y < -120) this.reset();
    }
}

// ── Floating data packets ────────────────────────────────
class DataPacket {
    constructor() { this.reset(true); }
    reset(init = false) {
        this.x  = Math.random() * canvas.width;
        this.y  = init ? Math.random() * canvas.height : canvas.height + 30;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -(0.4 + Math.random() * 0.6);
        this.alpha = 0.06 + Math.random() * 0.14;
        this.size = 3 + Math.random() * 5;
        this.trail = [];
        this.maxTrail = 10 + Math.floor(Math.random() * 15);
    }
    draw() {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const a = (i / this.trail.length) * this.alpha * 0.6;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.size * 0.4 * (i / this.trail.length), 0, Math.PI * 2);
            ctx.fillStyle = SKY + a + ')';
            ctx.fill();
        }
        // Dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = SKY2 + this.alpha + ')';
        ctx.fill();
        // Glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = SKY + (this.alpha * 0.3) + ')';
        ctx.fill();
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
        if (this.y < -30) this.reset();
    }
}

// ── Connection lines between nodes ──────────────────────
class NetworkNode {
    constructor() { this.reset(true); }
    reset(init = false) {
        this.x  = Math.random() * canvas.width;
        this.y  = init ? Math.random() * canvas.height : Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.15;
        this.r  = 2 + Math.random() * 3;
        this.alpha = 0.1 + Math.random() * 0.2;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = SKY + this.alpha + ')';
        ctx.fill();
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width)  this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height)  this.vy *= -1;
    }
}

// ── Table grid rows (floating) ───────────────────────────
class TableGrid {
    constructor() { this.reset(true); }
    reset(init = false) {
        this.x     = Math.random() * (canvas.width - 120);
        this.y     = init ? Math.random() * canvas.height : canvas.height + 60;
        this.vy    = -(0.12 + Math.random() * 0.2);
        this.w     = 100 + Math.random() * 120;
        this.rows  = 3 + Math.floor(Math.random() * 4);
        this.cols  = 3 + Math.floor(Math.random() * 3);
        this.cellH = 10 + Math.random() * 6;
        this.cellW = this.w / this.cols;
        this.alpha = 0.05 + Math.random() * 0.1;
        this.angle = (Math.random() - 0.5) * 0.3;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = SKY + this.alpha + ')';
        ctx.lineWidth = 0.6;
        // Grid lines
        for (let r = 0; r <= this.rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * this.cellH);
            ctx.lineTo(this.w, r * this.cellH);
            ctx.stroke();
        }
        for (let c = 0; c <= this.cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * this.cellW, 0);
            ctx.lineTo(c * this.cellW, this.rows * this.cellH);
            ctx.stroke();
        }
        // Header fill
        ctx.fillStyle = SKY + (this.alpha * 1.5) + ')';
        ctx.fillRect(0, 0, this.w, this.cellH);
        ctx.restore();
    }
    update() {
        this.y += this.vy;
        if (this.y < -100) this.reset();
    }
}

// ── Initialise objects ────────────────────────────────────
const cylinders = Array.from({ length: 8 }, () => new DbCylinder());
const packets   = Array.from({ length: 30 }, () => new DataPacket());
const nodes     = Array.from({ length: 20 }, () => new NetworkNode());
const tables    = Array.from({ length: 10 }, () => new TableGrid());

const CONNECT_DIST = 160;

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark gradient background
    const grad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.3, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
    );
    grad.addColorStop(0, 'rgba(4,15,35,1)');
    grad.addColorStop(1, 'rgba(2,6,16,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw & update table grids (deepest layer)
    tables.forEach(t => { t.draw(); t.update(); });

    // Connection lines between nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const d  = Math.sqrt(dx*dx + dy*dy);
            if (d < CONNECT_DIST) {
                const a = (1 - d / CONNECT_DIST) * 0.1;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = SKY + a + ')';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
    }

    // Nodes
    nodes.forEach(n => { n.draw(); n.update(); });

    // Cylinders
    cylinders.forEach(c => { c.draw(); c.update(); });

    // Data packets (top layer)
    packets.forEach(p => { p.draw(); p.update(); });

    requestAnimationFrame(animate);
}
animate();

// ═══════════════════════════════════════════════════════
//  EDITOR — textarea + line numbers
// ═══════════════════════════════════════════════════════
const sqlInput    = document.getElementById('sqlInput');
const lineNumbers = document.getElementById('lineNumbers');

function updateLineNumbers() {
    const count = sqlInput.value.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: count }, (_, i) => `<div>${i + 1}</div>`).join('');
}

sqlInput.addEventListener('scroll', () => { lineNumbers.scrollTop = sqlInput.scrollTop; });
sqlInput.addEventListener('input', updateLineNumbers);
updateLineNumbers();

// ── File Upload ───────────────────────────────────────────
document.getElementById('sql-file').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { sqlInput.value = ev.target.result; updateLineNumbers(); };
    reader.readAsText(file);
});

// ── Jump & Highlight ──────────────────────────────────────
window.highlightTableFromRef = function (idx) {
    const finding = window.latestFindings && window.latestFindings[idx];
    if (!finding) return;

    const lines = sqlInput.value.split('\n');
    if (finding.lineNum < 1 || finding.lineNum > lines.length) return;

    let startPos = 0;
    for (let i = 0; i < finding.lineNum - 1; i++) startPos += lines[i].length + 1;

    const lineText = lines[finding.lineNum - 1] || '';
    let selStart = startPos;
    let selEnd   = startPos + lineText.length;

    const safe  = finding.table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = lineText.match(new RegExp(`\\b(?:FROM|JOIN)\\b\\s+(${safe})`, 'i'));
    if (match) {
        const off = match.index + match[0].length - match[1].length;
        selStart  = startPos + off;
        selEnd    = selStart + match[1].length;
    }

    sqlInput.focus();
    setTimeout(() => {
        sqlInput.setSelectionRange(selStart, selEnd);
        // Line height = CSS --lh = 21px (exact same formula as reference site)
        sqlInput.scrollTop = (finding.lineNum - 1) * 21 - (sqlInput.clientHeight / 4);
        lineNumbers.scrollTop = sqlInput.scrollTop;
    }, 0);
};

// ── Apply Fix ─────────────────────────────────────────────
window.applySuggestion = function (idx) {
    const finding = window.latestFindings && window.latestFindings[idx];
    if (!finding) return;
    const dialect = document.getElementById('sql-dialect').value;
    const hint    = dialect === 'DB2' ? 'WITH UR' : 'WITH (NOLOCK)';
    const lines   = sqlInput.value.split('\n');
    if (finding.lineNum > lines.length) return;
    const safe = finding.table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    lines[finding.lineNum - 1] = lines[finding.lineNum - 1].replace(
        new RegExp(`(\\b(?:FROM|JOIN)\\b\\s+)(${safe})(?!\\s+WITH)`, 'i'),
        `$1$2 ${hint}`
    );
    sqlInput.value = lines.join('\n');
    updateLineNumbers();
    finding.applied = true;
    const btn = document.getElementById(`apply-btn-${idx}`);
    if (btn) { btn.classList.add('applied'); btn.innerHTML = '<i class="fa-solid fa-check"></i> APPLIED'; btn.disabled = true; }
};

// ═══════════════════════════════════════════════════════
//  TERMINAL HELPERS
// ═══════════════════════════════════════════════════════
const terminalOutput = document.getElementById('terminal-output');
const scanBtn        = document.getElementById('scan-btn');

function appendToTerminal(html) {
    const cursor = terminalOutput.querySelector('.blink-cursor');
    if (cursor) cursor.remove();
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    terminalOutput.appendChild(wrap);
    const cur = document.createElement('div');
    cur.className = 'sys-msg blink-cursor'; cur.textContent = '_';
    terminalOutput.appendChild(cur);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════
//  SCAN
// ═══════════════════════════════════════════════════════
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

    // CTE pre-pass
    const cteNames = new Set();
    const cteRx = /\b(?:WITH|,)\s+([\[\]\w]+)\s+AS\s*\(/gi;
    let cm;
    while ((cm = cteRx.exec(script)) !== null) cteNames.add(cm[1].toUpperCase());

    // Strip inline comments for scanning (keep line count intact)
    const cleanLines = lines.map(l => l.replace(/--.*$/, '').replace(/\/\*[\s\S]*?\*\//g, ' '));

    for (let i = 0; i < cleanLines.length; i++) {
        const cl = cleanLines[i];
        const fromJoinRx = /\b(FROM|JOIN)\s+((?![#@])([\[\]\w\.]+))(?:\s+(?:AS\s+)?([\[\]\w]+))?/gi;
        let m;
        while ((m = fromJoinRx.exec(cl)) !== null) {
            const fullName = m[2], tableName = m[3];
            if (cteNames.has(fullName.toUpperCase()) || cteNames.has((tableName || '').toUpperCase())) continue;
            if (/^(SYS\.|INFORMATION_SCHEMA\.|MSDB\.|MASTER\.)/i.test(fullName)) continue;

            // Look ahead in remaining text for (NOLOCK) before next clause
            const lookAhead = cleanLines.slice(i).join('\n').substring(m.index + m[0].length);
            const termIdx   = lookAhead.search(/\b(WHERE|JOIN|GROUP|ORDER|UNION|SELECT|INSERT|UPDATE|DELETE|BEGIN|END|IF|GO)\b/i);
            const context   = termIdx >= 0 ? lookAhead.substring(0, termIdx) : lookAhead;
            if (/(?:WITH\s*)?\(NOLOCK\)/i.test(context) || /WITH\s+UR/i.test(context)) continue;

            findings.push({ lineNum: i + 1, original: lines[i], table: fullName });
        }
    }

    await sleep(250);

    // ── Summary ──
    appendToTerminal(`<div class="log-header">## SUMMARY</div>`);
    appendToTerminal(`<div class="sys-msg">- Dialect      : <span class="log-val">${dialect}</span></div>`);
    appendToTerminal(`<div class="sys-msg">- Total Lines  : <span class="log-val">${lines.length}</span></div>`);
    appendToTerminal(`<div class="sys-msg">- Missing NOLOCK : <span style="color:#f85149;font-weight:bold">${findings.length}</span></div>`);

    const badge = document.getElementById('missing-badge');
    badge.textContent  = `${findings.length} MISSING`;
    badge.style.display = findings.length > 0 ? 'inline-block' : 'none';

    if (findings.length === 0) {
        appendToTerminal(`<div class="log-success" style="margin-top:10px">✓ All tables have NOLOCK hints — no issues found!</div>`);
    } else {
        appendToTerminal(`<div class="log-header">## FINDINGS &nbsp;<small style="color:var(--text-muted);font-weight:normal;font-size:0.75rem">— click the red line to jump</small></div>`);
        findings.forEach((f, idx) => {
            const safe = f.table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const fixedLine = f.original.replace(
                new RegExp(`(\\b(?:FROM|JOIN)\\b\\s+)(${safe})(?!\\s+WITH)`, 'i'),
                `$1$2 ${hint}`
            );
            appendToTerminal(`
                <div class="finding-card">
                    <div class="finding-top">
                        <span class="finding-title">Finding #${idx + 1}</span>
                        <span class="table-badge">
                            <i class="fa-solid fa-table"></i> ${esc(f.table)}
                        </span>
                    </div>
                    <div class="finding-meta">
                        Line: <span class="val">${f.lineNum}</span>
                        &nbsp;|&nbsp; Severity: <span style="color:#f85149">MISSING NOLOCK</span>
                    </div>
                    <div class="finding-original"
                         onclick="window.highlightTableFromRef(${idx})"
                         title="Click to jump & highlight in editor">
                        <span class="arrow">&#8594;</span>
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
