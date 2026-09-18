// ============================================================
// Mr. OddJobs – Task Intake Form
// Multi-step, single-question-at-a-time, Web3Forms submission.
// No dependencies, vanilla JS, works on GitHub Pages.
// ============================================================

// ---- Configuration ----
const WEB3FORMS_ACCESS_KEY = "bb5ba8d4-18dd-4383-9a7b-c6441f7cb1a8";
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const FALLBACK_EMAIL = "borngreatbright023@gmail.com";

// ---- Step definitions ----
// Each step has: id, question, supporting text, field name, input type,
// required flag, placeholder, and any extra config (options, conditional).
const steps = [
    {
        id: "name",
        question: "What should I call you?",
        support: "Just something I can use when I get back to you.",
        fieldName: "name",
        inputType: "text",
        required: true,
        placeholder: "Your name or what you'd like me to call you",
        maxLength: 100,
        autocomplete: "name",
        validate: (value) => {
            const trimmed = value.trim();
            if (!trimmed) return "I need something to call you.";
            if (trimmed.length > 100) return "That's a bit long — please keep it under 100 characters.";
            return null;
        }
    },
    {
        id: "task",
        question: "What do you need done?",
        support: "Describe the task in your own words. Don't worry about choosing the right service category.",
        fieldName: "task",
        inputType: "textarea",
        required: true,
        placeholder: "Example: I have a spreadsheet with about 300 rows that needs cleaning up and formatting.",
        minLength: 10,
        maxLength: 3000,
        validate: (value) => {
            const trimmed = value.trim();
            if (!trimmed) return "Tell me what you need done before moving on.";
            if (trimmed.length < 10) return "Give me a little more detail so I know what you're asking for.";
            if (trimmed.length > 3000) return "That's a lot — please keep it under 3000 characters.";
            return null;
        }
    },
    {
        id: "category",
        question: "What category does your task fall under?",
        support: "",
        fieldName: "category",
        inputType: "radio",
        required: true,
        options: [
            "Research / information gathering",
            "Data entry / spreadsheet work",
            "Transcription",
            "Proofreading / editing",
            "Document formatting",
            "Translation",
            "Simple web tool / custom digital solution",
            "I'm not sure",
            "Something else"
        ],
        validate: (value) => {
            if (!value) return "Pick the closest category — or choose \"I'm not sure\".";
            return null;
        }
    },
    {
        id: "desired_result",
        question: "What should the finished result look like?",
        support: "Tell me what you'd consider a successful result. If you have a specific format, structure, or outcome in mind, mention it here.",
        fieldName: "desired_result",
        inputType: "textarea",
        required: true,
        placeholder: "Example: I want the spreadsheet cleaned up, duplicates removed, and the columns formatted consistently.",
        minLength: 10,
        maxLength: 3000,
        validate: (value) => {
            const trimmed = value.trim();
            if (!trimmed) return "Let me know what a good result looks like to you.";
            if (trimmed.length < 10) return "A little more detail will help me get it right.";
            if (trimmed.length > 3000) return "That's a lot — please keep it under 3000 characters.";
            return null;
        }
    },
    {
        id: "deadline",
        question: "When do you need it?",
        support: "",
        fieldName: "deadline",
        inputType: "radio",
        required: true,
        options: [
            "ASAP",
            "Within 24 hours",
            "2–3 days",
            "Within a week",
            "No specific deadline",
            "Other"
        ],
        hasConditional: true,
        conditionalField: {
            fieldName: "deadline_other",
            label: "What's your deadline?",
            placeholder: "e.g. by next Friday, end of the month…",
            required: true,
            validate: (value) => {
                if (!value.trim()) return "You selected \"Other\" — please tell me your deadline.";
                return null;
            }
        },
        validate: (value) => {
            if (!value) return "Pick a deadline option.";
            return null;
        }
    },
    {
        id: "additional_details",
        question: "Anything else I should know?",
        support: "Anything that might help me understand the task before I get back to you.",
        fieldName: "additional_details",
        inputType: "textarea",
        required: false,
        placeholder: "Optional. Add anything else you think matters.",
        maxLength: 2000,
        validate: () => null
    },
    {
        id: "contact",
        question: "How should I contact you?",
        support: "Pick at least one way I can reach you. If you choose more than one, I'll need the details for each.",
        fieldName: "contact_methods",
        inputType: "checkbox",
        required: true,
        options: [
            { label: "WhatsApp", value: "WhatsApp" },
            { label: "Instagram DM", value: "Instagram" },
            { label: "Email", value: "Email" }
        ],
        // Dynamic contact fields appear when options are checked
        contactFields: {
            WhatsApp: {
                fieldName: "whatsapp",
                label: "What's your WhatsApp number?",
                placeholder: "+233 55 123 4567",
                type: "tel",
                required: true,
                validate: (value) => {
                    if (!value.trim()) return "You selected WhatsApp, so I need your WhatsApp number.";
                    return null;
                }
            },
            Instagram: {
                fieldName: "instagram",
                label: "What's your Instagram handle?",
                placeholder: "@yourhandle or yourhandle",
                type: "text",
                required: true,
                validate: (value) => {
                    if (!value.trim()) return "You selected Instagram, so I need your Instagram handle.";
                    return null;
                }
            },
            Email: {
                fieldName: "email",
                label: "What's your email address?",
                placeholder: "you@example.com",
                type: "email",
                required: true,
                validate: (value) => {
                    const trimmed = value.trim();
                    if (!trimmed) return "You selected Email, so I need your email address.";
                    // Basic email pattern – enough for intake, not overly strict
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "That email doesn't look quite right. Could you double-check it?";
                    return null;
                }
            }
        },
        validate: (selectedValues) => {
            if (!selectedValues || selectedValues.length === 0) return "Pick at least one way I can reach you.";
            return null;
        }
    }
];

