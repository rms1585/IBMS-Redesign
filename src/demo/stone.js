import { usePort, useStoredState } from './PortStore';

// The stone route (Bhomra and Burimari, BO-7; M2 Report 3.4.5): IBMS bills the whole shipment as soon as its lines
// are routed, including the charges each truck is expected to accrue, and the loaded truck leaves the fence only once
// that bill is paid. The empty truck back from the unloading zone is weighed; anything above the prepaid amount goes
// on a top-up bill. The exit lock on the foreign truck lifts only when Customs' release is in and every stone bill,
// top-ups included, is paid. The route stays disabled until NBR and BLPA decide its control, so this is a preview.
const EXPECTED_NIGHTS = 1;

const SEED = {
  id: 'SS-BHO-2026-0031', port: 'Bhomra', manifest: '2026/603/01277', importer: 'Satkhira Stone Traders',
  routedAt: new Date(Date.now() - 30 * 3600000).toISOString(),
  upfront: { paymentId: 'BLPA-BHO-0931-4', paid: false },
  released: false,
  trucks: [
    { plate: 'WB 51 K 2208', declaredKg: 16500, loadedKg: 24300, nights: 2 },
    { plate: 'WB 49 H 7715', declaredKg: 14000, loadedKg: 21900, nights: 0 },
  ],
};

const tonnes = (kg) => Math.ceil(kg / 1000);

export function truckCharges(rates, kg, nights) {
  return [
    { what: `Stone, ${tonnes(kg)} t`, amount: tonnes(kg) * rates.stone.rate },
    { what: 'Entry gate', amount: rates.gateEntry.rate },
    { what: 'Weighbridge, loaded and empty', amount: rates.weighbridge.rate * 2 },
    { what: `Overnight stay, ${nights} night${nights === 1 ? '' : 's'}`, amount: rates.overnight.rate * nights },
  ];
}
export const sum = (lines) => lines.reduce((s, l) => s + l.amount, 0);

export function useStoneShipment() {
  const p = usePort();
  const [ship, setShip] = useStoredState('stoneShipment', SEED);
  const { rates, vat } = p.tariff;
  // The up-front bill: every truck's stone and expected charges, on declared weights and the expected stay.
  const upfrontLines = ship.trucks.flatMap((t) => truckCharges(rates, t.declaredKg, EXPECTED_NIGHTS).map((l) => ({ ...l, truck: t.plate })));
  const upfrontNet = sum(upfrontLines);
  const trucks = ship.trucks.map((t) => {
    const prepaid = sum(truckCharges(rates, t.declaredKg, EXPECTED_NIGHTS));
    const actualLines = t.emptyKg ? truckCharges(rates, t.loadedKg - t.emptyKg, t.nights) : null;
    const topUpNet = actualLines ? Math.max(0, sum(actualLines) - prepaid) : null;
    const topUpPaid = topUpNet === 0 || Boolean(t.topUp?.paid);
    const lock = [
      !ship.upfront.paid && 'the up-front stone bill is unpaid',
      !t.emptyKg && 'the empty truck has not been weighed back',
      t.emptyKg && !t.topUp && topUpNet > 0 && 'the top-up bill has not been raised',
      t.topUp && !t.topUp.paid && 'the top-up bill is unpaid',
      !ship.released && "Customs' release has not arrived through BNSW",
    ].filter(Boolean);
    return { ...t, prepaid, actualLines, topUpNet, topUpPaid, lock };
  });
  const update = (change) => setShip((s) => ({ ...s, ...change }));
  const updateTruck = (plate, change) => setShip((s) => ({ ...s, trucks: s.trucks.map((t) => (t.plate === plate ? { ...t, ...change } : t)) }));
  return {
    ship, trucks, upfrontLines, upfrontNet, vat,
    payUpfront: () => { update({ upfront: { ...ship.upfront, paid: true, paidAt: new Date().toISOString() } }); p.logEvent(`Stone bill ${ship.upfront.paymentId} paid; provider confirmed`, ship.manifest, 'Payment provider'); },
    weighEmpty: (plate, kg) => { updateTruck(plate, { emptyKg: kg }); p.logEvent(`${plate} weighed empty back from the unloading zone: ${kg.toLocaleString('en-US')} kg`, ship.manifest, 'Device'); },
    raiseTopUp: (t) => {
      const paymentId = `BLPA-BHO-${String(940 + ship.trucks.indexOf(ship.trucks.find((x) => x.plate === t.plate))).padStart(4, '0')}-7`;
      updateTruck(t.plate, { topUp: { paymentId, net: t.topUpNet, paid: false } });
      p.logEvent(`Top-up bill ${paymentId} raised for ${t.plate}`, ship.manifest);
      return paymentId;
    },
    payTopUp: (t) => { updateTruck(t.plate, { topUp: { ...t.topUp, paid: true } }); p.logEvent(`Top-up bill ${t.topUp.paymentId} paid; provider confirmed`, ship.manifest, 'Payment provider'); },
    release: () => { update({ released: true }); p.logEvent(`Customs' release for ${ship.manifest} received through BNSW (simulated)`, ship.manifest, 'BNSW'); },
  };
}
