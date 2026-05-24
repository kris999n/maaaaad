import { useState, useEffect, useRef, useMemo } from 'react';
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
  Layout,
  Calendar,
  Heart
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
import { VALDEMARSRO_ARLA_RECIPES } from './data/scrapedRecipes';

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

interface IngredientPriceInfo {
  onSale: boolean;
  price: number;
  normalPrice: number;
  saving: number;
  store: string;
  displayName: string;
  unit: string;
  inFridge?: boolean;
}

// Scraper log structure
interface LogMessage {
  text: string;
  type: 'info' | 'success' | 'warning';
  time: string;
}

// Helper to scale ingredient amounts for servings adjuster
const scaleIngredientAmount = (amountStr: string, scaleFactor: number): string => {
  if (!amountStr) return '';
  // Match numbers, decimals, fractions (e.g. 1.5, 1,5, 1/2)
  const regex = /(\d+[\.,]\d+|\d+\/\d+|\d+)/g;
  return amountStr.replace(regex, (match) => {
    if (match.includes('/')) {
      const [num, den] = match.split('/').map(Number);
      const val = (num / den) * scaleFactor;
      return val % 1 === 0 ? val.toString() : val.toFixed(1);
    }
    const normalized = match.replace(',', '.');
    const val = Number(normalized) * scaleFactor;
    const formatted = val % 1 === 0 ? val.toString() : val.toFixed(1);
    return formatted.replace('.', ',');
  });
};

// Strict matching helper to prevent false positive deal matches (e.g. "løg" matching "hvidløg")
const isIngredientMatchingDeal = (ingName: string, dealItem: string): boolean => {
  const ing = ingName.toLowerCase().trim();
  const deal = dealItem.toLowerCase().trim();
  
  if (ing === deal) return true;
  
  // Specific exclusions and strict rules for short words to prevent false matching:
  // e.g. "løg" should not match garlic ("hvidløg") or spring onions ("forårsløg")
  if (ing === 'løg') {
    return deal === 'løg' || deal === 'rødløg' || deal === 'skalotteløg' || deal.split(' ').includes('løg') || deal.startsWith('løg ');
  }
  if (ing === 'ris') {
    return deal === 'ris' || deal === 'jasminris' || deal === 'basmatiris' || deal.split(' ').includes('ris') || deal.endsWith('ris');
  }
  if (ing === 'æg') {
    return deal === 'æg' || (deal.includes('æg') && !deal.includes('bacon') && !deal.includes('gær'));
  }
  if (ing === 'smør') {
    return deal.includes('smør') || deal.includes('smørbar');
  }
  if (ing === 'pasta') {
    return deal.includes('pasta') || deal.includes('spaghetti') || deal.includes('skruer') || deal.includes('penne');
  }
  if (ing === 'bacon') {
    return deal.includes('bacon');
  }
  if (ing === 'gulerødder') {
    return deal.includes('gulerød') || deal.includes('gulerod') || deal.includes('gulerødder');
  }
  
  return deal.includes(ing) || ing.includes(deal);
};

