// Search, filters, booking flow, Tranzilla checkout, PNR / boarding pass

function formatMoney(amountUSD) {
  if (state.currency === "EUR") {
    return "€" + Math.round(amountUSD * EUR_RATE).toLocaleString();
  }
  return "$" + Math.round(amountUSD).toLocaleString();
}

function setCurrency(curr) {
  state.currency = curr;
  document.getElementById("currUSD").className = curr === "USD"
    ? "px-2.5 py-1 rounded-md bg-sky-500 text-white transition"
    : "px-2.5 py-1 rounded-md text-slate-200 hover:text-white transition";
  document.getElementById("currEUR").className = curr === "EUR"
    ? "px-2.5 py-1 rounded-md bg-sky-500 text-white transition"
    : "px-2.5 py-1 rounded-md text-slate-200 hover:text-white transition";
  renderDestinations();
  renderVistaMareCards();
  renderFlightResults();
  updateAdminStats();
  if (state.selectedFlight) {
    renderOrderSummary("summaryStep2");
    renderOrderSummary("summaryStep3");
  }
}

function handleLangChange() {
  const lang = document.getElementById("langSelect").value;
  document.documentElement.dir = lang === "HE" ? "rtl" : "ltr";
}

function initDates() {
  const today = new Date();
  const dep = new Date(today.getTime() + 7 * 86400000);
  const ret = new Date(today.getTime() + 14 * 86400000);
  const depIso = dep.toISOString().split("T")[0];
  document.getElementById("searchDepart").value = depIso;
  document.getElementById("searchReturn").value = ret.toISOString().split("T")[0];
  document.getElementById("vmCheckIn").value = depIso;
}

function toggleReturnDate() {
  const isRound = document.querySelector('input[name="tripType"]:checked').value === "roundtrip";
  document.getElementById("returnDateWrapper").style.display = isRound ? "block" : "none";
}

function changePax(type, delta) {
  const next = state.pax[type] + delta;
  if (type === "adults" && next < 1) return;
  if (next < 0 || next > 9) return;
  state.pax[type] = next;
  document.getElementById("paxAdults").textContent = state.pax.adults;
  document.getElementById("paxKids").textContent = state.pax.kids;
  document.getElementById("paxInfants").textContent = state.pax.infants;
}

function swapAirports() {
  const fromEl = document.getElementById("searchFrom");
  const toEl = document.getElementById("searchTo");
  if (toEl.value === "ALL") toEl.value = "LCA";
  const tmp = fromEl.value;
  fromEl.value = toEl.value;
  toEl.value = tmp;
  onRouteChange();
}

function onRouteChange() {
  const fromVal = document.getElementById("searchFrom").value;
  const toVal = document.getElementById("searchTo").value;
  const isLCA = fromVal === "LCA" || toVal === "LCA" || toVal === "ALL";
  document.getElementById("lcaVistaBanner").classList.toggle("hidden", !isLCA);
}

function scrollToVistaMare() {
  document.getElementById("vistaMareSection").scrollIntoView({ behavior: "smooth" });
}

function quickSelectDestination(code) {
  switchSearchTab("book");
  document.getElementById("searchFrom").value = "TLV";
  document.getElementById("searchTo").value = code;
  onRouteChange();
  setFlowStep(1);
  renderFlightResults();
  document.getElementById("bookingFlowSection").scrollIntoView({ behavior: "smooth" });
}

