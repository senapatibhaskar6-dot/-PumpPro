import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MeterReadings } from './components/MeterReadings';
import { LubricantsManager } from './components/LubricantsManager';
import { CreditLedger } from './components/CreditLedger';
import { CashReconciliation } from './components/CashReconciliation';
import { Reports } from './components/Reports';
import { RatesAndSettings } from './components/RatesAndSettings';
import { ReceiptModal } from './components/ReceiptModal';
import { SubscriptionDashboard } from './components/SubscriptionDashboard';
import { SubscriptionModal } from './components/SubscriptionModal';
import { PumpRegistrationModal } from './components/PumpRegistrationModal';
import { NewProductLaunchModal } from './components/NewProductLaunchModal';
import { AccountsAuditGuideModal } from './components/AccountsAuditGuideModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { storage } from './services/storage';
import {
  PumpSettings,
  FuelRate,
  Nozzle,
  TankStock,
  NozzleReading,
  LubricantProduct,
  LubricantSale,
  CustomerCreditAccount,
  CreditIndentSlip,
  CreditPaymentRecord,
  ExpenseRecord,
  PumpSubscription,
  RegisteredPump,
} from './types';
import { Menu, X, Fuel, SlidersHorizontal, DollarSign } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeShift, setActiveShift] = useState<string>('Shift 1 (Morning)');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // App Data States
  const [settings, setSettings] = useState<PumpSettings>(storage.getSettings());
  const [rates, setRates] = useState<FuelRate[]>(storage.getRates());
  const [tanks, setTanks] = useState<TankStock[]>(storage.getTanks());
  const [nozzles, setNozzles] = useState<Nozzle[]>(storage.getNozzles());
  const [readings, setReadings] = useState<NozzleReading[]>(storage.getReadings());
  const [lubricants, setLubricants] = useState<LubricantProduct[]>(storage.getLubricants());
  const [lubeSales, setLubeSales] = useState<LubricantSale[]>(storage.getLubeSales());
  const [customers, setCustomers] = useState<CustomerCreditAccount[]>(storage.getCustomers());
  const [creditSlips, setCreditSlips] = useState<CreditIndentSlip[]>(storage.getCreditSlips());
  const [creditPayments, setCreditPayments] = useState<CreditPaymentRecord[]>(storage.getCreditPayments());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(storage.getExpenses());
  const [subscription, setSubscription] = useState<PumpSubscription>(storage.getSubscription());
  const [registeredPumps, setRegisteredPumps] = useState<RegisteredPump[]>(storage.getRegisteredPumps());

  // Modals
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [showPumpRegistrationModal, setShowPumpRegistrationModal] = useState<boolean>(false);
  const [showProductLaunchModal, setShowProductLaunchModal] = useState<boolean>(false);
  const [showAuditGuideModal, setShowAuditGuideModal] = useState<boolean>(false);
  const [receiptSlip, setReceiptSlip] = useState<CreditIndentSlip | null>(null);
  const [receiptReading, setReceiptReading] = useState<{
    reading: NozzleReading;
    nozzle: Nozzle;
  } | null>(null);

  // Refresh all state from local storage
  const refreshData = useCallback(() => {
    setSettings(storage.getSettings());
    setRates(storage.getRates());
    setTanks(storage.getTanks());
    setNozzles(storage.getNozzles());
    setReadings(storage.getReadings());
    setLubricants(storage.getLubricants());
    setLubeSales(storage.getLubeSales());
    setCustomers(storage.getCustomers());
    setCreditSlips(storage.getCreditSlips());
    setCreditPayments(storage.getCreditPayments());
    setExpenses(storage.getExpenses());
    setSubscription(storage.getSubscription());
    setRegisteredPumps(storage.getRegisteredPumps());
  }, []);

  // Listen for data sync events
  useEffect(() => {
    const handleDataChanged = () => {
      refreshData();
    };
    window.addEventListener('pumppro_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('pumppro_data_changed', handleDataChanged);
    };
  }, [refreshData]);

  // Derived counts for sidebar badges
  const lowStockCount = lubricants.filter((l) => l.currentStock <= l.lowStockThreshold).length;
  const unpaidCreditsCount = creditSlips.filter((s) => !s.isPaid).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        rates={rates}
        activeShift={activeShift}
        onChangeShift={setActiveShift}
        onOpenRatesModal={() => setCurrentTab('settings')}
        onNavigate={setCurrentTab}
        lowStockCount={lowStockCount}
        subscription={subscription}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
        registeredPumps={registeredPumps}
        onSwitchPump={(id) => {
          storage.switchActivePump(id);
          refreshData();
        }}
        onOpenRegisterPumpModal={() => setShowPumpRegistrationModal(true)}
        onOpenAuditGuideModal={() => setShowAuditGuideModal(true)}
        onOpenProductLaunchModal={() => setShowProductLaunchModal(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          unpaidCreditsCount={unpaidCreditsCount}
          lowStockCount={lowStockCount}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Body Area */}
        <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 pb-28 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <Dashboard
                settings={settings}
                rates={rates}
                tanks={tanks}
                nozzles={nozzles}
                readings={readings}
                lubricants={lubricants}
                lubeSales={lubeSales}
                customers={customers}
                creditSlips={creditSlips}
                expenses={expenses}
                activeShift={activeShift}
                onNavigate={setCurrentTab}
                onRefreshData={refreshData}
              />
            )}

            {currentTab === 'readings' && (
              <MeterReadings
                settings={settings}
                rates={rates}
                nozzles={nozzles}
                readings={readings}
                activeShift={activeShift}
                onRefreshData={refreshData}
                onPrintSlip={(r, n) => setReceiptReading({ reading: r, nozzle: n })}
              />
            )}

            {currentTab === 'lubricants' && (
              <LubricantsManager
                settings={settings}
                lubricants={lubricants}
                lubeSales={lubeSales}
                customers={customers}
                activeShift={activeShift}
                onRefreshData={refreshData}
              />
            )}

            {currentTab === 'credit' && (
              <CreditLedger
                settings={settings}
                rates={rates}
                lubricants={lubricants}
                customers={customers}
                creditSlips={creditSlips}
                creditPayments={creditPayments}
                activeShift={activeShift}
                onRefreshData={refreshData}
                onPrintSlip={(slip) => setReceiptSlip(slip)}
              />
            )}

            {currentTab === 'reconciliation' && (
              <CashReconciliation
                settings={settings}
                readings={readings}
                lubeSales={lubeSales}
                creditSlips={creditSlips}
                expenses={expenses}
                activeShift={activeShift}
                onRefreshData={refreshData}
              />
            )}

            {currentTab === 'expenses' && (
              <CashReconciliation
                settings={settings}
                readings={readings}
                lubeSales={lubeSales}
                creditSlips={creditSlips}
                expenses={expenses}
                activeShift={activeShift}
                onRefreshData={refreshData}
              />
            )}

            {currentTab === 'reports' && (
              <Reports
                settings={settings}
                rates={rates}
                nozzles={nozzles}
                readings={readings}
                lubricants={lubricants}
                lubeSales={lubeSales}
                expenses={expenses}
                creditSlips={creditSlips}
                customers={customers}
              />
            )}

            {currentTab === 'subscription' && (
              <SubscriptionDashboard
                subscription={subscription}
                registeredPumps={registeredPumps}
                settings={settings}
                onOpenUpgradeModal={() => setShowSubscriptionModal(true)}
                onOpenRegisterPumpModal={() => setShowPumpRegistrationModal(true)}
                onRefreshData={refreshData}
              />
            )}

            {currentTab === 'settings' && (
              <RatesAndSettings
                settings={settings}
                rates={rates}
                tanks={tanks}
                nozzles={nozzles}
                onRefreshData={refreshData}
              />
            )}
          </div>
        </main>
      </div>

      {/* SaaS Subscription Upgrade / Checkout Modal */}
      <SubscriptionModal
        subscription={subscription}
        settings={settings}
        registeredPumps={registeredPumps}
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionUpdated={refreshData}
      />

      {/* New Pump Onboarding & Registration Modal */}
      <PumpRegistrationModal
        isOpen={showPumpRegistrationModal}
        onClose={() => setShowPumpRegistrationModal(false)}
        onPumpRegistered={(pump) => {
          refreshData();
          setCurrentTab('dashboard');
        }}
      />

      {/* Thermal Receipt Print Modal */}
      {(receiptSlip || receiptReading) && (
        <ReceiptModal
          settings={settings}
          slip={receiptSlip}
          reading={receiptReading}
          onClose={() => {
            setReceiptSlip(null);
            setReceiptReading(null);
          }}
        />
      )}

      {/* Global New Oil Company Product Launch Modal */}
      <NewProductLaunchModal
        isOpen={showProductLaunchModal}
        onClose={() => setShowProductLaunchModal(false)}
        settings={settings}
        existingRates={rates}
        existingLubes={lubricants}
        onProductAdded={refreshData}
      />

      {/* Global Accounts Audit & Verification Guide Modal */}
      <AccountsAuditGuideModal
        isOpen={showAuditGuideModal}
        onClose={() => setShowAuditGuideModal(false)}
        settings={settings}
        rates={rates}
        nozzles={nozzles}
        readings={readings}
        tanks={tanks}
        lubricants={lubricants}
        lubeSales={lubeSales}
        customers={customers}
        creditSlips={creditSlips}
        expenses={expenses}
        activeShift={activeShift}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          setShowAuditGuideModal(false);
        }}
      />

      {/* Touch-Friendly Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        unpaidCreditsCount={unpaidCreditsCount}
        lowStockCount={lowStockCount}
        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMenuOpen={isMobileMenuOpen}
      />
    </div>
  );
}
