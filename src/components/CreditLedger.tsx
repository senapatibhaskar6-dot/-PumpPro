import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  CreditCard,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Truck,
  Phone,
  Calendar,
  X,
  Printer,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  Building,
} from 'lucide-react';
import {
  CustomerCreditAccount,
  CreditIndentSlip,
  CreditPaymentRecord,
  FuelRate,
  PumpSettings,
  LubricantProduct,
} from '../types';
import { storage, getTodayDateString } from '../services/storage';

interface CreditLedgerProps {
  settings: PumpSettings;
  rates: FuelRate[];
  lubricants: LubricantProduct[];
  customers: CustomerCreditAccount[];
  creditSlips: CreditIndentSlip[];
  creditPayments: CreditPaymentRecord[];
  activeShift: string;
  onRefreshData: () => void;
  onPrintSlip?: (slip: CreditIndentSlip) => void;
}

export const CreditLedger: React.FC<CreditLedgerProps> = ({
  settings,
  rates,
  lubricants,
  customers,
  creditSlips,
  creditPayments,
  activeShift,
  onRefreshData,
  onPrintSlip,
}) => {
  const sym = settings.currencySymbol;
  const [selectedTab, setSelectedTab] = useState<'customers' | 'slips' | 'payments'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddSlipModal, setShowAddSlipModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [slipToPrint, setSlipToPrint] = useState<CreditIndentSlip | null>(null);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustFleet, setNewCustFleet] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustVehicles, setNewCustVehicles] = useState('');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState(150000);
  const [newCustNotes, setNewCustNotes] = useState('');

  // New Credit Slip Form State
  const [slipCustomer, setSlipCustomer] = useState(customers[0]?.id || '');
  const [slipVehicle, setSlipVehicle] = useState('');
  const [slipDriver, setSlipDriver] = useState('');
  const [slipItemType, setSlipItemType] = useState<'Fuel' | 'Lubricant'>('Fuel');
  const [slipFuelType, setSlipFuelType] = useState<'petrol' | 'diesel' | 'premium_petrol'>('diesel');
  const [slipLubeId, setSlipLubeId] = useState(lubricants[0]?.id || '');
  const [slipQty, setSlipQty] = useState(100);
  const [slipIndentNo, setSlipIndentNo] = useState(`IND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [slipAuthBy, setSlipAuthBy] = useState('Shift Manager Ramesh');

  // Receive Payment Form State
  const [payCustomer, setPayCustomer] = useState(customers[0]?.id || '');
  const [payAmount, setPayAmount] = useState(25000);
  const [payMode, setPayMode] = useState<'Cash' | 'NEFT/Bank Transfer' | 'UPI' | 'Cheque'>('NEFT/Bank Transfer');
  const [payRefNo, setPayRefNo] = useState('');
  const [payBank, setPayBank] = useState('');
  const [payNotes, setPayNotes] = useState('Settlement towards outstanding fuel account');

  // Summary Metrics
  const summary = useMemo(() => {
    const totalOutstanding = customers.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalCreditLimit = customers.reduce((sum, c) => sum + c.creditLimit, 0);
    const unpaidSlips = creditSlips.filter((s) => !s.isPaid);
    const totalUnpaidAmount = unpaidSlips.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalReceivedPayments = creditPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalOutstanding,
      totalCreditLimit,
      unpaidSlipsCount: unpaidSlips.length,
      totalUnpaidAmount,
      totalReceivedPayments,
    };
  }, [customers, creditSlips, creditPayments]);

  // Selected customer for modal
  const activeCustomerObj = useMemo(() => {
    return customers.find((c) => c.id === (selectedCustomerId || payCustomer || slipCustomer));
  }, [customers, selectedCustomerId, payCustomer, slipCustomer]);

  // Handle Add Customer
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const newCust: CustomerCreditAccount = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      companyOrFleetName: newCustFleet || newCustName,
      phone: newCustPhone,
      vehicleNumbers: newCustVehicles.split(',').map((v) => v.trim()).filter(Boolean),
      creditLimit: Number(newCustCreditLimit),
      currentBalance: 0,
      status: 'Active',
      notes: newCustNotes,
    };

    storage.addOrUpdateCustomer(newCust);
    onRefreshData();
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustFleet('');
    setNewCustPhone('');
    setNewCustVehicles('');
  };

  // Handle Issue Credit Slip
  const handleAddSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === slipCustomer);
    if (!cust) return;

    let rate = 0;
    let lubeName = '';

    if (slipItemType === 'Fuel') {
      const rateObj = rates.find((r) => r.type === slipFuelType);
      rate = rateObj?.ratePerLiter || 92.80;
    } else {
      const lube = lubricants.find((l) => l.id === slipLubeId);
      rate = lube?.sellingPrice || 500;
      lubeName = lube ? `${lube.name} (${lube.packSize})` : 'Lubricant';
    }

    const totalAmount = slipQty * rate;

    const newSlip: CreditIndentSlip = {
      id: `slip-${Date.now()}`,
      slipNumber: slipIndentNo,
      date: getTodayDateString(),
      customerId: cust.id,
      customerName: cust.companyOrFleetName || cust.name,
      vehicleNumber: slipVehicle.toUpperCase() || 'MH-12-REGULAR',
      driverName: slipDriver || 'Assigned Driver',
      itemType: slipItemType,
      fuelType: slipItemType === 'Fuel' ? slipFuelType : undefined,
      lubeProductId: slipItemType === 'Lubricant' ? slipLubeId : undefined,
      lubeProductName: slipItemType === 'Lubricant' ? lubeName : undefined,
      quantity: Number(slipQty),
      rate,
      totalAmount,
      isPaid: false,
      shift: activeShift,
      authorizedBy: slipAuthBy,
      timestamp: Date.now(),
    };

    storage.addCreditSlip(newSlip);
    onRefreshData();
    setShowAddSlipModal(false);
    setSlipIndentNo(`IND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Handle Receive Payment
  const handleReceivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === payCustomer);
    if (!cust) return;

    const newPayment: CreditPaymentRecord = {
      id: `pay-${Date.now()}`,
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: getTodayDateString(),
      customerId: cust.id,
      customerName: cust.companyOrFleetName || cust.name,
      amount: Number(payAmount),
      paymentMode: payMode,
      referenceNo: payRefNo || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      bankName: payBank,
      notes: payNotes,
      timestamp: Date.now(),
    };

    storage.addCreditPayment(newPayment);
    onRefreshData();
    setShowPaymentModal(false);
  };

  // Quick Settle Slip
  const handleToggleSlipStatus = (slip: CreditIndentSlip) => {
    const slips = storage.getCreditSlips().map((s) => {
      if (s.id === slip.id) {
        return { ...s, isPaid: !s.isPaid, settledAt: !s.isPaid ? getTodayDateString() : undefined };
      }
      return s;
    });
    storage.saveCreditSlips(slips);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              Fleet & Credit Due Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Transporter accounts, vehicle indent slips, credit authorizations, and bank receipt reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddSlipModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Credit Slip / Indent</span>
          </button>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs px-4 py-2.5 rounded-xl transition active:scale-95 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>Receive Payment</span>
          </button>

          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition active:scale-95 cursor-pointer"
          >
            <Building className="w-4 h-4 text-sky-400" />
            <span>New Account</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Outstanding Balance
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              {sym}{summary.totalOutstanding.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Across {customers.length} Fleet Accounts
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Approved Credit Limits
            </span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {sym}{summary.totalCreditLimit.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Utilization: {Math.round((summary.totalOutstanding / (summary.totalCreditLimit || 1)) * 100)}%
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Unsettled Credit Slips
            </span>
            <div className="text-2xl font-black text-orange-400 font-mono mt-0.5">
              {summary.unpaidSlipsCount} Slips
            </div>
            <span className="text-[10px] text-orange-400/80 block mt-0.5">
              Total: {sym}{summary.totalUnpaidAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Payments Collected
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {sym}{summary.totalReceivedPayments.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">
              {creditPayments.length} Settled receipts
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Selector: Accounts | Slips | Receipts */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar flex-nowrap shrink-0">
        <button
          onClick={() => setSelectedTab('customers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            selectedTab === 'customers'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Fleet Customer Directory ({customers.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab('slips')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            selectedTab === 'slips'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Vehicle Credit Indent Slips ({creditSlips.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            selectedTab === 'payments'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>Payment Receipts Ledger ({creditPayments.length})</span>
        </button>
      </div>

      {/* TAB 1: FLEET CUSTOMER DIRECTORY */}
      {selectedTab === 'customers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((cust) => {
              const utilPercent = Math.min(100, Math.round((cust.currentBalance / cust.creditLimit) * 100));
              const isOverLimit = cust.currentBalance > cust.creditLimit;

              return (
                <div
                  key={cust.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {cust.status}
                      </span>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-orange-400" />
                        <span>{cust.phone}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white mt-2 group-hover:text-orange-400 transition">
                      {cust.companyOrFleetName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Contact: <strong className="text-slate-200">{cust.name}</strong>
                    </p>

                    {/* Authorized Vehicles Chips */}
                    <div className="mt-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Authorized Fleet Vehicles ({cust.vehicleNumbers.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cust.vehicleNumbers.slice(0, 4).map((veh) => (
                          <span
                            key={veh}
                            className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300 font-semibold"
                          >
                            {veh}
                          </span>
                        ))}
                        {cust.vehicleNumbers.length > 4 && (
                          <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] text-slate-400 rounded">
                            +{cust.vehicleNumbers.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Balance & Limit Progress */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Current Outstanding Due:</span>
                        <span
                          className={`font-mono font-black ${
                            isOverLimit ? 'text-red-400' : 'text-amber-400'
                          }`}
                        >
                          {sym}{cust.currentBalance.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOverLimit ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${utilPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Limit: {sym}{cust.creditLimit.toLocaleString('en-IN')}</span>
                        <span className="font-mono">{utilPercent}% used</span>
                      </div>
                    </div>

                    {cust.notes && (
                      <p className="text-[11px] text-slate-400 mt-2.5 italic line-clamp-1">
                        "{cust.notes}"
                      </p>
                    )}
                  </div>

                  {/* Customer Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setSlipCustomer(cust.id);
                        if (cust.vehicleNumbers.length > 0) setSlipVehicle(cust.vehicleNumbers[0]);
                        setShowAddSlipModal(true);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Issue Slip</span>
                    </button>

                    <button
                      onClick={() => {
                        setPayCustomer(cust.id);
                        setPayAmount(cust.currentBalance);
                        setShowPaymentModal(true);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Collect</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CREDIT SLIPS REGISTER */}
      {selectedTab === 'slips' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Credit / Indent Slip Registry
            </span>
            <span className="text-xs text-slate-400">
              Total {creditSlips.length} Slips Recorded
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar rounded-xl border border-slate-800 -mx-1 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[680px]">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Slip #</th>
                  <th className="py-3 px-3">Date & Shift</th>
                  <th className="py-3 px-3">Fleet Customer</th>
                  <th className="py-3 px-3">Vehicle & Driver</th>
                  <th className="py-3 px-3">Item / Fuel</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {creditSlips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-850/60 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">
                      {slip.slipNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      <div>{slip.date}</div>
                      <div className="text-[10px] text-slate-400">{slip.shift}</div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {slip.customerName}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-orange-400">
                        {slip.vehicleNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">Dr: {slip.driverName}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-200">
                        {slip.itemType === 'Fuel'
                          ? slip.fuelType?.toUpperCase()
                          : slip.lubeProductName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-300">
                      {slip.quantity} {slip.itemType === 'Fuel' ? 'L' : 'Pcs'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-white text-sm">
                      {sym}{slip.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleSlipStatus(slip)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          slip.isPaid
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        }`}
                      >
                        {slip.isPaid ? 'Settled' : 'Unpaid Due'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          if (onPrintSlip) onPrintSlip(slip);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition"
                        title="Print Thermal Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT RECEIPTS LEDGER */}
      {selectedTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Due Settlement / Payment Receipts
            </span>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              + Record New Receipt
            </button>
          </div>

          <div className="overflow-x-auto no-scrollbar rounded-xl border border-slate-800 -mx-1 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Receipt #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer Account</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th className="py-3 px-3">Bank / UTR Ref</th>
                  <th className="py-3 px-3 text-right">Amount Received</th>
                  <th className="py-3 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {creditPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850/60 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      {p.receiptNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{p.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {p.customerName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-200">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {p.referenceNo || 'Cash Receipt'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-400 text-sm">
                      {sym}{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 italic text-[11px]">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Credit Slip / Indent */}
      {showAddSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-bold text-white">Generate Fleet Credit Indent Slip</h2>
              </div>
              <button
                onClick={() => setShowAddSlipModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSlip} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Customer Fleet Account</label>
                <select
                  required
                  value={slipCustomer}
                  onChange={(e) => {
                    setSlipCustomer(e.target.value);
                    const c = customers.find((cust) => cust.id === e.target.value);
                    if (c && c.vehicleNumbers.length > 0) {
                      setSlipVehicle(c.vehicleNumbers[0]);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyOrFleetName} (Due: {sym}{c.currentBalance} / Limit: {sym}{c.creditLimit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Vehicle Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-12-RN-4401"
                    value={slipVehicle}
                    onChange={(e) => setSlipVehicle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono font-bold outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Driver Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Driver / Attendant"
                    value={slipDriver}
                    onChange={(e) => setSlipDriver(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>
              </div>

              {/* Item Type: Fuel or Lubricant */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Item Issued</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSlipItemType('Fuel')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      slipItemType === 'Fuel'
                        ? 'bg-orange-500 text-white border-orange-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Fuel (HSD Diesel / MS Petrol)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlipItemType('Lubricant')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      slipItemType === 'Lubricant'
                        ? 'bg-orange-500 text-white border-orange-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Lubricant / Oil / DEF
                  </button>
                </div>
              </div>

              {slipItemType === 'Fuel' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Fuel Grade</label>
                    <select
                      value={slipFuelType}
                      onChange={(e) => setSlipFuelType(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                    >
                      <option value="diesel">Diesel (HSD) - {sym}{rates.find(r=>r.type==='diesel')?.ratePerLiter}/L</option>
                      <option value="petrol">Petrol (MS) - {sym}{rates.find(r=>r.type==='petrol')?.ratePerLiter}/L</option>
                      <option value="premium_petrol">XP95 Premium - {sym}{rates.find(r=>r.type==='premium_petrol')?.ratePerLiter}/L</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Quantity (Liters)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={slipQty}
                      onChange={(e) => setSlipQty(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Select Lubricant</label>
                    <select
                      value={slipLubeId}
                      onChange={(e) => setSlipLubeId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                    >
                      {lubricants.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.packSize}) - {sym}{l.sellingPrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Quantity (Units)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={slipQty}
                      onChange={(e) => setSlipQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Indent / Slip Number</label>
                  <input
                    type="text"
                    required
                    value={slipIndentNo}
                    onChange={(e) => setSlipIndentNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Authorized By (Pump Sign)</label>
                  <input
                    type="text"
                    value={slipAuthBy}
                    onChange={(e) => setSlipAuthBy(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-slate-800 rounded-xl flex items-center justify-between border border-slate-700">
                <span className="text-xs text-slate-400">Total Indent Amount:</span>
                <span className="text-lg font-black font-mono text-orange-400">
                  {sym}
                  {(
                    slipQty *
                    (slipItemType === 'Fuel'
                      ? rates.find((r) => r.type === slipFuelType)?.ratePerLiter || 92.8
                      : lubricants.find((l) => l.id === slipLubeId)?.sellingPrice || 500)
                  ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
              >
                Save & Issue Indent Slip
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Receive Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Receive Due Payment</h2>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceivePayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Customer Account</label>
                <select
                  required
                  value={payCustomer}
                  onChange={(e) => {
                    setPayCustomer(e.target.value);
                    const c = customers.find((cust) => cust.id === e.target.value);
                    if (c) setPayAmount(c.currentBalance);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyOrFleetName} (Outstanding: {sym}{c.currentBalance})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Amount Received ({sym})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-base outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                >
                  <option value="NEFT/Bank Transfer">NEFT / RTGS / Bank Transfer</option>
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="Cheque">Bank Cheque / DD</option>
                  <option value="Cash">Physical Counter Cash</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Bank / Reference / UTR No.</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC261003449912 or Cheque #8812"
                  value={payRefNo}
                  onChange={(e) => setPayRefNo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Notes / Remarks</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                Confirm Payment & Update Balance
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Customer Account */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Create New Fleet Account</h2>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Company / Fleet Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navkar Roadways & Logistics"
                  value={newCustFleet}
                  onChange={(e) => setNewCustFleet(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Shah"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Mobile Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98..."
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Authorized Vehicle Numbers (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="MH-12-RN-1122, MH-12-RN-1123, MH-14-AA-9900"
                  value={newCustVehicles}
                  onChange={(e) => setNewCustVehicles(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Credit Limit ({sym})</label>
                <input
                  type="number"
                  required
                  value={newCustCreditLimit}
                  onChange={(e) => setNewCustCreditLimit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Payment Terms / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. 15-day settlement cycle, indent required"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
              >
                Create Fleet Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
