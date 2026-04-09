const totalPages = 6; // Total pages before submit

// Bạn có thể dán link Google Apps Script vào đây để hứng dữ liệu
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4OdQlSfJlBGAB-Xiu5wu8K0DMfl6U3DbjHOOIPw_dKdU1wxqYoXP9WOzblMlHC9dq8Q/exec';

function updateProgress(pageIndex) {
    // page 7 is thank you, progress is 100 on page 6 itself before submit or transition to page 7
    const progress = Math.min((pageIndex / totalPages) * 100, 100);
    document.getElementById('progressBar').style.width = `${progress}%`;
}

function validatePage(pageIndex) {
    const page = document.getElementById(`page${pageIndex}`);
    if (!page) return true;

    const requiredInputs = page.querySelectorAll('input[required], textarea[required], select[required]');

    const textInputs = [];
    const requiredRadioNames = new Set();

    requiredInputs.forEach(input => {
        if (input.type === 'radio') {
            requiredRadioNames.add(input.name);
        } else {
            textInputs.push(input);
        }
    });

    // Validate radiogroups
    for (const name of requiredRadioNames) {
        // Query ALL radios with this name across the page
        const radios = page.querySelectorAll(`input[type="radio"][name="${name}"]`);
        const isChecked = Array.from(radios).some(radio => radio.checked);
        if (!isChecked) {
            alert('Vui lòng chọn một tùy chọn cho tất cả các câu hỏi bắt buộc.');
            return false;
        }
    }

    // Validate text inputs
    for (const input of textInputs) {
        // Skip validation if this is an "other" input but the "Other" radio isn't selected
        if (input.classList.contains('other-input')) {
            const radioName = input.name.split('_other')[0];
            const otherRadio = page.querySelector(`input[type="radio"][name="${radioName}"][value="Other"]`);
            if (otherRadio && !otherRadio.checked) {
                continue; // Not required because 'Other' is not chosen
            }
        }

        if (!input.value.trim()) {
            alert('Vui lòng điền đầy đủ các thông tin bắt buộc.');
            input.focus();
            return false;
        }
    }

    return true;
}

function nextPage(currentPage) {
    if (validatePage(currentPage)) {
        document.getElementById(`page${currentPage}`).classList.remove('active');
        document.getElementById(`page${currentPage + 1}`).classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        updateProgress(currentPage + 1);
    }
}

function prevPage(currentPage) {
    document.getElementById(`page${currentPage}`).classList.remove('active');
    document.getElementById(`page${currentPage - 1}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateProgress(currentPage - 1);
}

function submitForm() {
    if (validatePage(totalPages)) {
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Đang xử lý...';
        submitBtn.disabled = true;

        const formData = new FormData(document.getElementById('jotformClone'));
        const data = Object.fromEntries(formData.entries());

        console.log("Dữ liệu được Submit:", data);

        if (GOOGLE_SCRIPT_URL) {
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            })
                .then(() => {
                    showThankYouPage();
                })
                .catch(error => {
                    console.error('Error!', error.message);
                    alert("Có lỗi xảy ra khi gửi dữ liệu. Vui lòng thử lại!");
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                });
        } else {
            // No URL defined, simulate success
            setTimeout(() => {
                showThankYouPage();
            }, 800);
        }
    }
}

function showThankYouPage() {
    document.getElementById(`page${totalPages}`).classList.remove('active');
    document.getElementById('page7').classList.add('active');
    document.getElementById('progressBar').style.width = '100%';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Logic for Radio buttons and "Other" field
document.addEventListener('change', function (e) {
    if (e.target.type === 'radio') {
        const name = e.target.name;
        const formBlocks = e.target.closest('.question-group');

        // Handle visual classes
        document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
            radio.closest('.option-card').classList.remove('selected');
        });
        e.target.closest('.option-card').classList.add('selected');

        // Handle 'Other' input visibility
        if (formBlocks) {
            const otherInputContainer = formBlocks.querySelector('.other-input-container');
            const otherInput = formBlocks.querySelector('.other-input');
            if (otherInputContainer) {
                if (e.target.value === 'Other') {
                    otherInputContainer.classList.add('visible');
                    if (otherInput) {
                        otherInput.setAttribute('required', 'true');
                        setTimeout(() => otherInput.focus(), 100);
                    }
                } else {
                    otherInputContainer.classList.remove('visible');
                    if (otherInput) {
                        otherInput.removeAttribute('required');
                        otherInput.value = ''; // clear value
                    }
                }
            }
        }
    }
});

// Init progress
updateProgress(1);
