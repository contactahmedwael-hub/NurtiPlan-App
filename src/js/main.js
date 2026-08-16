/**
 * NutriPlan - Main Entry Point
 */

import * as api from "./api/mealdb.js";
import * as nutritionApi from "./api/nutrition.js";
import * as productsApi from "./api/products.js";
import * as state from "./state/appState.js";
import * as ui from "./ui/components.js";

/* -------------------------------------------------------------------- */
/*  DOM references                                                      */
/* -------------------------------------------------------------------- */

const els = {
  loadingOverlay: document.getElementById("app-loading-overlay"),

  // Sidebar / nav
  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebar-overlay"),
  sidebarCloseBtn: document.getElementById("sidebar-close-btn"),
  headerMenuBtn: document.getElementById("header-menu-btn"),
  navLinks: Array.from(document.querySelectorAll(".nav-link")),
  headerTitle: document.querySelector("#header h1"),
  headerSubtitle: document.querySelector("#header p"),

  // Meals - list view sections
  searchFiltersSection: document.getElementById("search-filters-section"),
  categoriesSection: document.getElementById("meal-categories-section"),
  recipesSection: document.getElementById("all-recipes-section"),
  searchInput: document.getElementById("search-input"),
  cuisinePillsRow: document.getElementById("cuisine-pills-row"),
  cuisineSeeMoreBtn: document.getElementById("cuisine-see-more-btn"),
  categoriesGrid: document.getElementById("categories-grid"),
  recipesGrid: document.getElementById("recipes-grid"),
  recipesCount: document.getElementById("recipes-count"),
  gridViewBtn: document.getElementById("grid-view-btn"),
  listViewBtn: document.getElementById("list-view-btn"),

  // Meals - detail view
  mealDetails: document.getElementById("meal-details"),
  backToMealsBtn: document.getElementById("back-to-meals-btn"),
  heroImg: document.querySelector("#meal-details .relative.h-80 img"),
  heroTitle: document.querySelector("#meal-details h1"),
  heroBadges: document.querySelector(
    "#meal-details .absolute.bottom-0 .flex.items-center.gap-3",
  ),
  heroServings: document.getElementById("hero-servings"),
  heroCalories: document.getElementById("hero-calories"),
  logMealBtn: document.getElementById("log-meal-btn"),
  ingredientsList: document.querySelector(
    "#meal-details .grid.grid-cols-1.md\\:grid-cols-2.gap-3",
  ),
  ingredientsCount: document.querySelector("#meal-details h2 .ml-auto"),
  instructionsList: document.querySelector("#meal-details .space-y-4"),
  videoContainer: document.querySelector("#meal-details .aspect-video"),
  nutritionContainer: document.getElementById("nutrition-facts-container"),

  // Log Meal modal
  logMealModal: document.getElementById("log-meal-modal"),
  logMealModalBackdrop: document.getElementById("log-meal-modal-backdrop"),
  logMealModalImg: document.getElementById("log-meal-modal-img"),
  logMealModalName: document.getElementById("log-meal-modal-name"),
  logMealServingsValue: document.getElementById("log-meal-servings-value"),
  logMealServingsMinusBtn: document.getElementById("log-meal-servings-minus"),
  logMealServingsPlusBtn: document.getElementById("log-meal-servings-plus"),
  logMealCancelBtn: document.getElementById("log-meal-cancel-btn"),
  logMealConfirmBtn: document.getElementById("log-meal-confirm-btn"),
  logMealPreviewCalories: document.getElementById("log-meal-preview-calories"),
  logMealPreviewProtein: document.getElementById("log-meal-preview-protein"),
  logMealPreviewCarbs: document.getElementById("log-meal-preview-carbs"),
  logMealPreviewFat: document.getElementById("log-meal-preview-fat"),

  // Products
  productsSection: document.getElementById("products-section"),
  productSearchInput: document.getElementById("product-search-input"),
  searchProductBtn: document.getElementById("search-product-btn"),
  barcodeInput: document.getElementById("barcode-input"),
  lookupBarcodeBtn: document.getElementById("lookup-barcode-btn"),
  productsGrid: document.getElementById("products-grid"),
  productsCount: document.getElementById("products-count"),
  nutriScoreFilterBtns: Array.from(
    document.querySelectorAll(".nutri-score-filter"),
  ),
  productCategoriesRow: document.getElementById("product-categories"),

  // Food log
  foodlogSection: document.getElementById("foodlog-section"),
  foodlogDate: document.getElementById("foodlog-date"),
  loggedItemsList: document.getElementById("logged-items-list"),
  clearFoodlogBtn: document.getElementById("clear-foodlog"),
  quickLogBtns: Array.from(document.querySelectorAll(".quick-log-btn")),
  foodlogCaloriesValue: document.getElementById("foodlog-calories-value"),
  foodlogCaloriesBar: document.getElementById("foodlog-calories-bar"),
  foodlogProteinValue: document.getElementById("foodlog-protein-value"),
  foodlogProteinBar: document.getElementById("foodlog-protein-bar"),
  foodlogCarbsValue: document.getElementById("foodlog-carbs-value"),
  foodlogCarbsBar: document.getElementById("foodlog-carbs-bar"),
  foodlogFatValue: document.getElementById("foodlog-fat-value"),
  foodlogFatBar: document.getElementById("foodlog-fat-bar"),
  weeklyChart: document.getElementById("weekly-chart"),
  weeklyAvgCalories: document.getElementById("weekly-avg-calories"),
  weeklyTotalItems: document.getElementById("weekly-total-items"),
  weeklyDaysOnGoal: document.getElementById("weekly-days-on-goal"),
};

