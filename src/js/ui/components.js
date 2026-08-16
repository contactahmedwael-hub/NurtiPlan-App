/**
 * Pure(ish) rendering helpers.
 * Every function takes data + a container element and writes markup into it.
 * No fetching happens in here - that stays in main.js / api/mealdb.js.
 */

const CATEGORY_ICONS = {
  Beef: "fa-drumstick-bite",
  Chicken: "fa-drumstick-bite",
  Dessert: "fa-ice-cream",
  Lamb: "fa-drumstick-bite",
  Miscellaneous: "fa-utensils",
  Pasta: "fa-bowl-food",
  Pork: "fa-bacon",
  Seafood: "fa-fish",
  Side: "fa-carrot",
  Starter: "fa-plate-wheat",
  Vegan: "fa-leaf",
  Vegetarian: "fa-seedling",
  Breakfast: "fa-egg",
  Goat: "fa-drumstick-bite",
};

/**
 * Color theme per category, so "Browse by Meal Type" cards aren't all the
 * same green. Theme classes (cat-red, cat-orange, ...) are defined in
 * src/css/style.css and control the card background/border and the icon
 * gradient. Anything not listed here falls back to "cat-emerald", the
 * original design's color.
 */
const CATEGORY_THEMES = {
  Beef: "cat-red",
  Goat: "cat-red",
  Pork: "cat-red",
  Chicken: "cat-orange",
  Lamb: "cat-amber",
  Dessert: "cat-pink",
  Breakfast: "cat-amber",
  Pasta: "cat-amber",
  Miscellaneous: "cat-gray",
  Seafood: "cat-blue",
  Starter: "cat-cyan",
  Side: "cat-teal",
  Vegan: "cat-green",
  Vegetarian: "cat-lime",
};

function categoryTheme(name) {
  return CATEGORY_THEMES[name] || "cat-emerald";
}

/** Escapes text before it's interpolated into innerHTML, to avoid XSS from API data. */
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* -------------------------------------------------------------------- */
/*  Loading / empty / error states                                      */
/* -------------------------------------------------------------------- */

/**
 * Renders skeleton card placeholders into a container while waiting for grid data.
 * @param {HTMLElement} container - The DOM element to render into.
 * @param {number} [count=8] - The number of skeleton items to draw.
 */
export function renderSkeletonCards(container, count = 8) {
  container.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="bg-white rounded-xl overflow-hidden shadow-sm">
        <div class="h-48 skeleton"></div>
        <div class="p-4 space-y-2">
          <div class="h-4 w-3/4 skeleton rounded"></div>
          <div class="h-3 w-1/2 skeleton rounded"></div>
        </div>
      </div>`
    )
    .join("");
}

/**
 * Renders skeleton placeholder items specifically for the category sections.
 * @param {HTMLElement} container - The DOM element to render into.
 * @param {number} [count=6] - The number of skeleton items to draw.
 */
export function renderSkeletonCategories(container, count = 6) {
  container.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="rounded-xl p-3 border border-gray-200">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-lg skeleton"></div>
          <div class="h-4 w-16 skeleton rounded"></div>
        </div>
      </div>`
    )
    .join("");
}

/**
 * Renders a generic empty state graphic and message when a list is completely bare.
 * @param {HTMLElement} container - The DOM element to render into.
 * @param {Object} data - Contains title, subtitle, and font-awesome icon strings to populate.
 */
export function renderEmptyState(container, { title, subtitle, icon = "fa-search" }) {
  container.innerHTML = `
    <div class="empty-state flex flex-col items-center justify-center text-center" style="grid-column: 1 / -1; min-height: 55vh;">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid ${icon} text-gray-400 text-2xl"></i>
      </div>
      <p class="text-gray-500 text-lg">${escapeHtml(title)}</p>
      ${subtitle ? `<p class="text-gray-400 text-sm mt-2">${escapeHtml(subtitle)}</p>` : ""}
    </div>`;
}

/**
 * Renders a visually distinct error block into a container, optionally with a Retry button.
 * @param {HTMLElement} container - The DOM element to render into.
 * @param {string} message - The error message text.
 * @param {Object} [options] - Options, including an `onRetry` callback for the button.
 */
