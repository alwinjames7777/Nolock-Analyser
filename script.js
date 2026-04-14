// ═══════════════════════════════════════════════════════
//  3D DATABASE BACKGROUND ANIMATION
// ═══════════════════════════════════════════════════════
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

const SKY = 'rgba(56,189,248,', SKY2 = 'rgba(125,211,252,';

class DbCylinder {
    constructor() { this.reset(true); }
    reset(init = false) {
        this.x = Math.random() * canvas.width; this.y = init ? Math.random() * canvas.height : canvas.height + 80;
        this.w = 50 + Math.random() * 60; this.h = 14 + Math.random() * 10; this.body = this.w * 0.55;
        this.vy = -(0.15 + Math.random() * 0.25); this.alpha = 0.1 + Math.random() * 0.2;
        this.rot = (Math.random() - 0.5) * 0.008; this.angle = Math.random() * Math.PI * 2;
        this.scale = 0.7 + Math.random() * 0.9; this.lineCount = 2 + Math.floor(Math.random() * 3);
    }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.scale(this.scale, this.scale);
        const { alpha: a, w, h, body: b } = this;
        ctx.beginPath(); ctx.ellipse(0, b/2, w/2, h/2, 0, 0, Math.PI*2); ctx.strokeStyle = SKY+a+')'; ctx.lineWidth=1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-w/2,-b/2); ctx.lineTo(-w/2,b/2); ctx.moveTo(w/2,-b/2); ctx.lineTo(w/2,b/2); ctx.strokeStyle=SKY+(a*0.5)+')'; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0,-b/2,w/2,h/2,0,0,Math.PI*2); ctx.strokeStyle=SKY2+a+')'; ctx.lineWidth=1.5; ctx.stroke(); ctx.fillStyle=SKY+(a*0.12)+')'; ctx.fill();
        for(let i=0;i<this.lineCount;i++){const ly=-b/2+(b/(this.lineCount+1))*(i+1);ctx.beginPath();ctx.ellipse(0,ly,w/2*0.85,h/2*0.6,0,0,Math.PI*2);ctx.strokeStyle=SKY+(a*0.35)+')';ctx.lineWidth=0.7;ctx.stroke();}
        ctx.restore();
    }
    update() { this.y+=this.vy; this.angle+=this.rot; if(this.y<-120) this.reset(); }
}

class DataPacket {
    constructor() { this.reset(true); }
    reset(init=false) {
        this.x=Math.random()*canvas.width; this.y=init?Math.random()*canvas.height:canvas.height+30;
        this.vx=(Math.random()-0.5)*0.4; this.vy=-(0.4+Math.random()*0.6);
        this.alpha=0.06+Math.random()*0.14; this.size=3+Math.random()*5; this.trail=[]; this.maxTrail=10+Math.floor(Math.random()*15);
    }
    draw() {
        for(let i=0;i<this.trail.length;i++){const t=this.trail[i],a=(i/this.trail.length)*this.alpha*0.6;ctx.beginPath();ctx.arc(t.x,t.y,this.size*0.4*(i/this.trail.length),0,Math.PI*2);ctx.fillStyle=SKY+a+')';ctx.fill();}
        ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fillStyle=SKY2+this.alpha+')';ctx.fill();
        ctx.beginPath();ctx.arc(this.x,this.y,this.size*2,0,Math.PI*2);ctx.fillStyle=SKY+(this.alpha*0.3)+')';ctx.fill();
    }
    update() { this.trail.push({x:this.x,y:this.y});if(this.trail.length>this.maxTrail)this.trail.shift();this.x+=this.vx;this.y+=this.vy;if(this.y<-30)this.reset(); }
}

class NetworkNode {
    constructor() { this.reset(true); }
    reset(init=false) { this.x=Math.random()*canvas.width;this.y=Math.random()*canvas.height;this.vx=(Math.random()-0.5)*0.3;this.vy=(Math.random()-0.5)*0.15;this.r=2+Math.random()*3;this.alpha=0.1+Math.random()*0.2; }
    draw() { ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fillStyle=SKY+this.alpha+')';ctx.fill(); }
    update() { this.x+=this.vx;this.y+=this.vy;if(this.x<0||this.x>canvas.width)this.vx*=-1;if(this.y<0||this.y>canvas.height)this.vy*=-1; }
}

