// Destination cards and informational content

function renderDestinations() {
  const grid = document.getElementById("destinationsGrid");
  if (!grid) return;

  grid.innerHTML = DESTINATIONS.map(destination => `
    <article class="destination-card group bg-white rounded-3xl overflow-hidden border border-slate-200/80 flex flex-col">
      <div class="destination-card__image relative overflow-hidden">
        <img src="${escapeHTML(destination.img)}" alt="${escapeHTML(destination.name)}" loading="lazy" onerror="this.onerror=null;this.src=FALLBACK_DEST_IMG;" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div class="destination-card__image-shade absolute inset-0"></div>
        <span class="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/95 text-slate-800 text-[10px] font-extrabold uppercase tracking-wider">
          ${escapeHTML(destination.title)}
        </span>
        <div class="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3 text-white">
          <div>
            <div class="text-[10px] font-bold uppercase tracking-[.18em] text-white/75 mb-1">Your next destination</div>
            <h3 class="text-2xl font-extrabold tracking-tight drop-shadow-lg">${escapeHTML(destination.name)}</h3>
          </div>
          <span class="shrink-0 rounded-xl bg-white/15 border border-white/25 backdrop-blur-md px-3 py-2 text-[10px] font-extrabold shadow-lg">
            ${escapeHTML(destination.code)}
          </span>
        </div>
      </div>
      <div class="destination-card__body p-5 sm:p-6 flex flex-col flex-1">
        <p class="text-sm text-slate-600 leading-relaxed flex-1">${escapeHTML(destination.desc)}</p>
        <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fares from</div>
            <div class="text-xl font-extrabold text-slate-900 tracking-tight">${formatMoney(destination.fromPriceUSD)}</div>
            <div class="text-[10px] text-slate-400">per person</div>
          </div>
          <button type="button" onclick="quickSelectDestination('${escapeHTML(destination.code)}')" class="destination-card__button inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0b1936] hover:bg-blue-700 text-white font-extrabold text-xs shadow-md">
            View Flights
            <span aria-hidden="true" class="text-base leading-none">→</span>
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

function openInfoModal(key) {
  const infoMap = {
    about: {
      title: "About K.T.A International",
      body: "K.T.A International connects travellers and industry partners with flight options, charter coordination, and travel services linking Tel Aviv with destinations across Greece and Cyprus. Our focus is clear information, responsive assistance, and a straightforward travel-planning experience."
    },
    operators: {
      title: "Services for Tour Operators",
      body: "We support travel partners with group travel coordination, charter planning, passenger manifest assistance, and flight capacity enquiries. Contact our team to discuss your requirements and the options available for your programme."
    },
    carriers: {
      title: "Airline & Carrier Partnerships",
      body: "K.T.A works with airline and aviation partners to coordinate scheduled and charter travel options. Routes, schedules, capacity, and operating arrangements are subject to carrier confirmation."
    },
    connect: {
      title: "Contact K.T.A International",
      body: "Our team is available to assist with general enquiries and travel support. Call +972 3 510 05 99 or email service@ktair.net. Please include your booking reference when contacting us about an existing reservation."
    },
    terms: {
      title: "Booking Terms & Conditions",
      body: "All reservations are subject to the applicable airline, supplier, and fare conditions. Baggage allowances, ticket changes, cancellations, refunds, and schedule changes may vary by fare and carrier. Please review the conditions presented for your booking before completing a purchase."
    },
    health: {
      title: "Travel & Health Information",
      body: "Entry rules and travel documentation requirements may change. Before departure, passengers should confirm the latest passport, visa, health, and entry requirements with the relevant official authorities and their airline."
    }
  };
  const item = infoMap[key] || infoMap.about;
  document.getElementById("infoModalTitle").textContent = item.title;
  document.getElementById("infoModalBody").textContent = item.body;
  document.getElementById("infoModal").classList.remove("hidden");
}
