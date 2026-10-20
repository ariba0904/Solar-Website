// Solaris website interactions — no framework required.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Mobile navigation
const menuToggle = $("#menuToggle");
const mainNav = $("#mainNav");
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  mainNav.classList.toggle("open", open);
});
$$(".main-nav a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
}));

// Theme switcher with saved preference.
const themeToggle = $("#themeToggle");
const themeIcon = $("#themeIcon");
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  themeIcon.textContent = dark ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  document.querySelector('meta[name="theme-color"]').content = dark ? "#101b16" : "#f7f5ee";
}
let savedTheme = null;
try { savedTheme = localStorage.getItem("solaris-theme"); } catch (_) {}
applyTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("solaris-theme", next); } catch (_) {}
});

// Calculator: illustrative estimates only. Assumptions are visible and editable.
const calculator = $("#solarCalculator");
const billInput = $("#monthlyBill");
const billRange = $("#billRange");
const sunHours = $("#sunHours");
const electricityRate = $("#electricityRate");
const money = amount => new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(Math.max(0, amount));
function updateBillFromRange() { billInput.value = billRange.value; }
function updateRangeFromBill() {
  const value = Number(billInput.value);
  if (Number.isFinite(value)) billRange.value = Math.max(Number(billRange.min), Math.min(Number(billRange.max), value));
}
billRange.addEventListener("input", () => { updateBillFromRange(); calculateEstimate(); });
billInput.addEventListener("input", () => { updateRangeFromBill(); calculateEstimate(); });
[sunHours, electricityRate].forEach(el => el.addEventListener("change", calculateEstimate));
function calculateEstimate(event) {
  if (event) event.preventDefault();
  const bill = Math.max(0, Number(billInput.value) || 0);
  const rate = Math.max(1, Number(electricityRate.value) || 10);
  const sun = Math.max(1, Number(sunHours.value) || 4);
  // 80% target offset, 75% performance ratio; kWh/month ~= kW × sun hours × 30 × 0.75.
  const targetMonthlyKwh = (bill / rate) * 0.8;
  const systemKw = targetMonthlyKwh / (sun * 30 * 0.75);
  const roundedSize = Math.max(0, Math.ceil(systemKw * 10) / 10);
  const estimatedOffset = bill * 0.8;
  // Demo budget assumption: ৳80,000 per kW. Replace with local supplier quotes.
  const estimatedCost = roundedSize * 80000;
  $("#systemSize").textContent = roundedSize.toFixed(1);
  $("#systemCost").textContent = "৳" + money(estimatedCost);
  $("#billOffset").textContent = "৳" + money(estimatedOffset);
  $("#estimateDisclaimer").textContent = "Assumptions: 80% bill offset target, 75% performance ratio, and ৳80,000 per kW budget placeholder. Real prices, tariffs, roof conditions, shading, and export rules vary.";
}
calculator.addEventListener("submit", calculateEstimate);
calculateEstimate();

// Energy dashboard uses simulated readings; no real inverter or meter is connected.
const dashboardData = {
  today: { production: 18.4, consumption: 12.7, battery: 82, solarNow: 3.2, homeNow: 1.8, bars: [8, 20, 48, 75, 95, 86, 60, 25, 5], note: "Today", subtitle: "Illustrative hourly output" },
  week: { production: 112.6, consumption: 87.3, battery: 76, solarNow: 2.8, homeNow: 1.6, bars: [42, 58, 68, 82, 72, 95, 63], note: "This week", subtitle: "Illustrative daily output" },
  month: { production: 438.2, consumption: 351.8, battery: 68, solarNow: 2.1, homeNow: 1.4, bars: [55, 61, 73, 68, 84, 78, 95, 87, 70, 82, 65, 91], note: "This month", subtitle: "Illustrative daily output" }
};
function renderChart(values) {
  const chart = $("#generationChart");
  chart.replaceChildren();
  values.forEach((value, index) => {
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${Math.max(4, value)}%`;
    bar.title = `Sample output: ${value}% of illustrative peak`;
    bar.setAttribute("tabindex", "0");
    bar.setAttribute("role", "img");
    bar.setAttribute("aria-label", `Sample generation bar ${index + 1}: ${value}% of illustrative peak`);
    chart.append(bar);
  });
}
function renderDashboard(period = $("#dashboardPeriod").value) {
  const data = dashboardData[period] || dashboardData.today;
  $("#productionValue").textContent = data.production.toFixed(1);
  $("#consumptionValue").textContent = data.consumption.toFixed(1);
  $("#batteryValue").textContent = String(data.battery);
  $("#batteryBar").style.width = `${data.battery}%`;
  $("#productionNote").textContent = data.note;
  $("#consumptionNote").textContent = data.note;
  $("#batteryNote").textContent = "Charge estimate";
  $("#flowSolar").textContent = `${data.solarNow.toFixed(1)} kW`;
  $("#flowHome").textContent = `${data.homeNow.toFixed(1)} kW`;
  $("#chartSubtitle").textContent = data.subtitle;
  $("#dashboardDate").textContent = `${data.note} · Simulated readings`;
  renderChart(data.bars);
}
$("#dashboardPeriod").addEventListener("change", event => renderDashboard(event.target.value));
$("#refreshDashboard").addEventListener("click", () => {
  // Small variation makes the refresh interaction visible while remaining clearly demo data.
  const period = $("#dashboardPeriod").value;
  const data = dashboardData[period];
  const original = { ...data, bars: [...data.bars] };
  data.solarNow = Math.max(0, data.solarNow + (Math.random() - 0.5) * 0.6);
  data.homeNow = Math.max(0, data.homeNow + (Math.random() - 0.5) * 0.3);
  data.battery = Math.max(10, Math.min(100, data.battery + Math.round((Math.random() - 0.5) * 6)));
  data.bars = data.bars.map(v => Math.max(4, Math.min(100, v + Math.round((Math.random() - 0.5) * 12))));
  renderDashboard(period);
  // Keep the sample dataset bounded after repeated refreshes.
  setTimeout(() => { Object.assign(data, original); }, 8000);
});
renderDashboard();
$("#currentYear").textContent = new Date().getFullYear();

// Front-end contact form: validate, then offer an email draft rather than pretending to submit to a server.
const contactForm = $("#contactForm");
const formStatus = $("#formStatus");
contactForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const form = new FormData(contactForm);
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const project = String(form.get("project") || "").trim();
  const phone = String(form.get("phone") || "").trim();
  const message = String(form.get("message") || "").trim();
  const subject = encodeURIComponent(`Solar enquiry — ${project}`);
  const body = encodeURIComponent(`Hello Solaris,\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\nInterested in: ${project}\n\nProject details:\n${message}\n\nSent from the Solaris website demo.`);
  formStatus.textContent = "Your details are ready. Your email app may open so you can review and send the enquiry.";
  window.location.href = `mailto:hello@solaris.example?subject=${subject}&body=${body}`;
});