export default function App() {
  // Detect if running on mobile device or installed as PWA standalone
  const shouldHideMockControls = useMemo(() => {
    if (typeof window === "undefined") return false;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    return isMobile || isStandalone;
  }, []);

  // App navigation
  const [activeTab, setActiveTab] = useState<'home' | 'deals' | 'recipes' | 'shopping' | 'settings'>('home');
  
  // Database States (updated by Scraper)
  const [deals, setDeals] = useState<Deal[]>(LIVE_DEALS.length > 0 ? LIVE_DEALS : INITIAL_DEALS);
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    // Return INITIAL_RECIPES and VALDEMARSRO_ARLA_RECIPES combined
    return [...INITIAL_RECIPES, ...VALDEMARSRO_ARLA_RECIPES];
  });
  
  // Recipe filters and searching
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [selectedRecipeSource, setSelectedRecipeSource] = useState<'all' | 'valdemarsro' | 'arla'>('all');

  // Portion/servings adjustment states
  const [adjustedServings, setAdjustedServings] = useState<number | null>(null);

  // Scraper recipe sources active checkboxes
  const [activeRecipeSources, setActiveRecipeSources] = useState<Record<string, boolean>>({
    valdemarsro: true,
    arla: true,
    madbanditten: false
  });
  // Custom scraped recipe domains list
  const [customSources, setCustomSources] = useState<string[]>([]);
  const [newCustomSource, setNewCustomSource] = useState('');
  
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
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
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
  
  // Phase 5: Sorting & Zero Waste States
  const [dealsSortBy, setDealsSortBy] = useState<'saving' | 'price' | 'name'>('saving');
  const [recipesSortBy, setRecipesSortBy] = useState<'match' | 'price' | 'time' | 'health' | 'saving'>('match');
  const [recipesVisibleCount, setRecipesVisibleCount] = useState(24);
  const [fridgeItems, setFridgeItems] = useState<string[]>([]);
  const [newFridgeItem, setNewFridgeItem] = useState<string>('');
  const [isFridgeOpen, setIsFridgeOpen] = useState<boolean>(false);

  // Synchronize adjustedServings when selectedRecipe opens
  useEffect(() => {
    if (selectedRecipe) {
      setAdjustedServings(selectedRecipe.servings);
      setCheckedIngredients({});
      setCompletedSteps({});
    } else {
      setAdjustedServings(null);
      setCheckedIngredients({});
      setCompletedSteps({});
    }
  }, [selectedRecipe]);

  // Reset pagination when search parameters change
  useEffect(() => {
    setRecipesVisibleCount(24);
  }, [recipeSearchQuery, selectedRecipeSource, recipesSortBy]);
  
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
  const getIngredientNormalPriceInfo = (ingredientName: string): IngredientPriceInfo => {
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
  const getIngredientPriceInfo = (ingredientName: string): IngredientPriceInfo => {
    // Zero waste leftovers check first!
    const isOwned = fridgeItems.some(item => 
      item.trim().toLowerCase() === ingredientName.trim().toLowerCase() ||
      ingredientName.toLowerCase().includes(item.trim().toLowerCase())
    );
    
    if (isOwned) {
      return {
        onSale: true,
        inFridge: true,
        price: 0,
        normalPrice: 0,
        saving: 0,
        store: 'Mit Køleskab',
        displayName: `${ingredientName} (Ejes)`,
        unit: 'I køleskab'
      };
    }

    const matchedDeals = matcherDeals.filter(d => 
      activeStores.includes(d.store) && isIngredientMatchingDeal(ingredientName, d.item)
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
        
        // Zero waste leftovers check
        const isOwned = fridgeItems.some(item => 
          item.trim().toLowerCase() === ing.name.trim().toLowerCase() ||
          ing.name.toLowerCase().includes(item.trim().toLowerCase())
        );
        
        if (isOwned) return; // Already owned! Cost is 0, so skip adding to totals!

        const matchedDeals = matcherDeals.filter(d => 
          d.store === storeName && isIngredientMatchingDeal(ing.name, d.item)
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
  ): IngredientPriceInfo => {
    // Zero waste leftovers check first!
    const isOwned = fridgeItems.some(item => 
      item.trim().toLowerCase() === ingredientName.trim().toLowerCase() ||
      ingredientName.toLowerCase().includes(item.trim().toLowerCase())
    );
    
    if (isOwned) {
      return {
        onSale: true,
        inFridge: true,
        price: 0,
        normalPrice: 0,
        saving: 0,
        store: 'Mit Køleskab',
        displayName: `${ingredientName} (Ejes)`,
        unit: 'I køleskab'
      };
    }

    if (strategy === 'mix') {
      return getIngredientPriceInfo(ingredientName);
    }
    
    const targetStore = strategy === 'single' ? cheapestSingleStoreName : specificStoreName;
    
    const matchedDeals = matcherDeals.filter(d => 
      d.store === targetStore && isIngredientMatchingDeal(ingredientName, d.item)
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

  // Zero Waste Fridge left-overs helper controls
  const handleAddFridgeItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item = newFridgeItem.trim();
    if (item) {
      if (!fridgeItems.some(i => i.toLowerCase() === item.toLowerCase())) {
        setFridgeItems(prev => [...prev, item]);
        setNewFridgeItem('');
        showToast(`Tilføjede "${item}" til dit køleskab!`);
      } else {
        showToast(`"${item}" er allerede i dit køleskab`);
      }
    }
  };

  const handleRemoveFridgeItem = (itemToRemove: string) => {
    setFridgeItems(prev => prev.filter(item => item !== itemToRemove));
    showToast(`Fjernet "${itemToRemove}" fra dit køleskab`);
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
    const scaleFactor = adjustedServings ? adjustedServings / recipe.servings : 1;

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
        const scaledAmount = scaleIngredientAmount(ing.amount, scaleFactor);
        const scaledUnit = priceInfo.unit ? scaleIngredientAmount(priceInfo.unit, scaleFactor) : scaledAmount;
        
        newItems.push({
          id: itemKey,
          name: ing.name,
          displayName: priceInfo.onSale ? priceInfo.displayName : ing.displayName,
          price: Math.round(priceInfo.price * scaleFactor),
          normalPrice: Math.round(priceInfo.normalPrice * scaleFactor),
          saving: Math.round(priceInfo.saving * scaleFactor),
          store: priceInfo.store === 'Normalpris' ? 'Fælles indkøb' : priceInfo.store,
          unit: scaledUnit,
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
    
    // Dynamic progress bar keys based on settings checkboxes + custom domains!
    const initialProgress: Record<string, number> = {
      'Meny': 0, 'Rema 1000': 0, 'Netto': 0, 'Lidl': 0, 'Coop 365': 0, 'Føtex': 0
    };
    if (activeRecipeSources.valdemarsro) initialProgress['Valdemarsro'] = 0;
    if (activeRecipeSources.arla) initialProgress['Arla'] = 0;
    if (activeRecipeSources.madbanditten) initialProgress['Madbanditten'] = 0;
    customSources.forEach(src => {
      initialProgress[src] = 0;
    });
    initialProgress['Opskrifter'] = 0;
    
    setScraperProgress(initialProgress);
    
    const logs: LogMessage[] = [
      { text: 'Initialiserer maaaaad intelligent scraper v2.6...', type: 'info', time: getCurrentTime() }
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
      appendLog('[NETTO] & [COOP 365] Scraper ugentlige discounttilbud...', 'info');
      setScraperProgress(prev => ({ ...prev, 'Netto': 85, 'Coop 365': 70 }));
    }, 3600);

    setTimeout(() => {
      appendLog('[NETTO] Fandt fantastisk tilbud på bacon (Spar 50%) og smør!', 'success');
      appendLog('[LIDL] & [FØTEX] Behandler fisk- og grønttilbud...', 'info');
      setScraperProgress(prev => ({ ...prev, 'Netto': 100, 'Coop 365': 100, 'Lidl': 100, 'Føtex': 80 }));
    }, 4400);

    setTimeout(() => {
      appendLog('[FØTEX] Behandlet 620 tilbud. Database synkroniseret.', 'success');
      setScraperProgress(prev => ({ ...prev, 'Føtex': 100 }));
    }, 5200);

    // Dynamic recipe scanning timeline based on settings!
    let timeOffset = 5200;
    
    if (activeRecipeSources.valdemarsro) {
      timeOffset += 900;
      setTimeout(() => {
        appendLog('[VALDEMARSRO] Etablerer sitemap scanning for 3.104 opskrifter...', 'info');
        setScraperProgress(prev => ({ ...prev, 'Valdemarsro': 40 }));
      }, timeOffset);

      timeOffset += 900;
      setTimeout(() => {
        appendLog('[VALDEMARSRO] Batch-hentet Schema metadata. 13 signatur-opskrifter overført til React.', 'success');
        setScraperProgress(prev => ({ ...prev, 'Valdemarsro': 100 }));
      }, timeOffset);
    }

    if (activeRecipeSources.arla) {
      timeOffset += 900;
      setTimeout(() => {
        appendLog('[ARLA] Etablerer sitemap scanning for 2.110 opskrifter...', 'info');
        setScraperProgress(prev => ({ ...prev, 'Arla': 40 }));
      }, timeOffset);

      timeOffset += 900;
      setTimeout(() => {
        appendLog('[ARLA] Batch-hentet Schema metadata. 13 mejeribaserede opskrifter overført.', 'success');
        setScraperProgress(prev => ({ ...prev, 'Arla': 100 }));
      }, timeOffset);
    }

    if (activeRecipeSources.madbanditten) {
      timeOffset += 900;
      setTimeout(() => {
        appendLog('[MADBANDITTEN] Etablerer forbindelse til Keto-arkiv...', 'info');
        setScraperProgress(prev => ({ ...prev, 'Madbanditten': 30 }));
      }, timeOffset);

      timeOffset += 900;
      setTimeout(() => {
        appendLog('[MADBANDITTEN] Fejl: Server nægtede forbindelse (CORS rate-limit). Indlæste standard fallbacks.', 'warning');
        setScraperProgress(prev => ({ ...prev, 'Madbanditten': 100 }));
      }, timeOffset);
    }

    // Custom sources loops!
    customSources.forEach((src) => {
      timeOffset += 900;
      setTimeout(() => {
        appendLog(`[CUSTOM] Scanner brugerdefineret kilde: ${src}...`, 'info');
        setScraperProgress(prev => ({ ...prev, [src]: 50 }));
      }, timeOffset);

      timeOffset += 900;
      setTimeout(() => {
        appendLog(`[CUSTOM] Kilde '${src}' færdigscannet! Fandt 0 nye Schema matches (indekseret i baggrunden).`, 'success');
        setScraperProgress(prev => ({ ...prev, [src]: 100 }));
      }, timeOffset);
    });

    // Database compile
    timeOffset += 900;
    setTimeout(() => {
      appendLog('[OPSKRIFTER] Analyserer samlet database på 5.214 opskrifter, parrer enheder og udregner Match Scores...', 'info');
      setScraperProgress(prev => ({ ...prev, 'Opskrifter': 60 }));
    }, timeOffset);

    timeOffset += 1000;
    setTimeout(() => {
      setDeals(prev => {
        const originalDeals = prev.filter(d => !d.id.startsWith('sc_'));
        return [...originalDeals, ...SCRAPED_DEALS_POOL];
      });
      
      setRecipes(prev => {
        const originalRecipes = prev.filter(r => !r.id.startsWith('rec_sc_') && !r.id.startsWith('rec_valdemarsro_') && !r.id.startsWith('rec_arla_'));
        
        const activeScrapedRecipes = [];
        if (activeRecipeSources.valdemarsro) {
          activeScrapedRecipes.push(...VALDEMARSRO_ARLA_RECIPES.filter(r => r.tags.includes('Valdemarsro')));
        }
        if (activeRecipeSources.arla) {
          activeScrapedRecipes.push(...VALDEMARSRO_ARLA_RECIPES.filter(r => r.tags.includes('Arla')));
        }
        
        return [...originalRecipes, ...SCRAPED_RECIPES_POOL, ...activeScrapedRecipes];
      });
      
      const totalSourcedRecipesCount = (activeRecipeSources.valdemarsro ? 3104 : 0) + (activeRecipeSources.arla ? 2110 : 0);
      
      appendLog(`[DATABASE] Succes! Indkapslet 5.214 opskrifter (${totalSourcedRecipesCount} aktive kilder). Indlæst i søge-databasen.`, 'success');
      appendLog('Scraping færdig. Alle opskrifter har fået opdateret deres Match Score!', 'success');
      setScraperProgress(prev => ({ ...prev, 'Opskrifter': 100 }));
      setScraperStatus('completed');
      setIsAutoScraped(true);
      showToast('Scraper færdig! Nye tilbud og opskrifter indlæst.');
    }, timeOffset);
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

  // Sort deals based on dealsSortBy state
  const sortedDeals = [...filteredDeals].sort((a, b) => {
    if (dealsSortBy === 'price') return a.price - b.price;
    if (dealsSortBy === 'saving') return b.saving - a.saving;
    if (dealsSortBy === 'name') return a.item.localeCompare(b.item, 'da');
    return 0;
  });

  // 1. Memoize recipe pricing stats to eliminate O(N) recalculations on search/filter renders!
  const recipesWithStats = useMemo(() => {
    return recipes.map((recipe: Recipe) => ({
      ...recipe,
      stats: calculateRecipeStats(recipe)
    }));
  }, [recipes, deals, activeStores]);

  // 2. Filter recipes based on recipeSearchQuery and selectedRecipeSource
  const filteredRecipes = useMemo(() => {
    const query = recipeSearchQuery.trim().toLowerCase();
    return recipesWithStats.filter((recipe: any) => {
      const matchesSearch = query === '' || 
                            recipe.name.toLowerCase().includes(query) || 
                            recipe.description.toLowerCase().includes(query) ||
                            recipe.tags.some((t: string) => t.toLowerCase().includes(query));
                            
      const matchesSource = selectedRecipeSource === 'all' || 
                            (selectedRecipeSource === 'valdemarsro' && recipe.tags.some((t: string) => t.toLowerCase() === 'valdemarsro')) ||
                            (selectedRecipeSource === 'arla' && recipe.tags.some((t: string) => t.toLowerCase() === 'arla'));
                            
      return matchesSearch && matchesSource;
    });
  }, [recipesWithStats, recipeSearchQuery, selectedRecipeSource]);

  // 3. Sort recipes by chosen sorting method
  const sortedRecipes = useMemo(() => {
    return [...filteredRecipes].sort((a: any, b: any) => {
      if (recipesSortBy === 'price') return a.stats.totalPrice - b.stats.totalPrice;
      if (recipesSortBy === 'time') return a.prepTime - b.prepTime;
      if (recipesSortBy === 'health') return (b.healthScore || 5) - (a.healthScore || 5);
      if (recipesSortBy === 'match') return b.stats.matchScore - a.stats.matchScore;
      if (recipesSortBy === 'saving') return b.stats.saving - a.stats.saving;
      return 0;
    });
  }, [filteredRecipes, recipesSortBy]);

  // 4. Lazy loader slice: slice the sorted array to limit active DOM nodes initially!
  const displayedRecipes = useMemo(() => {
    return sortedRecipes.slice(0, recipesVisibleCount);
  }, [sortedRecipes, recipesVisibleCount]);

  return (
    <div className="app-container">
      {/* Dynamic notch for desktop */}
      {!shouldHideMockControls && <div className="app-notch"></div>}
      
      {/* iOS Status Bar */}
      {!shouldHideMockControls && (
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
      )}

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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Sorter efter selector */}
                <select 
                  className="sort-select"
                  value={dealsSortBy}
                  onChange={(e) => setDealsSortBy(e.target.value as any)}
                >
                  <option value="saving">Sorter: Mest besparelse</option>
                  <option value="price">Sorter: Laveste pris</option>
                  <option value="name">Sorter: Navn (A-Å)</option>
                </select>

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
            </div>

            <div className={`deals-grid view-${dealsViewMode}`} style={{ flex: 1, overflowY: 'auto' }}>
              {sortedDeals.length > 0 ? (
                sortedDeals.map(deal => {
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

            {/* Elegant Recipe Search Bar */}
            <div className="search-bar-container" style={{ marginBottom: '12px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} className="search-icon" style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                placeholder="Søg i alle opskrifter..." 
                value={recipeSearchQuery}
                onChange={(e) => setRecipeSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-secondary)',
                  outline: 'none'
                }}
              />
              {recipeSearchQuery && (
                <X 
                  size={16} 
                  onClick={() => setRecipeSearchQuery('')} 
                  style={{ cursor: 'pointer', color: 'var(--text-tertiary)', position: 'absolute', right: '12px' }} 
                />
              )}
            </div>

            {/* Horizontal Source Selector */}
            <div className="horizontal-selector" style={{ marginBottom: '16px', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              <div 
                className={`selector-pill ${selectedRecipeSource === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedRecipeSource('all')}
                style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                Alle opskrifter
              </div>
              <div 
                className={`selector-pill ${selectedRecipeSource === 'valdemarsro' ? 'active' : ''}`}
                onClick={() => setSelectedRecipeSource('valdemarsro')}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="source-dot valdemarsro" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D4AF37', display: 'inline-block' }}></span>
                Valdemarsro
              </div>
              <div 
                className={`selector-pill ${selectedRecipeSource === 'arla' ? 'active' : ''}`}
                onClick={() => setSelectedRecipeSource('arla')}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="source-dot arla" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00A859', display: 'inline-block' }}></span>
                Arla
              </div>
            </div>

            <div className="highlight-banner" style={{ padding: '12px 14px', marginBottom: '16px' }}>
              <Info size={16} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
              <p style={{ fontSize: '11.5px', color: '#3b5a4a', lineHeight: 1.4 }}>
                Beregnes udelukkende på tilbud fra dine <b>{activeStores.length} aktive butikker</b>. Du kan slå flere butikker til under Indstillinger!
              </p>
            </div>

            {/* Zero Waste Fridge leftovers input panel */}
            <div className="zero-waste-panel" style={{ marginBottom: '16px' }}>
              <div 
                className="zero-waste-header" 
                onClick={() => setIsFridgeOpen(!isFridgeOpen)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-soft)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent-green)' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Zero Waste: Tøm dit køleskab</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 400, marginTop: '2px' }}>
                      {fridgeItems.length > 0 
                        ? `${fridgeItems.length} leftover varer gemt. Sparer penge automatisk!` 
                        : 'Har du rester liggende? Tilføj dem og spar penge automatisk!'}
                    </div>
                  </div>
                </div>
                {isFridgeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {isFridgeOpen && (
                <div 
                  className="zero-waste-body"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderTop: 'none',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px',
                    padding: '14px',
                    marginTop: '-4px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <form onSubmit={handleAddFridgeItem} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input 
                      type="text"
                      className="fridge-input"
                      placeholder="Skriv rest, fx 'gulerødder', 'letmælk'..."
                      value={newFridgeItem}
                      onChange={(e) => setNewFridgeItem(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        backgroundColor: 'var(--bg-primary)'
                      }}
                    />
                    <button 
                      type="submit"
                      className="btn-add-fridge"
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'var(--text-primary)',
                        color: 'var(--bg-primary)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Tilføj
                    </button>
                  </form>

                  {fridgeItems.length > 0 ? (
                    <div className="fridge-chips-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {fridgeItems.map(item => (
                        <span 
                          key={item} 
                          className="fridge-chip"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#E6F6EE',
                            color: '#00A859',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(0, 168, 89, 0.1)'
                          }}
                        >
                          {item}
                          <X 
                            size={12} 
                            onClick={() => handleRemoveFridgeItem(item)}
                            style={{ cursor: 'pointer', opacity: 0.8 }}
                          />
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px 0' }}>
                      Køleskabet er tomt. Skriv en ingrediens ovenfor for at starte.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 12px 0' }}>
              <span>{sortedRecipes.length} retter foreslået</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Sorter efter selector */}
                <select 
                  className="sort-select"
                  value={recipesSortBy}
                  onChange={(e) => setRecipesSortBy(e.target.value as any)}
                >
                  <option value="match">Sorter: Bedste match</option>
                  <option value="price">Sorter: Laveste pris</option>
                  <option value="time">Sorter: Korteste tid</option>
                  <option value="health">Sorter: Sundeste</option>
                  <option value="saving">Sorter: Penge sparet</option>
                </select>

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
            </div>

            <div className={`recipes-grid view-${recipesViewMode}`}>
              {displayedRecipes.map((recipe: any) => {
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
                      {recipe.stats.saving > 0 && (
                        <div className="recipe-savings-badge">
                          Spar {recipe.stats.saving} kr.
                        </div>
                      )}
                    </div>
                    <div className="recipe-card-content">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px', alignItems: 'center' }}>
                        {recipe.tags.some((t: string) => t.toLowerCase() === 'valdemarsro') && (
                          <span className="source-badge valdemarsro" style={{ 
                            fontSize: '8px', 
                            fontWeight: 800, 
                            color: '#bfa02c', 
                            border: '1px solid #d4af37', 
                            padding: '1px 5px', 
                            borderRadius: '4px',
                            backgroundColor: '#FCFAF0',
                            marginRight: '4px',
                            letterSpacing: '0.5px'
                          }}>VALDEMARSRO</span>
                        )}
                        {recipe.tags.some((t: string) => t.toLowerCase() === 'arla') && (
                          <span className="source-badge arla" style={{ 
                            fontSize: '8px', 
                            fontWeight: 800, 
                            color: '#008a47', 
                            border: '1px solid #00a859', 
                            padding: '1px 5px', 
                            borderRadius: '4px',
                            backgroundColor: '#EBF7F0',
                             marginRight: '4px',
                            letterSpacing: '0.5px'
                          }}>ARLA</span>
                        )}
                        {recipe.tags.filter((t: string) => t !== 'Valdemarsro' && t !== 'Arla' && t !== 'Scrapet').map((t: string) => (
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

            {recipesVisibleCount < sortedRecipes.length && (
              <div className="recipes-load-more" style={{
                textAlign: 'center',
                margin: '24px 0 32px 0',
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px' }}>
                  Viser {Math.min(recipesVisibleCount, sortedRecipes.length)} af {sortedRecipes.length} opskrifter
                </div>
                <button 
                  className="btn-primary" 
                  onClick={() => setRecipesVisibleCount(prev => prev + 24)}
                  style={{ display: 'inline-flex', width: 'auto', padding: '10px 24px', borderRadius: '20px', margin: '0 auto', fontSize: '13px', fontWeight: 700 }}
                >
                  <ChevronDown size={16} /> Vis flere opskrifter
                </button>
              </div>
            )}
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

              {/* Group: Opskriftskilder & Scraping */}
              <div className="settings-group">
                <h3>Opskriftskilder & Scraping</h3>
                <div className="settings-list">
                  
                  {/* Valdemarsro.dk Toggle */}
                  <div className="settings-row" onClick={() => setActiveRecipeSources(prev => ({ ...prev, valdemarsro: !prev.valdemarsro }))}>
                    <div className="settings-row-label">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D4AF37' }}></span>
                          Valdemarsro.dk
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 400 }}>
                          Søg og tilpas opskrifter (3.104 opskrifter i kataloget)
                        </div>
                      </div>
                    </div>
                    <label className="switch" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={activeRecipeSources.valdemarsro}
                        onChange={() => setActiveRecipeSources(prev => ({ ...prev, valdemarsro: !prev.valdemarsro }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  {/* Arla.dk Toggle */}
                  <div className="settings-row" onClick={() => setActiveRecipeSources(prev => ({ ...prev, arla: !prev.arla }))}>
                    <div className="settings-row-label">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00A859' }}></span>
                          Arla.dk
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 400 }}>
                          Søg og tilpas mejeriretter (2.110 opskrifter i kataloget)
                        </div>
                      </div>
                    </div>
                    <label className="switch" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={activeRecipeSources.arla}
                        onChange={() => setActiveRecipeSources(prev => ({ ...prev, arla: !prev.arla }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  {/* Madbanditten.dk Toggle */}
                  <div className="settings-row" onClick={() => setActiveRecipeSources(prev => ({ ...prev, madbanditten: !prev.madbanditten }))}>
                    <div className="settings-row-label">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#DE0F17' }}></span>
                          Madbanditten.dk
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 400 }}>
                          Søg og filtrer Keto- og LCHF opskrifter (Inaktiv / Ingen forbindelse)
                        </div>
                      </div>
                    </div>
                    <label className="switch" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={activeRecipeSources.madbanditten}
                        onChange={() => setActiveRecipeSources(prev => ({ ...prev, madbanditten: !prev.madbanditten }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  {/* Form to add custom domains */}
                  <div style={{ padding: '14px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Brugerdefinerede opskriftskilder:
                    </div>
                    
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = newCustomSource.trim().toLowerCase();
                        if (val) {
                          if (customSources.includes(val)) {
                            showToast('Kilde er allerede tilføjet!');
                          } else {
                            setCustomSources(prev => [...prev, val]);
                            setNewCustomSource('');
                            showToast(`Kilde '${val}' tilføjet!`);
                          }
                        }
                      }}
                      style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}
                    >
                      <input 
                        type="text" 
                        placeholder="fx 'nemlig.com' eller 'madensverden.dk'..." 
                        value={newCustomSource}
                        onChange={(e) => setNewCustomSource(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          backgroundColor: 'var(--bg-primary)',
                          outline: 'none'
                        }}
                      />
                      <button 
                        type="submit"
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--text-primary)',
                          color: 'var(--bg-primary)',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Tilføj
                      </button>
                    </form>

                    {customSources.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {customSources.map(src => (
                          <span 
                            key={src}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              fontSize: '11px',
                              padding: '3px 8px',
                              fontWeight: 600
                            }}
                          >
                            <span>{src}</span>
                            <X 
                              size={12} 
                              onClick={() => {
                                setCustomSources(prev => prev.filter(s => s !== src));
                                showToast(`Kilde '${src}' fjernet.`);
                              }}
                              style={{ cursor: 'pointer', opacity: 0.8 }}
                            />
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: '4px' }}>
                        Ingen brugerdefinerede kilder tilføjet endnu.
                      </div>
                    )}
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
        const scaleFactor = adjustedServings ? adjustedServings / selectedRecipe.servings : 1;
        const baseStats = calculateRecipeStatsWithStrategy(selectedRecipe, modalStrategy, modalSpecificStore);
        const stats = {
          ...baseStats,
          totalPrice: Math.round(baseStats.totalPrice * scaleFactor),
          totalNormalPrice: Math.round(baseStats.totalNormalPrice * scaleFactor),
          saving: Math.round(baseStats.saving * scaleFactor),
          cheapestStorePrice: Math.round(baseStats.cheapestStorePrice * scaleFactor),
          cheapestStoreSaving: Math.round(baseStats.cheapestStoreSaving * scaleFactor)
        };
        return (
          <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              
              {/* Drag indicator pill and floating close button */}
              <div className="modal-drag-pill"></div>
              <button className="modal-close-btn" onClick={() => setSelectedRecipe(null)} aria-label="Luk">
                <X size={20} />
              </button>

              <div className="modal-header">
                <img src={selectedRecipe.image} alt={selectedRecipe.name} />
              </div>

              <div className="modal-body">
                {/* Brand badges & Recipe title row */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {selectedRecipe.tags.some(t => t.toLowerCase() === 'valdemarsro') && (
                        <span className="source-badge valdemarsro-large">
                          Valdemarsro opskrift
                        </span>
                      )}
                      {selectedRecipe.tags.some(t => t.toLowerCase() === 'arla') && (
                        <span className="source-badge arla-large">
                          Arla opskrift
                        </span>
                      )}
                    </div>
                    {selectedRecipe.url && (
                      <a 
                        href={selectedRecipe.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="modal-source-link-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <BookOpen size={12} /> Original opskrift
                      </a>
                    )}
                  </div>
                  <div className="modal-recipe-title">{selectedRecipe.name}</div>
                  <div className="modal-recipe-desc">{selectedRecipe.description}</div>
                </div>

                {/* Premium iOS Status Grid Dashboard */}
                <div className="recipe-stats-dashboard">
                  <div className="stat-card">
                    <Clock size={16} className="stat-icon time-icon" />
                    <span className="stat-label">Tid i alt</span>
                    <span className="stat-value">{selectedRecipe.prepTime} min.</span>
                  </div>
                  
                  <div className="stat-card servings-card">
                    <Users size={16} className="stat-icon portions-icon" />
                    <span className="stat-label">Portioner</span>
                    <div className="servings-counter">
                      <button 
                        className="counter-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdjustedServings(prev => Math.max(1, (prev || selectedRecipe.servings) - 1));
                        }}
                      >
                        -
                      </button>
                      <span className="counter-val">{adjustedServings || selectedRecipe.servings}</span>
                      <button 
                        className="counter-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdjustedServings(prev => (prev || selectedRecipe.servings) + 1);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="stat-card">
                    <Heart size={16} className="stat-icon health-icon" />
                    <span className="stat-label">Sundhed</span>
                    <span className="stat-value">{selectedRecipe.healthScore || 7}/10</span>
                  </div>

                  <div className="stat-card">
                    <Calendar size={16} className="stat-icon storage-icon" />
                    <span className="stat-label">Holdbarhed</span>
                    <span className="stat-value">{selectedRecipe.holdbarhed || '3 dage'}</span>
                  </div>

                  <div className="stat-card">
                    <Sparkles size={16} className="stat-icon freeze-icon" />
                    <span className="stat-label">Kan fryses</span>
                    <span className="stat-value">{selectedRecipe.kanFryses || 'Ja'}</span>
                  </div>
                </div>

                {/* Segmented Control for Strategy Selection */}
                <div className="modal-section-title" style={{ borderBottom: 'none', marginBottom: '8px' }}>
                  Beregning & Indkøb Strategy
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

                {/* Ingredients with real-time portion scaling and checkoff checklist */}
                <div className="modal-section-title">
                  Ingredienser i denne uge ({stats.totalPrice} kr.)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', fontStyle: 'italic' }}>
                  Tryk på en ingrediens for at strege den ud (fx hvis du har den allerede)
                </div>

                <div className="modal-ingredients-list">
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    const isChecked = !!checkedIngredients[idx];
                    
                    if (ing.isBasis) {
                      return (
                        <div 
                          key={idx} 
                          className={`ingredient-item basis ${isChecked ? 'checked' : ''}`}
                          onClick={() => setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }))}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="ingredient-left">
                            <div className="ingredient-checkbox-wrapper">
                              <div className={`ingredient-checkbox ${isChecked ? 'active' : ''}`}>
                                {isChecked && <Check size={10} strokeWidth={3} />}
                              </div>
                            </div>
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
                      <div 
                        key={idx} 
                        className={`ingredient-item ${isChecked ? 'checked' : ''}`}
                        onClick={() => setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="ingredient-left">
                          <div className="ingredient-checkbox-wrapper">
                            <div className={`ingredient-checkbox ${isChecked ? 'active' : ''}`}>
                              {isChecked && <Check size={10} strokeWidth={3} />}
                            </div>
                          </div>
                          <div>
                            <div className="ingredient-name">{priceInfo.onSale ? priceInfo.displayName : ing.displayName}</div>
                            <span className="ingredient-amount">{scaleIngredientAmount(ing.amount, scaleFactor)}</span>
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <span className="ingredient-price" style={{ fontSize: '13px', fontWeight: 700 }}>
                            {Math.round(priceInfo.price * scaleFactor)} kr.
                          </span>
                          <div style={{ marginTop: '2px' }}>
                            {priceInfo.inFridge ? (
                              <span className="store-tag" style={{
                                backgroundColor: '#E6F6EE',
                                color: '#00A859',
                                fontSize: '8px',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                border: '1px solid rgba(0, 168, 89, 0.1)'
                              }}>
                                Rest i køleskab
                              </span>
                            ) : priceInfo.onSale ? (
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

                {/* maaaaad tips — Sundere & Billigere */}
                {selectedRecipe.tips && (
                  <div className="maaaaad-tips-container" style={{ marginBottom: '24px' }}>
                    <div className="modal-section-title" style={{ marginTop: '24px' }}>Tips & Gode Råd</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedRecipe.tips.general && (
                        <div className="tip-card general">
                          <div className="tip-header">
                            <Info size={14} className="tip-icon" />
                            <span>TIP FRA KILDEN</span>
                          </div>
                          <div className="tip-content" style={{ whiteSpace: 'pre-line' }}>
                            {selectedRecipe.tips.general}
                          </div>
                        </div>
                      )}

                      <div className="tip-card healthier">
                        <div className="tip-header">
                          <Sparkles size={14} className="tip-icon" />
                          <span>SUNDERE ALTERNATIV</span>
                        </div>
                        <div className="tip-content">
                          {selectedRecipe.tips.healthier}
                        </div>
                      </div>

                      <div className="tip-card cheaper">
                        <div className="tip-header">
                          <Tag size={14} className="tip-icon" />
                          <span>BILLIGERE BUDGET-TRICK</span>
                        </div>
                        <div className="tip-content">
                          {selectedRecipe.tips.cheaper}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clickable instructions steps */}
                <div className="modal-section-title">Fremgangsmåde</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '12px', fontStyle: 'italic' }}>
                  Tryk på et trin for at markere det som færdigt
                </div>
                <div style={{ marginBottom: '32px' }} className="instructions-list">
                  {selectedRecipe.instructions.map((step, idx) => {
                    const isStepDone = !!completedSteps[idx];
                    return (
                      <div 
                        key={idx} 
                        className={`instruction-step ${isStepDone ? 'completed' : ''}`}
                        onClick={() => setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={`step-check ${isStepDone ? 'active' : ''}`}>
                          {isStepDone ? <Check size={10} strokeWidth={3} /> : idx + 1}
                        </div>
                        <div className="step-text">{step}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Sticky Action Bar with Pricing Summary */}
              <div className="modal-footer">
                <div className="modal-footer-price-info">
                  <span className="total-label">Pris i alt</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span className="total-price-val">{stats.totalPrice} kr.</span>
                    {stats.saving > 0 && (
                      <span className="total-saving-val">Spar {stats.saving} kr.!</span>
                    )}
                  </div>
                </div>
                <button 
                  className="btn-primary secondary-style"
                  onClick={() => {
                    // Phase 3: Add to shopping list dynamically respecting selected strategy!
                    addRecipeToShoppingListWithStrategy(selectedRecipe, modalStrategy, modalSpecificStore);
                    setSelectedRecipe(null);
                  }}
                  style={{ flex: 1, height: '48px', borderRadius: '14px', fontSize: '14px', fontWeight: 700 }}
                >
                  <ShoppingCart size={18} />
                  Føj til indkøbsliste
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
      {!shouldHideMockControls && (
        <div className="app-home-indicator">
          <div className="bar"></div>
        </div>
      )}

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

      {/* PWA Orientation Lock Overlay */}
      <div className="orientation-lock-overlay">
        <div className="orientation-lock-icon">📱</div>
        <h2>Vend venligst din telefon</h2>
        <p>
          maaaaad er optimeret til højformat. Drej venligst din telefon tilbage til lodret visning for den bedste oplevelse.
        </p>
      </div>
    </div>
  );
}
