/**
 * NutriPlan - Products API module
 *
 * Base URL: https://nutriplan-api.vercel.app/api/products
 * Confirmed via live inspection (browser address-bar requests) - no
 * x-api-key required for these endpoints, unlike /api/nutrition/analyze.
 *
 * Confirmed shapes:
 *   GET /search?q={query}&page={n}&limit={n}
 *     -> { message, pagination: {total, totalPages, currentPage, limit}, results: [Product] }
 *   GET /barcode/{barcode}
 *     -> { message, result: Product | null }
 *   GET /categories
 *     -> { message, pagination, results: [{ id, name }] }
 *   GET /category/{categoryId}?page={n}&limit={n}
 *     -> { message, pagination, results: [Product] }
 *
 * Product shape (fields can be missing/zero - OpenFoodFacts data is
 * user-submitted and inconsistent):
 *   {
 *     barcode, name, brand, image?, nutritionGrade ("a".."e" | "unknown"),
 *     novaGroup?, nutrients: { calories, fat, carbs, protein, sugar, fiber, sodium }
 *   }
 * nutrients values are per 100g (standard OpenFoodFacts convention - the
 * very small sodium values observed, e.g. 0.04, only make sense as grams
 * per 100g, not milligrams or per-serving).
 */

const BASE_URL = "https://nutriplan-api.vercel.app/api/products";
const REQUEST_TIMEOUT_MS = 12000;

/**
 * Shared helper wrapping a fetch call against the products API with timeout logic and unified error parsing.
 * @param {string} path - The specific API route path to hit.
 * @returns {Promise<Object>} Processed JSON data returned from successful fetch.
 */
async function request(path) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("The product service timed out. Please try again.");
    }
    throw new Error(
      "Couldn't reach the product service. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    if (response.status === 404) throw new Error("Product not found.");
    throw new Error(
      `Product service returned an error (status ${response.status}).`,
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Product service returned an invalid response.");
  }

  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    data.message !== "success"
  ) {
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : "Product service returned an error.",
    );
  }

  return data;
}

/** GET /search?q=&page=&limit= */
export async function searchProducts(query, { page = 1, limit = 24 } = {}) {
  const data = await request(
    `/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
  );
  return {
    results: Array.isArray(data?.results) ? data.results : [],
    pagination: data?.pagination || null,
  };
}

/** GET /barcode/{barcode} - returns null if the barcode isn't found. */
export async function getProductByBarcode(barcode) {
  const data = await request(`/barcode/${encodeURIComponent(barcode)}`);
  return data?.result || null;
}

/** GET /categories */
export async function getProductCategories() {
  const data = await request(`/categories`);
  return Array.isArray(data?.results) ? data.results : [];
}

/** GET /category/{categoryId}?page=&limit= */
export async function getProductsByCategory(
  categoryId,
  { page = 1, limit = 24 } = {},
) {
  const data = await request(
    `/category/${encodeURIComponent(categoryId)}?page=${page}&limit=${limit}`,
  );
  return {
    results: Array.isArray(data?.results) ? data.results : [],
    pagination: data?.pagination || null,
  };
}
