// Admin console: flights Excel import, users, PNR list

function switchAdminTab(tab) {
  const panes = ["excel", "tranzilla", "users", "bookings"];
  panes.forEach(p => {
    const cap = p.charAt(0).toUpperCase() + p.slice(1);
    document.getElementById("adminPane" + cap).classList.toggle("hidden", p !== tab);
    document.getElementById("adminTab" + cap).className = p === tab
      ? "px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 transition"
      : "px-3.5 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition";
  });
  if (tab === "users") renderAdminUsers();
  if (tab === "bookings") renderAdminBookings();
}

function updateAdminStats() {
  document.getElementById("adminFlightCount").textContent = state.flights.length;
  document.getElementById("catalogTotalLabel").textContent = state.flights.length;
  document.getElementById("adminUserCount").textContent = state.users.length;
  const totalRevUSD = state.bookings.reduce((sum, b) => sum + (b.totalUSD || 0), 0);
  document.getElementById("adminRevenueTotal").textContent = formatMoney(totalRevUSD);
  document.getElementById("adminTranzillaStatus").textContent = state.tranzilla.terminal;
  renderAdminFlightsTable();
}

function renderAdminFlightsTable() {
  const tbody = document.getElementById("adminFlightsTableBody");
  tbody.innerHTML = state.flights.map(f => `
    <tr>
      <td class="py-2 px-3 font-mono font-bold text-sky-300">${escapeHTML(f.flightNo)}</td>
      <td class="py-2 px-3">${escapeHTML(f.airline)}</td>
      <td class="py-2 px-3 font-bold">${escapeHTML(f.from)} → ${escapeHTML(f.to)}</td>
      <td class="py-2 px-3">${escapeHTML(f.depTime)} - ${escapeHTML(f.arrTime)} (${escapeHTML(f.duration)})</td>
      <td class="py-2 px-3">${f.stops === 0 ? "Direct" : escapeHTML(f.stops) + " Stop"}</td>
      <td class="py-2 px-3">${escapeHTML(f.cabin)}</td>
      <td class="py-2 px-3 font-bold">$${escapeHTML(f.priceUSD)}</td>
      <td class="py-2 px-3">${escapeHTML(f.seats)}</td>
    </tr>
  `).join("");
}

function downloadSampleExcel() {
  const sampleRows = [
    { FlightNo: "KTA201", Airline: "Aegean Airlines", From: "TLV", To: "LCA", DepTime: "08:00", ArrTime: "09:05", Duration: "1h 05m", Stops: 0, Cabin: "Economy", PriceUSD: 145, Seats: 28 },
    { FlightNo: "KTA202", Airline: "Cyprus Airways", From: "TLV", To: "ATH", DepTime: "14:15", ArrTime: "16:35", Duration: "2h 20m", Stops: 0, Cabin: "Flex", PriceUSD: 195, Seats: 15 },
    { FlightNo: "KTA203", Airline: "Aegean Airlines", From: "TLV", To: "SKG", DepTime: "11:00", ArrTime: "15:30", Duration: "4h 30m", Stops: 1, Cabin: "Business", PriceUSD: 390, Seats: 6 }
  ];
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Flights");
  XLSX.writeFile(wb, "KTA_Flights_Template.xlsx");
}

function handleExcelFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!rows.length) {
        showUploadFeedback("The selected file has no flight rows.", false);
        return;
      }

      const imported = rows
        .filter(r => r.From && r.To)
        .map((r, idx) => ({
          id: secureRandomCode("EX_", 6) + "_" + idx,
          flightNo: String(r.FlightNo || ("KTA" + (300 + idx))).trim(),
          airline: String(r.Airline || "K.T.A Partner").trim(),
          from: String(r.From).trim().toUpperCase(),
          to: String(r.To).trim().toUpperCase(),
          depTime: String(r.DepTime || "09:00").trim(),
          arrTime: String(r.ArrTime || "11:30").trim(),
          duration: String(r.Duration || "2h 30m").trim(),
          stops: Math.max(0, Number(r.Stops || 0) || 0),
          cabin: String(r.Cabin || "Economy").trim(),
          priceUSD: Math.max(1, Number(r.PriceUSD || 199) || 199),
          seats: Math.max(1, Number(r.Seats || 20) || 20)
        }));

      if (!imported.length) {
        showUploadFeedback("Please ensure your Excel sheet includes 'From' and 'To' airport codes.", false);
        return;
      }

      saveRemoteFlights(imported).then(() => {
        state.flights = [...imported, ...state.flights];
        updateAdminStats();
        renderFlightResults();
        logSecurityEvent(`Excel import: ${imported.length} flight(s) saved to database`);
        showUploadFeedback(`Successfully saved ${imported.length} flight(s) to the database.`, true);
      }).catch(err => {
        showUploadFeedback("Could not save flights (are you logged in as admin/agent?): " + err.message, false);
      });
    } catch (err) {
      showUploadFeedback("Error reading Excel/CSV file: " + err.message, false);
    }
  };
  reader.readAsArrayBuffer(file);
  event.target.value = "";
}

function showUploadFeedback(msg, ok) {
  const el = document.getElementById("uploadFeedback");
  el.classList.remove("hidden");
  el.className = ok
    ? "mt-4 p-3.5 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
    : "mt-4 p-3.5 rounded-xl text-sm font-semibold bg-rose-500/20 text-rose-200 border border-rose-400/30";
  el.textContent = msg;
}

function addUserFromAdmin(e) {
  e.preventDefault();
  const email = document.getElementById("newUserEmail").value.trim();
  if (state.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    alert("User with this email already exists.");
    return;
  }
  state.users.push({
    firstName: document.getElementById("newUserFirst").value.trim(),
    lastName: document.getElementById("newUserLast").value.trim(),
    email,
    password: document.getElementById("newUserPass").value,
    role: document.getElementById("newUserRole").value,
    phone: "+972500000000"
  });
  saveUsers();
  updateAdminStats();
  renderAdminUsers();
  logSecurityEvent(`Admin added user: ${email}`);
  e.target.reset();
}

function deleteUserByEmail(email) {
  if (email.toLowerCase() === "sami@ktair.net") {
    alert("Primary admin account Sami cannot be deleted.");
    return;
  }
  state.users = state.users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
  saveUsers();
  updateAdminStats();
  renderAdminUsers();
  logSecurityEvent(`Admin removed user: ${email}`);
}

function renderAdminUsers() {
  const box = document.getElementById("adminUsersList");
  box.innerHTML = state.users.map(u => `
    <div class="flex items-center justify-between bg-slate-800/80 px-4 py-2.5 rounded-xl border border-white/10 text-xs">
      <div>
        <span class="font-bold text-white">${escapeHTML(u.firstName)} ${escapeHTML(u.lastName)}</span>
        <span class="text-slate-400 ml-2">${escapeHTML(u.email)}</span>
        <span class="ml-2 px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold uppercase">${escapeHTML(u.role)}</span>
      </div>
      ${u.email.toLowerCase() !== "sami@ktair.net"
        ? `<button onclick="deleteUserByEmail('${escapeHTML(u.email)}')" class="text-rose-400 hover:text-rose-300 font-bold">Remove</button>`
        : `<span class="text-amber-300 font-bold">Primary Admin</span>`}
    </div>
  `).join("");
}

function getFilteredAdminBookings() {
  const q = (document.getElementById("adminPnrSearchInput")?.value || "").trim().toLowerCase();
  const stayFilter = document.getElementById("adminPnrStayFilter")?.value || "ALL";

  return state.bookings.filter(b => {
    if (stayFilter === "WITH_STAY" && !b.vistaStay) return false;
    if (stayFilter === "FLIGHT_ONLY" && b.vistaStay) return false;
    if (!q) return true;

    const paxText = (b.passengers || []).map(p => `${p.firstName || ""} ${p.lastName || ""} ${p.doc || ""}`).join(" ");
    const hay = `${b.pnr || ""} ${b.ticketNo || ""} ${b.tranzillaRef || ""} ${paxText} ${b.flight?.from || ""} ${b.flight?.to || ""} ${b.flight?.flightNo || ""}`.toLowerCase();
    return hay.includes(q);
  });
}

