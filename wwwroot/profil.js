function toggleMenu() {
  const menu = document.getElementById("menu");
  if (menu) menu.classList.toggle("active");
}

function kolichka() {
  window.location.href = "kolichka.html";
}

function surce() {
  window.location.href = "lyubimi.html";
}

function ikona() {
  window.location.href = "profil.html";
}

const authSection = document.getElementById("authSection");
const profileLayout = document.getElementById("profileLayout");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const regFirstNameField = document.getElementById("regFirstNameField");
const regLastNameField = document.getElementById("regLastNameField");
const regRoleField = document.getElementById("regRoleField");
const authForm = document.getElementById("authForm");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authMessage = document.getElementById("authMessage");
const adminPanel = document.getElementById("adminPanel");

let isRegisterMode = false;
let currentUser = null;

try {
  currentUser = JSON.parse(localStorage.getItem("wondersci_user"));
} catch (e) {
  currentUser = null;
}

if (tabLogin && tabRegister) {
  tabLogin.addEventListener("click", () => {
    isRegisterMode = false;
    tabLogin.className = "save-button";
    tabRegister.className = "cancel-button";
    if (regFirstNameField) regFirstNameField.hidden = true;
    if (regLastNameField) regLastNameField.hidden = true;
    if (regRoleField) regRoleField.hidden = true;
    authSubmitBtn.textContent = "Влез в профила";
    authMessage.textContent = "";
  });

  tabRegister.addEventListener("click", () => {
    isRegisterMode = true;
    tabRegister.className = "save-button";
    tabLogin.className = "cancel-button";
    if (regFirstNameField) regFirstNameField.hidden = false;
    if (regLastNameField) regLastNameField.hidden = false;
    if (regRoleField) regRoleField.hidden = false;
    authSubmitBtn.textContent = "Създай профил";
    authMessage.textContent = "";
  });
}

if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authMessage.textContent = "Изчакай...";

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    try {
      if (isRegisterMode) {
        const firstName = document.getElementById("authFirstName").value.trim();
        const lastName = document.getElementById("authLastName").value.trim();
        const roleEl = document.getElementById("authRole");
        const role = roleEl ? roleEl.value : "customer";

        if (!firstName || !lastName) {
          authMessage.textContent = "Моля, попълни име и фамилия.";
          return;
        }

        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName, email, password, role })
        });

        const data = await res.json();
        if (res.ok) {
          currentUser = data;
          localStorage.setItem("wondersci_user", JSON.stringify(currentUser));
          updateUI();
        } else {
          authMessage.textContent = data.message || "Грешка при регистрация.";
        }
      } else {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
          currentUser = data;
          localStorage.setItem("wondersci_user", JSON.stringify(currentUser));
          updateUI();
        } else {
          authMessage.textContent = data.message || "Грешен имейл или парола.";
        }
      }
    } catch (err) {
      authMessage.textContent = "Няма връзка със сървъра.";
    }
  });
}

async function loadAdminData() {
  const prodList = document.getElementById("adminProductsList");
  const ordList = document.getElementById("adminOrdersList");

  if (prodList) {
    const prodRes = await fetch("/products");
    const products = await prodRes.json();
    prodList.replaceChildren();

    products.forEach(p => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border:1px solid #e2e8f0; border-radius:8px; margin-top:6px;";

      const info = document.createElement("span");
      info.innerHTML = `${p.image || "🧪"} <strong>${p.name}</strong> — ${Number(p.price).toFixed(2)} лв.`;

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "logout-button";
      delBtn.style.cssText = "width:auto; padding:4px 10px; margin:0;";
      delBtn.textContent = "Изтрий";
      delBtn.addEventListener("click", async () => {
        await fetch(`/products/${p.id}`, { method: "DELETE" });
        loadAdminData();
      });

      row.append(info, delBtn);
      prodList.appendChild(row);
    });
  }

  if (ordList) {
    const ordRes = await fetch("/api/orders");
    const orders = await ordRes.json();
    ordList.replaceChildren();

    if (orders.length === 0) {
      ordList.innerHTML = "<p>Няма направени поръчки.</p>";
    } else {
      orders.forEach(o => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border:1px solid #e2e8f0; border-radius:8px; margin-top:6px;";

        const info = document.createElement("span");
        info.innerHTML = `<strong>№${o.id}</strong> ${o.customerName} (${o.phone}) — ${Number(o.totalPrice).toFixed(2)} лв.`;

        const doneBtn = document.createElement("button");
        doneBtn.type = "button";
        doneBtn.className = "cancel-button";
        doneBtn.style.cssText = "padding:4px 10px;";
        doneBtn.textContent = "Приключи";
        doneBtn.addEventListener("click", async () => {
          await fetch(`/api/orders/${o.id}`, { method: "DELETE" });
          loadAdminData();
        });

        row.append(info, doneBtn);
        ordList.appendChild(row);
      });
    }
  }
}

