let currentFileInputId = '';
let validGenders = [];
let validVisitPurposes = [];

function showModal(fileInputId) {
    currentFileInputId = fileInputId;
    const modal = document.getElementById('photoModal');
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('photoModal');
    if (modal) modal.style.display = 'none';
    stopCamera();
}

function openGallery() {
    const fileInput = document.getElementById(currentFileInputId);
    if (fileInput) {
        fileInput.removeAttribute('capture');
        fileInput.click();
    }
    closeModal();
}

function openCamera() {
    const fileInput = document.getElementById(currentFileInputId);
    if (fileInput) {
        fileInput.setAttribute('capture', 'environment');
        fileInput.click();
    }
    closeModal();
}

function startCamera(fileInput) {
    const video = document.getElementById('cameraPreview');
    const canvas = document.getElementById('cameraCanvas');
    if (!video || !canvas) return;
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
            showError('error-' + currentFileInputId, 'Unable to access camera');
        });
}

function stopCamera() {
    const video = document.getElementById('cameraPreview');
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.style.display = 'none';
    }
    const captureBtn = document.querySelector('button[onclick*="capture"]');
    if (captureBtn) captureBtn.remove();
}

function previewImage(input, id) {
    const file = input.files[0];
    const img = document.getElementById(id);
    if (file && img) {
        const reader = new FileReader();
        reader.onload = e => {
            img.src = e.target.result;
            img.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else if (img) {
        img.classList.add('hidden');
    }
}

function toggleDriverDetails() {
    const driverDetails = document.getElementById('driverDetails');
    if (driverDetails) driverDetails.classList.toggle('hidden');
}

function showError(id, msg) {
    const element = document.getElementById(id);
    if (element) element.innerText = msg;
}

function clearErrors() {
    document.querySelectorAll('.error').forEach(el => el.innerText = '');
}

async function fetchGenders() {
    try {
        const response = await fetch('http://192.168.3.73:3001/gender');
        const data = await response.json();
        validGenders = data.map(item => item.name);
        const select = document.getElementById('gender');
        if (!select) return;
        select.innerHTML = '<option value="">Select gender</option>';
        validGenders.forEach(gender => {
            const option = document.createElement('option');
            option.value = gender;
            option.textContent = gender;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching genders:', error);
        showError('error-gender', 'Failed to load gender options');
    }
}

async function fetchVisitPurposes() {
    try {
        const response = await fetch('http://192.168.3.73:3001/purpose-of-visit');
        const data = await response.json();
        validVisitPurposes = data.map(item => item.name); // e.g., ['Business Meeting', 'Interview', 'Delivery', ...]
        const select = document.getElementById('visit');
        if (!select) return;
        select.innerHTML = '<option value="">Select purpose</option>';
        validVisitPurposes.forEach(purpose => {
            const option = document.createElement('option');
            option.value = purpose;
            option.textContent = purpose;
            select.appendChild(option);
        });
        select.addEventListener('change', () => {
            const customPurposeInput = document.getElementById('custom-purpose');
            if (customPurposeInput) {
                customPurposeInput.classList.toggle('hidden', select.value !== 'Others');
                if (select.value !== 'Others') {
                    customPurposeInput.value = '';
                    showError('error-visit', '');
                }
            }
        });
    } catch (error) {
        console.error('Error fetching visit purposes:', error);
        showError('error-visit', 'Failed to load visit purpose options');
    }
}

const validateField = (name, value, formData = {}) => {
    let error = '';
    const requiredFields = [
        'firstname', 'lastname', 'gender', 'contactnumber', 'email',
        'date', 'time', 'nationalid', 'photo', 'visit', 'personname',
        'department', 'durationtime', 'visitortype'
    ];
    if (requiredFields.includes(name) && !value && name !== 'photo') {
        error = `${name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
    } else if (name === 'photo' && !document.getElementById(name)?.files.length) {
        error = 'Photo is required';
    }
    switch (name) {
        case 'firstname':
        case 'lastname':
        case 'personname':
        case 'drivername':
            if (value && !/^[a-zA-Z\s]{2,}$/.test(value)) {
                error = `${name === 'firstname' ? 'First' : name === 'lastname' ? 'Last' : name === 'personname' ? 'Person' : 'Driver'} name must be at least 2 characters and contain only letters`;
            }
            break;
        case 'contactnumber':
        case 'drivermobile':
            if (value && !/^\d+$/.test(value)) {
                error = 'Phone number must contain only digits';
            }
            break;
        case 'nationalid':
        case 'drivernationalid':
            if (value && !/^[a-zA-Z0-9]{4,}$/.test(value)) {
                error = 'National ID must be at least 4 characters (letters and numbers allowed)';
            }
            break;
        case 'email':
            if (value && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
                error = 'Please enter a valid email address';
            }
            break;
        case 'gender':
            if (!value || !validGenders.includes(value)) {
                error = 'Please select a valid gender';
            }
            break;
        case 'visit':
            if (!value || (value !== 'Others' && !validVisitPurposes.includes(value))) {
                error = 'Please select a valid purpose of visit';
            } else if (value === 'Others') {
                const customPurpose = document.getElementById('custom-purpose')?.value.trim();
                if (!customPurpose || !/^[a-zA-Z\s]{2,}$/.test(customPurpose)) {
                    error = 'Please specify a valid custom purpose';
                }
            }
            break;
        case 'visitortype':
            if (!value) error = 'Please select a visitor type';
            break;
        case 'durationtime':
            if (value && !/^\d+$/.test(value)) {
                error = 'Duration must be a positive number';
            }
            break;
    }
    return error;
};

const attachLiveValidation = () => {
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => {
            const formData = {
                date: document.getElementById('date')?.value,
                time: document.getElementById('time')?.value
            };
            const error = validateField(input.id, input.value, formData);
            showError('error-' + input.id, error);
        });
    });
};

async function checkFormStatus(email, date, time) {
    try {
        const response = await fetch(
            `http://192.168.3.73:3001/appointment/check-status?email=${encodeURIComponent(email)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }
        );
        if (!response.ok) throw new Error(`Failed to check form status: ${response.statusText}`);
        const { isFormCompleted } = await response.json();
        console.log('checkFormStatus response:', { email, date, time, isFormCompleted });
        return isFormCompleted;
    } catch (error) {
        console.error('Error checking form status:', error);
        return false;
    }
}

function storeSubmission(email, date, time, isMessageShown = false) {
    const key = `appointment_${email}_${date}_${time}`;
    localStorage.setItem(key, JSON.stringify({ status: 'submitted', isMessageShown }));
    console.log('Stored submission:', { key, status: 'submitted', isMessageShown });
}

function getSubmissionState(email, date, time) {
    const key = `appointment_${email}_${date}_${time}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const state = JSON.parse(stored);
    console.log('Checked submission state:', { key, state });
    return state;
}

function markMessageShown(email, date, time) {
    const key = `appointment_${email}_${date}_${time}`;
    const state = getSubmissionState(email, date, time);
    if (state) {
        localStorage.setItem(key, JSON.stringify({ ...state, isMessageShown: true }));
        console.log('Marked message as shown:', { key });
    }
}

function displaySuccessMessage(email, date, time) {
    const state = getSubmissionState(email, date, time);
    const isSubsequentAccess = state && state.isMessageShown;
    const messageTitle = isSubsequentAccess
        ? 'Your Appointment Has Already Been Submitted'
        : 'Your Appointment Scheduled Successfully';
    const messageBody = isSubsequentAccess
        ? 'Please check your email for the QR code and further instructions.'
        : 'Please check your email for the QR code and further instructions.';

    document.body.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            z-index: 1000;
        ">
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 15px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
                text-align: center;
                border: 1px solid #e0e0e0;
            ">
                <h1 style="
                    color: #3f51b5;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                    font-weight: bold;
                    border-bottom: 2px solid #3f51b5;
                    padding-bottom: 0.5rem;
                ">
                    ${messageTitle}
                </h1>
                ${messageBody ? `
                <p style="
                    font-size: 1rem;
                    color: #666;
                ">
                    ${messageBody}
                </p>` : ''}
            </div>
        </div>
    `;

    if (!isSubsequentAccess && email && date && time) {
        markMessageShown(email, date, time);
    }
}

async function initializeForm() {
    await Promise.all([fetchGenders(), fetchVisitPurposes()]);

    const urlParams = new URLSearchParams(window.location.search);
    const genderParam = urlParams.get('gender') || '';
    const visitParam = urlParams.get('visit') || '';
    const email = urlParams.get('email') || '';
    const date = urlParams.get('date') || '';
    const time = urlParams.get('time') || '';

    const genderInput = document.getElementById('gender');
    if (genderInput && genderParam) {
        const formatted = genderParam.charAt(0).toUpperCase() + genderParam.slice(1).toLowerCase();
        if (validGenders.includes(formatted)) {
            genderInput.value = formatted;
            genderInput.disabled = true;
        }
    }

    const visitInput = document.getElementById('visit');
    if (visitInput && visitParam) {
        const formatted = visitParam.charAt(0).toUpperCase() + visitParam.slice(1).toLowerCase();
        if (validVisitPurposes.includes(formatted)) {
            visitInput.value = formatted;
            visitInput.disabled = true;
        } else if (formatted.toLowerCase() === 'others') {
            visitInput.value = 'Others';
            const customPurposeInput = document.getElementById('custom-purpose');
            if (customPurposeInput) {
                customPurposeInput.classList.remove('hidden');
                customPurposeInput.value = urlParams.get('customPurpose') || '';
                customPurposeInput.disabled = true;
            }
        }
    }

    if (email && date && time) {
        const state = getSubmissionState(email, date, time);
        const isFormCompleted = await checkFormStatus(email, date, time);
        if (state?.status === 'submitted' || isFormCompleted) {
            console.log('Form already submitted:', { email, date, time, isStored: !!state, isFormCompleted });
            displaySuccessMessage(email, date, time);
            return;
        }
    }

    if (date) {
        const selectedDate = new Date(date);
        const currentDate = new Date();
        selectedDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        if (currentDate > selectedDate) {
            const formContainer = document.querySelector('.absolute.top-1/2');
            if (formContainer) {
                formContainer.innerHTML = `
                    <div class="w-full max-w-5xl bg-white rounded-lg shadow-md p-6 text-center">
                        <h2 class="text-xl font-semibold mb-4" style="font-family: 'Nunito', sans-serif;">Form is Expired</h2>
                        <p class="text-sm text-gray-600">The form has expired as the selected date has passed.</p>
                    </div>
                `;
            }
            return;
        }
    }

    const fields = [
        'firstname', 'lastname', 'gender', 'contactnumber', 'email',
        'date', 'time', 'nationalid', 'visit', 'personname',
        'department', 'durationtime', 'visitortype'
    ];

    fields.forEach(field => {
        const input = document.getElementById(field);
        if (input) {
            let value = urlParams.get(field) || '';
            if (value) {
                if (field === 'time') {
                    value = value.split(':').slice(0, 2).join(':');
                    if (!/^\d{2}:\d{2}$/.test(value)) value = '';
                }
                if (field === 'gender') {
                    value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                    if (!validGenders.includes(value)) value = '';
                }
                if (field === 'visit') {
                    value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                    if (!validVisitPurposes.includes(value) && value.toLowerCase() !== 'others') value = '';
                    if (value.toLowerCase() === 'others') {
                        value = 'Others';
                        const customPurposeInput = document.getElementById('custom-purpose');
                        if (customPurposeInput) {
                            customPurposeInput.classList.remove('hidden');
                            customPurposeInput.value = urlParams.get('customPurpose') || '';
                        }
                    }
                }
                input.value = value;
                input.disabled = !!value;
            }
        }
    });

    const form = document.getElementById('visitorForm');
    const submitBtn = document.getElementById('submitBtn');
    if (!form || !submitBtn) return;

    let loading = false;

    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (loading) return;

        clearErrors();
        let valid = true;

        const get = id => document.getElementById(id)?.value.trim() || '';
        const fieldsToValidate = [
            'firstname', 'lastname', 'gender', 'contactnumber', 'email',
            'date', 'time', 'nationalid', 'photo', 'visit', 'personname',
            'department', 'durationtime', 'durationunit', 'visitortype', 'vehicletype',
            'vehiclenumber', 'drivername', 'drivermobile', 'drivernationalid', 'driverphoto'
        ];

        const formData = { date: get('date'), time: get('time') };

        fieldsToValidate.forEach(id => {
            const value = id === 'photo' || id === 'driverphoto' ? document.getElementById(id)?.files[0] : get(id);
            const errorMsg = validateField(id, value, formData);
            if (errorMsg) {
                showError('error-' + id, errorMsg);
                valid = false;
            }
        });

        const visitValue = get('visit');
        if (visitValue === 'Others') {
            const customPurpose = get('custom-purpose');
            if (!customPurpose || !/^[a-zA-Z\s]{2,}$/.test(customPurpose)) {
                showError('error-visit', 'Please specify a valid custom purpose');
                valid = false;
            } else {
                formData.customPurpose = customPurpose;
            }
        }

        const photo = document.getElementById('photo')?.files[0];
        if (!photo || !/\.(jpg|jpeg|png)$/i.test(photo.name)) {
            showError('error-photo', 'Upload .jpg/.png image');
            valid = false;
        }

        const driverToggle = document.getElementById('driverToggle')?.checked;
        if (driverToggle) {
            const dName = get('drivername');
            const dMob = get('drivermobile');
            const dNid = get('drivernationalid');
            const dPhoto = document.getElementById('driverphoto')?.files[0];

            if (!/^[A-Za-z\s]{2,50}$/.test(dName)) {
                showError('error-drivername', 'Enter valid driver name');
                valid = false;
            }
            if (!/^\d{5,15}$/.test(dMob)) {
                showError('error-drivermobile', 'Enter valid mobile');
                valid = false;
            }
            if (!/^[a-zA-Z0-9]{4,}$/.test(dNid)) {
                showError('error-drivernationalid', 'Enter valid ID');
                valid = false;
            }
            if (!dPhoto || !/\.(jpg|jpeg|png)$/i.test(dPhoto.name)) {
                showError('error-driverphoto', 'Upload driver image');
                valid = false;
            }
        }

        const notes = get('notes');
        if (notes.length > 500 || /<script/i.test(notes)) {
            showError('error-notes', 'Invalid notes content');
            valid = false;
        }

        if (!valid) {
            showError('error-general', 'Please fix the errors above.');
            return;
        }

        const emailValue = get('email');
        const dateValue = get('date');
        const timeValue = get('time');

        if (emailValue && dateValue && timeValue) {
            const state = getSubmissionState(emailValue, dateValue, timeValue);
            const isFormCompleted = await checkFormStatus(emailValue, dateValue, timeValue);
            if (state?.status === 'submitted' || isFormCompleted) {
                console.log('Blocked duplicate submission:', { emailValue, dateValue, timeValue, isStored: !!state, isFormCompleted });
                displaySuccessMessage(emailValue, dateValue, timeValue);
                return;
            }
        }

        loading = true;
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const formattedData = new FormData();
        form.querySelectorAll('input:not([type="checkbox"]), select, textarea').forEach(input => {
            if (input.type === 'file' && input.files[0]) {
                formattedData.append(input.name, input.files[0]);
            } else if (!input.disabled) {
                formattedData.append(input.name, input.value || '');
            }
        });

        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input) formattedData.append(field, input.value || '');
        });

        const durationunit = get('durationunit');
        if (durationunit) {
            formattedData.append('durationunit', durationunit);
        }

        if (visitValue === 'Others') {
            const customPurpose = get('custom-purpose');
            if (customPurpose) {
                formattedData.append('customPurpose', customPurpose);
            }
        }

        console.log('📤 Submitting FormData:');
        for (const [key, value] of formattedData.entries()) {
            console.log(`  ${key}: ${value instanceof File ? value.name : value}`);
        }

        try {
            const response = await fetch('http://192.168.3.73:3001/appointment/create', {
                method: 'POST',
                body: formattedData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit form. Please try again.');
            }

            if (emailValue && dateValue && timeValue) {
                storeSubmission(emailValue, dateValue, timeValue, false);
                history.pushState(null, '', `?email=${encodeURIComponent(emailValue)}&date=${encodeURIComponent(dateValue)}&time=${encodeURIComponent(timeValue)}`);
                displaySuccessMessage(emailValue, dateValue, timeValue);
            }
        } catch (error) {
            showError('error-general', error.message);
        } finally {
            loading = false;
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    attachLiveValidation();
}

document.addEventListener('DOMContentLoaded', initializeForm);
