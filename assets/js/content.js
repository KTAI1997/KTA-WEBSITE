// Destinations grid + info modals

function renderDestinations() {
  const grid = document.getElementById("destinationsGrid");
  grid.innerHTML = DESTINATIONS.map(d => `
    <article class="destination-card group bg-white rounded-3xl overflow-hidden border border-slate-200/80 flex flex-col">
      <div class="destination-card__image relative overflow-hidden">
        <img src="${escapeHTML(d.img)}" alt="${escapeHTML(d.name)}" loading="lazy" onerror="this.onerror=null;this.src=FALLBACK_DEST_IMG;" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div class="destination-card__image-shade absolute inset-0"></div>
        <span class="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/95 text-slate-800 text-[10px] font-extrabold uppercase tracking-wider shadow-lg">
          ${escapeHTML(d.title)}
        </span>
        <div class="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3 text-white">
          <div>
            <div class="text-[10px] font-bold uppercase tracking-[.18em] text-white/75 mb-1">Explore destination</div>
            <h3 class="text-2xl font-extrabold tracking-tight drop-shadow-lg">${escapeHTML(d.name)}</h3>
          </div>
          <span class="shrink-0 rounded-xl bg-white/15 border border-white/25 backdrop-blur-md px-3 py-2 text-[10px] font-extrabold shadow-lg">
            ${escapeHTML(d.code)}
          </span>
        </div>
      </div>
      <div class="destination-card__body p-5 sm:p-6 flex flex-col flex-1">
        <p class="text-sm text-slate-600 leading-relaxed flex-1">${escapeHTML(d.desc)}</p>
        <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Flights from</div>
            <div class="text-xl font-extrabold text-slate-900 tracking-tight">${formatMoney(d.fromPriceUSD)}</div>
            <div class="text-[10px] text-slate-400">per passenger</div>
          </div>
          <button type="button" onclick="quickSelectDestination('${escapeHTML(d.code)}')" class="destination-card__button inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0b1936] hover:bg-blue-700 text-white font-extrabold text-xs shadow-md">
            Explore flights
            <span aria-hidden="true" class="text-base leading-none">→</span>
          </button>
        </div>
      </div>
    </article>
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
