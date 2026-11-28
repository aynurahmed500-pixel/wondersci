
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
async function applyFeatureFlags() {
    try {
        const res = await fetch("/api/features");
        if (!res.ok) return;
        const features = await res.json();

        const promoBanner = document.getElementById("promoBanner");
        if (promoBanner) {
            promoBanner.style.display = features.enablePromoBanner ? "block" : "none";
        }
    } catch (e) {
        console.error("Грешка при зареждане на Feature Flags:", e);
    }
}

applyFeatureFlags();

document.addEventListener("DOMContentLoaded", () => {
    const nlForm = document.getElementById("newsletterForm");
    if (!nlForm) return;

    nlForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById("newsletterEmail");
        const status = document.getElementById("newsletterStatus");
        status.textContent = "Записване...";

        try {
            const res = await fetch("/api/newsletter/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput.value.trim() })
            });
            const data = await res.json();
            status.textContent = data.message;
            if (res.ok) nlForm.reset();
        } catch {
            status.textContent = "Грешка при връзка със сървъра.";
        }
    });
});