function resetHome() {
  setFlowStep(1);
  document.getElementById("searchFrom").value = "TLV";
  document.getElementById("searchTo").value = "LCA";
  onRouteChange();
  resetFilters();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function switchSearchTab(tab) {
  const isBook = tab === "book";
  document.getElementById("tabBookFlight").className = isBook
    ? "px-4 py-2 rounded-xl text-sm font-bold bg-[#0b1936] text-white transition"
    : "px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition";
  document.getElementById("tabFindRes").className = !isBook
    ? "px-4 py-2 rounded-xl text-sm font-bold bg-[#0b1936] text-white transition"
    : "px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition";
  document.getElementById("tripTypeControls").style.display = isBook ? "flex" : "none";
  document.getElementById("bookFlightForm").classList.toggle("hidden", !isBook);
  document.getElementById("findReservationBox").classList.toggle("hidden", isBook);
}

function handleSearchFlights(e) {
  e.preventDefault();
  onRouteChange();
  setFlowStep(1);
  renderFlightResults();
  document.getElementById("bookingFlowSection").scrollIntoView({ behavior: "smooth" });
}

function resetFilters() {
  document.getElementById("filterCabin").value = "ALL";
  document.getElementById("filterStops").value = "ALL";
  document.getElementById("filterTime").value = "ALL";
  document.getElementById("filterSort").value = "PRICE_ASC";
  renderFlightResults();
}

function getDepartureHour(depTimeStr) {
  if (!depTimeStr) return 12;
  const parts = String(depTimeStr).split(":");
  return parseInt(parts[0], 10) || 0;
}

function renderFlightResults() {
  const fromVal = document.getElementById("searchFrom").value;
  const toVal = document.getElementById("searchTo").value;
  const cabinVal = document.getElementById("filterCabin").value;
  const stopsVal = document.getElementById("filterStops").value;
  const timeVal = document.getElementById("filterTime").value;
  const sortVal = document.getElementById("filterSort").value;

  let list = state.flights.filter(f => {
    if (fromVal && f.from.toUpperCase() !== fromVal.toUpperCase()) return false;
    if (toVal && toVal !== "ALL" && f.to.toUpperCase() !== toVal.toUpperCase()) return false;
    if (cabinVal !== "ALL" && f.cabin.toLowerCase() !== cabinVal.toLowerCase()) return false;
    if (stopsVal !== "ALL" && String(f.stops) !== stopsVal) return false;

    const hr = getDepartureHour(f.depTime);
    if (timeVal === "MORNING" && !(hr >= 5 && hr < 12)) return false;
    if (timeVal === "AFTERNOON" && !(hr >= 12 && hr < 18)) return false;
    if (timeVal === "EVENING" && !(hr >= 18 && hr <= 23)) return false;
    return true;
  });

  if (sortVal === "PRICE_ASC") list.sort((a, b) => a.priceUSD - b.priceUSD);
  if (sortVal === "PRICE_DESC") list.sort((a, b) => b.priceUSD - a.priceUSD);
  if (sortVal === "DEP_ASC") list.sort((a, b) => getDepartureHour(a.depTime) - getDepartureHour(b.depTime));

  const container = document.getElementById("flightResultsList");
  if (list.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
        <div class="text-base font-bold text-slate-800">No flights match your current search or filter criteria.</div>
        <p class="text-xs text-slate-500 mt-1">Try changing your route, resetting filters, or uploading flights via the Sami Admin Excel panel.</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(f => {
    const isLCA = f.to.toUpperCase() === "LCA" || f.from.toUpperCase() === "LCA";
    return `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border ${isLCA ? "border-teal-200 bg-teal-50/20" : "border-slate-200 bg-white"} hover:border-sky-400 hover:shadow-md transition">
      <div class="flex flex-wrap items-center gap-6">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-extrabold text-sky-700 uppercase">${escapeHTML(f.airline)} • ${escapeHTML(f.flightNo)}</span>
            ${isLCA ? `<span class="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-extrabold">Vista Mare Eligible</span>` : ""}
          </div>
          <div class="flex items-center gap-3 mt-1">
            <span class="text-lg font-extrabold text-slate-900">${escapeHTML(f.depTime)} <small class="text-xs font-semibold text-slate-500">${escapeHTML(f.from)}</small></span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              ${escapeHTML(f.duration)} • ${f.stops === 0 ? "Direct" : escapeHTML(f.stops) + " Stop"}
            </span>
            <span class="text-lg font-extrabold text-slate-900">${escapeHTML(f.arrTime)} <small class="text-xs font-semibold text-slate-500">${escapeHTML(f.to)}</small></span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">${escapeHTML(f.cabin)}</span>
          <span class="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">${escapeHTML(f.seats)} seats left</span>
        </div>
      </div>

      <div class="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
        <div class="text-right">
          <div class="text-[11px] text-slate-400">per passenger</div>
          <div class="text-2xl font-extrabold text-slate-900">${formatMoney(f.priceUSD)}</div>
        </div>
        <button onclick="selectFlightForBooking('${escapeHTML(f.id)}')" class="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition">
          Select Flight
        </button>
      </div>
    </div>
  `;
  }).join("");
}

function renderVistaMareCards() {
  const nights = parseInt(document.getElementById("vmNightsSelect")?.value || "3", 10);
  const grid = document.getElementById("vistaMareGrid");
  grid.innerHTML = VISTA_MARE_UNITS.map(u => `
    <div class="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between">
      <div>
        <div class="h-40 relative bg-slate-200">
          <img src="${escapeHTML(u.img)}" alt="${escapeHTML(u.name)}" onerror="this.onerror=null;this.src=FALLBACK_RESORT_IMG;" class="w-full h-full object-cover" />
          <span class="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-teal-900/90 text-teal-200 text-[10px] font-bold">
            ${escapeHTML(u.capacity)}
          </span>
        </div>
        <div class="p-4">
          <h3 class="font-extrabold text-base text-slate-900">${escapeHTML(u.name)}</h3>
          <p class="text-xs text-slate-600 mt-1 leading-relaxed">${escapeHTML(u.desc)}</p>
          <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span class="text-xs font-extrabold text-teal-700">${escapeHTML(u.priceNote)}</span>
            <span class="text-[11px] font-semibold text-slate-500">${nights} nights stay</span>
          </div>
        </div>
      </div>
      <div class="px-4 pb-4 space-y-2">
        <button type="button" onclick="reserveVistaMareWithLCA('${escapeHTML(u.id)}')" class="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs transition">
          Request with LCA Flight
        </button>
        <a href="https://vistamarecyprus.com/" target="_blank" rel="noopener noreferrer" class="block w-full text-center py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition">
          Check Live Rates on Website ↗
        </a>
      </div>
    </div>
  `).join("");
}

function reserveVistaMareWithLCA(unitId) {
  const nights = parseInt(document.getElementById("vmNightsSelect")?.value || "3", 10);
  state.selectedVistaMare = { unitId, nights, transfer: true };

  // Ensure an LCA flight is selected or pre-filtered
  document.getElementById("searchFrom").value = "TLV";
  document.getElementById("searchTo").value = "LCA";
  onRouteChange();

  const lcaFlight = state.flights.find(f => f.to.toUpperCase() === "LCA");
  if (lcaFlight) {
    selectFlightForBooking(lcaFlight.id, true);
  } else {
    setFlowStep(1);
    renderFlightResults();
    document.getElementById("bookingFlowSection").scrollIntoView({ behavior: "smooth" });
  }
}

function setFlowStep(step) {
  const titles = {
    1: "Available Flights & Filters",
    2: "Passenger Details & Vista Mare Stay",
    3: "Tranzilla Secure Payment",
    4: "Booking Confirmed & E-Ticket"
  };
  document.getElementById("flowTitle").textContent = titles[step];

  [1, 2, 3, 4].forEach(n => {
    document.getElementById("step" + n + "Pane").classList.toggle("hidden", n !== step);
    const badge = document.getElementById("stepBadge" + n);
    badge.className = n === step
      ? "px-3 py-1.5 rounded-full bg-blue-600 text-white"
      : (n < step ? "px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800" : "px-3 py-1.5 rounded-full bg-slate-100 text-slate-500");
  });
}

function selectFlightForBooking(flightId, keepVistaSelection = false) {
  const flight = state.flights.find(f => f.id === flightId);
  if (!flight) return;
  state.selectedFlight = flight;
  state.discountRate = 0;
  if (!keepVistaSelection) {
    state.selectedVistaMare = null;
  }
  buildPassengerForms();
  populateStep2VistaSelect();
  renderOrderSummary("summaryStep2");
  setFlowStep(2);
  document.getElementById("bookingFlowSection").scrollIntoView({ behavior: "smooth" });
}

function populateStep2VistaSelect() {
  const sel = document.getElementById("step2VistaRoomSelect");
  sel.innerHTML = `<option value="">No hotel stay needed</option>` +
    VISTA_MARE_UNITS.map(u => `<option value="${escapeHTML(u.id)}">${escapeHTML(u.name)} (Rate on vistamarecyprus.com)</option>`).join("");

  if (state.selectedVistaMare) {
    sel.value = state.selectedVistaMare.unitId;
    document.getElementById("step2VistaNights").value = state.selectedVistaMare.nights;
    document.getElementById("step2VistaTransfer").checked = !!state.selectedVistaMare.transfer;
  } else {
    sel.value = "";
    document.getElementById("step2VistaTransfer").checked = false;
  }
}

function updateVistaAddonFromStep2() {
  const unitId = document.getElementById("step2VistaRoomSelect").value;
  const nights = Math.max(1, parseInt(document.getElementById("step2VistaNights").value || "3", 10));
  const transfer = document.getElementById("step2VistaTransfer").checked;
  if (!unitId) {
    state.selectedVistaMare = null;
  } else {
    state.selectedVistaMare = { unitId, nights, transfer };
  }
  renderOrderSummary("summaryStep2");
  renderOrderSummary("summaryStep3");
}

function buildPassengerForms() {
  const container = document.getElementById("passengerFormsContainer");
  const groups = [];
  for (let i = 1; i <= state.pax.adults; i++) groups.push({ label: `Adult ${i}`, type: "Adult" });
  for (let i = 1; i <= state.pax.kids; i++) groups.push({ label: `Child ${i} (Age 2–11)`, type: "Child" });
  for (let i = 1; i <= state.pax.infants; i++) groups.push({ label: `Infant ${i} (On lap)`, type: "Infant" });

  container.innerHTML = groups.map((g, idx) => `
    <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200">
      <h4 class="font-bold text-slate-900 text-sm mb-3">${escapeHTML(g.label)}</h4>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
          <input type="text" required data-pax-idx="${idx}" data-pax-type="${escapeHTML(g.type)}" class="pax-first w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm" placeholder="Given name" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
          <input type="text" required data-pax-idx="${idx}" data-pax-type="${escapeHTML(g.type)}" class="pax-last w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm" placeholder="Surname" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Passport / ID No.</label>
          <input type="text" required class="pax-doc w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm uppercase" placeholder="Passport No." />
        </div>
      </div>
    </div>
  `).join("");

  if (state.currentUser) {
    document.getElementById("contactEmail").value = state.currentUser.email || "";
    document.getElementById("contactPhone").value = state.currentUser.phone || "+972 ";
  }
}

function calculateTotalsUSD() {
  const f = state.selectedFlight;
  if (!f) return { baseUSD: 0, taxesUSD: 0, vistaUSD: 0, discountUSD: 0, totalUSD: 0 };
  const paxCount = state.pax.adults + state.pax.kids + Math.ceil(state.pax.infants * 0.2);
  const baseUSD = f.priceUSD * Math.max(1, paxCount);
  const taxesUSD = Math.round(baseUSD * 0.14);

  let vistaUSD = 0;
  if (state.selectedVistaMare) {
    const unit = VISTA_MARE_UNITS.find(u => u.id === state.selectedVistaMare.unitId);
    if (unit) {
      vistaUSD += unit.rateUSD * state.selectedVistaMare.nights;
      if (state.selectedVistaMare.transfer) vistaUSD += 45;
    }
  }

  const subtotal = baseUSD + taxesUSD + vistaUSD;
  const discountUSD = Math.round(subtotal * state.discountRate);
  const totalUSD = Math.max(0, subtotal - discountUSD);
  return { baseUSD, taxesUSD, vistaUSD, discountUSD, totalUSD };
}

function renderOrderSummary(targetId) {
  const el = document.getElementById(targetId);
  const f = state.selectedFlight;
  if (!f || !el) return;
  const t = calculateTotalsUSD();
  const vistaUnit = state.selectedVistaMare ? VISTA_MARE_UNITS.find(u => u.id === state.selectedVistaMare.unitId) : null;

  el.innerHTML = `
    <h3 class="font-extrabold text-slate-900 text-base mb-3">Order Summary</h3>
    <div class="pb-3 border-b border-slate-200 text-xs space-y-1">
      <div class="font-bold text-slate-900 text-sm">${escapeHTML(f.from)} → ${escapeHTML(f.to)} (${escapeHTML(f.flightNo)})</div>
      <div class="text-slate-600">${escapeHTML(f.airline)} • ${escapeHTML(f.cabin)}</div>
      <div class="text-slate-500">Depart ${escapeHTML(f.depTime)} • Arrive ${escapeHTML(f.arrTime)} (${escapeHTML(f.duration)})</div>
    </div>
    <div class="py-3 border-b border-slate-200 text-xs space-y-2">
      <div class="flex justify-between"><span class="text-slate-600">Flight Fare (${state.pax.adults} Adt, ${state.pax.kids} Chd, ${state.pax.infants} Inf)</span><span class="font-bold">${formatMoney(t.baseUSD)}</span></div>
      <div class="flex justify-between"><span class="text-slate-600">Airport Taxes & Carrier Fees</span><span class="font-bold">${formatMoney(t.taxesUSD)}</span></div>
      ${vistaUnit ? `
        <div class="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 space-y-1">
          <div class="font-extrabold">Vista Mare: ${escapeHTML(vistaUnit.name)}</div>
          <div class="flex justify-between">
            <span>${state.selectedVistaMare.nights} nights ${state.selectedVistaMare.transfer ? "+ LCA Transfer ($45)" : ""}</span>
            <span class="font-bold">${t.vistaUSD > 0 ? formatMoney(t.vistaUSD) : "Hotel Rate Direct"}</span>
          </div>
        </div>` : ""}
      ${t.discountUSD > 0 ? `<div class="flex justify-between text-emerald-700 font-bold"><span>Promo Discount</span><span>-${formatMoney(t.discountUSD)}</span></div>` : ""}
    </div>
    <div class="pt-3 flex items-center justify-between">
      <span class="font-extrabold text-slate-900">Total Due (Tranzilla)</span>
      <span class="text-xl font-extrabold text-blue-700">${formatMoney(t.totalUSD)}</span>
    </div>
  `;
}

function goToPaymentStep(e) {
  e.preventDefault();
  const firsts = document.querySelectorAll(".pax-first");
  const lasts = document.querySelectorAll(".pax-last");
  const docs = document.querySelectorAll(".pax-doc");
  state.passengers = [];
  for (let i = 0; i < firsts.length; i++) {
    state.passengers.push({
      firstName: firsts[i].value.trim(),
      lastName: lasts[i].value.trim(),
      doc: docs[i].value.trim().toUpperCase(),
      type: firsts[i].dataset.paxType
    });
  }
  state.contact = {
    email: document.getElementById("contactEmail").value.trim(),
    phone: document.getElementById("contactPhone").value.trim()
  };
  document.getElementById("checkoutTzTerminal").textContent = state.tranzilla.terminal;
  renderOrderSummary("summaryStep3");
  setFlowStep(3);
  document.getElementById("bookingFlowSection").scrollIntoView({ behavior: "smooth" });
}

function flipCard(isBack) {
  document.getElementById("card3D").classList.toggle("flipped", isBack);
}

function formatAndPreviewCardNumber() {
  const input = document.getElementById("cardNumberInput");
  const digits = input.value.replace(/\D/g, "").slice(0, 16);
  const grouped = digits.replace(/(.{4})/g, "$1 ").trim();
  input.value = grouped;

  const brandBadge = document.getElementById("cardBrandBadge");
  if (digits.startsWith("4")) brandBadge.textContent = "VISA";
  else if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) brandBadge.textContent = "MASTERCARD";
  else if (/^3[47]/.test(digits)) brandBadge.textContent = "AMEX";
  else brandBadge.textContent = "CARD";

  document.getElementById("previewCardNumber").textContent = grouped || "•••• •••• •••• ••••";
}

function formatAndPreviewExpiry() {
  const input = document.getElementById("cardExpiryInput");
  let digits = input.value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    digits = digits.slice(0, 2) + "/" + digits.slice(2);
  }
  input.value = digits;
  document.getElementById("previewCardExpiry").textContent = digits || "MM/YY";
}