function updateUI() {
  if (!currentUser) {
    if (authSection) authSection.hidden = false;
    if (profileLayout) profileLayout.hidden = true;
    return;
  }

  if (authSection) authSection.hidden = true;
  if (profileLayout) profileLayout.hidden = false;

  const isAdmin = currentUser.role === "admin";
  if (adminPanel) adminPanel.hidden = !isAdmin;

  document.getElementById("avatar").textContent = currentUser.firstName.charAt(0).toUpperCase();
  document.getElementById("sidebarName").textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById("sidebarEmail").textContent = currentUser.email;

  const sidebarRole = document.getElementById("sidebarRole");
  if (sidebarRole) {
    sidebarRole.textContent = isAdmin ? "🛡️ Администратор" : "👤 Клиент";
  }

  document.getElementById("firstName").value = currentUser.firstName;
  document.getElementById("lastName").value = currentUser.lastName;
  document.getElementById("email").value = currentUser.email;
  document.getElementById("phone").value = currentUser.phone || "";

  if (isAdmin) {
    loadAdminData();
  }
}

const addProductForm = document.getElementById("addProductForm");
if (addProductForm) {
  addProductForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const adminMessage = document.getElementById("adminMessage");
    adminMessage.textContent = "Добавяне...";

    const productData = {
      name: document.getElementById("prodName").value.trim(),
      price: Number(document.getElementById("prodPrice").value),
      category: document.getElementById("prodCategory").value,
      image: document.getElementById("prodImage").value.trim() || "🧪",
      description: document.getElementById("prodDescription").value.trim()
    };

    const res = await fetch("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData)
    });

    if (res.ok) {
      adminMessage.textContent = "Продуктът е добавен успешно в каталога!";
      addProductForm.reset();
      loadAdminData();
    } else {
      adminMessage.textContent = "Грешка при добавяне на продукта.";
    }
  });
}

const editButton = document.getElementById("editButton");
const formActions = document.getElementById("formActions");
const cancelButton = document.getElementById("cancelButton");
const profileForm = document.getElementById("profileForm");
const statusMessage = document.getElementById("statusMessage");
const inputs = ["firstName", "lastName", "email", "phone"].map(id => document.getElementById(id));

if (editButton) {
  editButton.addEventListener("click", () => {
    inputs.forEach(input => input.disabled = false);
    formActions.hidden = false;
    editButton.hidden = true;
    statusMessage.textContent = "";
  });
}

if (cancelButton) {
  cancelButton.addEventListener("click", () => {
    inputs.forEach(input => input.disabled = true);
    formActions.hidden = true;
    editButton.hidden = false;
    updateUI();
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const updated = {
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim()
    };

    const res = await fetch(`/api/users/${currentUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });

    if (res.ok) {
      currentUser = { ...currentUser, ...updated };
      localStorage.setItem("wondersci_user", JSON.stringify(currentUser));
inputs.forEach(input => input.disabled = true);
formActions.hidden = true;
editButton.hidden = false;
statusMessage.textContent = "Промените са запазени успешно!";
updateUI();
} else {
statusMessage.textContent = "Грешка при запазване.";
}
});
}
const saveSettings = document.getElementById("saveSettings");
if (saveSettings) {
saveSettings.addEventListener("click", () => {
document.getElementById("settingsMessage").textContent = "Настройките са запазени!";
});
}
const logoutButton = document.getElementById("logoutButton");
if (logoutButton) {
logoutButton.addEventListener("click", () => {
localStorage.removeItem("wondersci_user");
currentUser = null;
updateUI();
});
}
updateUI();

async function resetPasswordFlow() {
    const emailInput = document.getElementById("authEmail");
    const email = prompt("Въведете вашия имейл адрес:", emailInput ? emailInput.value : "");
    if (!email) return;

    const newPassword = prompt("Въведете новата си парола (поне 6 символа):");
    if (!newPassword || newPassword.length < 6) {
        alert("Паролата трябва да е поне 6 символа.");
        return;
    }

    try {
        const res = await fetch("/api/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password: newPassword })
        });
        const data = await res.json();
        alert(data.message);
    } catch {
        alert("Грешка при връзка със сървъра.");
    }
}
