// Reservation requests and staff data stored in Supabase.
// Customers can only create pending requests for themselves (RLS);
// PNRs, tickets and payment status are never set from the browser.

function bookingFromRow(r) {
  const snap = r.flight_snapshot || {};
  const { vistaStay, ...flight } = snap;
  return {
    id: r.id,
    pnr: r.pnr || String(r.id).slice(0, 8).toUpperCase(),
    ticketNo: r.ticket_no || "",
    status: r.status,
    flight,
    vistaStay: vistaStay || null,
    departDate: r.depart_date || "",
    passengers: Array.isArray(r.passenger_data) ? r.passenger_data : [],
    contact: { email: r.contact_email || "", phone: r.contact_phone || "" },
    totalUSD: Number(r.total_usd) || 0,
    createdAt: r.created_at ? new Date(r.created_at).toLocaleString() : ""
  };
}

async function saveBookingRequest() {
  const client = window.ktaSupabase;
  if (!client) throw new Error("Service is temporarily unavailable.");
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData && sessionData.session && sessionData.session.user;
  if (!user) throw new Error("Please log in first.");

  const totals = calculateTotalsUSD();
  const unit = state.selectedVistaMare
    ? VISTA_MARE_UNITS.find(u => u.id === state.selectedVistaMare.unitId)
    : null;
  const snapshot = {
    ...state.selectedFlight,
    vistaStay: unit ? {
      unitName: unit.name,
      nights: state.selectedVistaMare.nights,
      transfer: Boolean(state.selectedVistaMare.transfer)
    } : null
  };
  const departDate = document.getElementById("searchDepart")?.value || null;

  const row = {
    user_id: user.id,
    status: "pending",
    flight_snapshot: snapshot,
    passenger_data: state.passengers,
    contact_email: state.contact.email,
    contact_phone: state.contact.phone || null,
    depart_date: departDate || null,
    total_usd: totals.totalUSD
  };

  const { data, error } = await client.from("bookings").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  return String(data.id).slice(0, 8).toUpperCase();
}

async function loadRemoteBookings() {
  const client = window.ktaSupabase;
  if (!client) return;
  const { data, error } = await client
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Unable to load bookings:", error.message);
    return;
  }
  state.bookings = data.map(bookingFromRow);
}

async function loadAdminUsers() {
  const client = window.ktaSupabase;
  if (!client) return;
  const { data, error } = await client
    .from("profiles")
    .select("id, first_name, last_name, phone, role, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Unable to load users:", error.message);
    return;
  }
  state.users = data.map(p => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    phone: p.phone || "",
    role: p.role
  }));
}

async function refreshStaffData() {
  await Promise.all([loadRemoteBookings(), loadAdminUsers()]);
  updateAdminStats();
  renderAdminUsers();
  renderAdminBookings();
}
