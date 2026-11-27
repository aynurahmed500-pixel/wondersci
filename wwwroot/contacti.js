function toggleMenu() {
    const menu = document.getElementById("menu");
    if (menu) menu.classList.toggle("active");
}
function surce() { window.location.href = "lyubimi.html"; }
function kolichka() { window.location.href = "kolichka.html"; }
function ikona() { window.location.href = "profil.html"; }

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const status = document.getElementById("contactStatus");
        const btn = document.getElementById("contactSubmitBtn");

        const name = document.getElementById("contactName").value.trim();
        const email = document.getElementById("contactEmail").value.trim();
        const message = document.getElementById("contactMessage").value.trim();

        btn.disabled = true;
        status.textContent = "Изпращане на съобщението...";

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message })
            });
            const data = await res.json();

            if (res.ok) {
                status.textContent = "✓ " + data.message;
                form.reset();
            } else {
                status.textContent = data.message || "Възникна грешка при изпращането.";
            }
        } catch {
            status.textContent = "Грешка при връзка със сървъра.";
        } finally {
            btn.disabled = false;
        }
    });
});