class TableGrid {
    constructor() { this.reset(true); }
    reset(init=false) {
        this.x=Math.random()*(canvas.width-120);this.y=init?Math.random()*canvas.height:canvas.height+60;
        this.vy=-(0.12+Math.random()*0.2);this.w=100+Math.random()*120;this.rows=3+Math.floor(Math.random()*4);
        this.cols=3+Math.floor(Math.random()*3);this.cellH=10+Math.random()*6;this.cellW=this.w/this.cols;
        this.alpha=0.05+Math.random()*0.1;this.angle=(Math.random()-0.5)*0.3;
    }
    draw() {
        ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);ctx.strokeStyle=SKY+this.alpha+')';ctx.lineWidth=0.6;
        for(let r=0;r<=this.rows;r++){ctx.beginPath();ctx.moveTo(0,r*this.cellH);ctx.lineTo(this.w,r*this.cellH);ctx.stroke();}
        for(let c=0;c<=this.cols;c++){ctx.beginPath();ctx.moveTo(c*this.cellW,0);ctx.lineTo(c*this.cellW,this.rows*this.cellH);ctx.stroke();}
        ctx.fillStyle=SKY+(this.alpha*1.5)+')';ctx.fillRect(0,0,this.w,this.cellH);
        ctx.restore();
    }
    update() { this.y+=this.vy;if(this.y<-100)this.reset(); }
}

const cylinders = Array.from({length:8},()=>new DbCylinder());
const packets   = Array.from({length:30},()=>new DataPacket());
const nodes     = Array.from({length:20},()=>new NetworkNode());
const tables    = Array.from({length:10},()=>new TableGrid());
const CONNECT_DIST = 160;

function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const grad=ctx.createRadialGradient(canvas.width*0.5,canvas.height*0.3,0,canvas.width*0.5,canvas.height*0.5,canvas.width*0.8);
    grad.addColorStop(0,'rgba(4,15,35,1)');grad.addColorStop(1,'rgba(2,6,16,1)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,canvas.width,canvas.height);
    tables.forEach(t=>{t.draw();t.update();});
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<CONNECT_DIST){const a=(1-d/CONNECT_DIST)*0.1;ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.strokeStyle=SKY+a+')';ctx.lineWidth=0.8;ctx.stroke();}}
    nodes.forEach(n=>{n.draw();n.update();});
    cylinders.forEach(c=>{c.draw();c.update();});
    packets.forEach(p=>{p.draw();p.update();});
    requestAnimationFrame(animate);
}
animate();

// ═══════════════════════════════════════════════════════
//  MODE SWITCH
// ═══════════════════════════════════════════════════════
let currentMode = 'nolock';

window.setMode = function(mode) {
    currentMode = mode;
    const tabNolock   = document.getElementById('tab-nolock');
    const tabOptimise = document.getElementById('tab-optimise');
    const reportTitle = document.getElementById('report-title');
    const termLabel   = document.getElementById('terminal-label');

    tabNolock.className   = 'mode-tab' + (mode === 'nolock' ? ' active' : '');
    tabOptimise.className = 'mode-tab' + (mode === 'optimise' ? ' optimise-active' : '');

    if (mode === 'nolock') {
        reportTitle.innerHTML = '<i class="fa-solid fa-lock-open"></i> NOLOCK REPORT';
        termLabel.textContent = 'sql_analyser.exe — nolock_mode';
    } else {
        reportTitle.innerHTML = '<i class="fa-solid fa-bolt"></i> OPTIMISATION REPORT';
        termLabel.textContent = 'sql_analyser.exe — optimise_mode';
    }

    // Clear terminal
    terminalOutput.innerHTML = '<div class="sys-msg">&gt; Mode switched — ready to scan.</div><div class="sys-msg blink-cursor">_</div>';
    document.getElementById('missing-badge').style.display = 'none';
};

// ═══════════════════════════════════════════════════════
//  EDITOR — textarea + line numbers
// ═══════════════════════════════════════════════════════
const sqlInput    = document.getElementById('sqlInput');
const lineNumbers = document.getElementById('lineNumbers');

function updateLineNumbers() {
    const count = sqlInput.value.split('\n').length;
    lineNumbers.innerHTML = Array.from({length:count},(_,i)=>`<div>${i+1}</div>`).join('');
}
sqlInput.addEventListener('scroll', ()=>{ lineNumbers.scrollTop = sqlInput.scrollTop; });
sqlInput.addEventListener('input', updateLineNumbers);
updateLineNumbers();

