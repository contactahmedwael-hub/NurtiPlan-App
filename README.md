# 🥗 NutriPlan

**Plan your meals, know what's in them, log what you eat — all in one place, powered by real recipe and nutrition data.**

NutriPlan is a vanilla JavaScript web app for discovering recipes, scanning packaged products for their nutrition grade, and tracking daily/weekly food intake. No framework, no build step — just clean ES modules talking to real APIs.

**🔗 Live Demo:** [contactahmedwael-hub.github.io/NurtiPlan-App](https://contactahmedwael-hub.github.io/NurtiPlan-App/)

---

## ✨ Features

### 🍽️ Meals & Recipes
- Browse recipes by meal type (Beef, Chicken, Dessert, Seafood, Vegan, ...) with color-coded categories
- Filter by cuisine — a live, scrollable pill list of every cuisine TheMealDB actually supports (American, Egyptian, Indian, Thai, and more), with a "see more" toggle
- Free-text search by name, ingredient, or cuisine
- Grid or list view for browsing results
- Full recipe detail: ingredients (with checkboxes), step-by-step instructions, embedded YouTube video when available

### 🔥 Nutrition Facts
- Per-serving calories, protein, carbs, fat, fiber, sugar, saturated fat, cholesterol, and sodium for any recipe
- Computed live from the actual ingredient list via a nutrition analysis API — not static/fabricated numbers
- Cached per recipe for the session, so reopening a recipe is instant

### 📷 Product Scanner
- Search packaged products by name or scan by barcode
- Filter by Nutri-Score grade (A–E) and browse by product category
- Nutri-Score and NOVA processing-level badges on every result

### 📊 Food Log
- Log a recipe with a chosen number of servings via a confirmation modal with a live nutrition preview
- Daily totals with progress bars against calorie/macro targets
- Weekly overview: a 7-day strip of calories and items logged, plus weekly average, total items, and "days on goal"

---

## 🛠️ Tech Stack

- **Vanilla JavaScript (ES modules)** — no framework, no bundler, no build step
- **Tailwind CSS** (compiled) + a small hand-written stylesheet for custom theming
- **Font Awesome** for icons, **SweetAlert2** for dialogs
- `localStorage` for persisting favorites and the food log across sessions

## 🔌 APIs Used

| API | Used for | Auth |
|---|---|---|
| [TheMealDB](https://www.themealdb.com/api.php) | Recipes, categories, cuisines | None (free, public) |
| `nutriplan-api.vercel.app/api/nutrition/analyze` | Per-serving nutrition analysis from an ingredient list | API key (header) |
| `nutriplan-api.vercel.app/api/products` | Packaged product search, barcode lookup, categories | None |

## 📁 Project Structure

```
starter/
├── index.html
├── README.md
└── src/
    ├── css/
    │   ├── index.css
    │   └── style.css
    └── js/
        ├── main.js
        ├── api/
        │   ├── mealdb.js
        │   ├── nutrition.js
        │   └── products.js
        ├── state/
        │   └── appState.js
        └── ui/
            └── components.js
```

## 🙏 Acknowledgments

- [TheMealDB](https://www.themealdb.com/) for the free recipe API
- [Font Awesome](https://fontawesome.com/) for icons
- [SweetAlert2](https://sweetalert2.github.io/) for dialogs
