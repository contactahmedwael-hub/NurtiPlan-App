/**
 * NutriPlan - Nutrition Analysis API module
 *
 * POST https://nutriplan-api.vercel.app/api/nutrition/analyze
 * Requires an `x-api-key` header.
 *
 * NOTE ON THE REQUEST BODY: sends { recipeName, ingredients } - confirmed
 * working via a live browser test (ingredients parsed correctly on the
 * API's side).
 *
 * NOTE ON THE RESPONSE: confirmed shape (via live inspection) is
 * { success, data: { perServing: {...}, totals: {...}, recipeName,
 * servings, totalWeight, ingredients: [...] } }. normalizeResponse()
 * reads per-serving macros from data.perServing and the total calorie
 * figure from data.totals.calories.
 *
 * NOTE ON THE API KEY: it's used directly from the browser here, which
 * means it's visible to anyone who opens dev tools on this page. That's
 * a known trade-off for this build (see the project's README/chat notes)
 * - for anything beyond a demo/course project, this call should go
 * through a small server-side proxy that holds the key instead.
 */

const API_URL = "https://nutriplan-api.vercel.app/api/nutrition/analyze";
const API_KEY = "Ahr0UeHTUZDfdky0CemxzfLtX3Y9B1t1Gg4V9IpU";
const REQUEST_TIMEOUT_MS = 15000;

const cache = new Map(); // mealId -> normalized nutrition object
const inFlight = new Map(); // mealId -> Promise, dedupes overlapping requests for the same meal

/**
 * Iterates through the up to 20 potential ingredient and measure fields from TheMealDB format and concats them.
 * @param {Object} meal - A meal data object.
 * @returns {Array<string>} An array of composed ingredients (e.g., ["1 cup Milk", "2 tsp Sugar"]).
 */
function buildIngredientStrings(meal) {
  const lines = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = (meal[`strIngredient${i}`] || "").trim();
    const measure = (meal[`strMeasure${i}`] || "").trim();
    if (ingredient) {
      lines.push(measure ? `${measure} ${ingredient}` : ingredient);
    }
  }
  return lines;
}

/**
 * Scans an object for the first truthy/defined value among a series of provided possible string keys.
 * @param {Object} obj - Data object to scan.
 * @param {Array<string>} keys - Fallback keys to attempt reading.
 * @returns {*} The matched property value, or undefined.
 */
function pick(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

/**
 * Maps varying, irregular keys in the incoming API response payload to a standardized internal format object.
 * @param {Object} raw - Disorganized raw data from the API body.
 * @returns {Object} Consistent object shape covering macros and limits.
 */
function normalizeResponse(raw) {
  // Confirmed shape (via live inspection): { success, data: { perServing: {...},
  // totals: {...}, recipeName, servings, totalWeight, ingredients: [...] } }
  const data = raw?.data || raw?.result || raw?.nutrition || raw;
  const perServing = data?.perServing || data?.per_serving || data;
  const totals = data?.totals || data?.total || {};

  const normalized = {
    caloriesPerServing:
      Number(
        pick(perServing, [
          "calories",
          "caloriesPerServing",
          "calories_per_serving",
        ]),
      ) || 0,
    totalCalories:
      Number(pick(totals, ["calories", "totalCalories", "total_calories"])) ||
      0,
    protein:
      Number(pick(perServing, ["protein", "protein_g", "proteinGrams"])) || 0,
    carbs:
      Number(
        pick(perServing, [
          "carbs",
          "carbohydrates",
          "carbs_g",
          "carbohydrates_g",
        ]),
      ) || 0,
    fat:
      Number(pick(perServing, ["fat", "fat_g", "totalFat", "total_fat"])) || 0,
    fiber: Number(pick(perServing, ["fiber", "fiber_g", "dietaryFiber"])) || 0,
    sugar: Number(pick(perServing, ["sugar", "sugar_g", "sugars"])) || 0,
    saturatedFat:
      Number(
        pick(perServing, [
          "saturatedFat",
          "saturated_fat",
          "saturatedFatGrams",
        ]),
      ) || 0,
    cholesterol:
      Number(pick(perServing, ["cholesterol", "cholesterol_mg"])) || 0,
    sodium: Number(pick(perServing, ["sodium", "sodium_mg"])) || 0,
    servings:
      Number(pick(data, ["servings", "numberOfServings", "serves"])) || null,
    totalWeight: pick(data, ["totalWeight", "total_weight"]) ?? null,
  };

  if (!normalized.totalCalories && !normalized.caloriesPerServing) {
    console.warn(
      "[nutrition] Response didn't match any expected field name - check the raw shape and update src/js/api/nutrition.js:",
      raw,
    );
  }

  return normalized;
}

/** Returns a cached result for this meal id, or null if nothing's cached yet. */
export function getCachedNutrition(mealId) {
  return cache.get(String(mealId)) || null;
}

/**
 * Analyzes a meal's ingredient list and returns normalized nutrition
 * data. Results are cached per meal id for the session (so reopening the
 * same recipe doesn't re-call the API), and concurrent calls for the
 * same meal share one in-flight request instead of firing duplicates.
 */
export async function analyzeNutrition(meal, { signal } = {}) {
  const id = String(meal.idMeal);

  const cached = cache.get(id);
  if (cached) return cached;

  if (inFlight.has(id)) return inFlight.get(id);

  const promise = (async () => {
    const ingredients = buildIngredientStrings(meal);
    if (ingredients.length === 0) {
      throw new Error("This recipe has no ingredients to analyze.");
    }

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(
      () => timeoutController.abort(),
      REQUEST_TIMEOUT_MS,
    );
    const onExternalAbort = () => timeoutController.abort();
    if (signal) {
      if (signal.aborted) timeoutController.abort();
      else signal.addEventListener("abort", onExternalAbort);
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        // Guessed body shape - see the module note at the top of this file.
        // Response echoes recipeName: "Untitled Recipe" when this key
        // isn't recognized, so switched from the guessed "mealName" to
        // "recipeName" to match the API's own field naming.
        body: JSON.stringify({
          recipeName: meal.strMeal,
          ingredients,
        }),
        signal: timeoutController.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Nutrition lookup is rate-limited right now. Please try again shortly.",
          );
        }
        throw new Error(
          `Nutrition analysis failed (status ${response.status}).`,
        );
      }

      let raw;
      try {
        raw = await response.json();
      } catch {
        throw new Error("The nutrition service returned an invalid response.");
      }

      const normalized = normalizeResponse(raw);
      cache.set(id, normalized);
      return normalized;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(
          signal?.aborted
            ? "Nutrition lookup cancelled."
            : "Nutrition lookup timed out. Please try again.",
        );
      }
      if (err instanceof TypeError) {
        throw new Error(
          "Couldn't reach the nutrition service. Check your connection and try again.",
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener("abort", onExternalAbort);
    }
  })();

  inFlight.set(id, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(id);
  }
}