document.getElementById('sql-file').addEventListener('change', function(e) {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => { sqlInput.value = ev.target.result; updateLineNumbers(); };
    reader.readAsText(file);
});

// ═══════════════════════════════════════════════════════
//  JUMP & HIGHLIGHT — entire line selected
// ═══════════════════════════════════════════════════════
window.jumpToLine = function(lineNum) {
    const lines = sqlInput.value.split('\n');
    if (lineNum < 1 || lineNum > lines.length) return;
    let startPos = 0;
    for (let i = 0; i < lineNum - 1; i++) startPos += lines[i].length + 1;
    const endPos = startPos + lines[lineNum - 1].length;
    sqlInput.focus();
    setTimeout(() => {
        sqlInput.setSelectionRange(startPos, endPos);
        sqlInput.scrollTop = (lineNum - 1) * 21 - (sqlInput.clientHeight / 4);
        lineNumbers.scrollTop = sqlInput.scrollTop;
    }, 0);
};

// ═══════════════════════════════════════════════════════
//  APPLY FIX — NOLOCK
// ═══════════════════════════════════════════════════════
window.applyNolock = function(idx) {
    const f = window.latestFindings && window.latestFindings[idx]; if(!f) return;
    const dialect = document.getElementById('sql-dialect').value;
    const hint = dialect === 'DB2' ? 'WITH UR' : 'WITH (NOLOCK)';
    const lines = sqlInput.value.split('\n'); if(f.lineNum > lines.length) return;
    const safe = f.table.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    lines[f.lineNum-1] = lines[f.lineNum-1].replace(
        new RegExp(`(\\b(?:FROM|JOIN)\\b\\s+)(${safe})(?!\\s+WITH)`,'i'), `$1$2 ${hint}`
    );
    sqlInput.value = lines.join('\n'); updateLineNumbers();
    const btn = document.getElementById(`nolock-apply-${idx}`);
    if(btn){btn.classList.add('applied');btn.innerHTML='<i class="fa-solid fa-check"></i> APPLIED';btn.disabled=true;}
};

// ═══════════════════════════════════════════════════════
//  APPLY FIX — OPTIMISE
// ═══════════════════════════════════════════════════════
window.applyOptimise = function(idx) {
    const f = window.latestOptFindings && window.latestOptFindings[idx];
    if (!f) return;
    const btn = document.getElementById(`opt-apply-${idx}`);

    if (f.autoFix) {
        // Directly replace the flagged line in the editor
        const lines = sqlInput.value.split('\n');
        if (f.lineNum <= lines.length) {
            lines[f.lineNum - 1] = f.fix;
            sqlInput.value = lines.join('\n');
            updateLineNumbers();
        }
        if (btn) { btn.classList.add('applied'); btn.innerHTML = '<i class="fa-solid fa-check"></i> APPLIED'; btn.disabled = true; }
    } else {
        // Insert suggestion as a comment on the line above
        const lines = sqlInput.value.split('\n');
        if (f.lineNum <= lines.length) {
            const comment = `-- ⚡ SUGGESTION: ${f.fix}`;
            lines.splice(f.lineNum - 1, 0, comment);
            sqlInput.value = lines.join('\n');
            updateLineNumbers();
        }
        if (btn) { btn.classList.add('applied'); btn.innerHTML = '<i class="fa-solid fa-check"></i> INSERTED'; btn.disabled = true; }
    }
};

// ═══════════════════════════════════════════════════════
//  TERMINAL HELPERS
// ═══════════════════════════════════════════════════════
const terminalOutput = document.getElementById('terminal-output');
const scanBtn        = document.getElementById('scan-btn');

