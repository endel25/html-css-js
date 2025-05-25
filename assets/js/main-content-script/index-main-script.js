// Function to get Dashboard permissions from localStorage
function getPermissions() {
    const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
    const dashboardPermissions = permissions.find(p => p.name === 'Dashboard') || {
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false
    };
    console.log('Retrieved Dashboard permissions:', dashboardPermissions);
    return dashboardPermissions;
}

let approvedVisitors = [];
let disapprovedVisitors = [];
let exitVisitors = [];

async function fetchApprovedVisitors() {
    try {
        console.log('Fetching approved visitors...');
        const response = await fetch(`http://192.168.3.74:3001/visitors?t=${new Date().getTime()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        approvedVisitors = data
            .filter(visitor => visitor.isApproved === true)
            .map(visitor => ({
                ...visitor,
                date: visitor.date ? visitor.date.split('-').reverse().join('-') : '',
                durationunit: visitor.durationunit || visitor.durationUnit || '',
            }));

        localStorage.setItem('approvedVisitors', JSON.stringify(approvedVisitors));
        updateApprovedCard();
    } catch (error) {
        console.error('Failed to fetch approved visitors:', error.message);
        approvedVisitors = JSON.parse(localStorage.getItem('approvedVisitors')) || [];
        approvedVisitors = approvedVisitors.filter(visitor => visitor.isApproved === true);
        updateApprovedCard();
    }
}

async function fetchDisapprovedVisitors() {
    try {
        console.log('Fetching disapproved visitors...');
        const response = await fetch(`http://192.168.3.74:3001/visitors?t=${new Date().getTime()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        disapprovedVisitors = data
            .filter(visitor => visitor.isApproved === false)
            .map(visitor => ({
                ...visitor,
                date: visitor.date ? visitor.date.split('-').reverse().join('-') : '',
                durationunit: visitor.durationunit || visitor.durationUnit || '',
            }));

        localStorage.setItem('disapprovedVisitors', JSON.stringify(disapprovedVisitors));
        updateDisapprovedCard();
    } catch (error) {
        console.error('Failed to fetch disapproved visitors:', error.message);
        disapprovedVisitors = JSON.parse(localStorage.getItem('disapprovedVisitors')) || [];
        disapprovedVisitors = disapprovedVisitors.filter(visitor => visitor.isApproved === false);
        updateDisapprovedCard();
    }
}

async function fetchExitVisitors() {
    try {
        console.log('Fetching exit visitors...');
        const response = await fetch(`http://192.168.3.74:3001/visitors?t=${new Date().getTime()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        exitVisitors = data
            .filter(visitor => visitor.exit === true)
            .map(visitor => ({
                ...visitor,
                date: visitor.date ? visitor.date.split('-').reverse().join('-') : '',
                durationunit: visitor.durationunit || visitor.durationUnit || '',
            }));

        localStorage.setItem('exitVisitors', JSON.stringify(exitVisitors));
        updateExitCard();
    } catch (error) {
        console.error('Failed to fetch exit visitors:', error.message);
        exitVisitors = JSON.parse(localStorage.getItem('exitVisitors')) || [];
        exitVisitors = exitVisitors.filter(visitor => visitor.exit === true);
        updateExitCard();
    }
}

function updateApprovedCard() {
    document.getElementById('approvedCount').textContent = approvedVisitors.length;

    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekCount = approvedVisitors.filter(visitor => {
        if (!visitor.date) return false;
        const [day, month, year] = visitor.date.split('-').map(Number);
        const visitorDate = new Date(year, month - 1, day);
        return visitorDate >= oneWeekAgo && visitorDate <= today;
    }).length;

    document.getElementById('approvedLastWeekCount').textContent = lastWeekCount;
}

function updateDisapprovedCard() {
    document.getElementById('disapprovedCount').textContent = disapprovedVisitors.length;

    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekCount = disapprovedVisitors.filter(visitor => {
        if (!visitor.date) return false;
        const [day, month, year] = visitor.date.split('-').map(Number);
        const visitorDate = new Date(year, month - 1, day);
        return visitorDate >= oneWeekAgo && visitorDate <= today;
    }).length;

    document.getElementById('disapprovedLastWeekCount').textContent = lastWeekCount;
}

function updateExitCard() {
    const exitCount = exitVisitors.length;
    document.getElementById('exitCount').textContent = exitCount;

    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekCount = exitVisitors.filter(visitor => {
        if (!visitor.date) return false;
        const [day, month, year] = visitor.date.split('-').map(Number);
        const visitorDate = new Date(year, month - 1, day);
        return visitorDate >= oneWeekAgo && visitorDate <= today;
    }).length;

    document.getElementById('exitLastWeekCount').textContent = lastWeekCount;
}

let visitors = [];

async function fetchVisitors() {
    try {
        console.log('Fetching all visitors from http://192.168.3.74:3001/visitors');
        const response = await fetch(`http://192.168.3.74:3001/visitors?t=${new Date().getTime()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched visitors:', data);
        visitors = data.map(visitor => ({
            ...visitor,
            date: visitor.date ? visitor.date.split('-').reverse().join('-') : '',
            durationunit: visitor.durationunit || visitor.durationUnit || '',
        }));

        if (visitors.length === 0) {
            console.warn('No visitors fetched from the server');
        }

        localStorage.setItem('allVisitors', JSON.stringify(visitors));
        updateCard();
    } catch (error) {
        console.error('Failed to fetch visitors:', error.message);
        visitors = JSON.parse(localStorage.getItem('allVisitors')) || [];
        if (visitors.length === 0) {
            console.warn('No cached visitors available either');
        }
        updateCard();
    }
}

function updateCard() {
    const totalVisitorsCount = visitors.length;
    document.getElementById('totalVisitorsCount').textContent = totalVisitorsCount;

    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekCount = visitors.filter(visitor => {
        if (!visitor.date) return false;
        const [day, month, year] = visitor.date.split('-').map(Number);
        const visitorDate = new Date(year, month - 1, day);
        return visitorDate >= oneWeekAgo && visitorDate <= today;
    }).length;
    document.getElementById('lastWeekCount').textContent = lastWeekCount;
}

document.addEventListener('alpine:init', () => {
    // Upcoming Appointments
    Alpine.data('upcomingAppointments', () => ({
        appointmentsList: [],
        searchQuery: '',

        get filteredAppointments() {
            if (!this.searchQuery) return this.appointmentsList;
            const query = this.searchQuery.toLowerCase();
            return this.appointmentsList.filter(item =>
                Object.values(item).some(val =>
                    val?.toString().toLowerCase().includes(query)
                )
            );
        },

        async fetchUpcomingAppointments() {
            try {
                const response = await fetch('http://192.168.3.74:3001/appointment');
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                const apiData = Array.isArray(data)
                    ? data.map(item => ({
                        id: item.id,
                        firstName: item.firstname || 'Unknown',
                        lastName: item.lastname || 'Unknown',
                        date: item.date || 'N/A',
                        allocatedTime: item.time || 'N/A',
                        host: item.personname || 'Unknown',
                        purpose: item.visit || 'N/A',
                        nationalId: item.nationalid || 'N/A',
                    }))
                    : (data.data || []).map(item => ({
                        id: item.id,
                        firstName: item.firstname || 'Unknown',
                        lastName: item.lastname || 'Unknown',
                        date: item.date || 'N/A',
                        allocatedTime: item.time || 'N/A',
                        host: item.personname || 'Unknown',
                        purpose: item.visit || 'N/A',
                        nationalId: item.nationalid || 'N/A',
                    }));

                this.appointmentsList = apiData;
            } catch (error) {
                console.error('Error fetching appointments:', error);
            }
        }
    }));

    // Today's Visitors
    Alpine.data('todaysVisitors', () => ({
        visitorsList: [],
        searchQuery: '',

        get filteredVisitors() {
            if (!this.searchQuery) return this.visitorsList;
            const query = this.searchQuery.toLowerCase();
            return this.visitorsList.filter(item =>
                Object.values(item).some(val =>
                    val?.toString().toLowerCase().includes(query)
                )
            );
        },

        async fetchTodaysVisitors() {
            try {
                const response = await fetch('http://192.168.3.74:3001/visitors');
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                const today = new Date().toISOString().split('T')[0];
                const apiData = Array.isArray(data)
                    ? data
                        .filter(item => item.date === today)
                        .map(item => ({
                            id: item.id,
                            firstName: item.firstname || 'Unknown',
                            lastName: item.lastname || 'Unknown',
                            date: item.date || 'N/A',
                            allocatedTime: item.time || 'N/A',
                            host: item.personname || 'Unknown',
                            purpose: item.visit || 'N/A',
                            nationalId: item.nationalid || 'N/A',
                            pendingApproval: item.isApproved ?? true,
                        }))
                    : (data.data || [])
                        .filter(item => item.date === today)
                        .map(item => ({
                            id: item.id,
                            firstName: item.firstname || 'Unknown',
                            lastName: item.lastname || 'Unknown',
                            date: item.date || 'N/A',
                            allocatedTime: item.time || 'N/A',
                            host: item.personname || 'Unknown',
                            purpose: item.visit || 'N/A',
                            nationalId: item.nationalid || 'N/A',
                            pendingApproval: item.isApproved ?? true,
                        }));
                this.visitorsList = apiData;
            } catch (error) {
                console.error("Error fetching today's visitors:", error);
                this.showMessage("Failed to load today's visitors.", 'error');
            }
        },

        async toggleApproval(id, currentStatus) {
            try {
                const status = currentStatus ? 'disapprove' : 'approve';
                const response = await fetch(`http://192.168.3.74:3001/appointment/${id}/status/${status}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                this.showMessage(`Visitor ${status}d successfully.`);
                await this.fetchTodaysVisitors();
            } catch (error) {
                console.error('Error toggling approval status:', error);
                this.showMessage('Failed to toggle approval status.', 'error');
            }
        },

        showMessage(msg = '', type = 'success') {
            const toast = window.Swal.mixin({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
            });
            toast.fire({
                icon: type,
                title: msg,
                padding: '10px 20px',
            });
        },
    }));

    // Visitor Details
    Alpine.data('visitorDetails', () => ({
        visitorsList: [],
        searchQuery: '',

        get filteredVisitors() {
            if (!this.searchQuery) return this.visitorsList;
            const query = this.searchQuery.toLowerCase();
            return this.visitorsList.filter(item =>
                Object.values(item).some(val =>
                    val?.toString().toLowerCase().includes(query)
                )
            );
        },

        getVisitorStatus(visitor) {
            if (visitor.exitApproval) return 'exit';
            if (visitor.complete) return 'complete';
            if (visitor.inCampus) return 'incampus';
            if (visitor.pendingApproval) return 'pending';
            return '';
        },

        async fetchVisitorDetails() {
    try {
        const response = await fetch('http://192.168.3.74:3001/visitors');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('API Response for Visitor Details:', JSON.stringify(data, null, 2)); // Detailed log for API response

        // Get today's date in DD-MM-YYYY format for logging
        const today = new Date();
        const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
        console.log('Today\'s date:', todayStr);

        const apiData = Array.isArray(data)
            ? data
                .map(item => {
                    // Validate and normalize exitDate format
                    let exitDateToUse = item.exitDate || localStorage.getItem(`exitDate_${item.id}`) || item.date;
                    if (exitDateToUse.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        // Convert YYYY-MM-DD to DD-MM-YYYY
                        const [year, month, day] = exitDateToUse.split('-').map(Number);
                        exitDateToUse = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
                    }
                    if (!exitDateToUse || !exitDateToUse.match(/^\d{2}-\d{2}-\d{4}$/)) {
                        console.warn(`Invalid exitDate format for visitor ID ${item.id}: exitDate=${item.exitDate}, date=${item.date}, using fallback`);
                        exitDateToUse = todayStr; // Fallback to today if invalid
                    }

                    return {
                        id: item.id,
                        firstName: item.firstname || 'Unknown',
                        lastName: item.lastname || 'Unknown',
                        date: item.date || 'N/A',
                        allocatedTime: item.time || 'N/A',
                        host: item.personname || 'Unknown',
                        purpose: item.visit || 'N/A',
                        nationalId: item.nationalid || 'N/A',
                        pendingApproval: true,
                        inCampus: (item.isApproved ?? true) ? true : (item.inprogress ?? false),
                        complete: item.complete ?? false,
                        exitApproval: item.exit ?? false,
                        exitDate: exitDateToUse,
                        isApproved: item.isApproved ?? true,
                    };
                })
                .filter(item => {
                    // If the visitor has exited, check if exitDate is before today
                    if (item.exitApproval && item.exitDate) {
                        const [exitDay, exitMonth, exitYear] = item.exitDate.split('-').map(Number);
                        const exitDate = new Date(Date.UTC(exitYear, exitMonth - 1, exitDay));
                        const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

                        // Log detailed comparison
                        console.log(`Visitor ID ${item.id}: exitDate=${item.exitDate} (${exitDate.toISOString().split('T')[0]}), today=${todayStr} (${todayDate.toISOString().split('T')[0]}), exitDate < todayDate=${exitDate < todayDate}`);

                        // Keep the visitor if their exitDate is today or in the future
                        return exitDate >= todayDate;
                    }
                    console.log(`Visitor ID ${item.id}: Not exited or no exitDate, keeping in list`);
                    return true; // Keep non-exited visitors or those without an exit date
                })
            : (data.data || [])
                .map(item => {
                    // Validate and normalize exitDate format
                    let exitDateToUse = item.exitDate || localStorage.getItem(`exitDate_${item.id}`) || item.date;
                    if (exitDateToUse.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        // Convert YYYY-MM-DD to DD-MM-YYYY
                        const [year, month, day] = exitDateToUse.split('-').map(Number);
                        exitDateToUse = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
                    }
                    if (!exitDateToUse || !exitDateToUse.match(/^\d{2}-\d{2}-\d{4}$/)) {
                        console.warn(`Invalid exitDate format for visitor ID ${item.id}: exitDate=${item.exitDate}, date=${item.date}, using fallback`);
                        exitDateToUse = todayStr; // Fallback to today if invalid
                    }

                    return {
                        id: item.id,
                        firstName: item.firstname || 'Unknown',
                        lastName: item.lastname || 'Unknown',
                        date: item.date || 'N/A',
                        allocatedTime: item.time || 'N/A',
                        host: item.personname || 'Unknown',
                        purpose: item.visit || 'N/A',
                        nationalId: item.nationalid || 'N/A',
                        pendingApproval: true,
                        inCampus: (item.isApproved ?? true) ? true : (item.inprogress ?? false),
                        complete: item.complete ?? false,
                        exitApproval: item.exit ?? false,
                        exitDate: exitDateToUse,
                        isApproved: item.isApproved ?? true,
                    };
                })
                .filter(item => {
                    // If the visitor has exited, check if exitDate is before today
                    if (item.exitApproval && item.exitDate) {
                        const [exitDay, exitMonth, exitYear] = item.exitDate.split('-').map(Number);
                        const exitDate = new Date(Date.UTC(exitYear, exitMonth - 1, exitDay));
                        const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

                        // Log detailed comparison
                        console.log(`Visitor ID ${item.id}: exitDate=${item.exitDate} (${exitDate.toISOString().split('T')[0]}), today=${todayStr} (${todayDate.toISOString().split('T')[0]}), exitDate < todayDate=${exitDate < todayDate}`);

                        // Keep the visitor if their exitDate is today or in the future
                        return exitDate >= todayDate;
                    }
                    console.log(`Visitor ID ${item.id}: Not exited or no exitDate, keeping in list`);
                    return true; // Keep non-exited visitors or those without an exit date
                });

        this.visitorsList = apiData;
        console.log('Mapped Visitor List:', JSON.stringify(this.visitorsList, null, 2)); // Detailed log for final mapped list
    } catch (error) {
        console.error('Error fetching visitor details:', error);
        this.showMessage('Failed to load visitor details.', 'error');
    }
},

        async updateVisitor(visitor) {
    try {
        let status = '';
        let body = {};
        if (visitor.inCampus) {
            status = 'inprogress';
            body = { inprogress: true };
        } else if (visitor.complete) {
            status = 'complete';
            body = { complete: true };
        } else if (visitor.exitApproval) {
            status = 'exit';
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            const exitDateStr = `${day}-${month}-${year}`;
            body = { exit: true, exitDate: exitDateStr };
            // Store in localStorage as a fallback
            localStorage.setItem(`exitDate_${visitor.id}`, exitDateStr);
        }

        if (status) {
            const response = await fetch(`http://192.168.3.74:3001/visitors/${visitor.id}/status/${status}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            this.showMessage('Visitor status updated successfully.');
            await this.fetchVisitorDetails();
        } else {
            throw new Error('No status change detected.');
        }
    } catch (error) {
        console.error('Error updating visitor status:', error);
        this.showMessage('Failed to update visitor status.', 'error');
    }
},

        showMessage(msg = '', type = 'success') {
            const toast = window.Swal.mixin({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
            });
            toast.fire({
                icon: type,
                title: msg,
                padding: '10px 20px',
            });
        },

renderProgressSteps(visitor) {
            const status = this.getVisitorStatus(visitor);
            const isDisapproved = !visitor.isApproved;
            const isExited = visitor.exitApproval;
            console.log(`Rendering progress steps for visitor ID ${visitor.id}: status=${status}, isDisapproved=${isDisapproved}, isExited=${isExited}`); // Debug log
            return `
                <div class="progress-steps" data-status="${status}" data-is-disapproved="${isDisapproved}" data-is-exited="${isExited}">
                    <div class="step" data-step="pending">
                        <div class="step-circle">
                            <svg class="step-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3"></path>
                            </svg>
                        </div>
                        <div class="step-label">Pending Approval</div>
                    </div>
                    <div class="step" data-step="incampus">
                        <div class="step-circle">
                            <svg class="step-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <div class="step-label">InCampus</div>
                    </div>
                    <div class="step" data-step="complete">
                        <div class="step-circle">
                            <svg class="step-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div class="step-label">Complete</div>
                    </div>
                    <div class="step" data-step="exit">
                        <div class="step-circle">
                            <svg class="step-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                            </svg>
                        </div>
                        <div class="step-label">Exit Approval</div>
                    </div>
                </div>
            `;
        },
    }));
});

// Add logic to update step classes based on status
document.addEventListener('DOMContentLoaded', () => {
    const updateSteps = () => {
        document.querySelectorAll('.progress-steps').forEach(progress => {
            const status = progress.dataset.status;
            // Fallback to false if attributes are missing
            const isDisapproved = (progress.dataset.isDisapproved === 'true') || false;
            const isExited = (progress.dataset.isExited === 'true') || false;
            const steps = progress.querySelectorAll('.step');

            console.log(`Updating steps: status=${status}, isDisapproved=${isDisapproved}, isExited=${isExited}`); // Debug log

            steps.forEach(step => {
                step.classList.remove('active', 'red');
                const stepType = step.dataset.step;

                // Determine if this step should be highlighted based on status
                const shouldHighlight =
                    (status === 'pending' && stepType === 'pending') ||
                    (status === 'incampus' && (stepType === 'pending' || stepType === 'incampus')) ||
                    (status === 'complete' && (stepType === 'pending' || stepType === 'incampus' || stepType === 'complete')) ||
                    (status === 'exit' && (stepType === 'pending' || stepType === 'incampus' || stepType === 'complete' || stepType === 'exit'));

                if (shouldHighlight) {
                    if (isDisapproved) {
                        // Apply red class if disapproved, takes precedence
                        console.log(`Applying red class to step ${stepType} due to disapproval`); // Debug log
                        step.classList.add('red');
                    } else if (isExited && stepType === 'exit') {
                        // Apply red class to the exit step if exited
                        console.log(`Applying red class to exit step due to exit status`); // Debug log
                        step.classList.add('red');
                    } else {
                        // Apply green class only if not disapproved
                        console.log(`Applying active (green) class to step ${stepType}`); // Debug log
                        step.classList.add('active');
                    }
                } else {
                    console.log(`Step ${stepType} not highlighted (gray)`); // Debug log
                }
            });
        });
    };

    // Initial update
    updateSteps();

    // Watch for Alpine.js updates
    document.addEventListener('alpine:initialized', updateSteps);
    setInterval(updateSteps, 1000); // Update periodically in case of dynamic changes
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing dashboard');

    // Setup Create Visitor Gatepass button
    const permissions = getPermissions();
    const button = document.getElementById('sticky-button');

    if (!button) {
        console.error('Create Visitor Gatepass button not found');
        return;
    }

    if (!permissions.canRead || !permissions.canCreate) {
        button.classList.add('disabled');
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.6';
        button.setAttribute('aria-disabled', 'true');
        const reason = !permissions.canRead 
            ? 'You do not have permission to view the dashboard'
            : 'You do not have permission to create a visitor gatepass';
        button.setAttribute('title', reason);

        button.addEventListener('click', (e) => {
            e.preventDefault();
            const toast = window.Swal.mixin({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
            });
            toast.fire({
                icon: 'error',
                title: reason,
                padding: '10px 20px',
            });
        });

        console.log('Create Visitor Gatepass button disabled:', { canRead: permissions.canRead, canCreate: permissions.canCreate });
    } else {
        button.classList.remove('disabled');
        button.style.pointerEvents = 'auto';
        button.style.opacity = '1';
        button.removeAttribute('aria-disabled');
        button.removeAttribute('title');
        console.log('Create Visitor Gatepass button enabled');
    }

    // Initial fetch
    fetchApprovedVisitors();
    fetchDisapprovedVisitors();
    fetchExitVisitors();
    fetchVisitors();
});