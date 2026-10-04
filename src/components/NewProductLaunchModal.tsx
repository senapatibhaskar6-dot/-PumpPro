import React, { useState } from 'react';
import {
  Sparkles,
  Fuel,
  Package,
  Plus,
  CheckCircle2,
  X,
  Droplet,
  Layers,
  ArrowRight,
  Zap,
  Building2,
  Tag,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  FuelRate,
  Nozzle,
  TankStock,
  LubricantProduct,
  LubeCategory,
  PumpSettings,
} from '../types';
import { storage } from '../services/storage';

interface NewProductLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PumpSettings;
  existingRates: FuelRate[];
  existingLubes: LubricantProduct[];
  onProductAdded: () => void;
}

export const NewProductLaunchModal: React.FC<NewProductLaunchModalProps> = ({
  isOpen,
  onClose,
  settings,
  existingRates,
  existingLubes,
  onProductAdded,
}) => {
  const sym = settings.currencySymbol;
  const [productType, setProductType] = useState<'fuel' | 'lubricant' | 'presets'>('presets');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- STATE FOR NEW FUEL / ENERGY PRODUCT ---
  const [oilCompany, setOilCompany] = useState<string>(settings.dealerBrand || 'Indian Oil');
  const [fuelName, setFuelName] = useState('XP100 High-Octane Petrol');
  const [fuelCode, setFuelCode] = useState('XP100');
  const [ratePerLiter, setRatePerLiter] = useState(160.0);
  const [costPerLiter, setCostPerLiter] = useState(154.5);
  const [fuelColor, setFuelColor] = useState('#8b5cf6'); // Purple
  const [autoCreateTank, setAutoCreateTank] = useState(true);
  const [tankCapacity, setTankCapacity] = useState(15000);
  const [autoCreateNozzle, setAutoCreateNozzle] = useState(true);
  const [dispenserUnit, setDispenserUnit] = useState('DU-03 (Island 3)');

  // --- STATE FOR NEW LUBRICANT / DEF PRODUCT ---
  const [lubeName, setLubeName] = useState('Servo Pride DEF AdBlue (BS-VI)');
  const [lubeBrand, setLubeBrand] = useState('Servo');
  const [lubeCategory, setLubeCategory] = useState<LubeCategory>('Coolant & DEF');
  const [lubePackSize, setLubePackSize] = useState('20 L');
  const [lubeUnit, setLubeUnit] = useState('Bucket');
  const [lubeSku, setLubeSku] = useState(`DEF-${Date.now().toString().slice(-4)}`);
  const [lubeMrp, setLubeMrp] = useState(950);
  const [lubePurchaseCost, setLubePurchaseCost] = useState(720);
  const [lubeSellingPrice, setLubeSellingPrice] = useState(900);
  const [lubeInitialStock, setLubeInitialStock] = useState(25);
  const [lubeLowStockThreshold, setLubeLowStockThreshold] = useState(5);

  if (!isOpen) return null;

  // Margin calculation for fuel
  const dealerMargin = Math.max(0, ratePerLiter - costPerLiter);

  // 1-Click Launch Presets (Common Indian Oil Company Launches)
  const presets = [
    {
      type: 'fuel' as const,
      company: 'Indian Oil',
      title: 'IOCL XP100 High Octane Petrol',
      shortCode: 'XP100',
      rate: 160.0,
      cost: 154.0,
      color: '#8b5cf6',
      badge: 'Supercar & Superbike Grade',
      desc: '100 Octane premium fuel launched for high-compression engines & luxury vehicles.',
    },
    {
      type: 'fuel' as const,
      company: 'Indian Oil',
      title: 'IOCL XtraGreen High-Efficiency Diesel',
      shortCode: 'XG-HSD',
      rate: 94.8,
      cost: 92.4,
      color: '#10b981',
      badge: 'Eco Green Diesel',
      desc: 'High cetane diesel offering 5-7% higher mileage and reduced greenhouse gases.',
    },
    {
      type: 'fuel' as const,
      company: 'Govt. Mandate / Multi-Brand',
      title: 'E20 Ethanol Blended Petrol (20%)',
      shortCode: 'E20',
      rate: 98.5,
      cost: 95.1,
      color: '#06b6d4',
      badge: 'National Biofuel Policy',
      desc: '20% Ethanol blended clean fuel mandated across commercial retail outlets.',
    },
    {
      type: 'fuel' as const,
      company: 'Bharat Petroleum',
      title: 'BPCL Speed 97 High Performance Petrol',
      shortCode: 'Speed97',
      rate: 115.0,
      cost: 110.8,
      color: '#ec4899',
      badge: 'Speed 97',
      desc: 'Multi-functional additive enriched high octane fuel from Bharat Petroleum.',
    },
    {
      type: 'fuel' as const,
      company: 'Hindustan Petroleum',
      title: 'HPCL Power 95 Petrol',
      shortCode: 'Power95',
      rate: 104.5,
      cost: 101.2,
      color: '#f97316',
      badge: 'Power 95',
      desc: 'HPCL premium fuel formulated with friction buster friction buster molecules.',
    },
    {
      type: 'lube' as const,
      company: 'Indian Oil',
      title: 'Servo Pride DEF AdBlue (20 L Bucket)',
      brand: 'Servo',
      category: 'Coolant & DEF' as LubeCategory,
      packSize: '20 L',
      unit: 'Bucket',
      mrp: 980,
      purchaseCost: 720,
      sellingPrice: 920,
      stock: 30,
      desc: 'Mandatory Diesel Exhaust Fluid for all BS-VI trucks, buses, tractors and SUVs.',
    },
    {
      type: 'lube' as const,
      company: 'Castrol',
      title: 'Castrol EDGE 0W-20 Full Synthetic (3.5 L)',
      brand: 'Castrol',
      category: 'Engine Oil Car/SUV' as LubeCategory,
      packSize: '3.5 L',
      unit: 'Can',
      mrp: 2750,
      purchaseCost: 2050,
      sellingPrice: 2500,
      stock: 12,
      desc: 'Fluid Titanium technology for modern turbo-petrol & hybrid passenger cars.',
    },
    {
      type: 'lube' as const,
      company: 'Hindustan Petroleum',
      title: 'HP Racer4 Synth 10W-30 (1 Liter)',
      brand: 'HP Racer',
      category: 'Engine Oil 4T' as LubeCategory,
      packSize: '1 L',
      unit: 'Bottle',
      mrp: 460,
      purchaseCost: 350,
      sellingPrice: 430,
      stock: 40,
      desc: 'Premium 4-stroke motorcycle engine oil meeting API SN & JASO MA2 specs.',
    },
    {
      type: 'lube' as const,
      company: 'Bharat Petroleum',
      title: 'Mak Eco DEF AdBlue (10 L Can)',
      brand: 'Mak',
      category: 'Coolant & DEF' as LubeCategory,
      packSize: '10 L',
      unit: 'Can',
      mrp: 540,
      purchaseCost: 390,
      sellingPrice: 500,
      stock: 20,
      desc: 'High purity AUS32 urea solution for SCR exhaust aftertreatment systems.',
    },
  ];

  // Handle Adding New Fuel Product
  const handleAddFuel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelName.trim() || !fuelCode.trim() || ratePerLiter <= 0) return;

    const fuelTypeKey = fuelCode.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // 1. Create or update FuelRate
    const newRate: FuelRate = {
      type: fuelTypeKey,
      name: fuelName,
      shortCode: fuelCode.toUpperCase(),
      ratePerLiter: Number(ratePerLiter),
      dealerCostPerLiter: Number(costPerLiter),
      dealerMarginPerLiter: Number(dealerMargin),
      color: fuelColor,
    };

    const currentRates = storage.getRates();
    const existingIndex = currentRates.findIndex((r) => r.type === fuelTypeKey);
    let updatedRates: FuelRate[];
    if (existingIndex >= 0) {
      updatedRates = currentRates.map((r, i) => (i === existingIndex ? newRate : r));
    } else {
      updatedRates = [...currentRates, newRate];
    }
    storage.saveRates(updatedRates);

    // 2. Optionally create Tank
    let createdTankId = 'tank-01';
    if (autoCreateTank) {
      const currentTanks = storage.getTanks();
      createdTankId = `tank-${fuelTypeKey}-${Date.now().toString().slice(-4)}`;
      const newTank: TankStock = {
        id: createdTankId,
        name: `Underground Tank (${fuelCode.toUpperCase()})`,
        fuelType: fuelTypeKey,
        capacityLiters: Number(tankCapacity),
        currentVolumeLiters: Math.round(Number(tankCapacity) * 0.75),
        dipReadingCm: 185.0,
        lastRefillDate: new Date().toISOString().split('T')[0],
      };
      storage.saveTanks([...currentTanks, newTank]);
    }

    // 3. Optionally create Nozzles
    if (autoCreateNozzle) {
      const currentNozzles = storage.getNozzles();
      const nozzle1: Nozzle = {
        id: `nozzle-${fuelTypeKey}-01`,
        dispenserUnit: dispenserUnit,
        nozzleNumber: currentNozzles.length + 1,
        name: `${dispenserUnit} Nozzle 1 (${fuelCode.toUpperCase()})`,
        fuelType: fuelTypeKey,
        tankId: createdTankId,
      };
      const nozzle2: Nozzle = {
        id: `nozzle-${fuelTypeKey}-02`,
        dispenserUnit: dispenserUnit,
        nozzleNumber: currentNozzles.length + 2,
        name: `${dispenserUnit} Nozzle 2 (${fuelCode.toUpperCase()})`,
        fuelType: fuelTypeKey,
        tankId: createdTankId,
      };
      storage.saveNozzles([...currentNozzles, nozzle1, nozzle2]);
    }

    setSuccessMessage(`সফলভাৱে যোগ হ'ল! "${fuelName}" এতিয়া ষ্টেচনত সক্ৰিয় কৰা হৈছে।`);
    onProductAdded();
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1800);
  };

  // Handle Adding New Lubricant Product
  const handleAddLubricant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lubeName.trim() || lubeSellingPrice <= 0) return;

    const newProduct: LubricantProduct = {
      id: `lube-${Date.now().toString().slice(-6)}`,
      name: lubeName,
      brand: lubeBrand,
      category: lubeCategory,
      packSize: lubePackSize,
      sku: lubeSku || `SKU-${Date.now().toString().slice(-4)}`,
      mrp: Number(lubeMrp),
      purchaseCost: Number(lubePurchaseCost),
      sellingPrice: Number(lubeSellingPrice),
      currentStock: Number(lubeInitialStock),
      lowStockThreshold: Number(lubeLowStockThreshold),
      unit: lubeUnit,
    };

    storage.addOrUpdateLubricant(newProduct);
    setSuccessMessage(`সফলভাৱে যোগ হ'ল! মবিল/AdBlue "${lubeName}" ষ্টকত সংলগ্ন কৰা হৈছে।`);
    onProductAdded();
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1800);
  };

  // Handle 1-Click Launch Preset
  const handleLaunchPreset = (preset: (typeof presets)[0]) => {
    if (preset.type === 'fuel') {
      const fuelTypeKey = preset.shortCode.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const newRate: FuelRate = {
        type: fuelTypeKey,
        name: preset.title,
        shortCode: preset.shortCode,
        ratePerLiter: preset.rate,
        dealerCostPerLiter: preset.cost,
        dealerMarginPerLiter: preset.rate - preset.cost,
        color: preset.color,
      };

      const currentRates = storage.getRates();
      const existingIdx = currentRates.findIndex((r) => r.type === fuelTypeKey);
      let updatedRates: FuelRate[];
      if (existingIdx >= 0) {
        updatedRates = currentRates.map((r, i) => (i === existingIdx ? newRate : r));
      } else {
        updatedRates = [...currentRates, newRate];
      }
      storage.saveRates(updatedRates);

      // Create Tank & Nozzles
      const currentTanks = storage.getTanks();
      const tankId = `tank-${fuelTypeKey}`;
      if (!currentTanks.some((t) => t.id === tankId)) {
        currentTanks.push({
          id: tankId,
          name: `Underground Tank (${preset.shortCode})`,
          fuelType: fuelTypeKey,
          capacityLiters: 20000,
          currentVolumeLiters: 15000,
          dipReadingCm: 190,
          lastRefillDate: new Date().toISOString().split('T')[0],
        });
        storage.saveTanks(currentTanks);
      }

      const currentNozzles = storage.getNozzles();
      if (!currentNozzles.some((n) => n.fuelType === fuelTypeKey)) {
        currentNozzles.push({
          id: `nozzle-${fuelTypeKey}-01`,
          dispenserUnit: 'DU-04 (New Island)',
          nozzleNumber: currentNozzles.length + 1,
          name: `DU-4 Nozzle 1 (${preset.shortCode})`,
          fuelType: fuelTypeKey,
          tankId: tankId,
        });
        storage.saveNozzles(currentNozzles);
      }

      setSuccessMessage(`সফলভাৱে সক্ৰিয় হ'ল! "${preset.title}" যোগ হৈছে।`);
    } else {
      const newLube: LubricantProduct = {
        id: `lube-preset-${Date.now().toString().slice(-5)}`,
        name: preset.title,
        brand: preset.brand,
        category: preset.category,
        packSize: preset.packSize,
        sku: `SKU-${preset.shortCode || Date.now().toString().slice(-4)}`,
        mrp: preset.mrp,
        purchaseCost: preset.purchaseCost,
        sellingPrice: preset.sellingPrice,
        currentStock: preset.stock,
        lowStockThreshold: 5,
        unit: preset.unit,
      };

      storage.addOrUpdateLubricant(newLube);
      setSuccessMessage(`সফলভাৱে সক্ৰিয় হ'ল! "${preset.title}" ষ্টকত সংলগ্ন কৰা হৈছে।`);
    }

    onProductAdded();
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-3xl p-4 sm:p-6 lg:p-8 shadow-2xl space-y-4 sm:space-y-6 my-auto relative max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>তেল কোম্পানীৰ নতুন প্ৰডাক্ট সংযোজন • Oil Company Product Launch</span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Launch New Fuel, AdBlue or Lubricant Product
          </h2>
          <p className="text-xs text-slate-400">
            IOCL, BPCL, HPCL, Shell বা Nayara এ যেতিয়াই নতুন প্ৰডাক্ট (যেনে XP100, XtraGreen Diesel, E20, AdBlue / DEF বা নতুন মবিল) বজাৰলৈ আনে, ইয়াত সহজে সংযোজন কৰক।
          </p>
        </div>

        {/* Feedback Alert */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tabs: Presets vs Custom Fuel vs Custom Lubricant */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setProductType('presets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              productType === 'presets'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Launch Presets (সাজু তালিকা)</span>
          </button>

          <button
            onClick={() => setProductType('fuel')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              productType === 'fuel'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Custom Fuel / Energy (নতুন ইন্ধন)</span>
          </button>

          <button
            onClick={() => setProductType('lubricant')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              productType === 'lubricant'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>New Lubricant / DEF (মবিল বা AdBlue)</span>
          </button>
        </div>

        {/* TAB 1: 1-CLICK LAUNCH PRESETS */}
        {productType === 'presets' && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300">
              ⚡ <strong>দ্ৰুত সংযোজন:</strong> তলৰ প্ৰডাক্টবোৰ ভাৰতৰ মুখ্য তেল কোম্পানীসমূহৰ দ্বাৰা শেহতীয়াকৈ মুকলি কৰা জনপ্ৰিয় প্ৰডাক্ট। মাত্ৰ এটা ক্লিকতে আপোনাৰ পাম্পত সংযোগ কৰক:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {presets.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                        {p.company}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.type === 'fuel'
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}
                      >
                        {p.type === 'fuel' ? 'Fuel Grade' : 'DEF / Lubricant'}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white">{p.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                    <div>
                      {p.type === 'fuel' ? (
                        <span className="text-xs font-mono font-bold text-white">
                          {sym}{p.rate.toFixed(2)}/L{' '}
                          <span className="text-[10px] text-emerald-400 font-normal">
                            (+{sym}{(p.rate - p.cost).toFixed(2)} margin)
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold text-white">
                          {sym}{p.sellingPrice}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({p.packSize} • Stock: {p.stock})
                          </span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleLaunchPreset(p)}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Launch / যোগ কৰক</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM FUEL GRADE FORM */}
        {productType === 'fuel' && (
          <form onSubmit={handleAddFuel} className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Oil Company / Brand (তেল কোম্পানী)
                </label>
                <select
                  value={oilCompany}
                  onChange={(e) => setOilCompany(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Indian Oil">Indian Oil (IOCL)</option>
                  <option value="Bharat Petroleum">Bharat Petroleum (BPCL)</option>
                  <option value="Hindustan Petroleum">Hindustan Petroleum (HPCL)</option>
                  <option value="Shell">Shell</option>
                  <option value="Nayara">Nayara Energy</option>
                  <option value="Reliance">Reliance / Jio-bp</option>
                  <option value="Independent">Independent / Alternative Energy</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Fuel / Product Full Name (ইন্ধনৰ সম্পূৰ্ণ নাম)
                </label>
                <input
                  type="text"
                  required
                  value={fuelName}
                  onChange={(e) => setFuelName(e.target.value)}
                  placeholder="e.g. XtraGreen High Cetane Diesel"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Short Code (ছিক্ৰেট / চুটি কোড)
                </label>
                <input
                  type="text"
                  required
                  value={fuelCode}
                  onChange={(e) => setFuelCode(e.target.value)}
                  placeholder="e.g. XG-HSD or XP100"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Display Color Badge (ৰং)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fuelColor}
                    onChange={(e) => setFuelColor(e.target.value)}
                    className="w-10 h-8 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-slate-400">{fuelColor}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Retail Selling Rate ({sym}/Liter) (বিক্ৰী দৰ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={ratePerLiter}
                  onChange={(e) => setRatePerLiter(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Dealer Purchase Cost ({sym}/Liter) (ক্ৰয় দৰ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={costPerLiter}
                  onChange={(e) => setCostPerLiter(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Calculated Profit Margin Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Dealer Margin per Liter (ডীলাৰ লাভ):
              </span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                +{sym}{dealerMargin.toFixed(2)} / Liter
              </span>
            </div>

            {/* Automatic Storage Tank & Nozzle Creation */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <span className="text-xs font-bold text-slate-200 block">
                Automatic Infrastructure Provisioning (টেংক আৰু নজল ব্যৱস্থা)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoCreateTank}
                    onChange={(e) => setAutoCreateTank(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-0"
                  />
                  <span>Create Underground Tank ({tankCapacity} L)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoCreateNozzle}
                    onChange={(e) => setAutoCreateNozzle(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-0"
                  />
                  <span>Assign 2 Nozzles on Dispenser Island</span>
                </label>
              </div>

              {autoCreateNozzle && (
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] text-slate-400">
                    Dispenser Unit Location (ডিছপেনচাৰ মেচিন)
                  </label>
                  <input
                    type="text"
                    value={dispenserUnit}
                    onChange={(e) => setDispenserUnit(e.target.value)}
                    placeholder="e.g. DU-04 (Island 4)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95 transition"
              >
                প্ৰডাক্ট সক্ৰিয় কৰক (Launch Fuel Product)
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: CUSTOM LUBRICANT / DEF FORM */}
        {productType === 'lubricant' && (
          <form onSubmit={handleAddLubricant} className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Brand / Manufacturer (ব্ৰেণ্ড)
                </label>
                <input
                  type="text"
                  required
                  value={lubeBrand}
                  onChange={(e) => setLubeBrand(e.target.value)}
                  placeholder="e.g. Servo, Mak, Castrol, Motul"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Product Name (মবিল বা AdBlue ৰ নাম)
                </label>
                <input
                  type="text"
                  required
                  value={lubeName}
                  onChange={(e) => setLubeName(e.target.value)}
                  placeholder="e.g. Servo Pride DEF 20L Bucket"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Category (শ্ৰেণী)
                </label>
                <select
                  value={lubeCategory}
                  onChange={(e) => setLubeCategory(e.target.value as LubeCategory)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Coolant & DEF">Coolant & DEF (AdBlue)</option>
                  <option value="Engine Oil 4T">Engine Oil 4T (Motorcycles)</option>
                  <option value="Engine Oil Car/SUV">Engine Oil Car/SUV (Synthetic)</option>
                  <option value="Commercial Heavy Duty">Commercial Heavy Duty (Trucks)</option>
                  <option value="Gear Oil">Gear Oil</option>
                  <option value="Grease">Grease</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Pack Size (পেকিং আকাৰ)
                </label>
                <input
                  type="text"
                  required
                  value={lubePackSize}
                  onChange={(e) => setLubePackSize(e.target.value)}
                  placeholder="e.g. 20 L, 5 L, 3.5 L, 1 L, 500 g"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  MRP ({sym})
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={lubeMrp}
                  onChange={(e) => setLubeMrp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Dealer Purchase Cost ({sym}) (ক্ৰয় দৰ)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={lubePurchaseCost}
                  onChange={(e) => setLubePurchaseCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Selling Price ({sym}) (বিক্ৰী দৰ)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={lubeSellingPrice}
                  onChange={(e) => setLubeSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Initial Stock Quantity (প্ৰাৰম্ভিক মজুত)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={lubeInitialStock}
                  onChange={(e) => setLubeInitialStock(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95 transition"
              >
                মবিল সংলগ্ন কৰক (Add Lubricant / DEF)
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            প্ৰডাক্ট সংযোগ হোৱাৰ পিছত আপুনি মিটাৰ ৰিডিং আৰু কাউন্টাৰ বিক্ৰীত ইয়াক পোৱা যাব।
          </span>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            বন্ধ কৰক
          </button>
        </div>
      </div>
    </div>
  );
};