export function renderErrorState(container, message, { onRetry } = {}) {
  container.innerHTML = `
    <div class="empty-state flex flex-col items-center justify-center text-center" style="grid-column: 1 / -1; min-height: 55vh;">
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-triangle-exclamation text-red-400 text-2xl"></i>
      </div>
      <p class="text-gray-700 text-lg font-medium">Something went wrong</p>
      <p class="text-gray-400 text-sm mt-2">${escapeHtml(message)}</p>
      ${onRetry ? `<button id="retry-btn" class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all">Try Again</button>` : ""}
    </div>`;
  if (onRetry) {
    container.querySelector("#retry-btn")?.addEventListener("click", onRetry);
  }
}

/* -------------------------------------------------------------------- */
/*  Meals page                                                          */
/* -------------------------------------------------------------------- */

/**
 * Injects HTML for interactive category cards based on a category list.
 * @param {Array} categories - Array of category data items.
 * @param {HTMLElement} container - The DOM element to render into.
 */
export function renderCategories(categories, container) {
  container.innerHTML = categories
    .map((cat) => {
      const icon = CATEGORY_ICONS[cat.strCategory] || "fa-utensils";
      const theme = categoryTheme(cat.strCategory);
      return `
      <div
        class="category-card ${theme} rounded-xl p-3 border hover:shadow-md cursor-pointer transition-all group"
        data-category="${escapeHtml(cat.strCategory)}"
        title="${escapeHtml(cat.strCategoryDescription || "").slice(0, 120)}"
      >
        <div class="flex items-center gap-2.5">
          <div class="category-icon text-white w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <i class="fa-solid ${icon}"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-gray-900">${escapeHtml(cat.strCategory)}</h3>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

/**
 * Builds HTML for interactive meal recipe cards and assigns them to the given container.
 * @param {Array} meals - Array of meal objects.
 * @param {HTMLElement} container - The DOM element to populate.
 */
export function renderRecipeCards(meals, container) {
  container.innerHTML = meals
    .map((meal) => {
      const category = meal.strCategory || "";
      const area = meal.strArea || "";
      return `
      <div
        class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
        data-meal-id="${escapeHtml(meal.idMeal)}"
      >
        <div class="relative h-48 overflow-hidden">
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" loading="lazy" />
          <div class="absolute bottom-3 left-3 flex gap-2">
            ${category ? `<span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">${escapeHtml(category)}</span>` : ""}
            ${area ? `<span class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white">${escapeHtml(area)}</span>` : ""}
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
            ${escapeHtml(meal.strMeal)}
          </h3>
          <p class="text-xs text-gray-600 mb-3 line-clamp-2">
            ${category || area ? `${escapeHtml(category)}${category && area ? " &middot; " : ""}${escapeHtml(area)} recipe` : "Tap to see the full recipe"}
          </p>
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-gray-900">
              <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${escapeHtml(category || "-")}
            </span>
            <span class="font-semibold text-gray-500">
              <i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHtml(area || "-")}
            </span>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

/** Truncates instruction text to a short excerpt for the list view card, on a word boundary. */
function excerpt(text, maxLength = 140) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(" "))}...`;
}

/**
 * List view: two-column grid of horizontal cards (image left, title +
 * instructions excerpt + category/area on the right).
 */
export function renderRecipeListItems(meals, container) {
  container.innerHTML = meals
    .map((meal) => {
      const category = meal.strCategory || "";
      const area = meal.strArea || "";
      return `
      <div
        class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex"
        data-meal-id="${escapeHtml(meal.idMeal)}"
      >
        <div class="w-40 sm:w-48 h-40 sm:h-44 shrink-0 overflow-hidden">
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" loading="lazy" />
        </div>
        <div class="p-4 flex flex-col flex-1 min-w-0">
          <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
            ${escapeHtml(meal.strMeal)}
          </h3>
          <p class="text-xs text-gray-600 mb-3 line-clamp-2">
            ${escapeHtml(excerpt(meal.strInstructions)) || "Tap to see the full recipe"}
          </p>
          <div class="flex items-center gap-4 text-xs mt-auto">
            <span class="font-semibold text-gray-900">
              <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${escapeHtml(category || "-")}
            </span>
            <span class="font-semibold text-gray-500">
              <i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHtml(area || "-")}
            </span>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

/**
 * Displays or updates the count of items displayed in the recipes grid section.
 * @param {HTMLElement} el - The DOM element holding the count text.
 * @param {number} count - Total items being displayed.
 * @param {Object} [options] - Optional pagination configurations (e.g. `total`).
 */
export function updateRecipesCount(el, count, { total } = {}) {
  if (count === 0) {
    el.textContent = "No recipes found";
  } else if (total && total !== count) {
    el.textContent = `Showing ${count} of ${total} recipes`;
  } else {
    el.textContent = `Showing ${count} recipe${count === 1 ? "" : "s"}`;
  }
}

/**
 * Injects generic placeholder loading pill shapes into a container.
 * @param {HTMLElement} container - Container to put the skeletons in.
 * @param {number} [count=10] - Number of skeleton pills to draw.
 */
export function renderSkeletonPills(container, count = 10) {
  container.innerHTML = Array.from({ length: count })
    .map(() => `<div class="h-9 w-24 skeleton rounded-full shrink-0"></div>`)
    .join("");
}

/**
 * Renders the "All Cuisines" + one pill per TheMealDB area.
 * @param {string[]} areas
 * @param {HTMLElement} container
 * @param {string|null} activeArea - falsy means "All Cuisines" is active.
 */
