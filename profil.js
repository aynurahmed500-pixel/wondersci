
function toggleMenu() {
  var menu = document.getElementById("menu");
  menu.classList.toggle("active");
}
const elements = document.querySelectorAll(".fade-in");

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }
    });
});

elements.forEach(element => {
    observer.observe(element);
});
const profileForm = document.getElementById("profileForm");
const editButton = document.getElementById("editButton");
const cancelButton = document.getElementById("cancelButton");
const formActions = document.getElementById("formActions");
const statusMessage = document.getElementById("statusMessage");

const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");

const sidebarName = document.getElementById("sidebarName");
const sidebarEmail = document.getElementById("sidebarEmail");
const avatar = document.getElementById("avatar");

const editableFields = [firstName, lastName, email, phone];

let originalData = {};

function getFormData() {
    return {
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim()
    };
}

function saveOriginalData() {
    originalData = getFormData();
}

function setEditing(isEditing) {
    editableFields.forEach(field => {
        field.disabled = !isEditing;
    });

    editButton.hidden = isEditing;
    formActions.hidden = !isEditing;
    statusMessage.textContent = "";
}

function updateSidebar() {
    const fullName = `${firstName.value.trim()} ${lastName.value.trim()}`.trim();

    sidebarName.textContent = fullName || "Потребител";
    sidebarEmail.textContent = email.value.trim();
    avatar.textContent = firstName.value.trim().charAt(0).toUpperCase() || "?";
}

editButton.addEventListener("click", () => {
    saveOriginalData();
    setEditing(true);
    firstName.focus();
});

cancelButton.addEventListener("click", () => {
    firstName.value = originalData.firstName;
    lastName.value = originalData.lastName;
    email.value = originalData.email;
    phone.value = originalData.phone;

    setEditing(false);
    updateSidebar();
    statusMessage.textContent = "Промените са отменени.";
});

profileForm.addEventListener("submit", event => {
    event.preventDefault();

    if (!profileForm.reportValidity()) {
        return;
    }

    updateSidebar();
    setEditing(false);

    statusMessage.textContent =
        "Данните са обновени за тази демонстрация.";
});

// Примерни настройки
const newsNotifications = document.getElementById("newsNotifications");
const scienceSuggestions = document.getElementById("scienceSuggestions");
const saveSettings = document.getElementById("saveSettings");
const settingsMessage = document.getElementById("settingsMessage");

saveSettings.addEventListener("click", () => {
    const settings = {
        newsNotifications: newsNotifications.checked,
        scienceSuggestions: scienceSuggestions.checked
    };

    // Засега само показваме избраните настройки.
    console.log("Избрани настройки:", settings);

    settingsMessage.textContent =
        "Настройките са запазени за тази демонстрация.";
});

document.getElementById("logoutButton").addEventListener("click", () => {
    const shouldLogout = confirm("Сигурен ли си, че искаш да излезеш от профила?");

    if (shouldLogout) {
        alert("Демонстрационен профил: все още няма активна система за вход.");
        window.location.href = "./index.html";
    }
});

saveOriginalData();
updateSidebar();
