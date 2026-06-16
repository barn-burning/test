const state = {
  allItems: [],
  query: "",
  category: "전체",
  tag: "전체",
  sort: "newest"
};

const elements = {
  searchInput: document.querySelector("#searchInput"),
  categoryFilters: document.querySelector("#categoryFilters"),
  tagFilters: document.querySelector("#tagFilters"),
  sortSelect: document.querySelector("#sortSelect"),
  resultCount: document.querySelector("#resultCount"),
  cardList: document.querySelector("#cardList"),
  emptyMessage: document.querySelector("#emptyMessage"),
  resetButton: document.querySelector("#resetButton")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  state.allItems = await loadData();
  bindEvents();
  buildFilters();
  render();
}

async function loadData() {
  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("data.json load failed");
    }
    return normalizeItems(await response.json());
  } catch (error) {
    const fallback = document.querySelector("#fallbackData").textContent;
    return normalizeItems(JSON.parse(fallback));
  }
}

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => ({
    id: item.id ?? index + 1,
    title: String(item.title ?? "제목 없음"),
    category: String(item.category ?? "기타"),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    summary: String(item.summary ?? ""),
    date: String(item.date ?? ""),
    url: String(item.url ?? "#")
  }));
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });

  elements.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });

  elements.resetButton.addEventListener("click", () => {
    state.query = "";
    state.category = "전체";
    state.tag = "전체";
    state.sort = "newest";
    elements.searchInput.value = "";
    elements.sortSelect.value = "newest";
    buildFilters();
    render();
  });
}

function buildFilters() {
  const categories = ["전체", ...unique(state.allItems.map((item) => item.category))];
  const tags = ["전체", ...unique(state.allItems.flatMap((item) => item.tags))];

  renderFilterButtons(elements.categoryFilters, categories, state.category, (value) => {
    state.category = value;
    buildFilters();
    render();
  });

  renderFilterButtons(elements.tagFilters, tags, state.tag, (value) => {
    state.tag = value;
    buildFilters();
    render();
  });
}

function renderFilterButtons(container, values, activeValue, onSelect) {
  container.replaceChildren();

  values.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = value === activeValue ? "chip active" : "chip";
    button.textContent = value;
    button.setAttribute("aria-pressed", String(value === activeValue));
    button.addEventListener("click", () => onSelect(value));
    container.appendChild(button);
  });
}

function render() {
  const items = getFilteredItems();

  elements.resultCount.textContent = `${items.length}개`;
  elements.cardList.replaceChildren();
  elements.emptyMessage.hidden = items.length !== 0;

  items.forEach((item) => {
    elements.cardList.appendChild(createCard(item));
  });
}

function getFilteredItems() {
  return state.allItems
    .filter((item) => {
      const searchableText = [
        item.title,
        item.summary,
        item.category,
        ...item.tags
      ].join(" ").toLowerCase();

      const matchesQuery = !state.query || searchableText.includes(state.query);
      const matchesCategory = state.category === "전체" || item.category === state.category;
      const matchesTag = state.tag === "전체" || item.tags.includes(state.tag);

      return matchesQuery && matchesCategory && matchesTag;
    })
    .sort((a, b) => {
      const first = new Date(a.date).getTime() || 0;
      const second = new Date(b.date).getTime() || 0;
      return state.sort === "newest" ? second - first : first - second;
    });
}

function createCard(item) {
  const article = document.createElement("article");
  article.className = "review-card";

  const cardTop = document.createElement("div");
  cardTop.className = "card-top";

  const category = document.createElement("span");
  category.className = "category-badge";
  category.textContent = item.category;

  const date = document.createElement("time");
  date.className = "date";
  date.dateTime = item.date;
  date.textContent = formatDate(item.date);

  cardTop.append(category, date);

  const title = document.createElement("h3");
  title.textContent = item.title;

  const summary = document.createElement("p");
  summary.className = "summary";
  summary.textContent = item.summary;

  const tagRow = document.createElement("div");
  tagRow.className = "tag-row";
  item.tags.forEach((tagName) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = `#${tagName}`;
    tagRow.appendChild(tag);
  });

  const link = document.createElement("a");
  link.className = "source-link";
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "원문 링크";

  article.append(cardTop, title, summary, tagRow, link);
  return article;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "날짜 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
