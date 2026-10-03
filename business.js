/**
 * Schedule Janitor - Task Directive Portal Logic
 * Dynamic multi-step form rendering, step validation, and submission handler.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const stepCounter = document.getElementById('step-counter');
    const progressFill = document.getElementById('progress-fill');
    const stepContainer = document.getElementById('step-container');
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const formMessage = document.getElementById('form-message');
    
    const formView = document.getElementById('form-view');
    const successView = document.getElementById('success-view');
    const errorView = document.getElementById('error-view');
    const retryBtn = document.getElementById('retry-btn');
    const honeypotInput = document.getElementById('website');

    let currentStepIndex = 0;
    const formData = {};

    // 7 Step Definitions tailored for Solo Founders & Business Directives
    const steps = [
        {
            id: 'category',
            title: 'What category best fits your operational task?',
            subtitle: 'Select the primary area of work you need taken off your plate.',
            type: 'radio',
            options: [
                { value: 'micro_tools', label: '⚡ Custom Internal Micro-Tools & Scripts (Scrapers, Calculators, Automations)' },
                { value: 'data_ops', label: '🗂️ Data Operations & Spreadsheet Cleanup (CRM Audit, CSV Formatting, Formulas)' },
                { value: 'research', label: '🧐 Research & Competitive Briefings (Market Intelligence, Vendor Analysis)' },
                { value: 'document_polish', label: '📄 Document & Proposal Polish (Decks, Executive Reports, Client Formatting)' },
                { value: 'media_processing', label: '✍️ Media & Content Processing (Call Summaries, Podcast Outlines, Transcripts)' },
                { value: 'other', label: '🛠️ Other Custom Operational Bottleneck' }
            ],
            required: true
        },
        {
            id: 'task_summary',
            title: 'Describe the directive or desired output',
            subtitle: 'Be as specific as possible. Feel free to paste a 1-2 minute Loom link if that is faster.',
            type: 'textarea',
            placeholder: 'Example: I have a messy CSV export with 500 leads. I need duplicate emails removed, phone numbers formatted to standard +1 E.164, and split into two sheets by region...',
            required: true
        },
        {
            id: 'source_assets',
            title: 'Links to source data, Loom video, or files',
            subtitle: 'Provide Google Drive, Dropbox, Notion, or Loom links (ensure access permissions are set to view).',
            type: 'text',
            placeholder: 'https://loom.com/share/... or https://drive.google.com/... (optional if explained above)',
            required: false
        },
        {
            id: 'expected_deliverable',
            title: 'What is your required deliverable format?',
            subtitle: 'How would you like the completed output returned to you?',
            type: 'radio',
            options: [
                { value: 'google_sheets_excel', label: 'Clean Google Sheet / Excel File' },
                { value: 'code_script', label: 'Raw Code / Script Repository / Live Web Tool' },
                { value: 'pdf_doc', label: 'Formatted PDF / Word / Google Doc' },
                { value: 'markdown_notion', label: 'Markdown Document / Executive Summary Page' },
                { value: 'other_format', label: 'Other (Specified in description)' }
            ],
            required: true
        },
        {
            id: 'timeline',
            title: 'What is your turnaround requirement?',
            subtitle: 'All scopes are reviewed within 2 hours of submission.',
            type: 'radio',
            options: [
                { value: 'standard_48h', label: 'Standard (24 – 48 Hours)' },
                { value: 'urgent_24h', label: 'Priority / Urgent (Under 24 Hours if feasible)' },
                { value: 'flexible', label: 'Flexible / Low Urgency' }
            ],
            required: true
        },
        {
            id: 'contact_method',
            title: 'How should I send your flat-rate quote?',
            subtitle: 'Select your preferred direct contact method and provide your handle or address.',
            type: 'contact_group',
            required: true
        },
        {
            id: 'budget_expectation',
            title: 'Estimated Budget / Scope Tier',
            subtitle: 'Quotes are fixed flat rates with zero hidden fees. Payment is released only after preview approval.',
            type: 'radio',
            options: [
                { value: 'small_task', label: 'Small Data / Polish Task ($25 – $50 range)' },
                { value: 'medium_task', label: 'Standard Ops & Research ($50 – $120 range)' },
                { value: 'custom_automation', label: 'Custom Micro-Tool / Complex Script (Quoted per scope)' },
                { value: 'quote_first', label: 'Unsure – Send me a custom quote after scope review' }
            ],
            required: true
        }
    ];

    // Initialize Form UI
    function renderStep(index) {
        const step = steps[index];
        stepContainer.innerHTML = '';

        // Header section for the step
        const headerDiv = document.createElement('div');
        headerDiv.className = 'step-header';
        
        const titleEl = document.createElement('h2');
        titleEl.className = 'step-title';
        titleEl.textContent = step.title;
        headerDiv.appendChild(titleEl);

        if (step.subtitle) {
            const subtitleEl = document.createElement('p');
            subtitleEl.className = 'step-subtitle';
            subtitleEl.textContent = step.subtitle;
            headerDiv.appendChild(subtitleEl);
        }

        stepContainer.appendChild(headerDiv);

        // Body section according to step type
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'step-body';

        if (step.type === 'radio') {
            const optionsGroup = document.createElement('div');
            optionsGroup.className = 'options-group';

            step.options.forEach(opt => {
                const label = document.createElement('label');
                label.className = 'option-card';
                if (formData[step.id] === opt.value) {
                    label.classList.add('selected');
                }

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = step.id;
                radio.value = opt.value;
                radio.checked = formData[step.id] === opt.value;

                radio.addEventListener('change', () => {
                    formData[step.id] = opt.value;
                    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                    label.classList.add('selected');
                    clearMessage();
                });

                const textSpan = document.createElement('span');
                textSpan.textContent = opt.label;

                label.appendChild(radio);
                label.appendChild(textSpan);
                optionsGroup.appendChild(label);
            });

            bodyDiv.appendChild(optionsGroup);

        } else if (step.type === 'textarea') {
            const textarea = document.createElement('textarea');
            textarea.className = 'form-input form-textarea';
            textarea.placeholder = step.placeholder || '';
            textarea.rows = 5;
            textarea.value = formData[step.id] || '';

            textarea.addEventListener('input', (e) => {
                formData[step.id] = e.target.value;
                clearMessage();
            });

            bodyDiv.appendChild(textarea);

        } else if (step.type === 'text') {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-input';
            input.placeholder = step.placeholder || '';
            input.value = formData[step.id] || '';

            input.addEventListener('input', (e) => {
                formData[step.id] = e.target.value;
                clearMessage();
            });

            bodyDiv.appendChild(input);

        } else if (step.type === 'contact_group') {
            const contactContainer = document.createElement('div');
            contactContainer.className = 'contact-group-container';

            const methodSelect = document.createElement('select');
            methodSelect.className = 'form-input form-select';
            methodSelect.innerHTML = `
                <option value="email">Email</option>
                <option value="linkedin">LinkedIn DM</option>
                <option value="twitter">X / Twitter DM</option>
                <option value="whatsapp">WhatsApp / Telegram</option>
            `;
            methodSelect.value = formData.contact_platform || 'email';

            const handleInput = document.createElement('input');
            handleInput.type = 'text';
            handleInput.className = 'form-input';
            handleInput.placeholder = 'Enter email address or handle...';
            handleInput.value = formData.contact_handle || '';

            methodSelect.addEventListener('change', (e) => {
                formData.contact_platform = e.target.value;
            });

            handleInput.addEventListener('input', (e) => {
                formData.contact_handle = e.target.value;
                clearMessage();
            });

            contactContainer.appendChild(methodSelect);
            contactContainer.appendChild(handleInput);
            bodyDiv.appendChild(contactContainer);
        }

        stepContainer.appendChild(bodyDiv);

        // Update Nav State
        updateNavigationUI();
    }

    function updateNavigationUI() {
        const currentNum = String(currentStepIndex + 1).padStart(2, '0');
        const totalNum = String(steps.length).padStart(2, '0');
        stepCounter.textContent = `${currentNum} / ${totalNum}`;

        const percentage = ((currentStepIndex + 1) / steps.length) * 100;
        progressFill.style.width = `${percentage}%`;

        // Button Visibility Logic
        if (currentStepIndex === 0) {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
        }

        if (currentStepIndex === steps.length - 1) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }
    }

    function validateCurrentStep() {
        const step = steps[currentStepIndex];

        if (!step.required) return true;

        if (step.type === 'contact_group') {
            if (!formData.contact_handle || formData.contact_handle.trim() === '') {
                showMessage('Please provide your contact handle or email so I can reach you.');
                return false;
            }
            return true;
        }

        if (step.type === 'radio') {
            if (!formData[step.id]) {
                showMessage('Please select an option to continue.');
                return false;
            }
            return true;
        }

        if (step.type === 'textarea' || step.type === 'text') {
            if (!formData[step.id] || formData[step.id].trim() === '') {
                showMessage('Please complete this field before proceeding.');
                return false;
            }
            return true;
        }

        return true;
    }

    function showMessage(msg) {
        formMessage.textContent = msg;
        formMessage.style.opacity = '1';
    }

    function clearMessage() {
        formMessage.textContent = '';
        formMessage.style.opacity = '0';
    }

    // Event Handlers
    nextBtn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            clearMessage();
            if (currentStepIndex < steps.length - 1) {
                currentStepIndex++;
                renderStep(currentStepIndex);
            }
        }
    });

    backBtn.addEventListener('click', () => {
        clearMessage();
        if (currentStepIndex > 0) {
            currentStepIndex--;
            renderStep(currentStepIndex);
        }
    });

    submitBtn.addEventListener('click', async () => {
        if (!validateCurrentStep()) return;

        // Anti-spam Honeypot Check
        if (honeypotInput && honeypotInput.value !== '') {
            // Silently fail spam bots
            formView.classList.add('hidden');
            successView.classList.remove('hidden');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Transmitting...';

        try {
            const payload = {
                access_key: '5ca04149-d604-49d9-ab54-d514971d80fd',
                subject: `New Task Directive: ${formData.category || 'Operational Task'} (${formData.contact_handle || 'New Inquiry'})`,
                from_name: 'Schedule Janitor Portal',
                ...formData
            };

            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                formView.classList.add('hidden');
                successView.classList.remove('hidden');
            } else {
                throw new Error(result.message || 'Form submission failed.');
            }
        } catch (err) {
            console.error('Web3Forms Submission Error:', err);
            formView.classList.add('hidden');
            if (errorView) {
                errorView.classList.remove('hidden');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send my request';
        }
    });

    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            errorView.classList.add('hidden');
            formView.classList.remove('hidden');
        });
    }

    // Initial Render
    renderStep(currentStepIndex);
});