function appendToTerminal(html) {
    const cursor = terminalOutput.querySelector('.blink-cursor'); if(cursor) cursor.remove();
    const wrap = document.createElement('div'); wrap.innerHTML = html; terminalOutput.appendChild(wrap);
    const cur = document.createElement('div'); cur.className='sys-msg blink-cursor'; cur.textContent='_'; terminalOutput.appendChild(cur);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

// ═══════════════════════════════════════════════════════
//  NOLOCK SCAN ENGINE
// ═══════════════════════════════════════════════════════
function runNolockScan(script, dialect) {
    const lines = script.split('\n');
    const findings = [];
    window.latestFindings = findings;

    const cteNames = new Set();
    const cteRx = /\b(?:WITH|,)\s+([\[\]\w]+)\s+AS\s*\(/gi;
    let cm;
    while((cm=cteRx.exec(script))!==null) cteNames.add(cm[1].toUpperCase());

    const cleanLines = lines.map(l=>l.replace(/--.*$/,'').replace(/\/\*[\s\S]*?\*\//g,' '));

    for(let i=0;i<cleanLines.length;i++){
        const cl=cleanLines[i];
        const rx=/\b(FROM|JOIN)\s+((?![#@])([\[\]\w\.]+))(?:\s+(?:AS\s+)?([\[\]\w]+))?/gi;
        let m;
        while((m=rx.exec(cl))!==null){
            const fullName=m[2], tblName=m[3];
            if(cteNames.has(fullName.toUpperCase())||cteNames.has((tblName||'').toUpperCase())) continue;
            if(/^(SYS\.|INFORMATION_SCHEMA\.|MSDB\.|MASTER\.)/i.test(fullName)) continue;
            const lookAhead = cleanLines.slice(i).join('\n').substring(m.index+m[0].length);
            const termIdx = lookAhead.search(/\b(WHERE|JOIN|GROUP|ORDER|UNION|SELECT|INSERT|UPDATE|DELETE|BEGIN|END|IF|GO)\b/i);
            const context = termIdx>=0 ? lookAhead.substring(0,termIdx) : lookAhead;
            if(/(?:WITH\s*)?\(NOLOCK\)/i.test(context)||/WITH\s+UR/i.test(context)) continue;
            findings.push({lineNum:i+1, original:lines[i], table:fullName});
        }
    }
    return findings;
}

// ═══════════════════════════════════════════════════════
//  OPTIMISE ENGINE
// ═══════════════════════════════════════════════════════
function runOptimiseScan(script) {
    const lines = script.split('\n');
    const findings = [];
    window.latestOptFindings = findings;

    const cleanLines = lines.map(l=>l.replace(/--.*$/,''));

    const checks = [
        {
            id: 'SELECT_STAR',
            label: 'SELECT * Usage',
            category: 'Performance',
            regex: /\bSELECT\s+\*/i,
            fix: () => 'Specify only required columns instead of SELECT *',
            autoFix: false,
        },
        {
            id: 'CURSOR',
            label: 'CURSOR Usage',
            category: 'Anti-Pattern',
            regex: /\bDECLARE\s+\w+\s+CURSOR\b/i,
            fix: () => 'Replace CURSOR with a set-based UPDATE/INSERT using a CTE or window functions',
            autoFix: false,
        },
        {
            id: 'LIKE_LEADING',
            label: 'Leading Wildcard LIKE',
            category: 'Index',
            regex: /\bLIKE\s+'%[^']+'/i,
            fix: () => "LIKE '%value' causes full table scan — consider Full-Text Search or reverse the pattern",
            autoFix: false,
        },
        {
            id: 'NOT_IN_SUBQUERY',
            label: 'NOT IN with Subquery',
            category: 'Performance',
            regex: /\bNOT\s+IN\s*\(\s*SELECT\b/i,
            fix: () => 'Replace NOT IN (SELECT...) with NOT EXISTS(...) or LEFT JOIN ... WHERE key IS NULL',
            autoFix: false,
        },
        {
            id: 'FUNC_ON_COLUMN',
            label: 'Function on Indexed Column',
            category: 'Sargability',
            regex: /\bWHERE\b.*\b(YEAR|MONTH|DAY|LEFT|RIGHT|LOWER|UPPER|CONVERT|CAST)\s*\([^)]+\)\s*(=|>|<|>=|<=)/i,
            fix: () => 'Rewrite WHERE to compare raw column value — avoid wrapping the column in a function',
            autoFix: false,
        },
        {
            id: 'SELECT_DISTINCT',
            label: 'Excessive DISTINCT',
            category: 'Performance',
            regex: /\bSELECT\s+DISTINCT\b/i,
            fix: () => 'Check if JOINs are creating duplicates — fix the JOIN instead of using DISTINCT',
            autoFix: false,
        },
        {
            id: 'MISSING_WHERE_UPDATE',
            label: 'UPDATE Without WHERE',
            category: '⚠ Danger',
            // Only flag if no WHERE, JOIN, or FROM appears within the next 10 lines
            regex: /^\s*UPDATE\b/i,
            checkFn: (allLines, lineIdx) => {
                const block = allLines.slice(lineIdx, lineIdx + 12).join(' ');
                const hasWhere = /\bWHERE\b/i.test(block);
                const hasJoin  = /\b(JOIN|FROM)\b/i.test(block.replace(/^[^\n]+/, ''));
                return !hasWhere && !hasJoin;
            },
            fix: () => 'Add a WHERE clause or verify the JOIN provides row filtering',
            autoFix: false,
        },
        {
            id: 'MISSING_WHERE_DELETE',
            label: 'DELETE Without WHERE',
            category: '⚠ Danger',
            regex: /^\s*DELETE\b/i,
            checkFn: (allLines, lineIdx) => {
                const block = allLines.slice(lineIdx, lineIdx + 8).join(' ');
                return !/\bWHERE\b/i.test(block) && !/\bJOIN\b/i.test(block);
            },
            fix: () => 'Add a WHERE clause to limit which rows are deleted',
            autoFix: false,
        },
        {
            id: 'IMPLICIT_CONVERT',
            label: 'Potential Implicit Conversion',
            category: 'Sargability',
            regex: /\bWHERE\b.*=\s*\d+/i,
            fix: () => 'Ensure column and value data types match to avoid implicit conversion blocking index use',
            autoFix: false,
        },
        {
            id: 'NOCOUNT_MISSING',
            label: 'SET NOCOUNT ON Missing',
            category: 'Performance',
            regex: /^\s*(?:CREATE|ALTER)\s+(?:PROC|PROCEDURE)\b/i,
            checkFn: (allLines) => !/SET\s+NOCOUNT\s+ON/i.test(allLines.join('\n')),
            fix: () => 'SET NOCOUNT ON;',
            autoFix: false,
        },
    ];

    for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i];
        for (const check of checks) {
            if (!check.regex.test(line)) continue;
            if (check.checkFn && !check.checkFn(cleanLines, i)) continue;

            findings.push({
                lineNum:  i + 1,
                original: lines[i],
                label:    check.label,
                category: check.category,
                fix:      check.fix(line),
                autoFix:  check.autoFix,
            });
            break;
        }
    }
    return findings;
}

// ═══════════════════════════════════════════════════════
//  FORM SUBMIT — dispatch by mode
// ═══════════════════════════════════════════════════════
document.getElementById('analyzer-form').addEventListener('submit', async e => {
    e.preventDefault();
    const dialect = document.getElementById('sql-dialect').value;
    const script  = sqlInput.value;
    if (!dialect || !script.trim()) return;

    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="btn-content"><i class="fa-solid fa-spinner fa-spin"></i> SCANNING...</span>';
    terminalOutput.innerHTML = '';

    await sleep(250);

    if (currentMode === 'nolock') {
        await runNolockReport(script, dialect);
    } else {
        await runOptimiseReport(script);
    }

    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="btn-content"><i class="fa-solid fa-radar"></i> SCAN</span>';
});

// ═══════════════════════════════════════════════════════
//  NOLOCK REPORT OUTPUT
// ═══════════════════════════════════════════════════════
async function runNolockReport(script, dialect) {
    const hint = dialect === 'DB2' ? 'WITH UR' : 'WITH (NOLOCK)';
    const lines = script.split('\n');
    const findings = runNolockScan(script, dialect);

    appendToTerminal(`<div class="log-header">## SUMMARY — NOLOCK SCAN</div>`);
    appendToTerminal(`<div class="sys-msg">- Dialect      : <span class="log-val">${dialect}</span></div>`);
    appendToTerminal(`<div class="sys-msg">- Total Lines  : <span class="log-val">${lines.length}</span></div>`);
    appendToTerminal(`<div class="sys-msg">- Missing NOLOCK : <span style="color:#f85149;font-weight:bold">${findings.length}</span></div>`);

    const badge = document.getElementById('missing-badge');
    badge.style.background = 'rgba(248,81,73,0.15)';
    badge.style.border = '1px solid rgba(248,81,73,0.45)';
    badge.style.color = '#f85149';
    badge.textContent = `${findings.length} MISSING`;
    badge.style.display = findings.length > 0 ? 'inline-block' : 'none';

    if (findings.length === 0) {
        appendToTerminal(`<div class="log-success" style="margin-top:10px">✓ All tables have NOLOCK hints!</div>`);
        return;
    }

    appendToTerminal(`<div class="log-header">## FINDINGS <small style="color:var(--text-muted);font-weight:normal;font-size:0.74rem">— click red line to jump</small></div>`);
    findings.forEach((f, idx) => {
        const safe = f.table.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const fixedLine = f.original.replace(
            new RegExp(`(\\b(?:FROM|JOIN)\\b\\s+)(${safe})(?!\\s+WITH)`,'i'),`$1$2 ${hint}`
        );
        appendToTerminal(`
            <div class="finding-card">
                <div class="finding-top">
                    <span class="finding-title">Finding #${idx+1}</span>
                    <span class="table-badge"><i class="fa-solid fa-table"></i> ${esc(f.table)}</span>
                </div>
                <div class="finding-meta">Line: <span class="val">${f.lineNum}</span> &nbsp;|&nbsp; Severity: <span style="color:#f85149">MISSING NOLOCK</span></div>
                <div class="finding-original" onclick="window.jumpToLine(${f.lineNum})" title="Click to jump to line">
                    <span class="arrow">&#8594;</span><span>${esc(f.original.trim())}</span>
                </div>
                <div class="finding-fix-row">
                    <div class="finding-fix">${esc(fixedLine.trim())}</div>
                    <button class="btn-apply" id="nolock-apply-${idx}" onclick="window.applyNolock(${idx})">
                        <i class="fa-solid fa-wrench"></i> APPLY
                    </button>
                </div>
            </div>
        `);
    });
}

// ═══════════════════════════════════════════════════════
//  OPTIMISE REPORT OUTPUT
// ═══════════════════════════════════════════════════════
async function runOptimiseReport(script) {
    const lines = script.split('\n');
    const findings = runOptimiseScan(script);

    appendToTerminal(`<div class="log-header">## SUMMARY — OPTIMISATION SCAN</div>`);
    appendToTerminal(`<div class="sys-msg">- Total Lines        : <span class="log-val">${lines.length}</span></div>`);
    appendToTerminal(`<div class="sys-msg">- Issues Detected    : <span class="log-warn">${findings.length}</span></div>`);

    const badge = document.getElementById('missing-badge');
    badge.style.background = 'rgba(251,191,36,0.12)';
    badge.style.border = '1px solid rgba(251,191,36,0.4)';
    badge.style.color = '#fbbf24';
    badge.textContent = `${findings.length} ISSUES`;
    badge.style.display = findings.length > 0 ? 'inline-block' : 'none';

    if (findings.length === 0) {
        appendToTerminal(`<div class="log-success" style="margin-top:10px">✓ No optimisation issues detected!</div>`);
        return;
    }

    appendToTerminal(`<div class="log-header" style="color:#fbbf24">## FINDINGS <small style="color:var(--text-muted);font-weight:normal;font-size:0.74rem">— click yellow line to jump</small></div>`);
    findings.forEach((f, idx) => {
        const btnLabel = f.autoFix
            ? '<i class="fa-solid fa-wrench"></i> APPLY'
            : '<i class="fa-solid fa-comment"></i> INSERT';
        const fixBlock = `<div class="opt-fix-row">
                    <div class="opt-suggestion">${esc(f.fix)}</div>
                    <button class="btn-opt-apply" id="opt-apply-${idx}" onclick="window.applyOptimise(${idx})">${btnLabel}</button>
               </div>`;

        appendToTerminal(`
            <div class="opt-card">
                <div class="opt-top">
                    <span class="opt-title">Issue #${idx+1} — ${esc(f.label)}</span>
                    <span class="opt-badge"><i class="fa-solid fa-triangle-exclamation"></i> ${esc(f.category)}</span>
                </div>
                <div class="opt-meta">Line: <span class="val">${f.lineNum}</span></div>
                <div class="opt-snippet" onclick="window.jumpToLine(${f.lineNum})" title="Click to jump to line">
                    <span class="arrow">&#8594;</span><span>${esc(f.original.trim())}</span>
                </div>
                ${fixBlock}
            </div>
        `);
    });
}
