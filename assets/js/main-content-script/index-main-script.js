
        let approvedVisitors = [];
        let disapprovedVisitors = [];
        let exitVisitors = [];

        async function fetchApprovedVisitors() {
            try {
                console.log('Fetching approved visitors...');
                const response = await fetch(`http://192.168.106.137:3001/visitors?t=${new Date().getTime()}`, {
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
                const response = await fetch(`http://192.168.106.137:3001/visitors?t=${new Date().getTime()}`, {
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
                const response = await fetch(`http://192.168.106.137:3001/visitors?t=${new Date().getTime()}`, {
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

        // Initial fetch
        fetchApprovedVisitors();
        fetchDisapprovedVisitors();
        fetchExitVisitors();

        let visitors = [];

        async function fetchVisitors() {
            try {
                console.log('Fetching all visitors from http://192.168.106.137:3001/visitors');
                const response = await fetch(`http://192.168.106.137:3001/visitors?t=${new Date().getTime()}`, {
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

            // Calculate last week's count (assuming date is in DD-MM-YYYY format)
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

        // Initial fetch
        fetchVisitors();


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
                        const response = await fetch('http://192.168.106.137:3001/appointment');
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
                        const response = await fetch('http://192.168.106.137:3001/visitors');
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
                        const response = await fetch(`http://192.168.106.137:3001/appointment/${id}/status/${status}`, {
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

                async fetchVisitorDetails() {
                    try {
                        const response = await fetch('http://192.168.106.137:3001/visitors');
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
                                pendingApproval: true,
                                inCampus: (item.isApproved ?? true) ? true : (item.inprogress ?? false),
                                complete: item.complete ?? false,
                                exitApproval: item.exit ?? false,
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
                                pendingApproval: true,
                                inCampus: (item.isApproved ?? true) ? true : (item.inprogress ?? false),
                                complete: item.complete ?? false,
                                exitApproval: item.exit ?? false,
                            }));
                        this.visitorsList = apiData;
                    } catch (error) {
                        console.error('Error fetching visitor details:', error);
                        this.showMessage('Failed to load visitor details.', 'error');
                    }
                },

                async updateVisitor(visitor) {
                    try {
                        let status = '';
                        if (visitor.inCampus) status = 'inprogress';
                        else if (visitor.complete) status = 'complete';
                        else if (visitor.exitApproval) status = 'exit';

                        if (status) {
                            const response = await fetch(`http://192.168.106.137:3001/visitors/${visitor.id}/status/${status}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
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
            }));

        });

        // Script to disable and check all Pending Approval checkboxes
        document.addEventListener('DOMContentLoaded', () => {
            const approvalCheckboxes = document.querySelectorAll('.approval-checkbox');
            approvalCheckboxes.forEach(checkbox => {
                checkbox.checked = true;
                checkbox.disabled = true;
            });
        });