function updateCardPreview() {
  const holder = document.getElementById("cardHolderInput").value.trim();
  const cvv = document.getElementById("cardCvvInput").value.trim();
  document.getElementById("previewCardHolder").textContent = holder || "FULL NAME";
  document.getElementById("previewCardCvv").textContent = cvv ? "•".repeat(cvv.length) : "•••";
}

function applyPromoCode() {
  const code = document.getElementById("promoCodeInput").value.trim().toUpperCase();
  const msg = document.getElementById("promoStatusMsg");
  if (code === "KTA10") {
    state.discountRate = 0.10;
    msg.className = "text-xs font-bold text-emerald-700";
    msg.textContent = "Promo code KTA10 applied: 10% discount deducted.";
  } else {
    state.discountRate = 0;
    msg.className = "text-xs font-bold text-rose-600";
    msg.textContent = "Invalid promo code. Try KTA10.";
  }
  renderOrderSummary("summaryStep3");
}

// Luhn check for card number validation before Tranzilla dispatch
function passesLuhnCheck(numStr) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = numStr.length - 1; i >= 0; i--) {
    let digit = parseInt(numStr.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Tranzilla Gateway Adapter (Ready for live backend signing endpoint)
async function dispatchToTranzillaGateway(payload) {
  if (state.tranzilla.endpoint) {
    // Real backend integration hook for Tranzilla Direct/Iframe handshake
    const res = await fetch(state.tranzilla.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Tranzilla gateway declined or unreachable.");
    return await res.json();
  }
  // Simulated Tranzilla authorization response when no live backend URL is configured
  await new Promise(r => setTimeout(r, 650));
  return {
    status: "000",
    confirmationCode: secureRandomCode("TZ-", 8),
    terminal: state.tranzilla.terminal
  };
}

async function processTranzillaPayment(e) {
  e.preventDefault();
  const cardNum = document.getElementById("cardNumberInput").value.replace(/\s/g, "");
  if (cardNum.length < 13 || !passesLuhnCheck(cardNum)) {
    alert("Card number failed validation (Luhn check). Please enter a valid card number.");
    return;
  }

  const payBtn = document.getElementById("tranzillaPayBtn");
  payBtn.disabled = true;
  payBtn.textContent = "Authorizing with Tranzilla...";

  try {
    const totals = calculateTotalsUSD();
    const installments = document.getElementById("tranzillaInstallments").value;
    const tzResponse = await dispatchToTranzillaGateway({
      supplier: state.tranzilla.terminal,
      currency: state.currency === "EUR" ? 978 : 840,
      sum: totals.totalUSD,
      cred_type: installments === "1" ? 1 : 8,
      npay: installments,
      last4: cardNum.slice(-4),
      email: state.contact.email
    });

    const pnr = secureRandomCode("KTA", 5);
    const ticketNo = "376-" + Math.floor(1000000000 + (window.crypto.getRandomValues(new Uint32Array(1))[0] % 8999999999));
    const departDate = document.getElementById("searchDepart").value;
    const vistaUnit = state.selectedVistaMare ? VISTA_MARE_UNITS.find(u => u.id === state.selectedVistaMare.unitId) : null;

    // Clear sensitive inputs immediately from DOM memory
    document.getElementById("cardNumberInput").value = "";
    document.getElementById("cardCvvInput").value = "";
    updateCardPreview();

    const booking = {
      pnr,
      ticketNo,
      tranzillaRef: tzResponse.confirmationCode,
      tranzillaTerminal: tzResponse.terminal,
      flight: state.selectedFlight,
      vistaStay: vistaUnit ? {
        unitName: vistaUnit.name,
        nights: state.selectedVistaMare.nights,
        transfer: state.selectedVistaMare.transfer
      } : null,
      departDate,
      passengers: state.passengers,
      contact: state.contact,
      last4: cardNum.slice(-4),
      totalUSD: totals.totalUSD,
      createdAt: new Date().toLocaleString()
    };

    state.bookings.unshift(booking);
    saveBookings();
    updateAdminStats();
    logSecurityEvent(`Tranzilla Tx ${booking.tranzillaRef} approved for PNR ${pnr}`);

    document.getElementById("ticketConfirmationBox").innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-200 pb-4 mb-4">
        <div>
          <span class="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold uppercase">Tranzilla Approved • Ticket Issued</span>
          <h3 class="text-2xl font-extrabold text-slate-900 mt-2">PNR Reference: <span class="text-blue-700 font-mono">${escapeHTML(pnr)}</span></h3>
          <p class="text-xs text-slate-600 mt-0.5">
            E-Ticket: <span class="font-mono font-bold">${escapeHTML(ticketNo)}</span> • Tranzilla Auth: <span class="font-mono font-bold text-teal-700">${escapeHTML(booking.tranzillaRef)}</span> • Card •••• ${escapeHTML(booking.last4)}
          </p>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-500">Total Paid</div>
          <div class="text-2xl font-extrabold text-emerald-700">${formatMoney(booking.totalUSD)}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-5">
        <div class="bg-white rounded-xl p-4 border border-emerald-100">
          <div class="text-xs font-bold text-slate-400 uppercase mb-1">Flight Itinerary</div>
          <div class="font-extrabold text-slate-900">${escapeHTML(booking.flight.from)} → ${escapeHTML(booking.flight.to)} (${escapeHTML(booking.flight.flightNo)})</div>
          <div class="text-xs text-slate-600 mt-1">${escapeHTML(booking.flight.airline)} • Date: ${escapeHTML(booking.departDate)}</div>
          <div class="text-xs text-slate-600">Departure: ${escapeHTML(booking.flight.depTime)} • Arrival: ${escapeHTML(booking.flight.arrTime)} (${escapeHTML(booking.flight.cabin)})</div>
          ${booking.vistaStay ? `
            <div class="mt-3 pt-2.5 border-t border-slate-100 text-xs text-teal-800 font-bold">
              🏨 Vista Mare Cyprus: ${escapeHTML(booking.vistaStay.unitName)} (${booking.vistaStay.nights} nights${booking.vistaStay.transfer ? " + LCA Airport Pick-up" : ""})
            </div>` : ""}
        </div>

        <div class="bg-white rounded-xl p-4 border border-emerald-100">
          <div class="text-xs font-bold text-slate-400 uppercase mb-1">Passengers</div>
          <ul class="space-y-1 text-xs text-slate-700">
            ${booking.passengers.map(p => `<li class="font-semibold">• ${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)} <span class="text-slate-400">(${escapeHTML(p.type)}, Doc: ${escapeHTML(p.doc)})</span></li>`).join("")}
          </ul>
        </div>
      </div>

      <div class="mb-5 bg-white rounded-xl p-4 border border-emerald-200 text-xs text-slate-700">
        <div class="font-extrabold text-slate-900 mb-1.5">Before You Fly — Passenger Checklist</div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>1. Arrive at the airport at least <strong>3 hours</strong> before international departure with a valid passport.</div>
          <div>2. Keep your <strong>PNR (${escapeHTML(pnr)})</strong> and E-Ticket ready for check-in & boarding pass lookup.</div>
          <div>3. Need help? Call <strong>+972 3 510 05 99</strong> or email <strong>service@ktair.net</strong>.</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <button onclick="lookupPNRDirectly('${escapeHTML(pnr)}', '${escapeHTML(booking.passengers[0]?.lastName || "")}')" class="px-5 py-2.5 rounded-xl bg-[#0b1936] hover:bg-slate-800 text-white font-bold text-xs">
          Verify in Find Reservation
        </button>
        <button onclick="resetHome()" class="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs">
          Book Another Flight
        </button>
      </div>
    `;

    setFlowStep(4);
    document.getElementById("bookingFlowSection").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    alert("Tranzilla Error: " + err.message);
  } finally {
    payBtn.disabled = false;
    payBtn.textContent = "Pay via Tranzilla & Issue Ticket";
  }
}

function lookupPNRDirectly(pnr, lastName) {
  switchSearchTab("find");
  document.getElementById("pnrInput").value = pnr;
  document.getElementById("pnrLastNameInput").value = lastName;
  document.getElementById("findReservationBox").scrollIntoView({ behavior: "smooth" });
  renderPNRResult(pnr, lastName);
}

function handleFindReservation(e) {
  e.preventDefault();
  const pnr = document.getElementById("pnrInput").value.trim().toUpperCase();
  const lastName = document.getElementById("pnrLastNameInput").value.trim().toLowerCase();
  renderPNRResult(pnr, lastName);
}

function renderPNRResult(pnr, lastName) {
  const box = document.getElementById("pnrResultBox");
  box.classList.remove("hidden");

  const found = state.bookings.find(b =>
    b.pnr.toUpperCase() === pnr &&
    b.passengers.some(p => p.lastName.toLowerCase() === String(lastName).toLowerCase())
  );

  if (!found) {
    box.innerHTML = `
      <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5">
        <span class="text-base">⚠️</span>
        <span>No active boarding pass found for PNR "${escapeHTML(pnr)}" and last name "${escapeHTML(lastName)}". Please verify your reference and surname.</span>
      </div>`;
    return;
  }

  const paxSummary = found.passengers
    .map(p => `${escapeHTML(p.firstName.toUpperCase())} ${escapeHTML(p.lastName.toUpperCase())}`)
    .join(" • ");
  const docSummary = found.passengers
    .map(p => escapeHTML(p.doc))
    .join(", ");
  const seatHint = found.passengers
    .map((_, i) => `${12 + i}${["A", "C", "D", "F"][i % 4]}`)
    .join(", ");

  // Deterministic decorative barcode bars derived from PNR
  const barcodeBars = Array.from({ length: 44 }, (_, idx) => {
    const code = (pnr.charCodeAt(idx % pnr.length) + idx * 7) % 5;
    const w = code === 0 ? "w-[2px]" : code === 1 ? "w-[3px]" : code === 2 ? "w-[1.5px]" : code === 3 ? "w-[4px]" : "w-[2px]";
    const gap = idx % 3 === 0 ? "mr-[2px]" : "mr-[1.5px]";
    return `<span class="inline-block h-10 ${w} ${gap} bg-slate-900"></span>`;
  }).join("");

  box.innerHTML = `
    <div class="mt-4 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
      <div class="grid grid-cols-1 lg:grid-cols-12">
        <!-- Left Main Boarding Pass Body (8 cols) -->
        <div class="lg:col-span-8 flex flex-col justify-between">
          <!-- Airline Top Strip -->
          <div class="bg-gradient-to-r from-[#0b1936] via-[#133875] to-[#0284c7] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="px-2.5 py-1.5 rounded-xl bg-white/10 backdrop-blur flex items-center border border-white/15">
                <img src="assets/images/logo.png" alt="KTA International" class="h-5 w-auto object-contain drop-shadow-[0_1px_6px_rgba(255,255,255,0.22)]" />
              </div>
              <div>
                <div class="text-xs font-extrabold tracking-widest uppercase text-sky-200">Electronic Flight Ticket & Boarding Pass</div>
                <div class="text-sm font-extrabold">${escapeHTML(found.flight.airline)} • Flight ${escapeHTML(found.flight.flightNo)}</div>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider shadow">
              ✓ Confirmed
            </span>
          </div>

          <!-- Route & Flight Path -->
          <div class="p-6">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Departure</div>
                <div class="text-3xl sm:text-4xl font-extrabold text-[#0b1936] tracking-tight">${escapeHTML(found.flight.from)}</div>
                <div class="text-xs font-bold text-sky-700 mt-0.5">${escapeHTML(found.flight.depTime)} • ${escapeHTML(found.departDate)}</div>
              </div>

              <div class="flex-1 flex flex-col items-center px-2">
                <div class="text-[11px] font-bold text-slate-500 mb-1">
                  ${escapeHTML(found.flight.duration)} • ${found.flight.stops === 0 ? "Non-stop" : escapeHTML(found.flight.stops) + " Stop"}
                </div>
                <div class="w-full flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                  <div class="flex-1 border-b-2 border-dashed border-sky-300 relative"></div>
                  <span class="text-blue-600 text-lg leading-none transform rotate-90">✈</span>
                  <div class="flex-1 border-b-2 border-dashed border-sky-300 relative"></div>
                  <span class="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0"></span>
                </div>
                <div class="text-[10px] font-semibold text-slate-400 mt-1 uppercase">${escapeHTML(found.flight.cabin)} Cabin</div>
              </div>

              <div class="text-right">
                <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Arrival</div>
                <div class="text-3xl sm:text-4xl font-extrabold text-[#0b1936] tracking-tight">${escapeHTML(found.flight.to)}</div>
                <div class="text-xs font-bold text-teal-700 mt-0.5">${escapeHTML(found.flight.arrTime)} • Terminal INTL</div>
              </div>
            </div>

            <!-- Passenger & Ticket Metadata Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-dashed border-slate-200 text-xs">
              <div>
                <div class="text-[10px] font-bold uppercase text-slate-400">Passenger(s)</div>
                <div class="font-extrabold text-slate-900 mt-0.5">${paxSummary}</div>
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase text-slate-400">Seat(s)</div>
                <div class="font-mono font-extrabold text-blue-700 mt-0.5">${escapeHTML(seatHint)}</div>
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase text-slate-400">E-Ticket No.</div>
                <div class="font-mono font-bold text-slate-800 mt-0.5">${escapeHTML(found.ticketNo)}</div>
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase text-slate-400">Passport / ID</div>
                <div class="font-mono font-bold text-slate-800 mt-0.5">${docSummary}</div>
              </div>
            </div>

            ${found.vistaStay ? `
              <div class="mt-4 p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-base">🏨</span>
                  <div>
                    <span class="font-extrabold text-teal-950">Vista Mare Cyprus (Yeni İskele):</span>
                    <span class="font-semibold text-teal-800 ml-1">${escapeHTML(found.vistaStay.unitName)} • ${escapeHTML(found.vistaStay.nights)} Night(s)</span>
                  </div>
                </div>
                ${found.vistaStay.transfer ? `<span class="px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold">LCA Pick-up Included</span>` : ""}
              </div>` : ""}
          </div>
        </div>

        <!-- Right Tear-Off Stub (4 cols) -->
        <div class="lg:col-span-4 bg-slate-50 border-t-2 lg:border-t-0 lg:border-l-2 border-dashed border-slate-300 p-6 flex flex-col justify-between relative">
          <div>
            <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>Booking Ref (PNR)</span>
              <span>Tranzilla Paid</span>
            </div>
            <div class="text-2xl font-mono font-extrabold text-blue-700 tracking-wider">${escapeHTML(found.pnr)}</div>
            <div class="text-[11px] font-mono text-slate-500 mt-0.5">Auth: ${escapeHTML(found.tranzillaRef || "TZ-VERIFIED")}</div>

            <div class="mt-4 space-y-2 text-xs border-t border-slate-200 pt-3">
              <div class="flex justify-between">
                <span class="text-slate-500">Route</span>
                <span class="font-extrabold text-slate-900">${escapeHTML(found.flight.from)} ➔ ${escapeHTML(found.flight.to)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Date</span>
                <span class="font-bold text-slate-800">${escapeHTML(found.departDate)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Fare Paid</span>
                <span class="font-extrabold text-emerald-700">${formatMoney(found.totalUSD)}</span>
              </div>
            </div>
          </div>

          <!-- Download Ticket / Page Button -->
          <div class="mt-4 flex items-center justify-center gap-2">
            <button type="button" onclick="window.print()" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition">
              🖨 Print / Save PDF
            </button>
            <button type="button" onclick="downloadCurrentHTMLFile()" class="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition">
              ⬇ Download HTML
            </button>
          </div>

          <!-- Visual Barcode -->
          <div class="mt-4 pt-4 border-t border-slate-200 text-center">
            <div class="bg-white px-3 py-2.5 rounded-xl border border-slate-200 inline-flex items-center justify-center">
              ${barcodeBars}
            </div>
            <div class="text-[10px] font-mono tracking-widest text-slate-500 mt-1.5">*${escapeHTML(found.pnr)}/${escapeHTML(found.flight.flightNo)}*</div>
          </div>
        </div>
      </div>
    </div>`;
}


function downloadCurrentHTMLFile() {
  const blob = new Blob([document.documentElement.outerHTML], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "index.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
