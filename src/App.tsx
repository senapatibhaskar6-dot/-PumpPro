import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MeterReadings } from './components/MeterReadings';
import { FuelStockManager } from './components/FuelStockManager';
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
import { NeonDatabaseModal } from './components/NeonDatabaseModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { StaffPanel } from './components/StaffPanel';
import { StationRegistrationScreen } from './components/StationRegistrationScreen';
import { SubscriptionLockScreen } from './components/SubscriptionLockScreen';
import { OwnerPasswordModal } from './components/OwnerPasswordModal';
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
import { Menu, X, Fuel, SlidersHorizontal, DollarSign, Lock, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeShift, setActiveShift] = useState<string>('Shift 1 (Morning)');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeRole, setActiveRole] = useState<'staff' | 'owner'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pumppro_active_role') : null;
    return saved === 'owner' || saved === 'staff' ? saved : 'staff';
  });

  // Owner & Management Security Lock State ("jate totkhanat belege hisab sabo nuare")
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(() => storage.isOwnerUnlocked());
  const [showOwnerPasswordModal, setShowOwnerPasswordModal] = useState<boolean>(false);

  const handleRoleChange = (role: 'staff' | 'owner') => {
    if (role === 'owner') {
      if (storage.isOwnerProtected() && !storage.isOwnerUnlocked()) {
        setShowOwnerPasswordModal(true);
        return;
      }
    }
    setActiveRole(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pumppro_active_role', role);
    }
  };

  const handleLockOwner = () => {
    storage.lockOwnerAccess();
    setIsOwnerUnlocked(false);
    setActiveRole('staff');
    if (typeof window !== 'undefined') {
      localStorage.setItem('pumppro_active_role', 'staff');
    }
  };

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
  const [isRegistered, setIsRegistered] = useState<boolean>(() => storage.isSetupCompleted());
  const [isSubActive, setIsSubActive] = useState<boolean>(() => storage.isSubscriptionActive());

  // Modals
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [showPumpRegistrationModal, setShowPumpRegistrationModal] = useState<boolean>(false);
  const [showProductLaunchModal, setShowProductLaunchModal] = useState<boolean>(false);
  const [showAuditGuideModal, setShowAuditGuideModal] = useState<boolean>(false);
  const [showNeonModal, setShowNeonModal] = useState<boolean>(false);
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
    setIsRegistered(storage.isSetupCompleted());
    setIsSubActive(storage.isSubscriptionActive());
    setIsOwnerUnlocked(storage.isOwnerUnlocked());
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

  // First-Time Station Setup / Registration Gate
  if (!isRegistered) {
    return (
      <StationRegistrationScreen
        onCompleteRegistration={(_newPump) => {
          refreshData();
          setIsRegistered(true);
          setIsSubActive(storage.isSubscriptionActive());
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  // Auto-Lock Gate when subscription expires or is ended ("subscribe khek hole autolock hobo")
  if (!isSubActive) {
    return (
      <SubscriptionLockScreen
        subscription={subscription}
        settings={settings}
        onUnlocked={() => {
          refreshData();
          setIsSubActive(true);
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white max-w-full overflow-x-hidden">
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
        onOpenNeonModal={() => setShowNeonModal(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        activeRole={activeRole}
        onToggleRole={handleRoleChange}
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
          activeRole={activeRole}
          onToggleRole={handleRoleChange}
        />

        {/* Content Body Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-6 pb-28 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              activeRole === 'staff' ? (
                <StaffPanel
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
                  onRefreshData={refreshData}
                  onSwitchToOwner={() => handleRoleChange('owner')}
                  onNavigate={setCurrentTab}
                  onPrintReadingSlip={(r, n) => setReceiptReading({ reading: r, nozzle: n })}
                />
              ) : (
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
              )
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

            {currentTab === 'fuel-stock' && (
              <FuelStockManager
                settings={settings}
                tanks={tanks}
                rates={rates}
                nozzles={nozzles}
                readings={readings}
                onRefreshData={refreshData}
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
                onReopenRegistration={() => setIsRegistered(false)}
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

      {/* Neon PostgreSQL Cloud Database Modal */}
      {showNeonModal && (
        <NeonDatabaseModal onClose={() => setShowNeonModal(false)} />
      )}

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
        activeRole={activeRole}
        onToggleRole={handleRoleChange}
      />
    </div>
  );
}
