import { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Tag, 
  BookOpen, 
  ShoppingCart, 
  Cpu, 
  Search, 
  Check, 
  Plus, 
  ArrowRight, 
  Clock, 
  Users, 
  X, 
  Info, 
  Sparkles, 
  Database,
  Settings,
  ChevronDown,
  ChevronUp,
  List,
  Grid,
  Layout
} from 'lucide-react';
import type { Deal, Recipe } from './data/mockData';
import { 
  INITIAL_DEALS, 
  INITIAL_RECIPES, 
  SUPERMARKETS, 
  CATEGORIES, 
  SCRAPED_DEALS_POOL, 
  SCRAPED_RECIPES_POOL 
} from './data/mockData';
import { LIVE_DEALS } from './data/liveDeals';

// Shopping Cart Item structure
interface ShoppingCartItem {
  id: string;
  name: string;
  displayName: string;
  price: number;
  normalPrice: number;
  saving: number;
  store: string;
  unit: string;
  checked: boolean;
}

// Scraper log structure
interface LogMessage {
  text: string;
  type: 'info' | 'success' | 'warning';
  time: string;
}

export default function App() {
  // App navigation
  const [activeTab, setActiveTab] = useState<'home' | 'deals' | 'recipes' | 'shopping' | 'settings'>('home');
  
  // Database States (updated by Scraper)
  const [deals, setDeals] = useState<Deal[]>(LIVE_DEALS.length > 0 ? LIVE_DEALS : INITIAL_DEALS);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  
  // Interactive Shopping List
  const [shoppingList, setShoppingList] = useState<ShoppingCartItem[]>([]);
  
  // Store selection filter (User's stores)
  const [activeStores, setActiveStores] = useState<string[]>(SUPERMARKETS.map(s => s.name));
  
  // Auto-scraping settings
  const [autoScrape, setAutoScrape] = useState<boolean>(true);
  const [isAutoScraped, setIsAutoScraped] = useState<boolean>(false);
  const [isAutoScrapingActive, setIsAutoScrapingActive] = useState<boolean>(false);
  
  // Custom shopping item inputs
  const [customItemName, setCustomItemName] = useState('');
  const [customItemStore, setCustomItemStore] = useState('Fælles indkøb');
  const [suggestedDeal, setSuggestedDeal] = useState<Deal | null>(null);

  // UI States
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('Alle');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Phase 3: Recipe details strategy settings (Mix stores, Single cheapest, or Specific store)
  const [modalStrategy, setModalStrategy] = useState<'mix' | 'single' | 'specific'>('mix');
  const [modalSpecificStore, setModalSpecificStore] = useState<string>('Rema 1000');
  
  // Phase 4: Layout and Member settings states
  const [includeMemberDeals, setIncludeMemberDeals] = useState<boolean>(true);
  const [dealsViewMode, setDealsViewMode] = useState<'list' | 'small' | 'large'>('list');
  const [recipesViewMode, setRecipesViewMode] = useState<'list' | 'small' | 'large'>('large');
  
  // Scraper Accordion State in Settings
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  
  // Scraper Engine States
  const [scraperStatus, setScraperStatus] = useState<'idle' | 'scraping' | 'completed'>('idle');
  const [scraperLogs, setScraperLogs] = useState<LogMessage[]>([
    { text: 'System klar. Venter på at starte scraping...', type: 'info', time: '16:00:00' }
  ]);
  const [scraperProgress, setScraperProgress] = useState<Record<string, number>>({
    'Meny': 0, 'Rema 1000': 0, 'Netto': 0, 'Lidl': 0, 'Coop 365': 0, 'Føtex': 0, 'Opskrifter': 0
  });

  // Filtered deals pool for matching engine (excludes member deals if includeMemberDeals is false)
  const matcherDeals = includeMemberDeals ? deals : deals.filter(d => !d.isMemberDeal);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll scraper console logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scraperLogs]);

  // Synchronize modalSpecificStore if current store is deactivated in Settings
  useEffect(() => {
    if (activeStores.length > 0 && !activeStores.includes(modalSpecificStore)) {
      setModalSpecificStore(activeStores[0]);
    }
  }, [activeStores, modalSpecificStore]);

  // Simulated background auto-scraping on app launch
  useEffect(() => {
    if (autoScrape && !isAutoScraped) {
      setIsAutoScrapingActive(true);
      
      const timer = setTimeout(() => {
        setDeals(prev => {
          const originalDeals = prev.filter(d => !d.id.startsWith('sc_'));
          return [...originalDeals, ...SCRAPED_DEALS_POOL];
        });
        setRecipes(prev => {
          const originalRecipes = prev.filter(r => !r.id.startsWith('rec_sc_'));
          return [...originalRecipes, ...SCRAPED_RECIPES_POOL];
        });
        setIsAutoScraped(true);
        setIsAutoScrapingActive(false);
        
        setScraperLogs(prev => [
          ...prev,
          { text: '[AUTO] Ugens nye tilbudsaviser blev automatisk indlæst og matchet!', type: 'success', time: getCurrentTime() }
        ]);
        showToast('⚡️ Ugens nye tilbudsaviser er automatisk indlæst!');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [autoScrape, isAutoScraped]);

  // Search for matches on sale as the user types custom shopping list items
  useEffect(() => {
    const query = customItemName.trim().toLowerCase();
    if (query.length > 1) {
      const matches = matcherDeals.filter(d => 
        activeStores.includes(d.store) && 
        (d.item.toLowerCase().includes(query) || query.includes(d.item.toLowerCase()))
      );
      if (matches.length > 0) {
        const best = [...matches].sort((a, b) => a.price - b.price)[0];
        setSuggestedDeal(best);
      } else {
        setSuggestedDeal(null);
      }
    } else {
      setSuggestedDeal(null);
    }
  }, [customItemName, matcherDeals, activeStores]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Toggle supermarket setting checkbox
  const toggleStoreSetting = (storeName: string) => {
    setActiveStores(prev => {
      if (prev.includes(storeName)) {
        if (prev.length === 1) {
          showToast('Vælg venligst mindst én butik!');
          return prev;
        }
        showToast(`Gemte ${storeName}-tilbud`);
        return prev.filter(s => s !== storeName);
      } else {
        showToast(`Viser nu tilbud fra ${storeName}`);
        return [...prev, storeName];
      }
    });
  };

  // Normal fallback prices for common foods when they are not on sale (Pantry fallbacks)
  const getIngredientNormalPriceInfo = (ingredientName: string) => {
    const fallbackNormalPrices: Record<string, { price: number, unit: string }> = {
      'lasagneplader': { price: 12, unit: '500g' },
      'letmælk': { price: 12, unit: '1 liter' },
      'mælk': { price: 12, unit: '1 liter' },
      'æg': { price: 24, unit: '10 stk' },
      'bacon': { price: 15, unit: '150g' },
      'pasta': { price: 10, unit: '500g' },
      'spaghetti': { price: 10, unit: '500g' },
      'ris': { price: 12, unit: '1 kg' },
      'kokosmælk': { price: 12, unit: '400ml' },
      'løg': { price: 2, unit: '1 stk' },
      'hvidløg': { price: 3, unit: '1 stk' },
      'ingefær': { price: 6, unit: '100g' },
      'citron': { price: 4, unit: '1 stk' },
      'citroner': { price: 4, unit: '1 stk' },
      'avocado': { price: 18, unit: '2 stk' },
      'rugbrød': { price: 16, unit: '900g' },
      'bananer': { price: 15, unit: '5 stk' },
      'gulerødder': { price: 11, unit: '1 kg' },
      'fløde': { price: 16, unit: '250ml' },
      'laks': { price: 55, unit: '250g' },
      'laksesteaks': { price: 55, unit: '250g' },
      'svinekød': { price: 40, unit: '500g' },
      'oksekød': { price: 50, unit: '400g' },
      'kylling': { price: 42, unit: '450g' },
      'kyllingebrystfilet': { price: 42, unit: '450g' },
      'porrer': { price: 11, unit: '3 stk' },
      'ost': { price: 35, unit: '400g' },
      'smør': { price: 22, unit: '250g' },
      'smørbar': { price: 22, unit: '250g' }
    };

    const key = Object.keys(fallbackNormalPrices).find(k => 
      ingredientName.toLowerCase().includes(k) || k.includes(ingredientName.toLowerCase())
    );
    
    const info = key ? fallbackNormalPrices[key] : { price: 15, unit: 'stk' };
    return {
      onSale: false,
      price: info.price,
      normalPrice: info.price,
      saving: 0,
      store: 'Normalpris',
      displayName: ingredientName,
      unit: info.unit
    };
  };

  // Helper matching engine to find best deals or normal price fallbacks for ingredients
  // Matched deals are strictly filtered by activeStores chosen in Settings!
  const getIngredientPriceInfo = (ingredientName: string) => {
    const matchedDeals = matcherDeals.filter(d => 
      activeStores.includes(d.store) && (
        d.item.toLowerCase().includes(ingredientName.toLowerCase()) || 
        ingredientName.toLowerCase().includes(d.item.toLowerCase())
      )
    );
    
    if (matchedDeals.length > 0) {
      const bestDeal = [...matchedDeals].sort((a, b) => a.price - b.price)[0];
      return {
        onSale: true,
        price: bestDeal.price,
        normalPrice: bestDeal.normalPrice,
        saving: bestDeal.saving,
        store: bestDeal.store,
        displayName: bestDeal.item,
        unit: bestDeal.unit
      };
    }
    
    return getIngredientNormalPriceInfo(ingredientName);
  };

  // Phase 3 helper: Evaluate cheapest single supermarket for all recipe ingredients
  const findCheapestSingleStore = (recipe: Recipe) => {
    if (activeStores.length === 0) return { store: 'Fælles indkøb', price: 0, normalPrice: 0, saving: 0 };
    
    const storeTotals = activeStores.map(storeName => {
      let totalPrice = 0;
      let totalNormalPrice = 0;
      
      recipe.ingredients.forEach(ing => {
        if (ing.isBasis) return;
        
        const matchedDeals = matcherDeals.filter(d => 
          d.store === storeName && (
            d.item.toLowerCase().includes(ing.name.toLowerCase()) || 
            ing.name.toLowerCase().includes(d.item.toLowerCase())
          )
        );
        
        if (matchedDeals.length > 0) {
          const bestDeal = [...matchedDeals].sort((a, b) => a.price - b.price)[0];
          totalPrice += bestDeal.price;
          totalNormalPrice += bestDeal.normalPrice;
        } else {
          const normalInfo = getIngredientNormalPriceInfo(ing.name);
          totalPrice += normalInfo.price;
          totalNormalPrice += normalInfo.price;
        }
      });
      
      return {
        store: storeName,
        price: totalPrice,
        normalPrice: totalNormalPrice,
        saving: totalNormalPrice - totalPrice
      };
    });
    
    const sortedStores = [...storeTotals].sort((a, b) => a.price - b.price);
    return sortedStores[0];
  };

  // Phase 3 helper: Get ingredient pricing based on chosen recipe shopping strategy
  const getIngredientPriceInfoWithStrategy = (
    ingredientName: string, 
    strategy: 'mix' | 'single' | 'specific',
    specificStoreName: string,
    cheapestSingleStoreName: string
  ) => {
    if (strategy === 'mix') {
      return getIngredientPriceInfo(ingredientName);
    }
    
    const targetStore = strategy === 'single' ? cheapestSingleStoreName : specificStoreName;
    
    const matchedDeals = matcherDeals.filter(d => 
      d.store === targetStore && (
        d.item.toLowerCase().includes(ingredientName.toLowerCase()) || 
        ingredientName.toLowerCase().includes(d.item.toLowerCase())
      )
    );
    
    if (matchedDeals.length > 0) {
      const bestDeal = [...matchedDeals].sort((a, b) => a.price - b.price)[0];
      return {
        onSale: true,
        price: bestDeal.price,
        normalPrice: bestDeal.normalPrice,
        saving: bestDeal.saving,
        store: bestDeal.store,
        displayName: bestDeal.item,
        unit: bestDeal.unit
      };
    }
    
    return getIngredientNormalPriceInfo(ingredientName);
  };

  // Compile recipe pricing stats with respect to strategy (Phase 3 feature)
  const calculateRecipeStatsWithStrategy = (
    recipe: Recipe, 
    strategy: 'mix' | 'single' | 'specific',
    specificStoreName: string
  ) => {
    const cheapestSingle = findCheapestSingleStore(recipe);
    
    let totalPrice = 0;
    let totalNormalPrice = 0;
    let matchedCount = 0;
    let matchableCount = 0;

    recipe.ingredients.forEach(ing => {
      if (ing.isBasis) return;
      matchableCount++;
      
      const priceInfo = getIngredientPriceInfoWithStrategy(
        ing.name, 
        strategy, 
        specificStoreName, 
        cheapestSingle.store
      );
      
      totalPrice += priceInfo.price;
      totalNormalPrice += priceInfo.normalPrice;
      if (priceInfo.onSale) {
        matchedCount++;
      }
    });

    const saving = totalNormalPrice - totalPrice;
    const matchScore = matchableCount > 0 ? Math.round((matchedCount / matchableCount) * 100) : 0;

    return {
      totalPrice,
      totalNormalPrice,
      saving,
      matchScore,
      matchedCount,
      matchableCount,
      cheapestStoreName: cheapestSingle.store,
      cheapestStorePrice: cheapestSingle.price,
      cheapestStoreSaving: cheapestSingle.saving
    };
  };

  // Calculate default recipe stats for list views (always uses mix strategy)
  const calculateRecipeStats = (recipe: Recipe) => {
    return calculateRecipeStatsWithStrategy(recipe, 'mix', 'Rema 1000');
  };

  // Add individual deal to shopping list
  const addDealToShoppingList = (deal: Deal) => {
    const exists = shoppingList.some(item => item.id === deal.id);
    if (exists) {
      setShoppingList(prev => prev.filter(item => item.id !== deal.id));
      showToast(`Fjernet ${deal.item} fra indkøbslisten`);
      return;
    }

    const newItem: ShoppingCartItem = {
      id: deal.id,
      name: deal.item,
      displayName: deal.item,
      price: deal.price,
      normalPrice: deal.normalPrice,
      saving: deal.saving,
      store: deal.store,
      unit: deal.unit,
      checked: false
    };

    setShoppingList(prev => [...prev, newItem]);
    showToast(`Tilføjet ${deal.item} (${deal.store}) til indkøbslisten!`);
  };

  // Add custom typed item to shopping list
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;

    const newItem: ShoppingCartItem = {
      id: `custom-${Date.now()}`,
      name: customItemName.trim(),
      displayName: customItemName.trim(),
      price: 0,
      normalPrice: 0,
      saving: 0,
      store: customItemStore,
      unit: 'stk',
      checked: false
    };

    setShoppingList(prev => [newItem, ...prev]);
    showToast(`Tilføjet "${customItemName.trim()}" til indkøbslisten!`);
    setCustomItemName('');
    setSuggestedDeal(null);
  };

  // Add recommended deal
  const addSuggestedDealDirectly = () => {
    if (!suggestedDeal) return;
    addDealToShoppingList(suggestedDeal);
    setCustomItemName('');
    setSuggestedDeal(null);
  };

  // Add recipe ingredients to shopping list respecting selected strategy (Phase 3 feature)
  const addRecipeToShoppingListWithStrategy = (
    recipe: Recipe,
    strategy: 'mix' | 'single' | 'specific',
    specificStoreName: string
  ) => {
    const cheapestSingle = findCheapestSingleStore(recipe);
    let addedCount = 0;
    const newItems: ShoppingCartItem[] = [];

    recipe.ingredients.forEach(ing => {
      if (ing.isBasis) return;
      
      const priceInfo = getIngredientPriceInfoWithStrategy(
        ing.name, 
        strategy, 
        specificStoreName, 
        cheapestSingle.store
      );
      
      const itemKey = `${recipe.id}-${ing.name}-${priceInfo.store}`;
      const exists = shoppingList.some(item => item.id === itemKey);
      
      if (!exists) {
        newItems.push({
          id: itemKey,
          name: ing.name,
          displayName: priceInfo.onSale ? priceInfo.displayName : ing.displayName,
          price: priceInfo.price,
          normalPrice: priceInfo.normalPrice,
          saving: priceInfo.saving,
          store: priceInfo.store === 'Normalpris' ? 'Fælles indkøb' : priceInfo.store,
          unit: priceInfo.unit || ing.amount,
          checked: false
        });
        addedCount++;
      }
    });

    if (newItems.length > 0) {
      setShoppingList(prev => [...prev, ...newItems]);
      showToast(`Tilføjet ${addedCount} ingredienser til indkøbslisten!`);
    } else {
      showToast('Alle ingredienser er allerede i indkøbslisten!');
    }
  };

  // Toggle checklist state in shopping list
  const toggleShoppingItem = (id: string) => {
    setShoppingList(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // Clean shopping list
  const clearShoppingList = () => {
    if (window.confirm('Vil du tømme din indkøbsliste?')) {
      setShoppingList([]);
      showToast('Indkøbslisten er tømt');
    }
  };

  // Simulated Scraping Engine Execution
  const runScraper = () => {
    if (scraperStatus === 'scraping') return;
    
    setScraperStatus('scraping');
    setScraperProgress({
      'Meny': 0, 'Rema 1000': 0, 'Netto': 0, 'Lidl': 0, 'Coop 365': 0, 'Føtex': 0, 'Opskrifter': 0
    });
    
    const logs: LogMessage[] = [
      { text: 'Initialiserer maaaaad intelligent scraper v2.4...', type: 'info', time: getCurrentTime() }
    ];
    setScraperLogs(logs);

    const appendLog = (text: string, type: 'info' | 'success' | 'warning' = 'info') => {
      setScraperLogs(prev => [...prev, { text, type, time: getCurrentTime() }]);
    };

    // Simulated timeline for scraping
    setTimeout(() => {
      appendLog('Forbinder til supermarkedernes tilbudsservere...', 'info');
      setScraperProgress(prev => ({ ...prev, 'Meny': 25 }));
    }, 800);

    setTimeout(() => {
      appendLog('[MENY] Henter tilbudsavis: Uge 22 (Premium madvarer)...', 'info');
      setScraperProgress(prev => ({ ...prev, 'Meny': 60, 'Rema 1000': 30 }));
    }, 1500);

    setTimeout(() => {
      appendLog('[REMA 1000] Forbundet. 412 aktive tilbud hentet.', 'success');
      setScraperProgress(prev => ({ ...prev, 'Rema 1000': 100, 'Netto': 40 }));
    }, 2200);

    setTimeout(() => {
      appendLog('[MENY] Fandt 12 nye gourmetkup! Oksemørbrad, Lurpak, revet ost...', 'success');
      setScraperProgress(prev => ({ ...prev, 'Meny': 100, 'Lidl': 50 }));
    }, 3000);

    setTimeout(() => {
      appendLog('[NETTO] ^& [COOP 365] Scraper ugentlige discounttilbud...', 'info');
      setScraperProgress(prev => ({ ...prev, 'Netto': 85, 'Coop 365': 70 }));
    }, 3600);

    setTimeout(() => {
      appendLog('[NETTO] Fandt fantastisk tilbud på bacon (Spar 50%) og smør!', 'success');
      appendLog('[LIDL] ^& [FØTEX] Behandler fisk- og grønttilbud...', 'info');
      setScraperProgress(prev => ({ ...prev, 'Netto': 100, 'Coop 365': 100, 'Lidl': 100, 'Føtex': 80 }));
    }, 4400);

    setTimeout(() => {
      appendLog('[FØTEX] Behandlet 620 tilbud. Database synkroniseret.', 'success');
      appendLog('[OPSKRIFTER] Scanner Valdemarsro ^& Madbanditten for nye madplaner...', 'info');
      setScraperProgress(prev => ({ ...prev, 'Føtex': 100, 'Opskrifter': 50 }));
    }, 5200);

    setTimeout(() => {
      appendLog('[OPSKRIFTER] Hentet 2 nye dynamiske opskrifter: Wok med Kylling, Smørrebrød med Laks.', 'success');
      setScraperProgress(prev => ({ ...prev, 'Opskrifter': 100 }));
    }, 5800);

    setTimeout(() => {
      setDeals(prev => {
        const originalDeals = prev.filter(d => !d.id.startsWith('sc_'));
        return [...originalDeals, ...SCRAPED_DEALS_POOL];
      });
      
      setRecipes(prev => {
        const originalRecipes = prev.filter(r => !r.id.startsWith('rec_sc_'));
        return [...originalRecipes, ...SCRAPED_RECIPES_POOL];
      });
      
      appendLog('[DATABASE] Succes! Indlæst 10 nye ugentlige megakup og 2 nye opskrifter.', 'success');
      appendLog('Scraping færdig. Alle opskrifter har fået opdateret deres Match Score!', 'success');
      setScraperStatus('completed');
      setIsAutoScraped(true);
      showToast('Scraper færdig! Nye tilbud og opskrifter indlæst.');
    }, 6500);
  };

  // Helper date/time formatters
  const getCurrentDateString = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    let date = new Date().toLocaleDateString('da-DK', options);
    return date.charAt(0).toUpperCase() + date.slice(1);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  // Calculations for Shopping List totals
  const totalShoppingPrice = shoppingList.reduce((acc, item) => acc + (item.checked ? 0 : item.price), 0);
  const totalNormalShoppingPrice = shoppingList.reduce((acc, item) => acc + (item.checked ? 0 : item.normalPrice), 0);
  const totalShoppingSavings = totalNormalShoppingPrice - totalShoppingPrice;

  // Filter deals based on searchQuery, store filter (from ActiveStores only!)
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.item.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          deal.category.toLowerCase().includes(searchQuery.toLowerCase());
    const isStoreActive = activeStores.includes(deal.store);
    const matchesStore = selectedStore === 'Alle' ? isStoreActive : (deal.store === selectedStore && isStoreActive);
    const matchesCategory = selectedCategory === 'Alle' || deal.category === selectedCategory;
    return matchesSearch && matchesStore && matchesCategory;
  });

  // Sort recipes by Match Score (highest first)
  const sortedRecipes = [...recipes].map(recipe => {
    const stats = calculateRecipeStats(recipe);
    return { ...recipe, stats };
  }).sort((a, b) => b.stats.matchScore - a.stats.matchScore);

  return (
    <div className="app-container">
      {/* Dynamic notch for desktop */}
      <div className="app-notch"></div>
      
      {/* iOS Status Bar */}
      <div className="app-status-bar">
        <span className="time">16:24</span>
        <div className="status-icons">
          {isAutoScrapingActive ? (
            <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '10px', animation: 'pulse 1s infinite alternate', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span className="console-dot" style={{ width: '5px', height: '5px' }}></span> Auto-updater...
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="console-dot" style={{ width: '5px', height: '5px', backgroundColor: isAutoScraped ? 'var(--accent-green)' : '#999' }}></span> Scraper klar
            </span>
          )}
          <Database size={13} style={{ opacity: 0.8 }} />
          <span>5G</span>
          <span style={{ fontSize: '11px', marginLeft: '2px' }}>100%</span>
        </div>
      </div>

      {/* Main Screen Content */}
      <div className="app-screen">
        
        {/* TAB 1: HOME DASHBOARD */}
        {activeTab === 'home' && (
          <div className="page-fade-active">
            <div className="header-container">
              <div className="date">{getCurrentDateString()}</div>
              <h1 className="app-title-logo">
                maaaaad<span className="logo-highlight">.</span>
              </h1>
            </div>

            <div className="highlight-banner">
              <div className="highlight-banner-icon">
                <Sparkles size={20} />
              </div>
              <div className="highlight-banner-text">
                <h3>Klar til at spare stort?</h3>
                <p>
                  Vi scanner ugentligt {activeStores.length} butikker. Lav dine yndlingsretter op til <b>52% billigere</b> netop nu!
                </p>
              </div>
            </div>

            <div className="home-summary-stats">
              <div className="stat-box">
                <div className="number">
                  {deals.filter(d => activeStores.includes(d.store)).length}
                </div>
                <div className="label">Ugens Kup</div>
              </div>
              <div className="stat-box">
                <div className="number">{recipes.length}</div>
                <div className="label">Matcher Retter</div>
              </div>
            </div>

            <div className="section-title">
              <span>Ugens Bedste Kup ⚡️</span>
              <span className="side-link" onClick={() => setActiveTab('deals')}>Se alle</span>
            </div>

            <div className="deals-carousel">
              {deals.filter(d => d.saving >= 12 && activeStores.includes(d.store)).slice(0, 6).map(deal => {
                const isAdded = shoppingList.some(item => item.id === deal.id);
                return (
                  <div key={deal.id} className="carousel-card">
                    <img src={deal.imageUrl || 'https://via.placeholder.com/150'} alt={deal.item} />
                    <span className="store-tag" style={{
                      backgroundColor: SUPERMARKETS.find(s => s.name === deal.store)?.bgColor || '#ECECEC',
                      color: SUPERMARKETS.find(s => s.name === deal.store)?.color || '#333',
                      fontSize: '8px',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                    }}>
                      {deal.store}
                    </span>
                    <div className="item-name">{deal.item}</div>
                    <div className="price-row">
                      <span className="price">{deal.price} kr.</span>
                      <span className="normal-price">{deal.normalPrice} kr.</span>
                    </div>
                    
                    <button 
                      onClick={() => addDealToShoppingList(deal)}
                      className="btn-add-circle"
                      style={{
                        position: 'absolute',
                        top: '66px',
                        right: '16px',
                        width: '28px',
                        height: '28px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}
                    >
                      {isAdded ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ marginTop: '20px', padding: '18px', cursor: 'pointer' }} onClick={() => setActiveTab('recipes')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Hvad kan jeg lave billigst? 🍳</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Find opskrifter sorteret efter ugens højeste match.</p>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
            
            <div className="card" style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Mine butikker: {activeStores.join(', ')}. Slå uønskede butikker fra under <b>Indstillinger</b> for at optimere dine madplaner.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: DEALS BROWSER */}
        {activeTab === 'deals' && (
          <div className="page-fade-active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="header-container">
              <div className="date">Ugens kupaviser</div>
              <h1>Find Tilbud</h1>
            </div>

            <div className="search-container">
              <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                placeholder="Søg på 'hakket kød', 'smør', 'grønt'..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && <X size={16} onClick={() => setSearchQuery('')} style={{ cursor: 'pointer', color: 'var(--text-tertiary)' }} />}
            </div>

            {/* Store selection slider */}
            <div className="horizontal-selector">
              <div 
                className={`selector-pill ${selectedStore === 'Alle' ? 'active' : ''}`}
                onClick={() => setSelectedStore('Alle')}
              >
                Aktive butikker
              </div>
              {SUPERMARKETS.filter(s => activeStores.includes(s.name)).map(store => (
                <div 
                  key={store.name} 
                  className={`selector-pill ${selectedStore === store.name ? 'active' : ''}`}
                  onClick={() => setSelectedStore(store.name)}
                >
                  {store.name}
                </div>
              ))}
            </div>

            {/* Category selection slider */}
            <div className="horizontal-selector">
              {CATEGORIES.map(cat => (
                <div 
                  key={cat} 
                  className={`selector-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  {cat}
                </div>
              ))}
            </div>

            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{filteredDeals.length} tilbud fundet</span>
              
              {/* Segmented View Switcher */}
              <div className="view-switcher">
                <button 
                  className={`view-btn ${dealsViewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setDealsViewMode('list')}
                  title="Liste"
                >
                  <List size={13} />
                  <span>Liste</span>
                </button>
                <button 
                  className={`view-btn ${dealsViewMode === 'small' ? 'active' : ''}`}
                  onClick={() => setDealsViewMode('small')}
                  title="Fliser"
                >
                  <Grid size={13} />
                  <span>Fliser</span>
                </button>
                <button 
                  className={`view-btn ${dealsViewMode === 'large' ? 'active' : ''}`}
                  onClick={() => setDealsViewMode('large')}
                  title="Kort"
                >
                  <Layout size={13} />
                  <span>Kort</span>
                </button>
              </div>
            </div>

            <div className={`deals-grid view-${dealsViewMode}`} style={{ flex: 1, overflowY: 'auto' }}>
              {filteredDeals.length > 0 ? (
                filteredDeals.map(deal => {
                  const isAdded = shoppingList.some(item => item.id === deal.id);
                  const storeStyle = SUPERMARKETS.find(s => s.name === deal.store);
                  return (
                    <div key={deal.id} className="deal-list-item">
                      <img src={deal.imageUrl || 'https://via.placeholder.com/150'} alt={deal.item} />
                      <div className="deal-info">
                        <h4>{deal.item}</h4>
                        <div className="deal-meta">
                          <span className="store-tag" style={{
                            backgroundColor: storeStyle?.bgColor || '#ECECEC',
                            color: storeStyle?.color || '#333'
                          }}>
                            {deal.store}
                          </span>
                          {deal.isMemberDeal && deal.memberType && (
                            <span className={`member-badge badge-member-${deal.store.toLowerCase().replace(' ', '-')}`}>
                              {deal.memberType}
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{deal.unit}</span>
                        </div>
                      </div>
                      <div className="deal-prices">
                        <span className="price">{deal.price} kr.</span>
                        <span className="saving">Spar {deal.saving} kr.</span>
                      </div>
                      <button 
                        onClick={() => addDealToShoppingList(deal)}
                        className={`btn-add-circle ${isAdded ? 'added' : ''}`}
                      >
                        {isAdded ? <Check size={16} /> : <Plus size={16} />}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Ingen tilbud fundet. Prøv at søge efter noget andet eller tjek dine butiksindstillinger.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: RECIPES BROWSER */}
        {activeTab === 'recipes' && (
          <div className="page-fade-active">
            <div className="header-container">
              <div className="date">Mest økonomiske retter</div>
              <h1>Spar med Retter</h1>
            </div>

            <div className="highlight-banner" style={{ padding: '12px 14px', marginBottom: '16px' }}>
              <Info size={16} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
              <p style={{ fontSize: '11.5px', color: '#3b5a4a', lineHeight: 1.4 }}>
                Beregnes udelukkende på tilbud fra dine <b>{activeStores.length} aktive butikker</b>. Du kan slå flere butikker til under Indstillinger!
              </p>
            </div>

            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 12px 0' }}>
              <span>{sortedRecipes.length} retter foreslået</span>
              
              {/* Segmented View Switcher */}
              <div className="view-switcher">
                <button 
                  className={`view-btn ${recipesViewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setRecipesViewMode('list')}
                  title="Liste"
                >
                  <List size={13} />
                  <span>Liste</span>
                </button>
                <button 
                  className={`view-btn ${recipesViewMode === 'small' ? 'active' : ''}`}
                  onClick={() => setRecipesViewMode('small')}
                  title="Fliser"
                >
                  <Grid size={13} />
                  <span>Fliser</span>
                </button>
                <button 
                  className={`view-btn ${recipesViewMode === 'large' ? 'active' : ''}`}
                  onClick={() => setRecipesViewMode('large')}
                  title="Kort"
                >
                  <Layout size={13} />
                  <span>Kort</span>
                </button>
              </div>
            </div>

            <div className={`recipes-grid view-${recipesViewMode}`}>
              {sortedRecipes.map(recipe => {
                let badgeClass = 'badge-gray';
                let scoreText = 'Ingen kup';
                
                if (recipe.stats.matchScore >= 75) {
                  badgeClass = 'badge-green';
                  scoreText = `Ugens Super-Kup! Spar ${recipe.stats.saving} kr.`;
                } else if (recipe.stats.matchScore >= 40) {
                  badgeClass = 'badge-green';
                  scoreText = `Gode besparelser. Spar ${recipe.stats.saving} kr.`;
                } else if (recipe.stats.saving > 0) {
                  badgeClass = 'badge-gray';
                  scoreText = `Spar ${recipe.stats.saving} kr.`;
                }

                return (
                  <div key={recipe.id} className="recipe-card" onClick={() => setSelectedRecipe(recipe)}>
                    <div className="recipe-card-img-wrapper">
                      <img src={recipe.image} alt={recipe.name} />
                      <div className="recipe-match-overlay">
                        <span className={`badge ${badgeClass}`} style={{ 
                          fontSize: '12px', 
                          fontWeight: 700,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                          padding: '6px 12px',
                          backgroundColor: '#FFFFFF',
                          color: recipe.stats.matchScore > 0 ? 'var(--accent-green)' : 'var(--text-secondary)'
                        }}>
                          {recipe.stats.matchScore}% Match
                        </span>
                      </div>
                    </div>
                    <div className="recipe-card-content">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '2px' }}>
                        {recipe.tags.map(t => (
                          <span key={t} style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>{t} •</span>
                        ))}
                      </div>
                      <h3>{recipe.name}</h3>
                      <p className="desc">{recipe.description}</p>
                      
                      <div className="recipe-card-stats">
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div className="recipe-stat-item">
                            <Clock size={12} />
                            <span>{recipe.prepTime} min</span>
                          </div>
                          <div className="recipe-stat-item">
                            <Users size={12} />
                            <span>{recipe.servings} pers</span>
                          </div>
                        </div>
                        <div className="recipe-price-calc">
                          <div>Kun {recipe.stats.totalPrice} kr.</div>
                          <div className="saving-pill">{scoreText}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: SMART SHOPPING LIST */}
        {activeTab === 'shopping' && (
          <div className="page-fade-active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div className="date">Organiseret indkøb</div>
                <h1>Indkøbsliste</h1>
              </div>
              {shoppingList.length > 0 && (
                <span className="side-link" onClick={clearShoppingList} style={{ color: 'var(--accent-red)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Tøm liste
                </span>
              )}
            </div>

            {/* Smart input bar */}
            <div className="shopping-input-container">
              <form onSubmit={handleAddCustomItem} className="shopping-input-row">
                <input 
                  type="text" 
                  placeholder="Tilføj egen vare (fx 'kaffe', 'smør')..." 
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                />
                <select 
                  value={customItemStore} 
                  onChange={(e) => setCustomItemStore(e.target.value)}
                >
                  <option value="Fælles indkøb">Andet</option>
                  {SUPERMARKETS.filter(s => activeStores.includes(s.name)).map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <button type="submit">
                  <Plus size={18} />
                </button>
              </form>

              {/* Dynamic suggestion card */}
              {suggestedDeal && (
                <div className="suggestion-chip" onClick={addSuggestedDealDirectly}>
                  <div className="suggestion-chip-left">
                    <Sparkles size={13} style={{ flexShrink: 0 }} />
                    <span>
                      Ugens kup: <b>{suggestedDeal.item}</b> i <b>{suggestedDeal.store}</b> til kun <b>{suggestedDeal.price} kr.</b> (Spar {suggestedDeal.saving} kr.!)
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', textDecoration: 'underline', fontWeight: 700, flexShrink: 0, marginLeft: '6px' }}>Tilføj</span>
                </div>
              )}
            </div>

            {shoppingList.length === 0 ? (
              <div className="shopping-empty">
                <ShoppingCart />
                <h3>Din indkøbsliste er tom</h3>
                <p>
                  Skriv en vare i feltet ovenfor, eller tilføj tilbud og ingredienser under <b>Tilbud</b> og <b>Opskrifter</b>!
                </p>
                <button className="btn-primary" onClick={() => setActiveTab('recipes')}>
                  Find opskrifter nu
                </button>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                
                {/* Group items by Supermarket / Fælles Indkøb */}
                {Array.from(new Set(shoppingList.map(item => item.store))).map(storeName => {
                  const storeItems = shoppingList.filter(item => item.store === storeName);
                  const storeStyle = SUPERMARKETS.find(s => s.name === storeName);
                  return (
                    <div key={storeName} className="store-shopping-group">
                      <div className="store-shopping-header">
                        <span className="store-tag" style={{
                          backgroundColor: storeStyle?.bgColor || '#F1F3F5',
                          color: storeStyle?.color || 'var(--text-secondary)',
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          {storeName}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {storeItems.filter(i => !i.checked).reduce((acc, curr) => acc + curr.price, 0)} kr.
                        </span>
                      </div>

                      <div className="shopping-items-list">
                        {storeItems.map(item => (
                          <div 
                            key={item.id} 
                            className={`shopping-item ${item.checked ? 'checked' : ''}`}
                            onClick={() => toggleShoppingItem(item.id)}
                          >
                            <div className="shopping-item-checkbox">
                              <span className="custom-checkbox">
                                {item.checked && <Check size={14} strokeWidth={3} />}
                              </span>
                              <div>
                                <div className="shopping-item-name">{item.displayName}</div>
                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{item.unit}</span>
                              </div>
                            </div>
                            <div className="shopping-item-info">
                              {item.price > 0 ? (
                                <>
                                  <span className="shopping-item-price">{item.price} kr.</span>
                                  {item.saving > 0 && (
                                    <span className="shopping-item-sale-info">Spar {item.saving} kr.</span>
                                  )}
                                </>
                              ) : (
                                <span className="shopping-item-price" style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>Egen vare</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Totals Summary */}
                <div className="shopping-totals-card">
                  <div className="totals-row">
                    <span>Varer i alt (ikke krydset af):</span>
                    <span>{shoppingList.filter(i => !i.checked).length} stk.</span>
                  </div>
                  {totalShoppingSavings > 0 && (
                    <div className="totals-row" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                      <span>Din ugentlige besparelse:</span>
                      <span>Spar {totalShoppingSavings} kr.</span>
                    </div>
                  )}
                  <div className="totals-row grand-total">
                    <span>Forventet total:</span>
                    <span>{totalShoppingPrice} kr.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SETTINGS & CONTROLS */}
        {activeTab === 'settings' && (
          <div className="page-fade-active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="header-container">
              <div className="date">Personlige præferencer</div>
              <h1>Indstillinger</h1>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              
              {/* Group 1: Store Configuration */}
              <div className="settings-group">
                <h3>Mine supermarkeder</h3>
                <div className="settings-list">
                  {SUPERMARKETS.map(store => {
                    const isActive = activeStores.includes(store.name);
                    return (
                      <div key={store.name} className="settings-row" onClick={() => toggleStoreSetting(store.name)}>
                        <div className="settings-row-label">
                          <span className="store-tag" style={{
                            backgroundColor: store.bgColor,
                            color: store.color || '#333',
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            {store.name}
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {deals.filter(d => d.store === store.name).length} aktive tilbud
                          </span>
                        </div>
                        <label className="switch" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isActive}
                            onChange={() => toggleStoreSetting(store.name)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Pricing & Matching Configuration */}
              <div className="settings-group">
                <h3>Pris- & matchindstillinger</h3>
                <div className="settings-list">
                  <div className="settings-row" onClick={() => setIncludeMemberDeals(!includeMemberDeals)}>
                    <div className="settings-row-label">
                      <div>
                        <div>Inkluder medlemstilbud</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 400 }}>
                          Brug priser fra Lidl Plus, Coop Medlem, Meny Kundeklub og Salling Plus i madplaner
                        </div>
                      </div>
                    </div>
                    <label className="switch" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={includeMemberDeals}
                        onChange={() => setIncludeMemberDeals(!includeMemberDeals)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Group 3: Scraping Configuration */}
              <div className="settings-group">
                <h3>Automatiseret scraping</h3>
                <div className="settings-list">
                  <div className="settings-row" onClick={() => setAutoScrape(!autoScrape)}>
                    <div className="settings-row-label">
                      <div>
                        <div>Baggrundsscraping</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 400 }}>
                          Hent automatisk nye tilbudsaviser ved opstart
                        </div>
                      </div>
                    </div>
                    <label className="switch" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={autoScrape}
                        onChange={() => setAutoScrape(!autoScrape)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Group 4: Collapsible Manual Scraper Accordion */}
              <div className="settings-group">
                <h3>Avancerede værktøjer</h3>
                
                <div 
                  className="accordion-header" 
                  onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={16} />
                    <span>Scraper Konsol ^& Terminal</span>
                  </div>
                  {isConsoleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                <div className={`accordion-content ${isConsoleOpen ? 'open' : ''}`}>
                  <div className="scraper-stats-row">
                    <div className="stat-box" style={{ padding: '10px' }}>
                      <div className="number" style={{ fontSize: '18px' }}>6</div>
                      <div className="label">Kilder i alt</div>
                    </div>
                    <div className="stat-box" style={{ padding: '10px' }}>
                      <div className="number" style={{ fontSize: '18px' }}>
                        {scraperStatus === 'completed' ? 'Opdateret' : 'Standard'}
                      </div>
                      <div className="label">Database status</div>
                    </div>
                  </div>

                  {/* Terminal Log Console */}
                  <div className="console-container" style={{ height: '200px' }}>
                    <div className="console-header">
                      <div className="console-title">
                        <span className={`console-dot ${scraperStatus === 'scraping' ? 'scraping' : ''}`}></span>
                        maaaaad-scraper-terminal.sh
                      </div>
                    </div>
                    <div className="console-logs">
                      {scraperLogs.map((log, index) => (
                        <div key={index} className={log.type}>
                          [{log.time}] {log.text}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </div>

                  {/* Progressive Scraper Loader Bars */}
                  {scraperStatus === 'scraping' && (
                    <div className="scraper-progress-section" style={{ marginBottom: '14px' }}>
                      {Object.entries(scraperProgress).map(([store, progress]) => {
                        let activeFillClass = 'progress-bar-fill';
                        if (store === 'Meny') activeFillClass += ' active-meny';
                        else if (store === 'Rema 1000') activeFillClass += ' active-rema';
                        else if (store === 'Netto') activeFillClass += ' active-netto';
                        else if (store === 'Lidl') activeFillClass += ' active-lidl';
                        else if (store === 'Coop 365') activeFillClass += ' active-coop';
                        else if (store === 'Føtex') activeFillClass += ' active-fotex';
                        
                        return (
                          <div key={store} className="progress-row" style={{ gap: '2px' }}>
                            <div className="progress-info" style={{ fontSize: '10px' }}>
                              <span>{store}</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="progress-bar-bg" style={{ height: '4px' }}>
                              <div className={activeFillClass} style={{ width: `${progress}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button 
                    className={`btn-primary ${scraperStatus === 'scraping' ? 'disabled' : 'secondary-style'}`}
                    onClick={runScraper}
                    disabled={scraperStatus === 'scraping'}
                    style={{
                      backgroundColor: scraperStatus === 'scraping' ? '#ECECEC' : 'var(--text-primary)',
                      color: scraperStatus === 'scraping' ? '#A0A0A0' : '#FFFFFF',
                      cursor: scraperStatus === 'scraping' ? 'not-allowed' : 'pointer',
                      padding: '10px 14px',
                      fontSize: '13px'
                    }}
                  >
                    {scraperStatus === 'scraping' ? 'Arbejder...' : 'Kør manuel scanning'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* RECIPE DETAILS MODAL (BOTTOM SLIDING SHEET WITH DYNAMIC SHOPPING STRATEGIES) */}
      {selectedRecipe && (() => {
        // Calculate dynamic stats for this recipe based on user's current MODAL Strategy!
        const stats = calculateRecipeStatsWithStrategy(selectedRecipe, modalStrategy, modalSpecificStore);
        return (
          <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <img src={selectedRecipe.image} alt={selectedRecipe.name} />
                <button className="modal-close-btn" onClick={() => setSelectedRecipe(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-recipe-title">{selectedRecipe.name}</div>
                <div className="modal-recipe-desc">{selectedRecipe.description}</div>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div className="recipe-stat-item" style={{ fontSize: '13px' }}>
                    <Clock size={16} />
                    <span><b>{selectedRecipe.prepTime}</b> minutter</span>
                  </div>
                  <div className="recipe-stat-item" style={{ fontSize: '13px' }}>
                    <Users size={16} />
                    <span><b>{selectedRecipe.servings}</b> portioner</span>
                  </div>
                </div>

                {/* Phase 3 Segmented Control for Strategy Selection */}
                <div className="modal-section-title" style={{ borderBottom: 'none', marginBottom: '8px' }}>
                  Beregning ^& Indkøb Strategy
                </div>
                <div className="strategy-selector">
                  <button 
                    className={`strategy-pill ${modalStrategy === 'mix' ? 'active' : ''}`}
                    onClick={() => setModalStrategy('mix')}
                  >
                    Bland butikker
                  </button>
                  <button 
                    className={`strategy-pill ${modalStrategy === 'single' ? 'active' : ''}`}
                    onClick={() => setModalStrategy('single')}
                  >
                    Enkeltbutik
                  </button>
                  <button 
                    className={`strategy-pill ${modalStrategy === 'specific' ? 'active' : ''}`}
                    onClick={() => setModalStrategy('specific')}
                  >
                    Vælg butik...
                  </button>
                </div>

                {/* Supermarket selector slider if 'specific' store is chosen */}
                {modalStrategy === 'specific' && (
                  <div className="modal-store-selector">
                    {SUPERMARKETS.filter(s => activeStores.includes(s.name)).map(store => (
                      <button
                        key={store.name}
                        className={`modal-store-pill ${modalSpecificStore === store.name ? 'active' : ''}`}
                        onClick={() => setModalSpecificStore(store.name)}
                      >
                        {store.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Dynamic Strategy Info Advice Card */}
                {modalStrategy === 'mix' && (
                  <div className="strategy-info-box">
                    <Info size={16} style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '11px' }}>
                      Blander ugesedler fra <span className="highlight">alle aktive butikker</span> for at opnå den absolut maksimale besparelse.
                    </div>
                  </div>
                )}

                {modalStrategy === 'single' && (
                  <div className="strategy-info-box">
                    <Info size={16} style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '11px' }}>
                      Køb alt samlet ét sted. <span className="highlight">{stats.cheapestStoreName}</span> gør hele retten billigst samlet til <span className="highlight">{stats.cheapestStorePrice} kr.</span> (Spar {stats.cheapestStoreSaving} kr.!).
                    </div>
                  </div>
                )}

                {modalStrategy === 'specific' && (
                  <div className="strategy-info-box">
                    <Info size={16} style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '11px' }}>
                      Evaluerer kun tilbud fra <span className="highlight">{modalSpecificStore}</span>. Alt andet købes i butikken til normal basispris.
                    </div>
                  </div>
                )}

                <div className="modal-section-title">
                  Ingredienser i denne uge ({stats.totalPrice} kr.)
                </div>

                <div className="modal-ingredients-list">
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    if (ing.isBasis) {
                      return (
                        <div key={idx} className="ingredient-item">
                          <div className="ingredient-left">
                            <span className="ingredient-name basis">{ing.displayName}</span>
                          </div>
                          <span className="ingredient-amount">Pantry / basis</span>
                        </div>
                      );
                    }

                    // Retrieve pricing for this ingredient respecting current strategy!
                    const priceInfo = getIngredientPriceInfoWithStrategy(
                      ing.name, 
                      modalStrategy, 
                      modalSpecificStore, 
                      stats.cheapestStoreName
                    );
                    const storeStyle = SUPERMARKETS.find(s => s.name === priceInfo.store);

                    return (
                      <div key={idx} className="ingredient-item">
                        <div className="ingredient-left">
                          <div>
                            <div className="ingredient-name">{priceInfo.onSale ? priceInfo.displayName : ing.displayName}</div>
                            <span className="ingredient-amount">{ing.amount}</span>
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <span className="ingredient-price" style={{ fontSize: '13px', fontWeight: 700 }}>
                            {priceInfo.price} kr.
                          </span>
                          <div style={{ marginTop: '2px' }}>
                            {priceInfo.onSale ? (
                              <span className="store-tag" style={{
                                backgroundColor: storeStyle?.bgColor,
                                color: storeStyle?.color,
                                fontSize: '8px',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                fontWeight: 700
                              }}>
                                TILBUD {priceInfo.store}
                              </span>
                            ) : (
                              <span className="store-tag" style={{
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)',
                                fontSize: '8px',
                                padding: '1px 4px',
                                borderRadius: '4px'
                              }}>
                                Normalpris
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="modal-section-title">Fremgangsmåde</div>
                <div style={{ marginBottom: '20px' }}>
                  {selectedRecipe.instructions.map((step, idx) => (
                    <div key={idx} className="instruction-step">
                      <div className="step-number">{idx + 1}</div>
                      <div className="step-text">{step}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-primary secondary-style"
                  onClick={() => {
                    // Phase 3: Add to shopping list dynamically respecting selected strategy!
                    addRecipeToShoppingListWithStrategy(selectedRecipe, modalStrategy, modalSpecificStore);
                    setSelectedRecipe(null);
                  }}
                >
                  <ShoppingCart size={16} />
                  Tilføj ingredienser ({stats.totalPrice} kr.)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* iOS App Navigation Tab Bar */}
      <div className="app-tab-bar">
        <button 
          className={`tab-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Home />
          <span>Hjem</span>
        </button>

        <button 
          className={`tab-item ${activeTab === 'deals' ? 'active' : ''}`}
          onClick={() => setActiveTab('deals')}
        >
          <Tag />
          <span>Tilbud</span>
        </button>

        <button 
          className={`tab-item ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          <BookOpen />
          <span>Opskrifter</span>
        </button>

        <button 
          className={`tab-item ${activeTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping')}
        >
          <ShoppingCart />
          <span>Indkøb</span>
          {shoppingList.filter(i => !i.checked).length > 0 && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: 'calc(50% - 22px)',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              fontSize: '8px',
              fontWeight: 700,
              width: '15px',
              height: '15px',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {shoppingList.filter(i => !i.checked).length}
            </span>
          )}
        </button>

        <button 
          className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings />
          <span>Indstillinger</span>
        </button>
      </div>

      {/* iOS Home Indicator Bar */}
      <div className="app-home-indicator">
        <div className="bar"></div>
      </div>

      {/* Global minimal Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'absolute',
          bottom: '88px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: '#FFFFFF',
          padding: '8px 16px',
          borderRadius: '30px',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backdropFilter: 'blur(5px)'
        }}>
          <Sparkles size={12} style={{ color: '#FFE000' }} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
