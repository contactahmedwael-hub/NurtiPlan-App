/**
 * TheMealDB API module
 * Base URL: https://www.themealdb.com/api/json/v1/1/
 * Free API, no key required.
 *
 * Every function returns a plain array (never null/undefined) so callers
 * never have to null-check. On network/API failure, functions throw an
 * Error with a human-readable message that the UI layer can display.
 */

const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

/**
 * Internal fetch helper. Normalizes network errors and bad HTTP statuses
 * into a single Error type so callers only need one catch block.
 */
async function request(endpoint) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`);
  } catch (networkError) {
    throw new Error(
      "Couldn't reach TheMealDB. Check your internet connection and try again.",
    );
  }

  if (!response.ok) {
    throw new Error(`TheMealDB returned an error (status ${response.status}).`);
  }

  try {
    return await response.json();
  } catch (parseError) {
    throw new Error("TheMealDB returned an unexpected response.");
  }
}

/**
 * GET /categories.php
 * @returns {Promise<Array>} list of category objects, [] if none.
 */
export async function getCategories() {
  const data = await request("/categories.php");
  return Array.isArray(data?.categories) ? data.categories : [];
}

/**
 * GET /list.php?a=list
 * Returns TheMealDB's real, filterable list of cuisines/areas
 * (American, British, Egyptian, Indian, Thai, ...).
 * @returns {Promise<Array<string>>} sorted list of area names, [] if none.
 */
export async function getAreas() {
  const data = await request("/list.php?a=list");
  const areas = Array.isArray(data?.meals)
    ? data.meals.map((a) => a.strArea).filter(Boolean)
    : [];
  return areas.sort((a, b) => a.localeCompare(b));
}

/**
 * GET /search.php?s={query}
 * @param {string} query
 * @returns {Promise<Array>} list of meals, [] if no matches.
 */
export async function searchMeals(query) {
  const data = await request(`/search.php?s=${encodeURIComponent(query)}`);
  return Array.isArray(data?.meals) ? data.meals : [];
}

/**
 * GET /lookup.php?i={id}
 * @param {string|number} id
 * @returns {Promise<Object|null>} the meal, or null if not found.
 */
export async function lookupMeal(id) {
  const data = await request(`/lookup.php?i=${encodeURIComponent(id)}`);
  return Array.isArray(data?.meals) && data.meals.length > 0
    ? data.meals[0]
    : null;
}

/**
 * GET /filter.php?c={category}
 * Note: filter.php results are "lite" objects (idMeal, strMeal, strMealThumb only).
 * @param {string} category
 * @returns {Promise<Array>}
 */
export async function filterByCategory(category) {
  const data = await request(`/filter.php?c=${encodeURIComponent(category)}`);
  return Array.isArray(data?.meals) ? data.meals : [];
}

/**
 * GET /filter.php?a={area}
 * @param {string} area
 * @returns {Promise<Array>}
 */
export async function filterByArea(area) {
  const data = await request(`/filter.php?a=${encodeURIComponent(area)}`);
  return Array.isArray(data?.meals) ? data.meals : [];
}

/**
 * GET /random.php
 * @returns {Promise<Object|null>}
 */
export async function getRandomMeal() {
  const data = await request("/random.php");
  return Array.isArray(data?.meals) && data.meals.length > 0
    ? data.meals[0]
    : null;
}