const PAGE_SECTIONS = {
  meals: [els.searchFiltersSection, els.categoriesSection, els.recipesSection],
  mealDetail: [els.mealDetails],
  products: [els.productsSection],
  foodlog: [els.foodlogSection],
};

const HEADER_COPY = {
  meals: {
    title: "Meals & Recipes",
    subtitle: "Discover delicious and nutritious recipes tailored for you",
  },
  products: {
    title: "Product Scanner",
    subtitle: "Search packaged products and check their nutrition grade",
  },
  foodlog: {
    title: "Food Log",
    subtitle: "Track and monitor your daily nutrition intake",
  },
};

/* -------------------------------------------------------------------- */
/*  Loading overlay                                                     */
/* -------------------------------------------------------------------- */

/**
 * Displays the full-screen loading overlay.
 */
function showLoadingOverlay() {
  // Inline style wins over the `.loading { display: none }` rule in style.css.
  els.loadingOverlay.style.display = "flex";
}

/**
 * Hides the full-screen loading overlay smoothly with a fade-out effect.
 */
function hideLoadingOverlay() {
  els.loadingOverlay.style.opacity = "0";
  setTimeout(() => {
    els.loadingOverlay.style.display = "none";
  }, 300);
}

/* -------------------------------------------------------------------- */
/*  Navigation                                                          */
/* -------------------------------------------------------------------- */

/**
 * Toggles visibility of page sections to show only the requested section.
 * @param {string} sectionKey - The key of the section to display (e.g., 'meals', 'products').
 */
function showSection(sectionKey) {
  Object.values(PAGE_SECTIONS)
    .flat()
    .forEach((section) => {
      if (section) section.style.display = "none";
    });
  (PAGE_SECTIONS[sectionKey] || []).forEach((section) => {
    if (section) section.style.display = "";
  });
}

/**
 * Updates the styling of the sidebar navigation links to reflect the active page.
 * @param {string} page - The current active page identifier.
 */
function setActiveNavLink(page) {
  const order = ["meals", "products", "foodlog"];
  const activeIndex = order.indexOf(page);
  els.navLinks.forEach((link, i) => {
    if (i === activeIndex) {
      link.classList.add("bg-emerald-50", "text-emerald-700");
      link.classList.remove("text-gray-600");
      link.querySelector("span")?.classList.add("font-semibold");
    } else {
      link.classList.remove("bg-emerald-50", "text-emerald-700");
      link.classList.add("text-gray-600");
      link.querySelector("span")?.classList.remove("font-semibold");
    }
  });
}

/**
 * Navigates the app to a specific top-level page, resetting views and rendering necessary data.
 * @param {string} page - The target page identifier ('meals', 'products', 'foodlog').
 */