export function renderCuisinePills(areas, container, activeArea) {
  const allPill = `<button type="button" class="cuisine-pill${!activeArea ? " active" : ""}" data-area="">All Cuisines</button>`;
  const areaPills = areas
    .map(
      (area) =>
        `<button type="button" class="cuisine-pill${activeArea === area ? " active" : ""}" data-area="${escapeHtml(area)}">${escapeHtml(area)}</button>`
    )
    .join("");
  container.innerHTML = allPill + areaPills;
}

/* -------------------------------------------------------------------- */
/*  Meal detail                                                         */
/* -------------------------------------------------------------------- */

/** Pulls the up-to-20 ingredient/measure pairs TheMealDB spreads across flat fields. */
export function getIngredientList(meal) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      list.push({ ingredient: ingredient.trim(), measure: (measure || "").trim() });
    }
  }
  return list;
}

/** TheMealDB gives instructions as one blob of text; split into readable steps. */
/**
 * Detects a short "Label:" line (e.g. "Pro Tips:", "Serving Suggestions:")
 * with no other content - these show up in some TheMealDB recipes as
 * their own line ahead of real content and should render as a section
 * divider, not a numbered step. Deliberately narrow: short, starts with
 * a capital letter, ends with a colon and nothing else, no sentence
 * punctuation - so it won't misfire on a real step like "Prepare the
 * Fire: Start a wood fire..." which has content after the colon.
 */
