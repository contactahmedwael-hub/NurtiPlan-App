/**
 * Lightweight app state.
 * No framework, so this is a plain object with helper functions.
 * Anything that must survive a refresh (favorites, food log) is
 * mirrored to localStorage on every write.
 */

const STORAGE_KEYS = {
  FAVORITES: "nutriplan:favorites",
  FOOD_LOG: "nutriplan:foodlog",
};

/**
 * Safely reads and parses a JSON string from localStorage, returning a fallback if it fails or is empty.
 * @param {string} key - The localStorage key to retrieve.
 * @param {*} fallback - Default value if reading or parsing fails.
 * @returns {*} The parsed JSON object or the fallback value.
 */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    // Corrupt or blocked storage shouldn't crash the app.
    return fallback;
  }
}

/**
 * Safely serializes an object and writes it into localStorage.
 * @param {string} key - The localStorage key to write to.
 * @param {*} value - The state item to save.
 */
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / disabled (e.g. private browsing) - fail silently,
    // the in-memory state still works for the current session.
  }
}

export const state = {
  // Navigation
  currentPage: "meals", // "meals" | "products" | "foodlog"
  mealsView: "list", // "list" | "detail"

  // Meals page data
  categories: [],
  recipes: [],
  selectedCategory: null,
  selectedArea: null,
  searchTerm: "",
  currentMeal: null,

  // Persisted data
  favorites: readJSON(STORAGE_KEYS.FAVORITES, []), // array of meal ids
  foodLog: readJSON(STORAGE_KEYS.FOOD_LOG, []), // array of {id, name, image, loggedAt}
};

/**
 * Updates the app's current top-level page state pointer.
 * @param {string} page - Page identifier ('meals', 'products', 'foodlog').
 */
export function setPage(page) {
  state.currentPage = page;
}

/**
 * Updates the state tracking the active meal layout (list overview vs individual detail block).
 * @param {string} view - The view type ('list' or 'detail').
 */
export function setMealsView(view) {
  state.mealsView = view;
}

/**
 * Stores the array of loaded meal categories locally into state.
 * @param {Array} categories - Pulled from API.
 */
export function setCategories(categories) {
  state.categories = categories;
}

/**
 * Populates state with an array of recipe objects to render into the main list grid.
 * @param {Array} recipes - Collection of recipe items.
 */
export function setRecipes(recipes) {
  state.recipes = recipes;
}

/**
 * Selects a distinct meal category filter to apply and wipes any competing filters.
 * @param {string} category - Specific category string.
 */
export function setSelectedCategory(category) {
  state.selectedCategory = category;
  state.selectedArea = null;
}

/**
 * Selects an area/cuisine filter to apply and wipes any competing category filters.
 * @param {string} area - Specific geographic cuisine string.
 */
export function setSelectedArea(area) {
  state.selectedArea = area;
  state.selectedCategory = null;
}

/**
 * Blanks out all current category, area, and text search filter constraints.
 */
export function clearFilters() {
  state.selectedCategory = null;
  state.selectedArea = null;
  state.searchTerm = "";
}

/**
 * Sets the explicit free-text search term in the state filter layer.
 * @param {string} term - A user search query.
 */
export function setSearchTerm(term) {
  state.searchTerm = term;
}

/**
 * Loads the detailed structure of a singular, fully-fetched meal currently in focus into state.
 * @param {Object} meal - Specific detailed recipe.
 */
export function setCurrentMeal(meal) {
  state.currentMeal = meal;
}

/**
 * Determines whether a specified meal ID exists in the saved favorites array.
 * @param {string|number} mealId - ID to check against state.
 * @returns {boolean} True if favorited.
 */
export function isFavorite(mealId) {
  return state.favorites.includes(String(mealId));
}

/**
 * Toggles a specific meal ID into or out of the favorited state bucket, updating local storage synchronously.
 * @param {string|number} mealId - Valid recipe ID token.
 * @returns {boolean} The new favorited status after execution.
 */
export function toggleFavorite(mealId) {
  const id = String(mealId);
  const index = state.favorites.indexOf(id);
  if (index === -1) {
    state.favorites.push(id);
  } else {
    state.favorites.splice(index, 1);
  }
  writeJSON(STORAGE_KEYS.FAVORITES, state.favorites);
  return isFavorite(id);
}

/**
 * Appends a new item data structure to the food log timeline and syncs it into local storage.
 * @param {Object} entry - Raw values for the logged meal block.
 */
export function addFoodLogEntry(entry) {
  state.foodLog.push({ ...entry, loggedAt: new Date().toISOString() });
  writeJSON(STORAGE_KEYS.FOOD_LOG, state.foodLog);
}

/**
 * Erases a discrete food log entry tracked by a distinct timestamp key, updating local storage natively.
 * @param {string} loggedAt - The ISO timestamp string denoting when it was inserted.
 */
export function removeFoodLogEntry(loggedAt) {
  state.foodLog = state.foodLog.filter((item) => item.loggedAt !== loggedAt);
  writeJSON(STORAGE_KEYS.FOOD_LOG, state.foodLog);
}

/**
 * Clears the entirety of the food log contents and scrubs memory in local storage.
 */
export function clearFoodLog() {
  state.foodLog = [];
  writeJSON(STORAGE_KEYS.FOOD_LOG, state.foodLog);
}

/**
 * Sums calories/protein/carbs/fat for entries logged today. Entries
 * logged before nutrition data was available (or for meals nutrition
 * lookup failed on) simply contribute 0 for whichever fields are
 * missing, rather than breaking the total.
 */
export function getTodayTotals() {
  const today = new Date().toDateString();
  return state.foodLog
    .filter((entry) => new Date(entry.loggedAt).toDateString() === today)
    .reduce(
      (totals, entry) => ({
        calories: totals.calories + (entry.calories || 0),
        protein: totals.protein + (entry.protein || 0),
        carbs: totals.carbs + (entry.carbs || 0),
        fat: totals.fat + (entry.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
}

/**
 * Builds the Sun-Sat view of the current week: per-day calorie total and
 * item count, plus weekly aggregates (average calories/day, total items,
 * and how many days landed within +/-10% of the calorie target - the
 * "Days On Goal" count). A day only counts toward "on goal" if it has at
 * least one logged item; an empty day is neither on nor off goal.
 */
export function getWeekOverview({
  calorieTarget = 2000,
  goalToleranceRatio = 0.1,
} = {}) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // back up to Sunday

  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    const dayKey = day.toDateString();

    const entries = state.foodLog.filter(
      (entry) => new Date(entry.loggedAt).toDateString() === dayKey,
    );
    const calories = entries.reduce(
      (sum, entry) => sum + (Number(entry.calories) || 0),
      0,
    );

    days.push({
      dayLabel: day.toLocaleDateString(undefined, { weekday: "short" }),
      dayNumber: day.getDate(),
      calories,
      itemCount: entries.length,
      isToday: dayKey === now.toDateString(),
    });
  }

  const totalCalories = days.reduce((sum, day) => sum + day.calories, 0);
  const totalItems = days.reduce((sum, day) => sum + day.itemCount, 0);
  const lowerBound = calorieTarget * (1 - goalToleranceRatio);
  const upperBound = calorieTarget * (1 + goalToleranceRatio);
  const daysOnGoal = days.filter(
    (day) =>
      day.itemCount > 0 &&
      day.calories >= lowerBound &&
      day.calories <= upperBound,
  ).length;

  return {
    days,
    weeklyAverage: Math.round(totalCalories / 7),
    totalItems,
    daysOnGoal,
  };
}
