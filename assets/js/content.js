// Destinations grid + info modals

function renderDestinations() {
  const grid = document.getElementById("destinationsGrid");
  grid.innerHTML = DESTINATIONS.map(d => `
    <div class="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-100 flex flex-col justify-between hover:shadow-xl transition">
      <div>
        <div class="h-44 bg-slate-200 relative overflow-hidden">
          <img src="${escapeHTML(d.img)}" alt="${escapeHTML(d.name)}" onerror="this.onerror=null;this.src=FALLBACK_DEST_IMG;" class="w-full h-full object-cover" />
          <span class="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0b1936]/85 text-white text-[11px] font-bold tracking-wider">
            ${escapeHTML(d.title)}
          </span>
        </div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-extrabold text-slate-900">${escapeHTML(d.name)}</h3>
            <span class="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
              From ${formatMoney(d.fromPriceUSD)}
            </span>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">${escapeHTML(d.desc)}</p>
        </div>
      </div>
      <div class="px-5 pb-5">
        <button onclick="quickSelectDestination('${escapeHTML(d.code)}')" class="w-full py-2.5 rounded-xl bg-[#0b1936] hover:bg-blue-700 text-white font-bold text-xs transition">
          Book Now
        </button>
      </div>
    </div>
  `).join("");
}

function openInfoModal(key) {
  const infoMap = {
    about: { title: "About K.T.A", body: "K.T.A (ktair.net) coordinates scheduled and charter flight operations, airline partnerships, and travel services connecting Tel Aviv with top destinations across Greece and Cyprus." },
    operators: { title: "Tour Operators", body: "Dedicated block allocations, group manifests, and charter schedule coordination for partner tour operators." },
    carriers: { title: "Air Carriers", body: "Close operational alignment with regional and international air carriers for reliable slots and seamless passenger service." },
    connect: { title: "Connect With Us", body: "Reach K.T.A operations and customer support at +972 3 510 05 99 or service@ktair.net." },
    terms: { title: "Terms & Conditions", body: "All bookings, fare rules, baggage allowances, amendments, and refund timelines are subject to applicable carrier terms and fare conditions." },
    health: { title: "Travel & Health Information", body: "Passengers are advised to verify current entry, health, and travel documentation requirements for their departure and destination countries prior to travel." }
  };
  const item = infoMap[key] || infoMap.about;
  document.getElementById("infoModalTitle").textContent = item.title;
  document.getElementById("infoModalBody").textContent = item.body;
  document.getElementById("infoModal").classList.remove("hidden");
}
