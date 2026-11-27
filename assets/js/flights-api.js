// Flight catalogue stored in Supabase (public read, staff-only write via RLS).
// If Supabase is unreachable or the table is empty, the built-in DEFAULT_FLIGHTS are shown.

function flightFromRow(r) {
  return {
    id: r.id,
    flightNo: r.flight_no,
    airline: r.airline,
    from: r.origin,
    to: r.destination,
    depTime: r.departure_time || "",
    arrTime: r.arrival_time || "",
    duration: r.duration || "",
    stops: r.stops,
    cabin: r.cabin || "Economy",
    priceUSD: Number(r.price_usd),
    seats: r.seats
  };
}

function flightToRow(f) {
  return {
    id: f.id,
    flight_no: f.flightNo,
    airline: f.airline,
    origin: f.from,
    destination: f.to,
    departure_time: f.depTime,
    arrival_time: f.arrTime,
    duration: f.duration,
    stops: f.stops,
    cabin: f.cabin,
    price_usd: f.priceUSD,
    seats: f.seats,
    is_active: true
  };
}

async function loadRemoteFlights() {
  if (!window.ktaSupabase) return false;
  const { data, error } = await window.ktaSupabase
    .from("flights")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Unable to load flights:", error.message);
    return false;
  }
  if (!data || !data.length) return false;
  state.flights = data.map(flightFromRow);
  return true;
}

async function saveRemoteFlights(flights) {
  if (!window.ktaSupabase) throw new Error("Supabase is not connected.");
  const { error } = await window.ktaSupabase
    .from("flights")
    .upsert(flights.map(flightToRow), { onConflict: "id" });
  if (error) throw new Error(error.message);
}

async function refreshFlights() {
  const ok = await loadRemoteFlights();
  if (ok) {
    renderDestinations();
    renderVistaMareCards();
    renderFlightResults();
    updateAdminStats();
  }
}
