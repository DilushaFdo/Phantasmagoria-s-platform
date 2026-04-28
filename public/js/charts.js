/**
 * Shared Chart Logic for Phantasmagoria Dashboard
 */

const getApiKey = () => document.querySelector('meta[name="api-key"]')?.content;
const getAuthHeaders = () => ({ 'Authorization': `Bearer ${getApiKey()}` });

// Global store for chart instances to allow destruction/refresh
const chartInstances = {};

/**
 * Initialize Filters
 */
async function initFilters(onApply) {
    const programmeSelect = document.getElementById('filterProgramme');
    const fromYearSelect = document.getElementById('filterYearFrom');
    const toYearSelect = document.getElementById('filterYearTo');
    const btnApply = document.getElementById('btnApplyFilters');
    const btnReset = document.getElementById('btnResetFilters');

    // Populate Programmes
    try {
        const res = await fetch('/api/analytics/degrees', { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.byProgramme) {
            data.byProgramme.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.title;
                opt.textContent = p.title;
                programmeSelect.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Failed to load programmes', err);
    }

    // Populate Years (2010 to current + 5)
    const currentYear = new Date().getFullYear();
    for (let y = 2010; y <= currentYear + 1; y++) {
        const opt1 = document.createElement('option');
        opt1.value = y; opt1.textContent = y;
        fromYearSelect.appendChild(opt1);
        
        const opt2 = document.createElement('option');
        opt2.value = y; opt2.textContent = y;
        toYearSelect.appendChild(opt2);
    }

    btnApply.addEventListener('click', () => {
        const filters = {
            programme: programmeSelect.value,
            yearFrom: fromYearSelect.value,
            yearTo: toYearSelect.value
        };
        showToast('Applying filters...');
        onApply(filters);
    });

    btnReset.addEventListener('click', () => {
        programmeSelect.value = '';
        fromYearSelect.value = '';
        toYearSelect.value = '';
        showToast('Filters reset.');
        onApply({});
    });
}

/**
 * Download Chart as PNG
 */
function downloadChart(chartId, filename = 'chart.png') {
    const chart = chartInstances[chartId];
    if (!chart) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = chart.toBase64Image();
    link.click();
}

/**
 * Radar Chart: Skills vs Certs
 */
function drawRadarChart(canvasId, certs, courses) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Get top 8 of each
    const topCerts = certs.slice(0, 8);
    const topCourses = courses.slice(0, 8);
    
    // Create unique labels from both
    const labels = [...new Set([...topCerts.map(c => c.title), ...topCourses.map(c => c.title)])].slice(0, 10);
    
    const certData = labels.map(l => certs.find(c => c.title === l)?.count || 0);
    const courseData = labels.map(l => courses.find(c => c.title === l)?.count || 0);

    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Certifications',
                    data: certData,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    pointBackgroundColor: 'rgba(52, 152, 219, 1)'
                },
                {
                    label: 'Professional Courses',
                    data: courseData,
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    pointBackgroundColor: 'rgba(46, 204, 113, 1)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } }
        }
    });
}

/**
 * Horizontal Bar Chart with Color Coding (Gap Analysis)
 */
function drawGapAnalysisChart(canvasId, data, totalAlumni) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const top10 = data.slice(0, 10);

    const labels = top10.map(i => i.title);
    const counts = top10.map(i => i.count);
    const percentages = counts.map(c => (c / totalAlumni) * 100);

    const backgroundColors = percentages.map(p => {
        if (p > 60) return '#e74c3c'; // Red (Critical)
        if (p > 30) return '#f39c12'; // Amber (Significant)
        return '#2ecc71'; // Green (Emerging)
    });

    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Popularity %',
                data: percentages,
                backgroundColor: backgroundColors,
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Popularity: ${ctx.raw.toFixed(1)}% (${top10[ctx.dataIndex].count} alumni)`
                    }
                }
            },
            scales: { x: { max: 100, beginAtZero: true, title: { display: true, text: 'Percentage of Alumni %' } } }
        }
    });
}

/**
 * Doughnut Chart: Top Employers
 */
function drawEmployerDoughnut(canvasId, employers) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const top8 = employers.slice(0, 8);
    const otherCount = employers.slice(8).reduce((sum, e) => sum + parseInt(e.count), 0);
    
    const labels = top8.map(e => e.company);
    const data = top8.map(e => parseInt(e.count));

    if (otherCount > 0) {
        labels.push('Other');
        data.push(otherCount);
    }

    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', '#34495e', '#1abc9c', '#d35400', '#95a5a6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });
}

/**
 * Line Chart: Trends
 */
function drawTrendLineChart(canvasId, trends) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const years = [...new Set(trends.map(t => t.year))].sort();
    const roles = [...new Set(trends.map(t => t.job_title))].slice(0, 5);

    const datasets = roles.map((role, idx) => {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6'];
        return {
            label: role,
            data: years.map(y => trends.find(t => t.year === y && t.job_title === role)?.count || 0),
            borderColor: colors[idx],
            fill: false,
            tension: 0.3
        };
    });

    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: { labels: years, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

/**
 * Job Titles Bar Chart (Gradient)
 */
function drawJobTitlesChart(canvasId, roles) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const top10 = roles.slice(0, 10);

    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(r => r.job_title),
            datasets: [{
                label: 'Alumni Count',
                data: top10.map(r => r.count),
                backgroundColor: '#3498db',
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

/**
 * Grouped Bar Chart: Roles vs Programme
 */
function drawRolesByProgrammeChart(canvasId, alumniData) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // This requires processing the full alumni list client-side
    // We group by Programme and then by Role
    const programmes = [...new Set(alumniData.map(al => al.Profile.Degrees[0]?.title))].filter(Boolean);
    const topRoles = ['Software Engineer', 'Data Scientist', 'Project Manager', 'DevOps Engineer', 'Full Stack Developer'];
    
    const datasets = topRoles.map((role, idx) => {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6'];
        return {
            label: role,
            data: programmes.map(prog => {
                return alumniData.filter(al => al.Profile.Degrees[0]?.title === prog && al.Profile.EmploymentHistories[0]?.job_title === role).length;
            }),
            backgroundColor: colors[idx]
        };
    });

    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: { labels: programmes, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

/**
 * Average Bid by Employer Chart
 */
function drawBidsByEmployerChart(canvasId, employers, bids) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // We need to correlate bids with employers
    // For this mockup, we'll use the top 5 employers
    const top5 = employers.slice(0, 5);
    const labels = top5.map(e => e.company);
    
    // Mocking the average bid calculation logic based on provided datasets
    const avgData = labels.map(label => {
        // In a real scenario, we'd join user -> bid -> employment
        // Returning random averages for visual proof of concept
        return 50 + Math.random() * 100;
    });

    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Average Bid (£)',
                data: avgData,
                backgroundColor: '#9b59b6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Avg Bid Amount' } } }
        }
    });
}

// Auto-download support for export page
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('download') === 'true') {
        setTimeout(() => {
            Object.keys(chartInstances).forEach(id => {
                downloadChart(id, `${id}_export.png`);
            });
        }, 1500); // Wait for animations to finish
    }
});
