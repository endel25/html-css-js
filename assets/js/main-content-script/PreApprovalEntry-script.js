
        let currentPage = 1;
        let rowsPerPage = 10; // Default from dropdown
        let totalRows = 0;
        let allVisitors = []; // Store current page for client-side search
        let currentFileInputId = '';
        let originalVisitorData = null;

        // Toast message function
        const showMessage = (msg = 'Example notification text.', type = 'success', position = 'top-right', showCloseButton = true, duration = 2000) => {
            const toast = window.Swal.mixin({
                toast: true,
                position: position,
                showConfirmButton: false,
                timer: duration,
                showCloseButton: showCloseButton,
                padding: '10px 20px',
            });

            toast.fire({
                icon: type,
                title: msg,
            });
        };

        // Initialize page and check for success message
        document.addEventListener('DOMContentLoaded', () => {
            const message = localStorage.getItem('appointmentSuccessMessage');
            if (message) {
                showMessage(message);
                localStorage.removeItem('appointmentSuccessMessage');
            }

            const tableBody = document.getElementById('visitorTableBody');
            const errorMessage = document.createElement('div');
            errorMessage.className = 'text-red-500 text-sm mt-2 text-center hidden';
            document.querySelector('.table-container').appendChild(errorMessage);

            loadVisitorData(); // Load initial data
        });

        // Modal functions for photo capture
        function showModal(fileInputId) {
            currentFileInputId = fileInputId;
            document.getElementById('photoModal').style.display = 'flex';
        }

        function closeModal1() {
            document.getElementById('photoModal').style.display = 'none';
            stopCamera();
        }

        function openGallery() {
            const fileInput = document.getElementById(currentFileInputId);
            fileInput.removeAttribute('capture');
            fileInput.click();
            closeModal1();
        }

        function openCamera() {
            startCamera(document.getElementById(currentFileInputId));
            closeModal1();
        }

        function startCamera(fileInput) {
            const video = document.getElementById('cameraPreview');
            const canvas = document.getElementById('cameraCanvas');
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                    video.srcObject = stream;
                    video.style.display = 'block';
                    video.play();
                    const captureBtn = document.createElement('button');
                    captureBtn.textContent = 'Capture Photo';
                    captureBtn.className = 'btn-outline-primary';
                    captureBtn.onclick = () => {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        canvas.getContext('2d').drawImage(video, 0, 0);
                        canvas.toBlob(blob => {
                            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(file);
                            fileInput.files = dataTransfer.files;
                            fileInput.dispatchEvent(new Event('change'));
                            stopCamera();
                        }, 'image/jpeg');
                    };
                    document.body.appendChild(captureBtn);
                })
                .catch(err => {
                    console.error('Camera access denied:', err);
                    showMessage('Failed to access camera', 'error');
                });
        }

        function stopCamera() {
            const video = document.getElementById('cameraPreview');
            const stream = video.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            video.style.display = 'none';
            const captureBtn = document.querySelector('button[onclick*="capture"]');
            if (captureBtn) captureBtn.remove();
        }

        function previewImage(input, id) {
            const file = input.files ? input.files[0] : null;
            const img = document.getElementById(id);
            console.log('Previewing image for', id, 'with file:', file);
            if (file) {
                const reader = new FileReader();
                reader.onload = e => {
                    img.src = e.target.result;
                    img.style.display = 'block';
                    console.log('Image preview updated for', id, 'to', e.target.result);
                };
                reader.onerror = () => console.error('Error reading file for', id);
                reader.readAsDataURL(file);
            } else {
                img.style.display = 'none';
                console.log('No file selected for', id, 'hiding preview');
            }
        }

        // Fetch visitor data from API
        async function fetchVisitorData(page = 1, limit = 10, retries = 3) {
            console.log(`📡 Fetching visitor data: page=${page}, limit=${limit}`);
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const url = `http://192.168.3.77:3001/appointment?page=${page}&limit=${limit}`;
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
                    }
                    const data = await response.json();
                    console.log('📥 API response:', data);

                    if (!data.data || typeof data.total !== 'number') {
                        throw new Error('Invalid response format: expected { data, total }');
                    }
                    return {
                        data: data.data || [],
                        total: data.total || 0,
                    };
                } catch (error) {
                    console.error(`Attempt ${attempt} failed to fetch visitor data:`, error);
                    if (attempt === retries) {
                        const errorMessage = document.querySelector('.table-container .text-red-500');
                        if (errorMessage) {
                            errorMessage.textContent = `Failed to load visitor data: ${error.message}`;
                            errorMessage.classList.remove('hidden');
                            setTimeout(() => errorMessage.classList.add('hidden'), 5000);
                        }
                        return { data: [], total: 0 };
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                }
            }
        }

        // Update table and pagination
        function updatePagination(visitors, total) {
            console.log(`📋 Updating pagination: page=${currentPage}, total=${total}, visitors=`, visitors);
            const tableBody = document.getElementById('visitorTableBody');
            const previousBtn = document.getElementById('previousBtn');
            const nextBtn = document.getElementById('nextBtn');
            const paginationButtons = document.querySelector('.pagination');
            const footerText = document.getElementById('footerText');

            totalRows = total;

            // Render server-side paginated data
            tableBody.innerHTML = '';
            if (!visitors || visitors.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="9" class="no-data">No visitor data available</td></tr>';
                console.log('No data to display for page', currentPage);
            } else {
                visitors.forEach(visitor => {
                    const row = document.createElement('tr');
                    row.setAttribute('data-id', visitor.id || '');
                    row.innerHTML = `
                    <td>${visitor.id || '-'}</td>
                    <td>${visitor.firstname || '-'}</td>
                    <td>${visitor.lastname || '-'}</td>
                    <td>${visitor.contactnumber || '-'}</td>
                    <td>${visitor.nationalid || '-'}</td>
                    <td class="center-checkbox">
    <input type="checkbox"
           class="nda-approve ${visitor.ndaApproved == null ? 'unset' : ''}"
           id="nda-${visitor.id || ''}"
           ${visitor.ndaApproved === true ? 'checked' : ''}
           disabled>
    <label for="nda-${visitor.id || ''}"></label>
</td>

                    <td class="center-checkbox">
    <input type="checkbox"
           class="nda-approve ${visitor.SaftyApproval == null ? 'unset' : ''}"
           id="nda-${visitor.id || ''}"
           ${visitor.SaftyApproval === true ? 'checked' : ''}
           disabled>
    <label for="nda-${visitor.id || ''}"></label>
</td>
                    <td class="center-checkbox">
                        <input type="checkbox" class="gatepass-approve ${visitor.gatepassApproved == null ? 'unset' : ''}" id="gatepass-${visitor.id || ''}" ${visitor.gatepassApproved === true ? 'checked' : ''} disabled>
                        <label for="gatepass-${visitor.id || ''}"></label>
                    </td>
                    <td><button class="btn-sm btn-outline-primary1 rounded-full details-btn" data-id="${visitor.id || ''}">Details</button></td>
                `;
                    tableBody.appendChild(row);
                });
                console.log('✅ Rendered table with', visitors.length, 'rows');
            }

            // Update footer text
            const startIndex = totalRows > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
            const endIndex = Math.min(currentPage * rowsPerPage, totalRows);
            footerText.textContent = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`;

            // Show/hide pagination buttons
            paginationButtons.style.display = totalRows > rowsPerPage ? 'flex' : 'none';
            previousBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage * rowsPerPage >= totalRows;

            // Reattach event listeners for details buttons
            document.querySelectorAll('.details-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const visitorId = button.getAttribute('data-id');
                    openVisitorModal(visitorId);
                });
            });
        }

        // Load visitor data and set up event listeners
        async function loadVisitorData() {
            try {
                // Initial fetch
                const { data: visitors, total } = await fetchVisitorData(currentPage, rowsPerPage);
                allVisitors = visitors; // Store for search
                updatePagination(visitors, total);

                // Entries per page change
                document.getElementById('entriesPerPage').addEventListener('change', async (e) => {
                    rowsPerPage = parseInt(e.target.value) || 10;
                    currentPage = 1;
                    const { data: visitors, total } = await fetchVisitorData(currentPage, rowsPerPage);
                    allVisitors = visitors;
                    updatePagination(visitors, total);
                });

                // Search functionality (client-side)
                const searchInput = document.getElementById('searchInput');
                searchInput.addEventListener('input', async () => {
                    const searchTerm = searchInput.value.toLowerCase();
                    if (searchTerm) {
                        // Client-side search on current page data
                        const filteredData = allVisitors.filter(visitor =>
                            (visitor.id && visitor.id.toString().toLowerCase().includes(searchTerm)) ||
                            (visitor.firstname && visitor.firstname.toLowerCase().includes(searchTerm)) ||
                            (visitor.lastname && visitor.lastname.toLowerCase().includes(searchTerm)) ||
                            (visitor.contactnumber && visitor.contactnumber.toLowerCase().includes(searchTerm)) ||
                            (visitor.nationalid && visitor.nationalid.toLowerCase().includes(searchTerm))
                        );
                        updatePagination(filteredData, filteredData.length);
                    } else {
                        // Reset to server-side data
                        const { data: visitors, total } = await fetchVisitorData(currentPage, rowsPerPage);
                        allVisitors = visitors;
                        updatePagination(visitors, total);
                    }
                });

                // Previous button
                document.getElementById('previousBtn').addEventListener('click', async () => {
                    if (currentPage > 1) {
                        currentPage--;
                        const { data: visitors, total } = await fetchVisitorData(currentPage, rowsPerPage);
                        allVisitors = visitors;
                        updatePagination(visitors, total);
                    }
                });

                // Next button
                document.getElementById('nextBtn').addEventListener('click', async () => {
                    const maxPages = Math.ceil(totalRows / rowsPerPage);
                    console.log(`🖱️ Next button clicked: currentPage=${currentPage}, maxPages=${maxPages}, totalRows=${totalRows}`);
                    if (currentPage < maxPages) {
                        currentPage++;
                        console.log(`📄 Fetching page ${currentPage}`);
                        const { data: visitors, total } = await fetchVisitorData(currentPage, rowsPerPage);
                        allVisitors = visitors;
                        updatePagination(visitors, total);
                    } else {
                        console.log('No more pages to fetch');
                        showMessage('No more records to display', 'info');
                    }
                });
            } catch (error) {
                console.error('Error loading visitor data:', error);
                const tableBody = document.getElementById('visitorTableBody');
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="9" class="no-data">Error loading data</td></tr>';
                }
                showMessage('Failed to load visitor data', 'error');
            }
        }

        // Fetch visitor details by ID
        async function fetchVisitorById(visitorId, retries = 3) {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const response = await fetch(`http://192.168.3.77:3001/appointment/${visitorId}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to fetch visitor: ${response.statusText}`);
                    }
                    const visitor = await response.json();
                    return visitor;
                } catch (error) {
                    console.error(`Attempt ${attempt} failed to fetch visitor ${visitorId}:`, error);
                    if (attempt === retries) {
                        const errorMessage = document.querySelector('.table-container .text-red-500');
                        if (errorMessage) {
                            errorMessage.textContent = `Failed to load visitor ${visitorId} details`;
                            errorMessage.classList.remove('hidden');
                            setTimeout(() => errorMessage.classList.add('hidden'), 5000);
                        }
                        return null;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                }
            }
        }

        // Preview image in modal
        function previewImageModal(input, previewId) {
            const preview = document.getElementById(previewId);
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                    console.log(`📸 Previewing new ${previewId === 'mainPreview' ? 'visitor' : 'driver'} photo`);
                };
                reader.onerror = () => {
                    preview.src = 'https://via.placeholder.com/150';
                    preview.classList.add('hidden');
                    console.error(`📸 Error loading ${previewId} photo`);
                };
                reader.readAsDataURL(file);
            } else {
                console.log(`📸 No new ${previewId === 'mainPreview' ? 'visitor' : 'driver'} photo selected`);
                preview.src = 'https://via.placeholder.com/150';
                preview.classList.add('hidden');
            }
        }

        // Open visitor details modal
        async function openVisitorModal(visitorId) {
            const visitor = await fetchVisitorById(visitorId);
            if (!visitor) return;

            originalVisitorData = { ...visitor };

            const populateField = (id, value, defaultValue = '') => {
                const element = document.getElementById(`edit-${id}`);
                if (element) element.value = value ?? defaultValue;
            };

            // Populate existing fields
            populateField('firstname', visitor.firstname);
            populateField('lastname', visitor.lastname);
            populateField('gender', visitor.gender);
            populateField('contactnumber', visitor.contactnumber);
            populateField('email', visitor.email);
            populateField('date', visitor.date);
            populateField('time', visitor.time);
            populateField('nationalid', visitor.nationalid);
            populateField('visit', visitor.visit);
            populateField('personname', visitor.personname);
            populateField('department', visitor.department);
            populateField('durationtime', visitor.durationtime);
            populateField('durationUnit', visitor.durationunit);
            populateField('visitortype', visitor.visitortype);
            populateField('vehicletype', visitor.vehicletype);
            populateField('vehiclenumber', visitor.vehiclenumber);
            populateField('drivername', visitor.drivername);
            populateField('drivermobile', visitor.drivermobile);
            populateField('drivernationalid', visitor.drivernationalid);
            populateField('notes', visitor.notes);

            // Handle driver details checkbox
            const driverToggle = document.getElementById('edit-driverToggle');
            const driverDetails = document.getElementById('driverDetails');
            const hasDriverDetails = visitor.drivername || visitor.drivermobile || visitor.drivernationalid || visitor.driverphoto;
            if (driverToggle && driverDetails) {
                driverToggle.checked = hasDriverDetails;
                driverDetails.classList.toggle('hidden', !hasDriverDetails);
            }

            const setPhotoPreview = async (previewId, path, visitorId, type) => {
                const preview = document.getElementById(previewId);
                if (!preview) return;

                preview.classList.remove('hidden');

                if (path && path.trim() !== '') {
                    try {
                        const photoUrl = `http://192.168.3.77:3001/appointment/${visitorId}/photo?type=${type}`;
                        const response = await fetch(photoUrl, { method: 'GET', mode: 'cors' });
                        if (!response.ok) throw new Error('Photo fetch failed');
                        const blob = await response.blob();
                        const reader = new FileReader();
                        reader.onloadend = () => preview.src = reader.result;
                        reader.readAsDataURL(blob);
                    } catch (error) {
                        preview.src = 'https://via.placeholder.com/150';
                        console.error(`📸 Failed to fetch ${previewId} photo:`, error);
                    }
                } else {
                    preview.src = 'https://via.placeholder.com/150';
                }
            };

            await setPhotoPreview('mainPreview', visitor.photo, visitorId, 'photo');
            await setPhotoPreview('driverPreview', visitor.driverphoto, visitorId, 'driverphoto');

            document.getElementById('visitorForm').setAttribute('data-id', visitorId);
            document.getElementById('visitorModal').style.display = 'block';
        }



        // Handle form submission
        document.getElementById('visitorForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const visitorId = e.target.getAttribute('data-id');

            try {
                if (!originalVisitorData) {
                    showMessage('Original data not loaded', 'error');
                    return;
                }

                const requiredFields = ['firstname', 'gender', 'email', 'date', 'time', 'nationalid', 'visit', 'personname', 'department', 'durationtime', 'visitortype', 'durationUnit'];
                const missingFields = requiredFields.filter(field => {
                    const element = document.getElementById(`edit-${field}`);
                    return !element || !element.value.trim();
                });
                if (missingFields.length > 0) {
                    showMessage(`Please fill in: ${missingFields.join(', ')}`, 'error');
                    return;
                }

                const changedData = {};
                const fields = ['firstname', 'lastname', 'gender', 'contactnumber', 'email', 'date', 'time', 'nationalid', 'visit', 'personname', 'department', 'durationtime', 'durationUnit', 'visitortype', 'vehicletype', 'vehiclenumber', 'drivername', 'drivermobile', 'drivernationalid', 'notes'];
                fields.forEach(field => {
                    const element = document.getElementById(`edit-${field}`);
                    if (!element) {
                        console.warn(`Field edit-${field} not found`);
                        return;
                    }
                    const currentValue = element.value;
                    const originalValue = originalVisitorData[field] ?? '';
                    if (currentValue !== originalValue.toString()) {
                        changedData[field === 'durationUnit' ? 'durationunit' : field] = currentValue;
                    }
                });

                const photoFile = document.getElementById('edit-photo')?.files[0];
                const driverPhotoFile = document.getElementById('edit-driverphoto')?.files[0];
                if (photoFile) changedData.photo = photoFile;
                if (driverPhotoFile) changedData.driverphoto = driverPhotoFile;

                if (Object.keys(changedData).length === 0) {
                    showMessage('No changes detected', 'info');
                    return;
                }

                const hasDriverDetails = ['drivername', 'drivermobile', 'drivernationalid'].some(field => changedData[field] || originalVisitorData[field]);
                if (hasDriverDetails && !changedData.driverphoto && !originalVisitorData.driverphoto) {
                    showMessage('Driver photo is required', 'error');
                    return;
                }

                let body = new FormData();
                Object.entries(changedData).forEach(([key, value]) => {
                    if (key === 'photo' || key === 'driverphoto') {
                        body.append(key, value instanceof File ? value : '');
                    } else {
                        body.append(key, value || '');
                    }
                });

                console.log('📤 Submitting FormData:');
                for (const [key, value] of body.entries()) {
                    console.log(`  ${key}: ${value instanceof File ? value.name : value}`);
                }

                async function attemptUpdate(attempt = 1, maxAttempts = 3) {
                    const submitBtn = document.querySelector('#save-details');
                    if (!submitBtn) {
                        showMessage('Save button not found', 'error');
                        return false;
                    }

                    const originalBtnContent = submitBtn.innerHTML;

                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `
                    <svg style="width: 20px; height: 20px; color: #4361ee; display: inline-block; margin-right: 8px; animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Saving...
                `;

                    try {
                        const response = await fetch(`http://192.168.3.77:3001/appointment/${visitorId}`, {
                            method: 'PUT',
                            body,
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Update failed');
                        }
                        await response.json();
                        document.getElementById('visitorModal').style.display = 'none';
                        originalVisitorData = null;
                        await loadVisitorData();
                        showMessage('Appointment Details saved successfully!', 'success');

                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnContent;
                        return true;
                    } catch (error) {
                        console.error(`Attempt ${attempt} failed:`, error);
                        if (attempt < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                            return attemptUpdate(attempt + 1, maxAttempts);
                        } else {
                            showMessage(`Failed to update visitor: ${error.message}`, 'error');
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalBtnContent;
                            return false;
                        }
                    }
                }
                await attemptUpdate();
            } catch (error) {
                console.error('Form submission error:', error);
                showMessage('An error occurred during submission', 'error');
            }
        });

        // Approve gatepass
        document.getElementById('approveGatepass').addEventListener('click', async () => {
            const visitorId = document.getElementById('visitorForm').getAttribute('data-id');
            async function attemptApprove(attempt = 1, maxAttempts = 3) {
                try {
                    const response = await fetch(`http://192.168.3.77:3001/appointment/${visitorId}/gatepass`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ gatepassApproved: true }),
                    });

                    if (!response.ok) throw new Error('Approval failed');
                    const data = await response.json();
                    const row = document.querySelector(`tr[data-id="${visitorId}"]`);
                    if (row) {
                        row.querySelector('.gatepass-approve').checked = data.gatepassApproved;
                    }
                    showMessage('Gatepass Approved successfully!', 'success');
                    document.getElementById('visitorModal').style.display = 'none';
                    originalVisitorData = null;
                    await loadVisitorData();
                    return true;
                } catch (error) {
                    if (attempt === maxAttempts) {
                        showMessage('Failed to approve: ' + error.message, 'error');
                        return false;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                    return await attemptApprove(attempt + 1);
                }
            }
            await attemptApprove();
        });

        // Disapprove gatepass
        document.getElementById('disapproveGatepass').addEventListener('click', async () => {
            const visitorId = document.getElementById('visitorForm').getAttribute('data-id');
            async function attemptDisapprove(attempt = 1, maxAttempts = 3) {
                try {
                    const response = await fetch(`http://192.168.3.77:3001/appointment/${visitorId}/gatepass`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ gatepassApproved: false }),
                    });

                    if (!response.ok) throw new Error('Disapproval failed');
                    const data = await response.json();
                    const row = document.querySelector(`tr[data-id="${visitorId}"]`);
                    if (row) {
                        row.querySelector('.gatepass-approve').checked = data.gatepassApproved;
                    }
                    showMessage('Gatepass disapproved successfully!', 'success');
                    document.getElementById('visitorModal').style.display = 'none';
                    originalVisitorData = null;
                    await loadVisitorData();
                    return true;
                } catch (error) {
                    if (attempt === maxAttempts) {
                        showMessage('Failed to disapprove: ' + error.message, 'error');
                        return false;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                    return await attemptDisapprove(attempt + 1);
                }
            }
            await attemptDisapprove();
        });

        // Close modal
        function closeVisitorModal() {
            document.getElementById('visitorModal').style.display = 'none';
            originalVisitorData = null;
            document.getElementById('visitorForm').reset();
            ['mainPreview', 'driverPreview'].forEach(id => {
                const img = document.getElementById(id);
                if (img) {
                    img.src = 'https://via.placeholder.com/150';
                    img.classList.add('hidden');
                }
            });
        }

        document.querySelector('.modal .close')?.addEventListener('click', closeVisitorModal);

        // Toggle driver details visibility
        window.toggleDriverDetails = function () {
            const driverDetails = document.getElementById('driverDetails');
            const driverToggle = document.getElementById('edit-driverToggle');
            if (driverDetails && driverToggle) {
                driverDetails.classList.toggle('hidden', !driverToggle.checked);
            }
        };
  