// ---- State ----
let currentStepIndex = 0;
const formData = {}; // Stores answers keyed by fieldName
const contactDetails = {}; // Stores dynamic contact details
let isSubmitting = false;

// ---- DOM references ----
const formView = document.getElementById("form-view");
const successView = document.getElementById("success-view");
const errorView = document.getElementById("error-view");
const stepContainer = document.getElementById("step-container");
const stepCounter = document.getElementById("step-counter");
const progressFill = document.getElementById("progress-fill");
const backBtn = document.getElementById("back-btn");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");
const formMessage = document.getElementById("form-message");
const errorMessageText = document.getElementById("error-message-text");
const retryBtn = document.getElementById("retry-btn");
const backHomeBtn = document.getElementById("back-home-btn");

// ---- Utility functions ----
function showMessage(msg) {
    formMessage.textContent = msg;
    formMessage.style.color = "";
    if (msg) {
        formMessage.style.opacity = "1";
    } else {
        formMessage.style.opacity = "0";
    }
}

function clearMessage() {
    formMessage.innerHTML = "";
    formMessage.style.color = "";
}

function updateProgress() {
    const total = steps.length;
    const current = currentStepIndex + 1;
    stepCounter.textContent = `${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    progressFill.style.width = `${(current / total) * 100}%`;
}

// ---- Render a step ----
function renderStep(index) {
    const step = steps[index];
    if (!step) return;

    // Build HTML
    let html = `<h2 class="step-question">${step.question}</h2>`;
    if (step.support) {
        html += `<p class="step-support">${step.support}</p>`;
    }

    if (step.inputType === "text" || step.inputType === "textarea") {
        const tag = step.inputType === "textarea" ? "textarea" : "input";
        const attrs = step.inputType === "textarea"
            ? `rows="5" class="step-textarea"`
            : `type="text" class="step-input"`;
        html += `<${tag} ${attrs} id="field-${step.fieldName}" name="${step.fieldName}" 
            placeholder="${step.placeholder || ""}" 
            ${step.maxLength ? `maxlength="${step.maxLength}"` : ""}
            ${step.autocomplete ? `autocomplete="${step.autocomplete}"` : ""}
            ${step.required ? "required" : ""}
        ></${tag}>`;
    } else if (step.inputType === "radio" || step.inputType === "checkbox") {
        const inputType = step.inputType;
        const name = step.fieldName;
        html += `<div class="options-grid">`;
        step.options.forEach((opt) => {
            const value = typeof opt === "string" ? opt : opt.value;
            const label = typeof opt === "string" ? opt : opt.label;
            const isSelected = formData[name] === value ||
                (Array.isArray(formData[name]) && formData[name].includes(value));
            html += `
                <label class="option-card ${isSelected ? "selected" : ""}" data-value="${value}">
                    <input type="${inputType}" name="${name}" value="${value}" ${isSelected ? "checked" : ""}>
                    <span>${label}</span>
                </label>
            `;
        });
        html += `</div>`;

        // Conditional field for deadline
        if (step.hasConditional && step.conditionalField) {
            const cond = step.conditionalField;
            const isOtherSelected = formData[name] === "Other";
            html += `
                <div class="conditional-field ${isOtherSelected ? "" : "hidden"}" id="conditional-${cond.fieldName}">
                    <label for="field-${cond.fieldName}">${cond.label}</label>
                    <input type="text" class="step-input" id="field-${cond.fieldName}" 
                        name="${cond.fieldName}" placeholder="${cond.placeholder || ""}"
                        value="${formData[cond.fieldName] || ""}">
                </div>
            `;
        }

        // Dynamic contact fields for contact step
        if (step.contactFields) {
            const selected = Array.isArray(formData[name]) ? formData[name] : [];
            Object.keys(step.contactFields).forEach((key) => {
                const cf = step.contactFields[key];
                const isChecked = selected.includes(key);
                html += `
                    <div class="conditional-field ${isChecked ? "" : "hidden"}" id="contact-field-${cf.fieldName}">
                        <label for="field-${cf.fieldName}">${cf.label}</label>
                        <input type="${cf.type}" class="step-input" id="field-${cf.fieldName}" 
                            name="${cf.fieldName}" placeholder="${cf.placeholder || ""}"
                            value="${contactDetails[cf.fieldName] || ""}">
                    </div>
                `;
            });
        }
    }

    // Replace content
    stepContainer.innerHTML = html;

    // Restore focus to first input for better UX
    const firstInput = stepContainer.querySelector("input, textarea");
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 50);
    }

    // Attach event listeners for radio/checkbox
    if (step.inputType === "radio" || step.inputType === "checkbox") {
        const cards = stepContainer.querySelectorAll(".option-card");
        cards.forEach((card) => {
            card.addEventListener("click", (e) => {
                // Prevent double-toggle when clicking the input directly
                if (e.target.tagName === "INPUT") return;
                const input = card.querySelector("input");
                if (input) {
                    input.checked = !input.checked;
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                }
            });
        });

        // Listen for changes
        stepContainer.querySelectorAll(`input[name="${step.fieldName}"]`).forEach((input) => {
            input.addEventListener("change", () => {
                // Update visual selected state
                stepContainer.querySelectorAll(".option-card").forEach((c) => {
                    const inp = c.querySelector("input");
                    if (inp) {
                        c.classList.toggle("selected", inp.checked);
                    }
                });

                // Store value
                if (step.inputType === "radio") {
                    formData[step.fieldName] = input.value;
                } else {
                    // Checkbox: collect all checked values
                    const checked = Array.from(
                        stepContainer.querySelectorAll(`input[name="${step.fieldName}"]:checked`)
                    ).map((i) => i.value);
                    formData[step.fieldName] = checked;
                }

                // Handle conditional deadline field
                if (step.hasConditional && step.conditionalField) {
                    const cond = step.conditionalField;
                    const condDiv = document.getElementById(`conditional-${cond.fieldName}`);
                    if (condDiv) {
                        const isOther = formData[step.fieldName] === "Other";
                        condDiv.classList.toggle("hidden", !isOther);
                        if (isOther) {
                            const condInput = document.getElementById(`field-${cond.fieldName}`);
                            if (condInput) setTimeout(() => condInput.focus(), 100);
                        }
                    }
                }

                // Handle dynamic contact fields
                if (step.contactFields) {
                    const selected = Array.isArray(formData[step.fieldName]) ? formData[step.fieldName] : [];
                    Object.keys(step.contactFields).forEach((key) => {
                        const cf = step.contactFields[key];
                        const fieldDiv = document.getElementById(`contact-field-${cf.fieldName}`);
                        if (fieldDiv) {
                            const isChecked = selected.includes(key);
                            fieldDiv.classList.toggle("hidden", !isChecked);
                            if (isChecked) {
                                const inp = document.getElementById(`field-${cf.fieldName}`);
                                if (inp) setTimeout(() => inp.focus(), 100);
                            }
                        }
                    });
                }

                clearMessage();
            });
        });
    }

    // Attach input listeners to store values and clear errors
    stepContainer.querySelectorAll("input, textarea").forEach((el) => {
        el.addEventListener("input", () => {
            const name = el.name;
            if (name) {
                formData[name] = el.value;
            }
            clearMessage();
        });
    });

    // Conditional field listener (deadline)
    if (step.hasConditional && step.conditionalField) {
        const cond = step.conditionalField;
        const condInput = document.getElementById(`field-${cond.fieldName}`);
        if (condInput) {
            condInput.addEventListener("input", () => {
                formData[cond.fieldName] = condInput.value;
                clearMessage();
            });
        }
    }

    // Dynamic contact field listeners
    if (step.contactFields) {
        Object.keys(step.contactFields).forEach((key) => {
            const cf = step.contactFields[key];
            const inp = document.getElementById(`field-${cf.fieldName}`);
            if (inp) {
                inp.addEventListener("input", () => {
                    contactDetails[cf.fieldName] = inp.value;
                    clearMessage();
                });
            }
        });
    }

    // Update navigation button visibility
    updateNavButtons();
    updateProgress();
}

// ---- Navigation button states ----
function updateNavButtons() {
    const isFirst = currentStepIndex === 0;
    const isLast = currentStepIndex === steps.length - 1;

    backBtn.classList.toggle("hidden", isFirst);
    nextBtn.classList.toggle("hidden", isLast);
    submitBtn.classList.toggle("hidden", !isLast);
}

// ---- Validate current step ----
function validateCurrentStep() {
    const step = steps[currentStepIndex];
    let error = null;

    // Primary field validation
    if (step.validate) {
        let value;
        if (step.inputType === "radio") {
            value = formData[step.fieldName] || "";
        } else if (step.inputType === "checkbox") {
            value = formData[step.fieldName] || [];
        } else {
            value = formData[step.fieldName] || "";
        }
        error = step.validate(value);
    }

    // Conditional deadline field
    if (!error && step.hasConditional && step.conditionalField) {
        if (formData[step.fieldName] === "Other") {
            const cond = step.conditionalField;
            const condValue = formData[cond.fieldName] || "";
            error = cond.validate(condValue);
        }
    }

    // Dynamic contact fields
    if (!error && step.contactFields) {
        const selected = formData[step.fieldName] || [];
        for (const key of selected) {
            const cf = step.contactFields[key];
            if (cf && cf.required) {
                const val = contactDetails[cf.fieldName] || "";
                const cfError = cf.validate(val);
                if (cfError) {
                    error = cfError;
                    break;
                }
            }
        }
    }

    return error;
}

// ---- Move to next step ----
function goNext() {
    const error = validateCurrentStep();
    if (error) {
        showMessage(error);
        return;
    }
    clearMessage();

    if (currentStepIndex < steps.length - 1) {
        // Transition
        stepContainer.classList.add("fade-out");
        setTimeout(() => {
            currentStepIndex++;
            renderStep(currentStepIndex);
            stepContainer.classList.remove("fade-out");
            stepContainer.classList.add("fade-in");
            setTimeout(() => stepContainer.classList.remove("fade-in"), 300);
        }, 150);
    }
}

// ---- Move to previous step ----
function goBack() {
    if (currentStepIndex > 0) {
        clearMessage();
        stepContainer.classList.add("fade-out");
        setTimeout(() => {
            currentStepIndex--;
            renderStep(currentStepIndex);
            stepContainer.classList.remove("fade-out");
            stepContainer.classList.add("fade-in");
            setTimeout(() => stepContainer.classList.remove("fade-in"), 300);
        }, 150);
    }
}

// ---- Build submission payload for Web3Forms ----
function buildSubmissionData() {
    const name = formData.name || "Anonymous";
    const task = formData.task || "Not provided";
    const category = formData.category || "Not provided";
    const desiredResult = formData.desired_result || "Not provided";
    let deadline = formData.deadline || "Not provided";
    if (deadline === "Other" && formData.deadline_other) {
        deadline = `Other: ${formData.deadline_other}`;
    }
    const additionalDetails = formData.additional_details || "None provided";
    const contactMethods = Array.isArray(formData.contact_methods)
        ? formData.contact_methods.join(", ")
        : "Not provided";

    const whatsapp = contactDetails.whatsapp || "";
    const instagram = contactDetails.instagram || "";
    const email = contactDetails.email || "";

    // Construct human-readable message
    let message = `MR. ODDJOBS TASK REQUEST\n\n`;
    message += `Name:\n${name}\n\n`;
    message += `Task:\n${task}\n\n`;
    message += `Category:\n${category}\n\n`;
    message += `Desired result:\n${desiredResult}\n\n`;
    message += `Deadline:\n${deadline}\n\n`;
    message += `Additional details:\n${additionalDetails}\n\n`;
    message += `Contact methods:\n${contactMethods}\n\n`;
    if (whatsapp) message += `WhatsApp:\n${whatsapp}\n\n`;
    if (instagram) message += `Instagram:\n${instagram}\n\n`;
    if (email) message += `Email:\n${email}\n\n`;

    // Web3Forms payload
    const payload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `New Mr. OddJobs task request from ${name}`,
        from_name: "Mr. OddJobs Task Form",
        name: name,
        message: message.trim()
    };

    // Add reply-to if email provided (Web3Forms supports this)
    if (email) {
        payload.replyto = email;
    }

    return payload;
}

// ---- Submit to Web3Forms ----
async function submitForm() {
    if (isSubmitting) return;

    // Validate all steps before submitting (in case user navigated back and forth)
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        let error = null;

        if (step.validate) {
            let value;
            if (step.inputType === "radio") {
                value = formData[step.fieldName] || "";
            } else if (step.inputType === "checkbox") {
                value = formData[step.fieldName] || [];
            } else {
                value = formData[step.fieldName] || "";
            }
            error = step.validate(value);
        }

        if (!error && step.hasConditional && step.conditionalField) {
            if (formData[step.fieldName] === "Other") {
                const cond = step.conditionalField;
                const condValue = formData[cond.fieldName] || "";
                error = cond.validate(condValue);
            }
        }

        if (!error && step.contactFields) {
            const selected = formData[step.fieldName] || [];
            for (const key of selected) {
                const cf = step.contactFields[key];
                if (cf && cf.required) {
                    const val = contactDetails[cf.fieldName] || "";
                    const cfError = cf.validate(val);
                    if (cfError) {
                        error = cfError;
                        break;
                    }
                }
            }
        }

        if (error) {
            // Jump to the problematic step
            currentStepIndex = i;
            renderStep(i);
            showMessage(error);
            return;
        }
    }

    // Honeypot check
    const honeypot = document.getElementById("website");
    if (honeypot && honeypot.value.trim() !== "") {
        console.warn("Honeypot triggered – submission blocked.");
        showSuccess();
        return;
    }

    // Proceed with submission
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    clearMessage();

    const payload = buildSubmissionData();

    try {
        const response = await fetch(WEB3FORMS_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

        // Try to parse the response body regardless of HTTP status
        let result = null;
        try {
            result = await response.json();
        } catch (parseErr) {
            // If the body isn't valid JSON, we can't inspect it further
            result = null;
        }

        // Success path
        if (result && result.success === true) {
            showSuccess();
            return;
        }

        // ---- Failure paths ----

        // Build a lowercase version of the API message (if any) for keyword checks
        const apiMessage = (result && typeof result.message === "string")
            ? result.message.toLowerCase()
            : "";

        // 1. Quota / limit errors
        const isQuotaError =
            apiMessage.includes("limit") ||
            apiMessage.includes("quota") ||
            apiMessage.includes("exceed") ||
            apiMessage.includes("upgrade") ||
            apiMessage.includes("plan") ||
            response.status === 429;

        if (isQuotaError) {
            console.warn("Web3Forms quota limit reached:", result);
            showQuotaError();
            return;
        }

        // 2. Network-ish errors (server returned 5xx)
        if (!response.ok && response.status >= 500) {
            console.error("Web3Forms server error:", response.status, result);
            showError("Something went wrong on my end. Your answers are still here — try again in a moment.");
            return;
        }

        // 3. Anything else — generic friendly message
        console.error("Web3Forms unexpected response:", response.status, result);
        showError("Something went wrong while sending that. Your answers are still here. Check your connection and try again.");

    } catch (err) {
        // Network failure (offline, DNS, CORS, etc.)
        console.error("Web3Forms network error:", err);
        showError("I couldn't reach the server. Your answers are still here. Check your connection and try again.");
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "Send my request";
    }
}

// ---- Success state ----
function showSuccess() {
    formView.classList.add("hidden");
    successView.classList.remove("hidden");
    errorView.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---- Error state ----
function showError(message) {
    // Show the error message in the form message area
    formMessage.textContent = message;
    formMessage.style.color = "";
    formMessage.style.opacity = "1";

    // Make sure the form is visible so the user can see the message and retry
    successView.classList.add("hidden");
    errorView.classList.add("hidden");
    formView.classList.remove("hidden");
}

// ---- Quota error (fallback to email) ----
function showQuotaError() {
    // Use the message area to display a rich message with a mailto link.
    formMessage.innerHTML = `
        I've hit my monthly limit for receiving requests through the form.
        Please email me directly at
        <a href="mailto:${FALLBACK_EMAIL}" style="color: var(--accent-gold); text-decoration: underline;">${FALLBACK_EMAIL}</a>
        and I'll get right back to you.
    `;
    formMessage.style.opacity = "1";
    formMessage.style.color = "var(--text-primary)";

    // Make sure the user is looking at the form (not the success view)
    successView.classList.add("hidden");
    errorView.classList.add("hidden");
    formView.classList.remove("hidden");

    // Re-enable the submit button so they can try again later if they want
    submitBtn.disabled = false;
    submitBtn.textContent = "Send my request";
}

// ---- Reset and show form again (for retry) ----
function resetToForm() {
    errorView.classList.add("hidden");
    formView.classList.remove("hidden");
    successView.classList.add("hidden");
    // Keep all data intact
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---- Event listeners ----
backBtn.addEventListener("click", goBack);
nextBtn.addEventListener("click", goNext);
submitBtn.addEventListener("click", submitForm);

retryBtn.addEventListener("click", () => {
    resetToForm();
    // Re-render current step to refresh any DOM state
    renderStep(currentStepIndex);
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// Allow Enter to advance on single-line inputs, but not on textareas
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target;
        if (target.tagName === "INPUT" && target.type !== "submit" && target.type !== "checkbox" && target.type !== "radio") {
            e.preventDefault();
            if (currentStepIndex === steps.length - 1) {
                submitForm();
            } else {
                goNext();
            }
        }
        // For textareas, let the default behavior (newline) happen
    }
});

// ---- Initialize ----
function init() {
    // Restore scroll progress (optional)
    window.addEventListener("scroll", () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
        document.getElementById("scroll-progress").style.width = scrolled + "%";
    });

    // Render first step
    renderStep(0);
    updateProgress();

    // Ensure success/error views are hidden
    successView.classList.add("hidden");
    errorView.classList.add("hidden");
}

init();