function isInstructionHeading(text) {
  return /^[A-Z][A-Za-z0-9 ,'&-]{1,38}:$/.test(text.trim());
}

/**
 * Takes the raw instruction string from a meal and smartly breaks it down into a list of individual steps.
 * @param {Object} meal - The meal data object from TheMealDB.
 * @returns {Array<string>} An array of individual instruction step strings.
 */
export function getInstructionSteps(meal) {
  const raw = (meal.strInstructions || "").trim();
  if (!raw) return [];
  // Try newline-separated steps first (most common), fall back to sentence split.
  let steps = raw
    .split(/\r?\n+/)
    .map((s) => s.replace(/^\s*(step\s*)?\d+[\).\-:]\s*/i, "").trim())
    // TheMealDB sometimes splits a step across two lines: a line that's
    // just the step marker ("2", "step 1", "STEP 3") followed by a
    // separate line with the actual text. The regex above only strips a
    // marker when it's attached to punctuation (e.g. "2." or "2)"), so a
    // bare marker with nothing after it survives as its own line - drop
    // those here rather than showing them as a step with no content.
    .filter((s) => s && !/^(step\s*)?\d+$/i.test(s));
  if (steps.length <= 1) {
    steps = raw
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return steps;
}

/**
 * Extracts and converts a standard YouTube watch URL to its embeddable frame equivalent.
 * @param {string} url - The original YouTube URL.
 * @returns {string|null} The converted embed URL, or null if no valid ID was matched.
 */
function youtubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

/**
 * Populates all DOM elements within the detailed meal view using a full recipe object.
 * @param {Object} meal - Meal object returned by TheMealDB API.
 * @param {Object} refs - A collection of targeted DOM node references.
 * @param {Object} options - UI state options (e.g. whether this is 'favorited').
 */
export function renderMealDetail(meal, refs, { favorited }) {
  const {
    heroImg,
    heroTitle,
    heroBadges,
    heroServings,
    heroCalories,
    ingredientsList,
    ingredientsCount,
    instructionsList,
    videoContainer,
    logMealBtn,
    favoriteBtn,
  } = refs;

  heroImg.src = meal.strMealThumb;
  heroImg.alt = meal.strMeal;
  heroImg.classList.remove("skeleton");
  heroTitle.textContent = meal.strMeal;

  const badges = [meal.strCategory, meal.strArea].filter(Boolean);
  heroBadges.innerHTML = badges
    .map(
      (b, i) =>
        `<span class="px-3 py-1 ${i === 0 ? "bg-emerald-500" : "bg-blue-500"} text-white text-sm font-semibold rounded-full">${escapeHtml(b)}</span>`
    )
    .join("");

  // Real values fill in once nutrition loads (main.js's
  // updateHeroNutritionSummary) - show a spinner rather than jumping
  // straight to "N/A" text while that fetch is still in flight.
  heroServings.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  heroCalories.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

  const ingredients = getIngredientList(meal);
  ingredientsCount.textContent = `${ingredients.length} item${ingredients.length === 1 ? "" : "s"}`;
  ingredientsList.innerHTML = ingredients
    .map(
      (item) => `
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
        <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300" />
        <span class="text-gray-700">
          ${item.measure ? `<span class="font-medium text-gray-900">${escapeHtml(item.measure)}</span> ` : ""}${escapeHtml(item.ingredient)}
        </span>
      </div>`
    )
    .join("");

  // Some TheMealDB recipes mix in short section labels like "Pro Tips:" or
  // "Serving Suggestions:" as their own line, followed by real content on
  // the next lines. Giving a bare label its own numbered step circle looks
  // wrong (it's not an action step) and disrupts the step count - render
  // it as a small section divider instead, and don't count it toward the
  // step numbers.
  const steps = getInstructionSteps(meal);
  let stepNumber = 0;
  instructionsList.innerHTML = steps
    .map((step) => {
      if (isInstructionHeading(step)) {
        return `
      <div class="pt-4 pb-1 first:pt-0">
        <p class="text-sm font-bold text-gray-500 uppercase tracking-wide">${escapeHtml(step)}</p>
      </div>`;
      }
      stepNumber += 1;
      return `
      <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
        <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${stepNumber}</div>
        <p class="text-gray-700 leading-relaxed pt-2">${escapeHtml(step)}</p>
      </div>`;
    })
    .join("");

  const embedUrl = youtubeEmbedUrl(meal.strYoutube);
  videoContainer.innerHTML = embedUrl
    ? `<iframe src="${embedUrl}" class="absolute inset-0 w-full h-full" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`
    : `<div class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">No video available for this recipe</div>`;

  // Nutrition Facts panel is populated separately by main.js
  // (loadNutritionFacts), since it comes from a different API and loads
  // asynchronously after the rest of the meal details are already shown.

  logMealBtn.dataset.mealId = meal.idMeal;

  if (favoriteBtn) {
    favoriteBtn.dataset.mealId = meal.idMeal;
    setFavoriteButtonState(favoriteBtn, favorited);
  }
}

/**
 * Toggles classes and markup on a favorite button to visually indicate if an item is liked.
 * @param {HTMLElement} btn - The heart button DOM element.
 * @param {boolean} favorited - True if currently liked, false otherwise.
 */
export function setFavoriteButtonState(btn, favorited) {
  const icon = btn.querySelector("i");
  if (favorited) {
    btn.classList.add("bg-red-50", "text-red-600");
    btn.classList.remove("bg-gray-100", "text-gray-700");
    if (icon) icon.className = "fa-solid fa-heart";
    btn.setAttribute("aria-pressed", "true");
  } else {
    btn.classList.remove("bg-red-50", "text-red-600");
    btn.classList.add("bg-gray-100", "text-gray-700");
    if (icon) icon.className = "fa-regular fa-heart";
    btn.setAttribute("aria-pressed", "false");
  }
}

/* -------------------------------------------------------------------- */
/*  Food log                                                            */
/* -------------------------------------------------------------------- */

/**
 * Updates the container to list out logged food entries, or shows a placeholder if empty.
 * @param {Array} entries - An array of food log entry objects.
 * @param {HTMLElement} container - The DOM node to attach the list elements to.
 * @param {Object} [options] - Options block including the remove callback logic.
 */
export function renderFoodLog(entries, container, { onRemove } = {}) {
  if (entries.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
        <p class="font-medium">No meals logged today</p>
        <p class="text-sm">Add meals from the Meals page or scan products</p>
      </div>`;
    return;
  }

  container.innerHTML = entries
    .map((entry) => {
      const hasMacros = entry.calories != null;
      return `
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl" data-logged-at="${escapeHtml(entry.loggedAt)}">
        <img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.name)}" class="w-12 h-12 rounded-lg object-cover" />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">${escapeHtml(entry.name)}</p>
          <p class="text-xs text-gray-500">${entry.servings || 1} serving${(entry.servings || 1) === 1 ? "" : "s"} &bull; Recipe</p>
          <p class="text-xs text-gray-400">${new Date(entry.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        ${
          hasMacros
            ? `<div class="text-right shrink-0">
                <p class="font-bold text-gray-900">${Math.round(entry.calories)}<span class="text-xs font-normal text-gray-500"> kcal</span></p>
                <div class="flex gap-1 mt-1">
                  <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded">${Math.round(entry.protein || 0)}g P</span>
                  <span class="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded">${Math.round(entry.carbs || 0)}g C</span>
                  <span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded">${Math.round(entry.fat || 0)}g F</span>
                </div>
              </div>`
            : ""
        }
        <button class="remove-log-btn text-gray-400 hover:text-red-500 transition-colors shrink-0" aria-label="Remove ${escapeHtml(entry.name)} from log" data-logged-at="${escapeHtml(entry.loggedAt)}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`;
    })
    .join("");

  if (onRemove) {
    container.querySelectorAll(".remove-log-btn").forEach((btn) => {
      btn.addEventListener("click", () => onRemove(btn.dataset.loggedAt));
    });
  }
}

/**
 * Renders the Sun-Sat "Weekly Overview" strip: one cell per day showing
 * day label, date, calories logged, and item count. Today's cell is
 * highlighted.
 */
