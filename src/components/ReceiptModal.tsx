import React from 'react';
import { PumpProLogo } from './PumpProLogo';
import { PumpSettings, CreditIndentSlip, NozzleReading, Nozzle } from '../types';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  settings: PumpSettings;
  slip?: CreditIndentSlip | null;
  reading?: { reading: NozzleReading; nozzle: Nozzle } | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  settings,
  slip,
  reading,
  onClose,
}) => {
  const sym = settings.currencySymbol;

  const handlePrint = () => {
    window.print();
  };

  if (!slip && !reading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Thermal Slip Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* THERMAL SLIP BODY (80mm styling) */}
        <div className="bg-white text-black p-5 rounded-2xl font-mono text-[11px] space-y-3.5 shadow-inner border border-slate-200">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-center mb-1">
              <PumpProLogo size="sm" theme="light" />
            </div>
            <div className="font-extrabold text-sm uppercase tracking-tight">
              {settings.pumpName}
            </div>
            <div className="text-[10px] text-slate-600">
              {settings.dealerBrand} Retail Outlet • RO: {settings.dealerCode}
            </div>
            <div className="text-[10px] text-slate-600">GSTIN: {settings.gstNumber}</div>
            <div className="text-[9px] text-slate-500">{settings.address}</div>
          </div>

          {/* Slip Metadata */}
          {slip && (
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between font-bold text-xs">
                <span>CREDIT INDENT SLIP</span>
                <span>#{slip.slipNumber}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Date: {slip.date}</span>
                <span>Shift: {slip.shift}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Customer:</span>
                <span className="font-bold">{slip.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Vehicle No:</span>
                <span className="font-bold">{slip.vehicleNumber}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Driver:</span>
                <span>{slip.driverName}</span>
              </div>
            </div>
          )}

          {reading && (
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between font-bold text-xs">
                <span>NOZZLE SALE MEMO</span>
                <span>{reading.nozzle.name}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Date: {reading.reading.date}</span>
                <span>{reading.reading.shift}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Opening: {reading.reading.openingReading.toFixed(2)}</span>
                <span>Closing: {reading.reading.closingReading.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Attendant:</span>
                <span className="font-bold">{reading.reading.recordedBy}</span>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between font-bold uppercase text-[10px] text-slate-600">
              <span>Item / Description</span>
              <span>Rate</span>
              <span>Amount</span>
            </div>

            {slip && (
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>
                    {slip.itemType === 'Fuel'
                      ? `${slip.fuelType?.toUpperCase()} (${slip.quantity} L)`
                      : `${slip.lubeProductName} x ${slip.quantity}`}
                  </span>
                  <span>{sym}{slip.rate.toFixed(2)}</span>
                  <span>{sym}{slip.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {reading && (
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>
                    {reading.nozzle.fuelType.toUpperCase()} ({reading.reading.netSaleQty.toFixed(2)} L)
                  </span>
                  <span>{sym}{reading.reading.rate.toFixed(2)}</span>
                  <span>{sym}{reading.reading.totalAmount.toFixed(2)}</span>
                </div>
                {reading.reading.testingQty > 0 && (
                  <div className="text-[10px] text-slate-500 italic">
                    Testing deducted: {reading.reading.testingQty} Liters
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center font-black text-sm pt-1">
            <span>TOTAL AMOUNT:</span>
            <span>
              {sym}
              {slip
                ? slip.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                : reading?.reading.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[9px] text-slate-600 border-t border-dashed border-slate-300">
            <div>
              <div className="h-6 border-b border-dotted border-slate-400 mb-1" />
              <span>Customer / Driver Sign</span>
            </div>
            <div>
              <div className="h-6 border-b border-dotted border-slate-400 mb-1" />
              <span>Attendant / Pump Sign</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[8px] text-slate-500 pt-2">
            *** Thank you for fueling with us! Safe Journey! ***
            <div className="font-mono text-[7px] mt-0.5 text-slate-400">Powered by PumpTally OS</div>
          </div>
        </div>

        {/* Modal footer buttons */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal Slip</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
