let mode = 'manual', uploadedFile = null;

const fields = () => ({
  name: document.getElementById('fName').value.trim(),
  country: document.getElementById('fCountry').value,
  period: document.getElementById('fPeriod').value,
  hours: document.getElementById('fHours').value,
  confirm: document.getElementById('fConfirm').checked,
  file: uploadedFile
});

function countComplete() {
  const f = fields();
  let n = 0;
  if (f.name) n++;
  if (f.country) n++;
  if (f.period) n++;
  if (mode === 'manual' && f.hours !== '' && parseFloat(f.hours) >= 0.5 && parseFloat(f.hours) <= 168 && (parseFloat(f.hours) % 0.5 === 0)) n++;
  if (mode === 'upload' && f.file) n++;
  if (f.confirm) n++;
  return n;
}

function track() {
  const n = countComplete();
  const pct = Math.round((n / 5) * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = n + ' of 5 fields complete';
  document.getElementById('submitBtn').disabled = (n < 5);
}

function switchTab(t) {
  mode = t;
  document.getElementById('tabM').classList.toggle('active', t === 'manual');
  document.getElementById('tabU').classList.toggle('active', t === 'upload');
  document.getElementById('panelM').style.display = t === 'manual' ? 'block' : 'none';
  document.getElementById('panelU').style.display = t === 'upload' ? 'block' : 'none';
  showErr('fHoursErr', false);
  showErr('fFileErr', false);
  track();
}

function doDrag(e, over) { e.preventDefault(); document.getElementById('dropZone').classList.toggle('drag', over); }

function doDrop(e) {
  e.preventDefault();
  document.getElementById('dropZone').classList.remove('drag');
  if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
}

function setFile(f) {
  if (!f) return;
  const validExtensions = ['.csv', '.xlsx', '.pdf'];
  const fileExtension = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
  if (!validExtensions.includes(fileExtension)) {
    showErr('fFileErr', true, 'Unsupported format. Use CSV, XLSX, or PDF.');
    return;
  }
  if (f.size > 5 * 1024 * 1024) {
    showErr('fFileErr', true, 'File size exceeds 5MB limit.');
    return;
  }
  uploadedFile = f;
  document.getElementById('fileName').textContent = f.name;
  document.getElementById('filePill').style.display = 'block';
  showErr('fFileErr', false);
  track();
}

function clearFile(event) {
  if (event) event.stopPropagation();
  uploadedFile = null;
  document.getElementById('filePill').style.display = 'none';
  document.getElementById('fileIn').value = '';
  track();
}

function showErr(id, show, customMsg = '') {
  const errEl = document.getElementById(id);
  errEl.classList.toggle('show', show);
  if (customMsg) errEl.innerHTML = `<i class="ti ti-alert-circle" aria-hidden="true" style="font-size:13px"></i> ` + customMsg;
  
  const inputId = { fNameErr:'fName', fCountryErr:'fCountry', fPeriodErr:'fPeriod', fHoursErr:'fHours' }[id];
  if (inputId) document.getElementById(inputId).classList.toggle('err', show);
  if (id === 'fFileErr') document.getElementById('dropZone').classList.toggle('err', show);
}

// Immediate error clearing on input
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fName').addEventListener('input', () => {
    if (document.getElementById('fName').value.trim()) showErr('fNameErr', false);
  });
  document.getElementById('fCountry').addEventListener('change', () => {
    if (document.getElementById('fCountry').value) showErr('fCountryErr', false);
  });
  document.getElementById('fPeriod').addEventListener('input', () => {
    if (document.getElementById('fPeriod').value) showErr('fPeriodErr', false);
  });
  document.getElementById('fHours').addEventListener('input', () => {
    const val = parseFloat(document.getElementById('fHours').value);
    if (val >= 0.5 && val <= 168 && val % 0.5 === 0) showErr('fHoursErr', false);
  });
  document.getElementById('fConfirm').addEventListener('change', () => {
    if (document.getElementById('fConfirm').checked) showErr('fConfirmErr', false);
  });
});

function doSubmit() {
  const f = fields();
  let ok = true;

  if (!f.name) { showErr('fNameErr', true); ok = false; } else { showErr('fNameErr', false); }
  if (!f.country) { showErr('fCountryErr', true); ok = false; } else { showErr('fCountryErr', false); }
  if (!f.period) { showErr('fPeriodErr', true); ok = false; } else { showErr('fPeriodErr', false); }

  if (mode === 'manual') {
    const h = parseFloat(f.hours);
    const bad = f.hours === '' || isNaN(h) || h < 0.5 || h > 168 || (h % 0.5 !== 0);
    if (bad) { showErr('fHoursErr', true); ok = false; } else { showErr('fHoursErr', false); }
  } else {
    if (!f.file) { showErr('fFileErr', true); ok = false; } else { showErr('fFileErr', false); }
  }

  if (!f.confirm) { showErr('fConfirmErr', true); ok = false; } else { showErr('fConfirmErr', false); }

  if (!ok) return;

  let formattedPeriod = f.period;
  if (f.period.includes('-W')) {
    const parts = f.period.split('-W');
    formattedPeriod = `Week ${parts[1]}, ${parts[0]}`;
  }

  const hoursDisplay = mode === 'manual' ? parseFloat(f.hours).toFixed(1) + ' hrs' : uploadedFile.name;

  document.getElementById('summaryBox').innerHTML =
    row('Employee Name', f.name) + 
    row('Country', f.country) + 
    row('Period', formattedPeriod) + 
    row('Log Record', hoursDisplay, true);

  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('en-US', options);
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const ms = String(now.getMilliseconds()).padStart(3, '0');

  document.getElementById('submitTime').textContent = `${dateStr} at ${timeStr}.${ms}`;

  document.getElementById('formCard').style.display = 'none';
  document.getElementById('successCard').style.display = 'block';
}

function row(k, v, highlight = false) {
  return `<div class="sum-row"><span class="sum-key">${k}</span><span class="sum-val ${highlight ? 'accent' : ''}">${v}</span></div>`;
}

function doReset() {
  ['fName', 'fHours', 'fNotes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fCountry').value = '';
  document.getElementById('fPeriod').value = '';
  document.getElementById('fConfirm').checked = false;
  clearFile();
  switchTab('manual');
  ['fNameErr', 'fCountryErr', 'fPeriodErr', 'fHoursErr', 'fFileErr', 'fConfirmErr'].forEach(id => showErr(id, false));
  document.getElementById('successCard').style.display = 'none';
  document.getElementById('formCard').style.display = 'block';
  track();
}

// Initial tracker invocation
document.addEventListener('DOMContentLoaded', () => {
  track();
});