export function renderWeeklyDayStrip(days, container) {
  container.innerHTML = `
    <div class="grid grid-cols-7 gap-2">
      ${days
        .map(
          (day) => `
        <div class="rounded-xl p-3 text-center ${day.isToday ? "bg-indigo-100 ring-2 ring-indigo-300" : "bg-gray-50"}">
          <p class="text-xs font-medium text-gray-500">${escapeHtml(day.dayLabel)}</p>
          <p class="text-sm font-semibold text-gray-900 mb-2">${day.dayNumber}</p>
          <p class="text-sm font-bold ${day.itemCount > 0 ? "text-emerald-600" : "text-gray-300"}">${Math.round(day.calories)}</p>
          <p class="text-[10px] text-gray-400">kcal</p>
          ${day.itemCount > 0 ? `<p class="text-[10px] text-gray-400 mt-1">${day.itemCount} item${day.itemCount === 1 ? "" : "s"}</p>` : ""}
        </div>`
        )
        .join("")}
    </div>`;
}

/** Updates the three "Weekly Average / Total Items This Week / Days On Goal" summary cards. */
export function updateWeeklySummaryCards({ avgEl, totalItemsEl, daysOnGoalEl }, overview) {
  if (avgEl) avgEl.textContent = `${overview.weeklyAverage} kcal`;
  if (totalItemsEl) totalItemsEl.textContent = `${overview.totalItems} item${overview.totalItems === 1 ? "" : "s"}`;
  if (daysOnGoalEl) daysOnGoalEl.textContent = `${overview.daysOnGoal} / 7`;
}

/**
 * Updates the four "Today's Nutrition" progress cards on the Food Log
 * page (Calories/Protein/Carbs/Fat) against fixed daily targets. Targets
 * match the numbers already printed in the static design.
 */
export function updateFoodLogProgress(refs, totals) {
  const targets = [
    { key: "calories", unit: "kcal", target: 2000, valueEl: refs.caloriesValueEl, barEl: refs.caloriesBarEl },
    { key: "protein", unit: "g", target: 50, valueEl: refs.proteinValueEl, barEl: refs.proteinBarEl },
    { key: "carbs", unit: "g", target: 250, valueEl: refs.carbsValueEl, barEl: refs.carbsBarEl },
    { key: "fat", unit: "g", target: 65, valueEl: refs.fatValueEl, barEl: refs.fatBarEl },
  ];

  targets.forEach(({ key, unit, target, valueEl, barEl }) => {
    const value = Math.round(totals[key] || 0);
    if (valueEl) valueEl.textContent = `${value} / ${target} ${unit}`;
    if (barEl) barEl.style.width = `${Math.max(0, Math.min(100, Math.round((value / target) * 100)))}%`;
  });
}

/* -------------------------------------------------------------------- */
/*  Nutrition Facts panel (via nutriplan-api.vercel.app)                */
/* -------------------------------------------------------------------- */

// Reference amounts used to size each macro's progress bar, based on
// commonly-cited daily values (grams/day). TheMealDB/the nutrition API
// don't provide personalized targets, so these are fixed reference points,
// not a diet recommendation.
const NUTRITION_DAILY_VALUES = {
  protein: 50,
  carbs: 275,
  fat: 78,
  fiber: 28,
  sugar: 50,
  saturatedFat: 20,
};