function navigateTo(page) {
  state.setPage(page);
  state.setMealsView("list");
  setActiveNavLink(page);
  showSection(page === "meals" ? "meals" : page);

  const copy = HEADER_COPY[page];
  if (copy) {
    els.headerTitle.textContent = copy.title;
    if (els.headerSubtitle) els.headerSubtitle.textContent = copy.subtitle;
  }

  if (page === "foodlog") {
    renderFoodLogPage();
  }

  closeSidebar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Opens the mobile sidebar menu.
 */
function openSidebar() {
  els.sidebar.classList.add("open");
  els.sidebarOverlay.classList.add("active");
}

/**
 * Closes the mobile sidebar menu.
 */
function closeSidebar() {
  els.sidebar.classList.remove("open");
  els.sidebarOverlay.classList.remove("active");
}

/* -------------------------------------------------------------------- */
/*  Meals: load + render                                                */
/* -------------------------------------------------------------------- */

/**
 * Fetches the list of meal categories from the API and renders them.
 */
async function loadCategories() {
  ui.renderSkeletonCategories(els.categoriesGrid);
  try {
    const categories = await api.getCategories();
    state.setCategories(categories);
    if (categories.length === 0) {
      ui.renderEmptyState(els.categoriesGrid, {
        title: "No categories available",
        icon: "fa-layer-group",
      });
      return;
    }
    ui.renderCategories(categories, els.categoriesGrid);
  } catch (err) {
    ui.renderErrorState(els.categoriesGrid, err.message, {
      onRetry: loadCategories,
    });
  }
}

/**
 * Fetches the list of cuisines/areas from the API and renders them as filter pills.
 */
async function loadCuisines() {
  if (!els.cuisinePillsRow) return;
  ui.renderSkeletonPills(els.cuisinePillsRow);
  try {
    const areas = await api.getAreas();
    ui.renderCuisinePills(areas, els.cuisinePillsRow, state.state.selectedArea);
  } catch (err) {
    // Non-critical: fall back to just "All Cuisines" rather than blocking the page.
    console.warn("Couldn't load cuisine list:", err.message);
    ui.renderCuisinePills([], els.cuisinePillsRow, null);
  }
  // Wait a frame so the browser has actually laid out the wrapped pills
  // before measuring row heights.
  requestAnimationFrame(() => applyCuisinePillsCollapse());
}

/* -------------------------------------------------------------------- */
/*  Cuisine pills: collapse to 2 lines with a "See more" toggle          */
/* -------------------------------------------------------------------- */

let cuisinePillsExpanded = false;

/**
 * Measures how tall the row needs to be to show exactly its first two
 * lines of pills, using getBoundingClientRect (viewport-relative, so it
 * doesn't matter what the row's offsetParent is). Returns null if
 * everything already fits within 2 lines - nothing to collapse.
 */
function measureCollapsedCuisineHeight() {
  const row = els.cuisinePillsRow;
  const pills = Array.from(row.children);
  if (pills.length === 0) return null;

  const rowRect = row.getBoundingClientRect();
  const pillRects = pills.map((p) => p.getBoundingClientRect());
  const rowTops = [...new Set(pillRects.map((r) => Math.round(r.top)))].sort(
    (a, b) => a - b,
  );

  if (rowTops.length <= 2) return null;

  const secondRowBottom = Math.max(
    ...pillRects
      .filter((r) => Math.round(r.top) === rowTops[1])
      .map((r) => r.bottom),
  );
  return Math.ceil(secondRowBottom - rowRect.top);
}

/**
 * Applies a max-height CSS style to visually limit the cuisine pills row to two lines.
 */
function applyCuisinePillsCollapse() {
  const row = els.cuisinePillsRow;
  const btn = els.cuisineSeeMoreBtn;
  if (!row || !btn) return;

  if (cuisinePillsExpanded) {
    row.style.maxHeight = "none";
    return;
  }

  const collapsedHeight = measureCollapsedCuisineHeight();
  if (collapsedHeight == null) {
    // Everything fits in 2 lines already - no toggle needed.
    row.style.maxHeight = "none";
    btn.style.display = "none";
  } else {
    row.style.maxHeight = `${collapsedHeight}px`;
    btn.style.display = "inline-flex";
  }
}

/**
 * Toggles the expanded/collapsed state of the cuisine pills row and updates the UI button.
 */
function toggleCuisinePillsExpanded() {
  cuisinePillsExpanded = !cuisinePillsExpanded;
  const btn = els.cuisineSeeMoreBtn;
  if (btn) {
    btn.classList.toggle("expanded", cuisinePillsExpanded);
    const label = btn.querySelector("span");
    if (label)
      label.textContent = cuisinePillsExpanded ? "See less" : "See more";
  }
  applyCuisinePillsCollapse();
}

/**
 * Loads an initial blanket broad search of recipes to populate the main grid on load.
 */
async function loadInitialRecipes() {
  ui.renderSkeletonCards(els.recipesGrid);
  try {
    // TheMealDB has no "list everything" endpoint, so we seed the grid
    // with a broad search (empty query returns a large result set).
    const meals = await api.searchMeals("");
    state.setRecipes(meals);
    renderRecipes(meals);
  } catch (err) {
    ui.renderErrorState(els.recipesGrid, err.message, {
      onRetry: loadInitialRecipes,
    });
    els.recipesCount.textContent = "";
  }
}

let recipesView = "grid"; // "grid" | "list"

/**
 * Renders the provided list of meals based on the currently active view mode (grid or list).
 * @param {Array} meals - The array of meal objects to render.
 */
function renderRecipes(meals) {
  if (meals.length === 0) {
    ui.renderEmptyState(els.recipesGrid, {
      title: "No recipes found",
      subtitle: "Try searching for something else",
    });
  } else if (recipesView === "list") {
    ui.renderRecipeListItems(meals, els.recipesGrid);
  } else {
    ui.renderRecipeCards(meals, els.recipesGrid);
  }
  ui.updateRecipesCount(els.recipesCount, meals.length);
}

/**
 * Executes a free-text search for meals via the API and updates the UI grid.
 * @param {string} term - The search term to look up.
 */
async function runSearch(term) {
  state.setSearchTerm(term);
  state.clearFilters();
  state.setSearchTerm(term);
  clearAllCuisineHighlights();

  ui.renderSkeletonCards(els.recipesGrid);
  try {
    const meals = await api.searchMeals(term);
    state.setRecipes(meals);
    renderRecipes(meals);
  } catch (err) {
    ui.renderErrorState(els.recipesGrid, err.message, {
      onRetry: () => runSearch(term),
    });
  }
}

/**
 * Filters the recipes grid by a selected category.
 * @param {string} category - The category string to filter by.
 */
async function filterByCategory(category) {
  state.setSelectedCategory(category);
  state.setSearchTerm("");
  els.searchInput.value = "";
  clearAllCuisineHighlights();

  ui.renderSkeletonCards(els.recipesGrid);
  try {
    const meals = await api.filterByCategory(category);
    state.setRecipes(meals);
    renderRecipes(meals);
  } catch (err) {
    ui.renderErrorState(els.recipesGrid, err.message, {
      onRetry: () => filterByCategory(category),
    });
  }
}

/**
 * Filters the recipes grid by a selected geographical area/cuisine.
 * @param {string} area - The area string to filter by.
 */
async function filterByArea(area) {
  state.setSelectedArea(area);
  state.setSearchTerm("");
  els.searchInput.value = "";
  highlightActiveCuisinePill(area);

  ui.renderSkeletonCards(els.recipesGrid);
  try {
    const meals = await api.filterByArea(area);
    state.setRecipes(meals);
    renderRecipes(meals);
  } catch (err) {
    ui.renderErrorState(els.recipesGrid, err.message, {
      onRetry: () => filterByArea(area),
    });
  }
}

/** Marks exactly one cuisine pill active (pass null/undefined for "All Cuisines"). */
function highlightActiveCuisinePill(area) {
  if (!els.cuisinePillsRow) return;
  els.cuisinePillsRow.querySelectorAll(".cuisine-pill").forEach((pill) => {
    pill.classList.toggle(
      "active",
      (pill.dataset.area || null) === (area || null),
    );
  });
}

/** Clears every cuisine pill's active state (used during free-text search, where no cuisine is "selected"). */
function clearAllCuisineHighlights() {
  if (!els.cuisinePillsRow) return;
  els.cuisinePillsRow
    .querySelectorAll(".cuisine-pill")
    .forEach((pill) => pill.classList.remove("active"));
}

/* -------------------------------------------------------------------- */
/*  Meal detail                                                         */
/* -------------------------------------------------------------------- */

let nutritionRequestToken = 0;

/**
 * Loads and renders the Nutrition Facts panel for a meal. Uses an
 * incrementing token so that if the user backs out and opens a
 * different recipe before this resolves, the stale response is
 * discarded instead of overwriting the panel for the wrong meal.
 */
async function loadNutritionFacts(meal) {
  const token = ++nutritionRequestToken;

  const cached = nutritionApi.getCachedNutrition(meal.idMeal);
  if (cached) {
    ui.renderNutritionFacts(els.nutritionContainer, cached);
    updateHeroNutritionSummary(cached);
    return;
  }

  ui.renderNutritionLoading(els.nutritionContainer);
  try {
    const nutrition = await nutritionApi.analyzeNutrition(meal);
    if (token !== nutritionRequestToken) return; // superseded by a newer request
    ui.renderNutritionFacts(els.nutritionContainer, nutrition);
    updateHeroNutritionSummary(nutrition);
  } catch (err) {
    if (token !== nutritionRequestToken) return;
    ui.renderNutritionErrorState(els.nutritionContainer, err.message, () =>
      loadNutritionFacts(meal),
    );
    // Nothing else will resolve for this meal - stop the hero spinner and
    // fall back to "Servings vary" / "Calories: N/A" instead of spinning forever.
    updateHeroNutritionSummary(null);
  }
}

/** Fills in the hero row's "Servings" and "Calories" once nutrition data has loaded. */
function updateHeroNutritionSummary(nutrition) {
  if (els.heroCalories) {
    els.heroCalories.textContent = nutrition?.caloriesPerServing
      ? `${Math.round(nutrition.caloriesPerServing)} cal`
      : "Calories: N/A";
  }
  if (els.heroServings) {
    els.heroServings.textContent = nutrition?.servings
      ? `${nutrition.servings} servings`
      : "Servings vary";
  }
}

/**
 * Fetches detailed information for a specific meal and transitions the view to the meal detail section.
 * @param {string|number} mealId - The unique ID of the meal to look up.
 */
async function openMealDetail(mealId) {
  state.setMealsView("detail");
  showSection("mealDetail");
  window.scrollTo({ top: 0, behavior: "smooth" });

  ui.renderMealDetailSkeleton({
    heroImg: els.heroImg,
    heroTitle: els.heroTitle,
    heroBadges: els.heroBadges,
    heroServings: els.heroServings,
    heroCalories: els.heroCalories,
    ingredientsList: els.ingredientsList,
    ingredientsCount: els.ingredientsCount,
    instructionsList: els.instructionsList,
  });

  try {
    const meal = await api.lookupMeal(mealId);
    if (!meal) {
      els.heroTitle.textContent = "Recipe not found";
      return;
    }
    state.setCurrentMeal(meal);
    ui.renderMealDetail(
      meal,
      {
        heroImg: els.heroImg,
        heroTitle: els.heroTitle,
        heroBadges: els.heroBadges,
        heroServings: els.heroServings,
        heroCalories: els.heroCalories,
        ingredientsList: els.ingredientsList,
        ingredientsCount: els.ingredientsCount,
        instructionsList: els.instructionsList,
        videoContainer: els.videoContainer,
        logMealBtn: els.logMealBtn,
      },
      { favorited: state.isFavorite(meal.idMeal) },
    );

    // Fire-and-forget: ingredients/instructions are already on screen,
    // nutrition loads independently so it doesn't block the rest of the page.
    loadNutritionFacts(meal);
  } catch (err) {
    els.heroTitle.textContent = "Couldn't load this recipe";
    if (window.Swal) {
      Swal.fire({
        icon: "error",
        title: "Couldn't load recipe",
        text: err.message,
      });
    }
  }
}

/**
 * Switches the UI view back from the meal details screen to the main recipe list screen.
 */
function backToMealsList() {
  state.setMealsView("list");
  showSection("meals");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Adds the currently viewed meal to the food log with the specified number of servings.
 * @param {string|number} mealId - The ID of the meal being logged.
 * @param {number} servings - The number of servings consumed (defaults to 1).
 */
function logCurrentMeal(mealId, servings = 1) {
  const meal = state.state.currentMeal;
  if (!meal || String(meal.idMeal) !== String(mealId)) return;

  // Reuse whatever nutrition data is already cached for this meal (from
  // the detail page's automatic lookup) so the Food Log's daily totals
  // have real numbers. If nutrition hasn't loaded/failed, the entry is
  // still logged - it just contributes 0 to today's totals.
  const nutrition = nutritionApi.getCachedNutrition(meal.idMeal);

  state.addFoodLogEntry({
    id: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    servings,
    calories: (nutrition?.caloriesPerServing ?? 0) * servings,
    protein: (nutrition?.protein ?? 0) * servings,
    carbs: (nutrition?.carbs ?? 0) * servings,
    fat: (nutrition?.fat ?? 0) * servings,
  });

  if (window.Swal) {
    Swal.fire({
      icon: "success",
      title: "Meal logged!",
      text: `${meal.strMeal} (${servings} serving${servings === 1 ? "" : "s"}) was added to today's food log.`,
      timer: 1800,
      showConfirmButton: false,
    });
  }
}

/* -------------------------------------------------------------------- */
/*  Log Meal modal                                                      */
/* -------------------------------------------------------------------- */

let pendingLogServings = 1;
let logModalRequestToken = 0;

/**
 * Helper to consolidate and return DOM element references related to the "Log Meal" modal.
 * @returns {Object} Collection of DOM elements for the log meal modal.
 */
const logMealModalRefs = () => ({
  img: els.logMealModalImg,
  nameEl: els.logMealModalName,
  caloriesEl: els.logMealPreviewCalories,
  proteinEl: els.logMealPreviewProtein,
  carbsEl: els.logMealPreviewCarbs,
  fatEl: els.logMealPreviewFat,
});

/**
 * Opens the "Log Meal" confirmation modal and loads preliminary meal info and nutrition stats.
 */
function openLogMealModal() {
  const meal = state.state.currentMeal;
  if (!meal) return;

  pendingLogServings = 1;
  ui.updateServingsValue(els.logMealServingsValue, pendingLogServings);
  els.logMealModal.style.display = "flex";
  els.logMealCancelBtn?.focus();

  const cached = nutritionApi.getCachedNutrition(meal.idMeal);
  if (cached) {
    ui.renderLogMealModal(logMealModalRefs(), meal, cached);
    return;
  }

  // Not cached yet (e.g. modal opened before the detail page's background
  // fetch finished) - fill in name/image now, show the preview cells as
  // loading, then fetch for real instead of leaving them blank.
  ui.renderLogMealModal(logMealModalRefs(), meal, null);
  ui.renderLogMealModalLoading(logMealModalRefs());

  const token = ++logModalRequestToken;
  nutritionApi
    .analyzeNutrition(meal)
    .then((nutrition) => {
      if (token !== logModalRequestToken) return; // modal closed/reopened for a different meal
      ui.renderLogMealModal(logMealModalRefs(), meal, nutrition);
    })
    .catch(() => {
      if (token !== logModalRequestToken) return;
      ui.renderLogMealModal(logMealModalRefs(), meal, null);
    });
}

/**
 * Closes the "Log Meal" modal and restores focus to the initiating button.
 */
function closeLogMealModal() {
  if (els.logMealModal) els.logMealModal.style.display = "none";
  els.logMealBtn?.focus();
}

/**
 * Evaluates whether the "Log Meal" modal is actively open in the UI.
 * @returns {boolean} True if the modal is currently displayed.
 */
function isLogMealModalOpen() {
  return els.logMealModal && els.logMealModal.style.display !== "none";
}

/**
 * Runs the actual log + the existing loading/success animation on the
 * page's "Log This Meal" button - unchanged from before, just now
 * triggered after the modal confirms instead of on the first click.
 */
function confirmLogMeal() {
  if (els.logMealConfirmBtn.disabled) return;
  els.logMealConfirmBtn.disabled = true;

  const servings = pendingLogServings;
  const mealId = els.logMealBtn.dataset.mealId;
  closeLogMealModal();

  els.logMealBtn.disabled = true;
  ui.setLogButtonState(els.logMealBtn, "loading");

  setTimeout(() => {
    logCurrentMeal(mealId, servings);
    ui.setLogButtonState(els.logMealBtn, "success");

    setTimeout(() => {
      ui.setLogButtonState(els.logMealBtn, "idle");
      els.logMealBtn.disabled = false;
      els.logMealConfirmBtn.disabled = false;
    }, 1500);
  }, 500);
}

/* -------------------------------------------------------------------- */
/*  Food log page                                                       */
/* -------------------------------------------------------------------- */

/**
 * Renders the full Food Log page, calculating totals and drawing weekly progress charts.
 */
function renderFoodLogPage() {
  els.foodlogDate.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  ui.renderFoodLog(state.state.foodLog, els.loggedItemsList, {
    onRemove: (loggedAt) => {
      state.removeFoodLogEntry(loggedAt);
      renderFoodLogPage();
    },
  });

  const heading = document.querySelector("#foodlog-today-section h4");
  if (heading)
    heading.textContent = `Logged Items (${state.state.foodLog.length})`;

  if (els.clearFoodlogBtn) {
    els.clearFoodlogBtn.style.display =
      state.state.foodLog.length > 0 ? "" : "none";
  }

  ui.updateFoodLogProgress(
    {
      caloriesValueEl: els.foodlogCaloriesValue,
      caloriesBarEl: els.foodlogCaloriesBar,
      proteinValueEl: els.foodlogProteinValue,
      proteinBarEl: els.foodlogProteinBar,
      carbsValueEl: els.foodlogCarbsValue,
      carbsBarEl: els.foodlogCarbsBar,
      fatValueEl: els.foodlogFatValue,
      fatBarEl: els.foodlogFatBar,
    },
    state.getTodayTotals(),
  );

  if (els.weeklyChart) {
    const weekOverview = state.getWeekOverview();
    ui.renderWeeklyDayStrip(weekOverview.days, els.weeklyChart);
    ui.updateWeeklySummaryCards(
      {
        avgEl: els.weeklyAvgCalories,
        totalItemsEl: els.weeklyTotalItems,
        daysOnGoalEl: els.weeklyDaysOnGoal,
      },
      weekOverview,
    );
  }
}

/**
 * Prompts the user with a confirmation dialog before clearing out all logged meals completely.
 */
async function clearFoodLog() {
  if (window.Swal) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Clear all logged meals?",
      text: "This can't be undone.",
      showCancelButton: true,
      confirmButtonText: "Clear all",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
  }
  state.clearFoodLog();
  renderFoodLogPage();
}

/* -------------------------------------------------------------------- */
/*  Products page                                                       */
/* -------------------------------------------------------------------- */

// Last fetched raw product list, kept so the Nutri-Score filter can
// re-filter client-side instead of re-hitting the API (the search/
// category/barcode endpoints don't document a grade filter param).
let lastProductResults = [];
let lastProductTotal = null;
let activeGradeFilter = ""; // "" = All

/**
 * Returns a subset of products filtered by the currently active Nutri-Score grade.
 * @param {Array} products - The array of products to filter.
 * @returns {Array} The filtered product array.
 */
function applyGradeFilter(products) {
  if (!activeGradeFilter) return products;
  return products.filter(
    (p) => (p.nutritionGrade || "").toLowerCase() === activeGradeFilter,
  );
}

/**
 * Handles rendering logic for a fetched set of products, including fallback empty states.
 * @param {Array} products - Array of product objects.
 * @param {Object} [options] - Options object including the total available count.
 */
function renderProductsResult(products, { total } = {}) {
  lastProductResults = products;
  lastProductTotal = total ?? null;

  const filtered = applyGradeFilter(products);

  if (filtered.length === 0) {
    ui.renderEmptyState(els.productsGrid, {
      title: "No products found",
      subtitle: activeGradeFilter
        ? "Try a different Nutri-Score filter."
        : "Try a different search term or barcode.",
      icon: "fa-barcode",
    });
  } else {
    ui.renderProductCards(filtered, els.productsGrid);
  }

  ui.updateProductsCount(els.productsCount, filtered.length, {
    total:
      !activeGradeFilter && total && total !== products.length
        ? total
        : undefined,
  });
}

/**
 * Updates the visual active state of the Nutri-Score filter buttons on the products page.
 * @param {string} grade - The specific Nutri-Score grade to highlight.
 */
function setActiveGradeFilterBtn(grade) {
  els.nutriScoreFilterBtns.forEach((btn) => {
    const isActive = (btn.dataset.grade || "") === grade;
    if (isActive) {
      btn.classList.add("bg-emerald-600", "text-white");
    } else {
      btn.classList.remove("bg-emerald-600", "text-white");
    }
  });
}

/**
 * Executes a name search for products against the API and updates the UI grid.
 * @param {string} term - The text search query for the products.
 */
async function runProductSearch(term) {
  if (!term) return;
  activeGradeFilter = "";
  setActiveGradeFilterBtn("");
  ui.renderSkeletonCards(els.productsGrid);
  try {
    const { results, pagination } = await productsApi.searchProducts(term);
    renderProductsResult(results, { total: pagination?.total });
  } catch (err) {
    ui.renderErrorState(els.productsGrid, err.message, {
      onRetry: () => runProductSearch(term),
    });
    els.productsCount.textContent = "";
  }
}

/**
 * Executes a barcode lookup via the products API and renders a single matching product.
 * @param {string} barcode - The numerical barcode sequence.
 */
async function lookupBarcode(barcode) {
  if (!barcode) return;
  activeGradeFilter = "";
  setActiveGradeFilterBtn("");
  ui.renderSkeletonCards(els.productsGrid);
  try {
    const product = await productsApi.getProductByBarcode(barcode);
    if (!product) {
      ui.renderEmptyState(els.productsGrid, {
        title: "No product found",
        subtitle: `No product matches barcode "${barcode}".`,
        icon: "fa-barcode",
      });
      els.productsCount.textContent = "No products found";
      lastProductResults = [];
      return;
    }
    renderProductsResult([product]);
  } catch (err) {
    ui.renderErrorState(els.productsGrid, err.message, {
      onRetry: () => lookupBarcode(barcode),
    });
    els.productsCount.textContent = "";
  }
}

/**
 * Fetches and filters the products list by a specific category ID, updating the UI.
 * @param {string} categoryId - The unique ID of the product category.
 * @param {string} categoryLabel - The human-readable name of the category.
 */
async function filterProductsByCategory(categoryId, categoryLabel) {
  activeGradeFilter = "";
  setActiveGradeFilterBtn("");
  els.productSearchInput.value = "";
  els.barcodeInput.value = "";
  ui.renderSkeletonCards(els.productsGrid);
  try {
    const { results, pagination } =
      await productsApi.getProductsByCategory(categoryId);
    renderProductsResult(results, { total: pagination?.total });
  } catch (err) {
    ui.renderErrorState(els.productsGrid, err.message, {
      onRetry: () => filterProductsByCategory(categoryId, categoryLabel),
    });
    els.productsCount.textContent = "";
  }
}

/**
 * Fetches the available product categories from the API to populate the category chips row.
 */
async function loadProductCategories() {
  if (!els.productCategoriesRow) return;
  try {
    const categories = await productsApi.getProductCategories();
    if (categories.length > 0) {
      ui.renderProductCategoryChips(categories, els.productCategoriesRow);
    }
  } catch (err) {
    // Non-critical: the static example category chips stay in place if this fails.
    console.warn("Couldn't load product categories:", err.message);
  }
}

/**
 * Renders the default empty state prompt on the initial load of the products page.
 */
function renderProductsIdle() {
  ui.renderEmptyState(els.productsGrid, {
    title: "Search for products to see results",
    subtitle: "Search by name, look up a barcode, or browse a category above.",
    icon: "fa-barcode",
  });
  els.productsCount.textContent = "Search for products to see results";
}

/* -------------------------------------------------------------------- */
/*  Event wiring                                                        */
/* -------------------------------------------------------------------- */

/**
 * Creates and returns a debounced version of the provided function.
 * @param {Function} fn - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} Debounced function wrapper.
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Binds all application-level DOM event listeners (clicks, inputs, keydowns, window resizes).
 */
function setupEventListeners() {
  // Sidebar
  els.headerMenuBtn?.addEventListener("click", openSidebar);
  els.sidebarCloseBtn?.addEventListener("click", closeSidebar);
  els.sidebarOverlay?.addEventListener("click", closeSidebar);

  // Sidebar nav: bind by visual order (Meals, Product Scanner, Food Log),
  // matching the order they appear in index.html.
  const pageOrder = ["meals", "products", "foodlog"];
  els.navLinks.forEach((link, i) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(pageOrder[i]);
    });
  });

  // Search (debounced)
  els.searchInput?.addEventListener(
    "input",
    debounce((e) => {
      const term = e.target.value.trim();
      if (term.length === 0) {
        loadInitialRecipes();
        state.clearFilters();
        highlightActiveCuisinePill(null);
        return;
      }
      runSearch(term);
    }, 400),
  );

  // Cuisine pills ("All Cuisines", American, British, Egyptian, ...).
  // Delegated because the pill row is populated asynchronously by loadCuisines().
  els.cuisinePillsRow?.addEventListener("click", (e) => {
    const pill = e.target.closest(".cuisine-pill");
    if (!pill) return;
    const area = pill.dataset.area;
    if (!area) {
      state.clearFilters();
      els.searchInput.value = "";
      loadInitialRecipes();
      highlightActiveCuisinePill(null);
    } else {
      filterByArea(area);
    }
  });

  // "See more" / "See less" toggle for the collapsed cuisine pills row.
  els.cuisineSeeMoreBtn?.addEventListener("click", toggleCuisinePillsExpanded);

  // Re-measure the 2-line collapse height on resize (how many pills fit
  // per row changes with viewport width) - only while collapsed, since
  // "expanded" just uses max-height: none regardless of width.
  window.addEventListener(
    "resize",
    debounce(() => {
      if (!cuisinePillsExpanded) applyCuisinePillsCollapse();
    }, 200),
  );

  // Category grid (event delegation - cards are re-rendered on every load)
  els.categoriesGrid?.addEventListener("click", (e) => {
    const card = e.target.closest(".category-card");
    if (!card) return;
    filterByCategory(card.dataset.category);
  });

  // Recipe grid (event delegation)
  els.recipesGrid?.addEventListener("click", (e) => {
    const card = e.target.closest(".recipe-card");
    if (!card) return;
    openMealDetail(card.dataset.mealId);
  });

  // Meal detail
  els.backToMealsBtn?.addEventListener("click", backToMealsList);
  els.logMealBtn?.addEventListener("click", openLogMealModal);

  // Log Meal modal
  els.logMealCancelBtn?.addEventListener("click", closeLogMealModal);
  els.logMealModalBackdrop?.addEventListener("click", closeLogMealModal);
  els.logMealConfirmBtn?.addEventListener("click", confirmLogMeal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isLogMealModalOpen()) closeLogMealModal();
  });
  els.logMealServingsMinusBtn?.addEventListener("click", () => {
    pendingLogServings = Math.max(1, pendingLogServings - 1);
    ui.updateServingsValue(els.logMealServingsValue, pendingLogServings);
  });
  els.logMealServingsPlusBtn?.addEventListener("click", () => {
    pendingLogServings = Math.min(20, pendingLogServings + 1);
    ui.updateServingsValue(els.logMealServingsValue, pendingLogServings);
  });

  // View toggle (grid/list) - re-renders the currently loaded recipes
  // in the matching layout, not just a class swap on the same cards.
  els.gridViewBtn?.addEventListener("click", () => {
    if (recipesView === "grid") return;
    recipesView = "grid";
    els.recipesGrid.classList.remove("grid-cols-1", "grid-cols-2");
    els.recipesGrid.classList.add("grid-cols-4");
    els.gridViewBtn.classList.add("bg-white", "shadow-sm");
    els.listViewBtn?.classList.remove("bg-white", "shadow-sm");
    renderRecipes(state.state.recipes);
  });
  els.listViewBtn?.addEventListener("click", () => {
    if (recipesView === "list") return;
    recipesView = "list";
    els.recipesGrid.classList.remove("grid-cols-4", "grid-cols-1");
    els.recipesGrid.classList.add("grid-cols-2");
    els.listViewBtn.classList.add("bg-white", "shadow-sm");
    els.gridViewBtn?.classList.remove("bg-white", "shadow-sm");
    renderRecipes(state.state.recipes);
  });

  // Products page
  const runSearchGuarded = () => {
    if (els.searchProductBtn.disabled) return;
    const term = els.productSearchInput?.value.trim();
    if (!term) return;
    els.searchProductBtn.disabled = true;
    runProductSearch(term).finally(() => {
      els.searchProductBtn.disabled = false;
    });
  };
  els.searchProductBtn?.addEventListener("click", runSearchGuarded);
  els.productSearchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearchGuarded();
  });

  const runLookupGuarded = () => {
    if (els.lookupBarcodeBtn.disabled) return;
    const barcode = els.barcodeInput?.value.trim();
    if (!barcode) return;
    els.lookupBarcodeBtn.disabled = true;
    lookupBarcode(barcode).finally(() => {
      els.lookupBarcodeBtn.disabled = false;
    });
  };
  els.lookupBarcodeBtn?.addEventListener("click", runLookupGuarded);
  els.barcodeInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runLookupGuarded();
  });

  // Nutri-Score filter pills - filters whatever is currently loaded, client-side.
  els.nutriScoreFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeGradeFilter = btn.dataset.grade || "";
      setActiveGradeFilterBtn(activeGradeFilter);
      renderProductsResult(lastProductResults, { total: lastProductTotal });
    });
  });

  // Category chips - delegated, since the real list replaces the static
  // example chips asynchronously after loadProductCategories() resolves.
  els.productCategoriesRow?.addEventListener("click", (e) => {
    const btn = e.target.closest(".product-category-btn");
    if (!btn || !els.productCategoriesRow.contains(btn)) return;
    const categoryId = btn.dataset.categoryId;
    if (categoryId) {
      filterProductsByCategory(categoryId, btn.textContent.trim());
    }
  });

  // Food log
  els.clearFoodlogBtn?.addEventListener("click", clearFoodLog);
  els.quickLogBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const label = btn.querySelector("p")?.textContent || "";
      if (label.includes("Log a Meal")) {
        navigateTo("meals");
      } else if (label.includes("Scan Product")) {
        navigateTo("products");
      }
    });
  });
}

/* -------------------------------------------------------------------- */
/*  Init                                                                */
/* -------------------------------------------------------------------- */

/**
 * Initializes the application: loads initial baseline data and starts up UI event listeners.
 */
async function init() {
  showLoadingOverlay();
  setupEventListeners();
  setActiveNavLink("meals");
  showSection("meals");
  renderProductsIdle();

  try {
    await Promise.all([
      loadCategories(),
      loadCuisines(),
      loadInitialRecipes(),
      loadProductCategories(),
    ]);
  } finally {
    hideLoadingOverlay();
  }
}

document.addEventListener("DOMContentLoaded", init);
