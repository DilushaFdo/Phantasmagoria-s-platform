// logic for exporting data to csv and pdf

// Shared helpers moved to main.js

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    loadPresets();

    document.getElementById('btnExportCSV').addEventListener('click', exportToCSV);
    document.getElementById('btnExportPDF').addEventListener('click', exportToPDF);
    document.getElementById('btnSavePreset').addEventListener('click', savePreset);
});

// helper function to get alumni data from the api
async function fetchAllAlumni() {
    const programme = document.getElementById('filterProgramme').value;
    const fromYear = document.getElementById('filterYearFrom').value;
    const toYear = document.getElementById('filterYearTo').value;

    const params = new URLSearchParams({
        limit: 1000,
        programme,
        yearFrom: fromYear,
        yearTo: toYear
    });

    const res = await fetch(`/api/analytics/alumni?${params}`, { headers: getAuthHeaders(), credentials: 'include' });
    const json = await res.json();
    const data = json.data || json;
    return data.alumni || (Array.isArray(data) ? data : []);
}

async function exportToCSV() {
    const btn = document.getElementById('btnExportCSV');
    setBtnLoading(btn, true);
    try {
        const alumni = await fetchAllAlumni();
        if (alumni.length === 0) {
            showToast('No data found to export with current filters', 'error');
            return;
        }

        let csvContent = "Email,Degree,Graduation Year,Current Role,Employer,Certifications,Licences\n";

        alumni.forEach(al => {
            const profile = al.Profile || {};
            const degrees = profile.Degrees || [];
            const history = profile.EmploymentHistories || [];
            
            const degree = degrees[0]?.title || 'N/A';
            const year = degrees[0]?.completion_date ? new Date(degrees[0].completion_date).getFullYear() : 'N/A';
            const role = history[0]?.job_title || 'N/A';
            const employer = history[0]?.company || 'N/A';
            const certs = (profile.Certifications || []).length;
            const licences = (profile.Licences || []).length;

            csvContent += `"${al.email}","${degree}","${year}","${role}","${employer}","${certs}","${licences}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alumni-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV Exported Successfully!');
    } catch (err) {
        handleFetchError(err);
    } finally {
        setBtnLoading(btn, false);
    }
}

async function exportToPDF() {
    const btn = document.getElementById('btnExportPDF');
    setBtnLoading(btn, true);
    try {
        const alumni = await fetchAllAlumni();
        if (alumni.length === 0) {
            showToast('No data found to export with current filters', 'error');
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('PDF library (jsPDF) failed to load. Please check your internet connection or CSP settings.');
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // add header to pdf
        doc.setFontSize(20);
        doc.text("Alumni Influencers — Data Export", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Export Date: ${new Date().toLocaleString('en-GB')}`, 14, 30);
        
        const prog = document.getElementById('filterProgramme').value || 'All';
        doc.text(`Applied Filter: ${prog} Programme`, 14, 36);

        // add some summary stats to the pdf
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Summary Stats", 14, 48);
        doc.setFontSize(11);
        doc.text(`Total Alumni: ${alumni.length}`, 14, 56);
        
        // create table for the alumni list
        const tableData = alumni.map(al => {
            const profile = al.Profile || {};
            const degrees = profile.Degrees || [];
            const history = profile.EmploymentHistories || [];
            return [
                al.email,
                degrees[0]?.title || 'N/A',
                history[0]?.job_title || 'N/A',
                history[0]?.company || 'N/A'
            ];
        });

        doc.autoTable({
            startY: 65,
            head: [['Email', 'Degree', 'Current Role', 'Employer']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80] }
        });

        doc.save(`alumni-report-${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('PDF Exported Successfully!');
    } catch (err) {
        handleFetchError(err);
    } finally {
        setBtnLoading(btn, false);
    }
}

// functions for managing filter presets
function savePreset() {
    const nameInput = document.getElementById('presetName');
    const name = nameInput.value;
    if (!name) {
        showToast('Please enter a name for the preset', true);
        return;
    }

    let presets = JSON.parse(localStorage.getItem('alumni_presets') || '[]');
    if (presets.length >= 5) {
        showToast('Maximum 5 presets reached. Delete one to save more.', true);
        return;
    }

    const newPreset = {
        name,
        programme: document.getElementById('filterProgramme').value,
        yearFrom: document.getElementById('filterYearFrom').value,
        yearTo: document.getElementById('filterYearTo').value,
        savedAt: new Date().toLocaleString('en-GB')
    };

    presets.push(newPreset);
    localStorage.setItem('alumni_presets', JSON.stringify(presets));
    nameInput.value = '';
    loadPresets();
    showToast(`Preset "${name}" saved!`);
}

function loadPresets() {
    const presets = JSON.parse(localStorage.getItem('alumni_presets') || '[]');
    const container = document.getElementById('presetsList');
    
    if (presets.length === 0) {
        container.innerHTML = '<div class="alert alert-light small text-center text-muted py-3">No saved presets yet.</div>';
        return;
    }

    container.innerHTML = presets.map((p, idx) => `
        <div class="list-group-item d-flex justify-content-between align-items-center bg-light border-0 rounded mb-2 p-3">
            <div>
                <h6 class="fw-bold mb-1">${p.name}</h6>
                <small class="text-muted">Saved: ${p.savedAt} | ${p.programme || 'All'}</small>
            </div>
            <div class="btn-group shadow-sm">
                <button class="btn btn-sm btn-primary" onclick="applyPreset(${idx})">Load</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePreset(${idx})"><i class="bi bi-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function applyPreset(idx) {
    const presets = JSON.parse(localStorage.getItem('alumni_presets') || '[]');
    const p = presets[idx];
    
    document.getElementById('filterProgramme').value = p.programme;
    document.getElementById('filterYearFrom').value = p.yearFrom;
    document.getElementById('filterYearTo').value = p.yearTo;
    
    showToast(`Preset "${p.name}" applied!`);
}

function deletePreset(idx) {
    let presets = JSON.parse(localStorage.getItem('alumni_presets') || '[]');
    const name = presets[idx].name;
    presets.splice(idx, 1);
    localStorage.setItem('alumni_presets', JSON.stringify(presets));
    loadPresets();
    showToast(`Preset "${name}" deleted.`);
}

// make these global so they work with button clicks
window.applyPreset = applyPreset;
window.deletePreset = deletePreset;