const MACRO_ROWS = [
  { key: "protein", label: "Protein", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  { key: "carbs", label: "Carbs", dot: "bg-blue-500", bar: "bg-blue-500" },
  { key: "fat", label: "Fat", dot: "bg-purple-500", bar: "bg-purple-500" },
  { key: "fiber", label: "Fiber", dot: "bg-orange-500", bar: "bg-orange-500" },
  { key: "sugar", label: "Sugar", dot: "bg-pink-500", bar: "bg-pink-500" },
  { key: "saturatedFat", label: "Saturated Fat", dot: "bg-red-500", bar: "bg-red-500" },
];

/**
 * Calculates the percentage towards a reference daily value for a given macronutrient.
 * @param {number} value - The raw amount of the nutrient (usually grams).
 * @param {string} key - The specific macronutrient identifier (e.g. 'protein').
 * @returns {number} A capped percentage between 0 and 100.
 */
function macroPercent(value, key) {
  const dv = NUTRITION_DAILY_VALUES[key];
  if (!dv) return 0;
  return Math.max(0, Math.min(100, Math.round((value / dv) * 100)));
}

/**
 * Injects a loading spinner specifically into the nutrition facts container.
 * @param {HTMLElement} container - The DOM element meant to hold the nutrition panel.
 */
export function renderNutritionLoading(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-10 text-center" role="status" aria-live="polite">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
      <p class="text-gray-500 text-sm">Analyzing nutrition...</p>
    </div>`;
}

/**
 * Fills the whole meal-detail page (hero, ingredients, instructions) with
 * shimmering skeleton placeholders while the recipe is being fetched -
 * replaces the old plain "Loading..." text with something that actually
 * looks alive.
 */
export function renderMealDetailSkeleton(refs) {
  const { heroImg, heroTitle, heroBadges, heroServings, heroCalories, ingredientsList, ingredientsCount, instructionsList } = refs;

  if (heroImg) {
    heroImg.removeAttribute("src");
    heroImg.alt = "";
    heroImg.classList.add("skeleton");
  }
  if (heroTitle) heroTitle.innerHTML = `<span class="inline-block h-8 w-64 max-w-full skeleton rounded"></span>`;
  if (heroBadges) {
    heroBadges.innerHTML = `
      <span class="inline-block h-6 w-20 skeleton rounded-full"></span>
      <span class="inline-block h-6 w-24 skeleton rounded-full"></span>`;
  }
  if (heroServings) heroServings.innerHTML = `<span class="inline-block h-4 w-20 skeleton rounded"></span>`;
  if (heroCalories) heroCalories.innerHTML = `<span class="inline-block h-4 w-16 skeleton rounded"></span>`;
  if (ingredientsCount) ingredientsCount.innerHTML = `<span class="inline-block h-4 w-12 skeleton rounded"></span>`;

  if (ingredientsList) {
    ingredientsList.innerHTML = Array.from({ length: 6 })
      .map(() => `<div class="h-11 skeleton rounded-xl"></div>`)
      .join("");
  }
  if (instructionsList) {
    instructionsList.innerHTML = Array.from({ length: 4 })
      .map(
        () => `
        <div class="flex gap-4 p-4">
          <div class="w-10 h-10 rounded-full skeleton shrink-0"></div>
          <div class="flex-1 space-y-2 pt-2">
            <div class="h-4 w-full skeleton rounded"></div>
            <div class="h-4 w-2/3 skeleton rounded"></div>
          </div>
        </div>`
      )
      .join("");
  }
}

const LOG_BUTTON_STATES = {
  idle: { icon: "fa-clipboard-list", label: "Log This Meal", classes: "bg-blue-600 hover:bg-blue-700" },
  loading: { icon: "fa-spinner fa-spin", label: "Logging...", classes: "bg-blue-500" },
  success: { icon: "fa-circle-check", label: "Logged!", classes: "bg-emerald-600" },
};

/**
 * Switches the "Log This Meal" button between idle/loading/success visuals.
 * "loading" spins the icon; "success" swaps to a checkmark with a quick
 * scale-up pop (the .scale-up animation already defined in style.css).
 */
export function setLogButtonState(btn, stateName) {
  const state = LOG_BUTTON_STATES[stateName] || LOG_BUTTON_STATES.idle;
  const icon = btn.querySelector("i");
  const label = btn.querySelector("span");
  if (icon) icon.className = `fa-solid ${state.icon}`;
  if (label) label.textContent = state.label;

  Object.values(LOG_BUTTON_STATES).forEach((s) => btn.classList.remove(...s.classes.split(" ")));
  btn.classList.add(...state.classes.split(" "));

  btn.classList.remove("scale-up");
  if (stateName === "success") {
    // Restart the animation even if it was already applied recently.
    void btn.offsetWidth;
    btn.classList.add("scale-up");
  }
}

/**
 * Populates an error state within the nutrition container, complete with a button to attempt refetching.
 * @param {HTMLElement} container - The wrapper element for the nutrition facts.
 * @param {string} message - A string describing what failed.
 * @param {Function} onRetry - A callback function triggered upon clicking retry.
 */
export function renderNutritionErrorState(container, message, onRetry) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-10 text-center">
      <div class="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
        <i class="fa-solid fa-triangle-exclamation text-red-400 text-xl"></i>
      </div>
      <p class="text-gray-700 font-medium">Couldn't load nutrition facts</p>
      <p class="text-gray-400 text-sm mt-1">${escapeHtml(message)}</p>
      <button id="nutrition-retry-btn" type="button" class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all">Try again</button>
    </div>`;
  container.querySelector("#nutrition-retry-btn")?.addEventListener("click", onRetry);
}

/** Renders the real Nutrition Facts panel from a normalized nutrition object. */
export function renderNutritionFacts(container, n) {
  const macroRows = MACRO_ROWS.map(
    (row) => `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full ${row.dot}"></div>
          <span class="text-gray-700">${row.label}</span>
        </div>
        <span class="font-bold text-gray-900">${Math.round(n[row.key])}g</span>
      </div>
      <div class="w-full bg-gray-100 rounded-full h-2">
        <div class="${row.bar} h-2 rounded-full" style="width: ${macroPercent(n[row.key], row.key)}%"></div>
      </div>`
  ).join("");

  container.innerHTML = `
    <p class="text-sm text-gray-500 mb-4">Per serving</p>
    <div class="text-center py-4 mb-4 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl">
      <p class="text-sm text-gray-600">Calories per serving</p>
      <p class="text-4xl font-bold text-emerald-600">${Math.round(n.caloriesPerServing)}</p>
      <p class="text-xs text-gray-500 mt-1">Total: ${Math.round(n.totalCalories)} cal</p>
    </div>
    <div class="space-y-4">
      ${macroRows}
    </div>
    <div class="mt-6 pt-6 border-t border-gray-100">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Other</h3>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Cholesterol</span>
          <span class="font-medium">${Math.round(n.cholesterol)}mg</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Sodium</span>
          <span class="font-medium">${Math.round(n.sodium)}mg</span>
        </div>
      </div>
    </div>`;
}

/* -------------------------------------------------------------------- */
/*  Product Scanner page (via nutriplan-api.vercel.app/api/products)    */
/* -------------------------------------------------------------------- */

const NUTRI_SCORE_COLORS = {
  a: "bg-green-500",
  b: "bg-lime-500",
  c: "bg-yellow-500",
  d: "bg-orange-500",
  e: "bg-red-500",
};

const NOVA_COLORS = {
  1: "bg-green-500",
  2: "bg-lime-500",
  3: "bg-orange-500",
  4: "bg-red-500",
};

/**
 * Helper strictly for parsing and rounding numeric amounts exactly to one decimal place.
 * @param {number|string} value - The input numeric value.
 * @returns {number} The rounded number.
 */
function round1(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

/** Builds one product-card element matching the static example in index.html. */
export function createProductCard(product) {
  const grade = (product.nutritionGrade || "").toLowerCase();
  const gradeColor = NUTRI_SCORE_COLORS[grade];
  const n = product.nutrients || {};

  const el = document.createElement("div");
  el.className =
    "product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group";
  el.dataset.barcode = product.barcode || "";

  const novaBadge = product.novaGroup
    ? `<div class="absolute top-2 right-2 ${NOVA_COLORS[product.novaGroup] || "bg-gray-400"} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" title="NOVA ${product.novaGroup}">${product.novaGroup}</div>`
    : "";

  el.innerHTML = `
    <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
      ${
        product.image
          ? `<img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name || "Product")}" loading="lazy" />`
          : `<i class="fa-solid fa-box-open text-gray-300 text-3xl"></i>`
      }
      <div class="absolute top-2 left-2 ${gradeColor || "bg-gray-400"} text-white text-xs font-bold px-2 py-1 rounded uppercase">
        ${gradeColor ? `Nutri-Score ${grade}` : "Not rated"}
      </div>
      ${novaBadge}
    </div>
    <div class="p-4">
      <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${escapeHtml(product.brand || "Unknown brand")}</p>
      <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${escapeHtml(product.name || "Unnamed product")}</h3>
      <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span><i class="fa-solid fa-fire mr-1"></i>${Math.round(n.calories || 0)} kcal/100g</span>
      </div>
      <div class="grid grid-cols-4 gap-1 text-center">
        <div class="bg-emerald-50 rounded p-1.5">
          <p class="text-xs font-bold text-emerald-700">${round1(n.protein)}g</p>
          <p class="text-[10px] text-gray-500">Protein</p>
        </div>
        <div class="bg-blue-50 rounded p-1.5">
          <p class="text-xs font-bold text-blue-700">${round1(n.carbs)}g</p>
          <p class="text-[10px] text-gray-500">Carbs</p>
        </div>
        <div class="bg-purple-50 rounded p-1.5">
          <p class="text-xs font-bold text-purple-700">${round1(n.fat)}g</p>
          <p class="text-[10px] text-gray-500">Fat</p>
        </div>
        <div class="bg-orange-50 rounded p-1.5">
          <p class="text-xs font-bold text-orange-700">${round1(n.sugar)}g</p>
          <p class="text-[10px] text-gray-500">Sugar</p>
        </div>
      </div>
    </div>`;
  return el;
}

/**
 * Takes a list of products from the API and populates them sequentially as cards within the grid.
 * @param {Array} products - The array of retrieved product structures.
 * @param {HTMLElement} container - The parent DOM node to dump the cards into.
 */
export function renderProductCards(products, container) {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  products.forEach((product) => fragment.appendChild(createProductCard(product)));
  container.appendChild(fragment);
}

/**
 * Alters the string output showing how many products were found.
 * @param {HTMLElement} el - The DOM text container.
 * @param {number} count - Rendered products count.
 * @param {Object} [options] - Pass in pagination properties (e.g. `total`) if they differ.
 */
export function updateProductsCount(el, count, { total } = {}) {
  if (count === 0) {
    el.textContent = "No products found";
  } else if (total && total !== count) {
    el.textContent = `Showing ${count} of ${total} products`;
  } else {
    el.textContent = `Showing ${count} product${count === 1 ? "" : "s"}`;
  }
}

/** Replaces the static example category chips with the real category list. */
// Category id -> { color, icon }. Uses inline background-color rather
// than Tailwind bg-* classes so it doesn't depend on those specific
// shades having survived the CSS purge (these chips are entirely
// JS-generated, so no static markup guarantees the classes are kept).
const PRODUCT_CATEGORY_STYLES = {
  snacks: { color: "#a855f7", icon: "fa-cookie" },
  beverages: { color: "#3b82f6", icon: "fa-glass-water" },
  dairies: { color: "#0ea5e9", icon: "fa-cheese" },
  cheeses: { color: "#eab308", icon: "fa-cheese" },
  yogurts: { color: "#ec4899", icon: "fa-bowl-food" },
  chocolates: { color: "#92400e", icon: "fa-cookie-bite" },
  biscuits: { color: "#ca8a04", icon: "fa-cookie" },
  "ice-creams": { color: "#f472b6", icon: "fa-ice-cream" },
  "breakfast-cereals": { color: "#f97316", icon: "fa-bowl-rice" },
  breads: { color: "#d97706", icon: "fa-bread-slice" },
  waters: { color: "#38bdf8", icon: "fa-glass-water" },
  sodas: { color: "#dc2626", icon: "fa-wine-bottle" },
  coffees: { color: "#78350f", icon: "fa-mug-hot" },
  teas: { color: "#16a34a", icon: "fa-mug-saucer" },
  fruits: { color: "#ef4444", icon: "fa-apple-whole" },
  vegetables: { color: "#22c55e", icon: "fa-carrot" },
  meats: { color: "#e11d48", icon: "fa-drumstick-bite" },
  fishes: { color: "#0891b2", icon: "fa-fish" },
  "plant-based-foods": { color: "#65a30d", icon: "fa-seedling" },
  "chips-and-fries": { color: "#eab308", icon: "fa-utensils" },
  sauces: { color: "#b91c1c", icon: "fa-pepper-hot" },
  spreads: { color: "#ea580c", icon: "fa-jar" },
  pastas: { color: "#ca8a04", icon: "fa-bowl-food" },
  desserts: { color: "#db2777", icon: "fa-cake-candles" },
};
const DEFAULT_PRODUCT_CATEGORY_STYLE = { color: "#059669", icon: "fa-box" };

/**
 * Creates distinct styled filter buttons for a provided array of product categories.
 * @param {Array} categories - Array of mapped category objects containing IDs and names.
 * @param {HTMLElement} container - DOM wrapper node handling layout.
 */
export function renderProductCategoryChips(categories, container) {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  categories.forEach((cat) => {
    const { color, icon } = PRODUCT_CATEGORY_STYLES[cat.id] || DEFAULT_PRODUCT_CATEGORY_STYLE;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "product-category-btn px-4 py-2 rounded-full text-sm font-semibold text-white whitespace-nowrap transition-transform hover:scale-105";
    btn.style.backgroundColor = color;
    btn.dataset.categoryId = cat.id;
    btn.innerHTML = `<i class="fa-solid ${icon} mr-1.5"></i>${escapeHtml(cat.name)}`;
    fragment.appendChild(btn);
  });
  container.appendChild(fragment);
}
/* -------------------------------------------------------------------- */
/*  Log Meal confirmation modal                                         */
/* -------------------------------------------------------------------- */

/**
 * Fills in the "Log This Meal" modal: thumbnail, name, and the
 * per-serving nutrition preview. `nutrition` may be null (still loading
 * or the lookup failed) - the preview cells show "-" in that case
 * rather than a fabricated number.
 */
export function renderLogMealModal(refs, meal, nutrition) {
  const { img, nameEl, caloriesEl, proteinEl, carbsEl, fatEl } = refs;

  if (img) {
    img.src = meal.strMealThumb;
    img.alt = meal.strMeal;
  }
  if (nameEl) nameEl.textContent = meal.strMeal;

  const set = (el, value, unit = "") => {
    if (!el) return;
    el.textContent = value == null ? "-" : `${Math.round(value)}${unit}`;
  };
  set(caloriesEl, nutrition?.caloriesPerServing ?? null);
  set(proteinEl, nutrition?.protein ?? null, "g");
  set(carbsEl, nutrition?.carbs ?? null, "g");
  set(fatEl, nutrition?.fat ?? null, "g");
}

/**
 * Updates the text showing the chosen amount of servings inside the 'Log Meal' modal block.
 * @param {HTMLElement} el - Element showing the servings number.
 * @param {number} servings - Number of servings.
 */
export function updateServingsValue(el, servings) {
  if (el) el.textContent = String(servings);
}

/** Shows a loading dash-spinner in the modal's nutrition preview cells while fetching. */
export function renderLogMealModalLoading(refs) {
  const { caloriesEl, proteinEl, carbsEl, fatEl } = refs;
  [caloriesEl, proteinEl, carbsEl, fatEl].forEach((el) => {
    if (el) el.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-base"></i>`;
  });
}