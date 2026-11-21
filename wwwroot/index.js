
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

