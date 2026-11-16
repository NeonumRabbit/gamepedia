// === Тёмная тема ===
(function () {
  const KEY = 'gp-theme';
  if (localStorage.getItem(KEY) === 'dark') {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  }

  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  function updateIcon() {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    btn.innerHTML = isDark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
  }
  updateIcon();

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-bs-theme');
      localStorage.setItem(KEY, 'light');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      localStorage.setItem(KEY, 'dark');
    }
    updateIcon();
  });
})();

// === Кнопка «наверх» ===
(function () {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// === Подсветка активного пункта меню ===
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar .nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page) a.classList.add('active');
  });
})();

// === Интерактивный чек-лист (Сохранение прогресса) ===
(function () {
  const checkboxes = document.querySelectorAll('.task-check');
  if (checkboxes.length === 0) return;
  
  checkboxes.forEach(box => {
    const saved = localStorage.getItem('checklist_' + box.id);
    if (saved === 'true') {
      box.checked = true;
      box.nextElementSibling.style.textDecoration = 'line-through';
      box.nextElementSibling.style.opacity = '0.6';
    }

    box.addEventListener('change', () => {
      localStorage.setItem('checklist_' + box.id, box.checked);
      
      if (box.checked) {
        box.nextElementSibling.style.textDecoration = 'line-through';
        box.nextElementSibling.style.opacity = '0.6';
      } else {
        box.nextElementSibling.style.textDecoration = 'none';
        box.nextElementSibling.style.opacity = '1';
      }
    });
  });
})();

// === Полоска прогресса чтения ===
(function() {
  const container = document.createElement('div');
  container.className = 'read-progress-container';
  const bar = document.createElement('div');
  bar.className = 'read-progress-bar';
  container.appendChild(bar);
  document.body.appendChild(container);

  window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    bar.style.width = scrolled + '%';
  });
})();

// === ГЛОБАЛЬНЫЙ ПОИСК ПО ТЕКСТУ СТАТЕЙ (FULL-TEXT SEARCH) ===
(function() {
  // Список файлов, которые будем сканировать
  const pagesToSearch = [
    { url: 'planning-full.html', title: 'Планирование: База знаний', icon: 'bi-journal-text text-warning' },
    { url: 'prototyping-full.html', title: 'Прототип: База знаний', icon: 'bi-journal-text text-success' },
    { url: 'development-full.html', title: 'Реализация: База знаний', icon: 'bi-journal-text text-primary' },
    { url: 'testing-full.html', title: 'Тестирование: База знаний', icon: 'bi-journal-text text-info' },
    { url: 'publishing-full.html', title: 'Публикация: База знаний', icon: 'bi-journal-text text-danger' },
    { url: 'planning.html', title: 'Планирование (Кратко)', icon: 'bi-lightbulb text-warning' },
    { url: 'prototyping.html', title: 'Прототип (Кратко)', icon: 'bi-puzzle text-success' },
    { url: 'development.html', title: 'Реализация (Кратко)', icon: 'bi-gear text-primary' },
    { url: 'testing.html', title: 'Тестирование (Кратко)', icon: 'bi-search text-info' },
    { url: 'publishing.html', title: 'Публикация (Кратко)', icon: 'bi-box-seam text-danger' }
  ];

  const searchInput = document.getElementById('globalSearchInput');
  const resultsContainer = document.getElementById('searchResultsContainer');
  const timelineContainer = document.getElementById('timelineContainer');
  const noResults = document.getElementById('noResults');

  if (!searchInput) return;

  let searchDatabase = null;
  let isFetching = false;

  // Функция скачивания и обработки текста страниц
  async function buildDatabase() {
    if (searchDatabase || isFetching) return;
    isFetching = true;
    
    resultsContainer.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Сканируем статьи... Это займет секунду.</p></div>';
    
    const promises = pagesToSearch.map(async (page) => {
      try {
        // Скачиваем HTML файл
        const response = await fetch(page.url);
        const html = await response.text();
        
        // Парсим HTML в виртуальный DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Достаем текст только из тега <main> (чтобы не искать по меню и кнопкам)
        const mainContent = doc.querySelector('main') || doc.body;
        const text = mainContent.textContent.toLowerCase();
        
        return { ...page, text };
      } catch (e) {
        return { ...page, text: '' }; 
      }
    });
    
    searchDatabase = await Promise.all(promises);
    isFetching = false;
  }

  // Слушаем ввод в поле поиска
  searchInput.addEventListener('input', async function() {
    const query = this.value.toLowerCase().trim();

    if (query === '') {
      resultsContainer.classList.add('d-none');
      timelineContainer.classList.remove('d-none');
      noResults.classList.add('d-none');
      return;
    }

    timelineContainer.classList.add('d-none');
    resultsContainer.classList.remove('d-none');
    
    // Если база текста еще не загружена, загружаем её
    if (!searchDatabase) {
      await buildDatabase();
      resultsContainer.innerHTML = ''; 
    }

    // Проверка на то, что мы открыли сайт локально (file://) и fetch заблокирован
    const hasText = searchDatabase.some(item => item.text.length > 0);
    if (!hasText) {
      resultsContainer.innerHTML = '<div class="col-12"><div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i><strong>Поиск не работает локально!</strong> Браузер блокирует сканирование файлов с диска. Поиск заработает, когда вы загрузите сайт на Netlify.</div></div>';
      return;
    }

    resultsContainer.innerHTML = '';
    const queryWords = query.split(' ').filter(word => word.length > 0);
    
    // Ищем в тексте
    const matches = searchDatabase.filter(item => {
      return queryWords.every(word => item.text.includes(word));
    });

    if (matches.length === 0) {
      noResults.classList.remove('d-none');
    } else {
      noResults.classList.add('d-none');
      matches.forEach(match => {
        const cardHTML = `
          <div class="col-md-6 col-lg-4">
            <a href="${match.url}" class="text-decoration-none text-body">
              <div class="card h-100 shadow-sm border-0 search-result-card">
                <div class="card-body">
                  <h5 class="card-title fw-bold"><i class="bi ${match.icon} me-2"></i>${match.title}</h5>
                  <p class="card-text text-muted small mb-0">Найдено совпадение в тексте статьи. Нажмите, чтобы прочитать.</p>
                </div>
              </div>
            </a>
          </div>
        `;
        resultsContainer.insertAdjacentHTML('beforeend', cardHTML);
      });
    }
  });
})();