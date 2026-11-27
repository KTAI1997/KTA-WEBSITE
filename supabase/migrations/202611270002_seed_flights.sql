-- Seed the public flight catalogue (safe to re-run).
insert into public.flights
  (id, flight_no, airline, origin, destination, departure_time, arrival_time, duration, stops, cabin, price_usd, seats)
values
  ('F1','KTA102','Cyprus Airways','TLV','LCA','10:40','11:45','1h 05m',0,'Economy',140,19),
  ('F2','KTA108','Aegean Airlines','TLV','LCA','15:15','16:20','1h 05m',0,'Flex',175,12),
  ('F3','KTA101','Aegean Airlines','TLV','ATH','07:15','09:35','2h 20m',0,'Economy',185,24),
  ('F4','KTA103','Corendon Airlines','TLV','HER','13:20','15:10','1h 50m',0,'Flex',215,14),
  ('F5','KTA104','Aegean Airlines','TLV','SKG','06:30','11:15','4h 45m',1,'Economy',195,11),
  ('F6','KTA105','Cyprus Airways','TLV','PFO','16:00','17:10','1h 10m',0,'Business',340,8),
  ('F7','KTA106','Aegean Airlines','TLV','RHO','09:10','11:05','1h 55m',0,'Economy',205,16)
on conflict (id) do nothing;