function openPnrFromAdmin(pnr, lastName) {
  lookupPNRDirectly(pnr, lastName);
}

function exportPnrsCSV() {
  const rows = getFilteredAdminBookings();
  if (!rows.length) {
    alert("No PNR records to export.");
    return;
  }
  const headers = ["PNR", "TicketNo", "TranzillaRef", "Passengers", "From", "To", "FlightNo", "DepartDate", "VistaMare", "TotalUSD", "CreatedAt"];
  const csvLines = [
    headers.join(","),
    ...rows.map(b => {
      const pax = (b.passengers || []).map(p => `${p.firstName} ${p.lastName} (${p.type})`).join(" / ");
      const stay = b.vistaStay ? `${b.vistaStay.unitName} (${b.vistaStay.nights}n)` : "None";
      const vals = [
        b.pnr || "",
        b.ticketNo || "",
        b.tranzillaRef || "",
        pax,
        b.flight?.from || "",
        b.flight?.to || "",
        b.flight?.flightNo || "",
        b.departDate || "",
        stay,
        b.totalUSD ?? 0,
        b.createdAt || ""
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
      return vals.join(",");
    })
  ];

  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kta-pnr-list-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderAdminBookings() {
  const tbody = document.getElementById("adminBookingsList");
  const summaryBar = document.getElementById("adminPnrSummaryBar");
  if (!tbody) return;

  const filtered = getFilteredAdminBookings();
  const totalFilteredUSD = filtered.reduce((acc, item) => acc + (item.totalUSD || 0), 0);

  if (summaryBar) {
    summaryBar.innerHTML = `
      <span>Total PNRs: <strong class="text-white">${state.bookings.length}</strong></span>
      <span>•</span>
      <span>Showing: <strong class="text-amber-300">${filtered.length}</strong></span>
      <span>•</span>
      <span>Filtered Volume: <strong class="text-emerald-400">${formatMoney(totalFilteredUSD)}</strong></span>
    `;
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 px-4 text-center text-slate-400 text-xs">
          ${state.bookings.length ? "No PNRs match your filter." : "No PNR bookings issued yet."}
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const paxNames = (b.passengers || [])
      .map(p => `${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}`)
      .join(", ") || "-";
    const firstLastName = (b.passengers && b.passengers[0] && b.passengers[0].lastName) || "";
    return `
      <tr class="hover:bg-white/5 transition">
        <td class="py-3 px-3 font-mono font-extrabold text-amber-300 whitespace-nowrap">${escapeHTML(b.pnr)}</td>
        <td class="py-3 px-3 font-semibold text-white">${paxNames}</td>
        <td class="py-3 px-3 whitespace-nowrap">
          <span class="font-bold text-sky-300">${escapeHTML(b.flight?.from || "")} → ${escapeHTML(b.flight?.to || "")}</span>
          <span class="text-slate-400 ml-1">(${escapeHTML(b.flight?.flightNo || "")})</span>
          ${b.vistaStay ? `<div class="text-[11px] text-teal-300 mt-0.5">+ ${escapeHTML(b.vistaStay.unitName)} (${escapeHTML(b.vistaStay.nights)}n)</div>` : ""}
        </td>
        <td class="py-3 px-3 whitespace-nowrap text-slate-300">
          <div>${escapeHTML(b.departDate || "-")}</div>
          <div class="text-[11px] text-slate-400">${escapeHTML(b.createdAt || "")}</div>
        </td>
        <td class="py-3 px-3 whitespace-nowrap">
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">Confirmed</span>
          <div class="text-[11px] font-mono text-teal-300 mt-0.5">${escapeHTML(b.tranzillaRef || "TZ")}</div>
        </td>
        <td class="py-3 px-3 font-extrabold text-emerald-400 whitespace-nowrap">${formatMoney(b.totalUSD || 0)}</td>
        <td class="py-3 px-3 text-right whitespace-nowrap">
          <button
            type="button"
            onclick="openPnrFromAdmin('${escapeHTML(b.pnr)}', '${escapeHTML(firstLastName)}')"
            class="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 font-bold text-[11px] transition"
          >
            Boarding Pass
          </button>
        </td>
      </tr>
    `;
  }).join("");
}
