document.addEventListener('DOMContentLoaded', () => {
  // Получаем элементы из DOM
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchResults = document.getElementById('searchResults');
  
  const previewBtns = document.querySelectorAll('.preview-controls button');
  const previewContainer = document.getElementById('previewContainer');
  const latexDemo = document.getElementById('latexDemo');
  
  const semSelect = document.getElementById('semesterSelect');
  const loadCurriculum = document.getElementById('loadCurriculum');
  const curriculumList = document.getElementById('curriculumList');

  // Вспомогательная функция для запросов к API
  async function fetchAPI(url, options = {}) {
    try {
      const res = await fetch(url, { 
        ...options, 
        headers: { 'Content-Type': 'application/json', ...options.headers } 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) { 
      console.error('API Error:', err); 
      return null; 
    }
  }

  // === МОДУЛЬ 1: Семантический поиск (п. 2.3 диплома) ===
  searchBtn.addEventListener('click', async () => {
    const query = searchInput.value.trim(); 
    
    if (!query) {
      searchResults.innerHTML = '<p class="hint" style="color:#991b1b">Введите запрос для поиска</p>';
      return;
    }
    
    searchBtn.disabled = true; 
    searchResults.innerHTML = '<p class="hint">🔍 Поиск...</p>';
    
    try {
      // Отправляем запрос на сервер
      const data = await fetchAPI('/api/search', { 
        method: 'POST', 
        body: JSON.stringify({ q: query }) 
      });
      
      searchBtn.disabled = false;
      
      if (!data || !data.results || data.results.length === 0) {
        searchResults.innerHTML = '<p class="hint">Ничего не найдено. Попробуйте: ГОСТ 2.105-2019 или оформление</p>';
        return;
      }
      
      // Отображение результатов
      searchResults.innerHTML = `
        <p style="margin-bottom:10px;color:#64748b">Найдено: ${data.total} результат(ов)</p>
        ${data.results.map(doc => `
          <div class="item">
            <div>
              <strong style="color:#2563eb">${doc.title}</strong>
              ${doc.fullTitle ? `<br><small style="color:#64748b">${doc.fullTitle}</small>` : ''}
              ${doc.tags && doc.tags.length ? `<br><small style="color:#059669">Теги: ${doc.tags.join(', ')}</small>` : ''}
            </div>
            <span class="status ${doc.status === 'действующий' ? 'active' : 'cancelled'}">
              ${doc.status}
            </span>
          </div>
        `).join('')}
      `;
      
    } catch (err) {
      console.error('Search error:', err);
      searchBtn.disabled = false;
      searchResults.innerHTML = '<p class="hint" style="color:#991b1b">Ошибка поиска. Попробуйте позже.</p>';
    }
  });

  // Поиск по нажатию Enter
  searchInput.addEventListener('keypress', e => { 
    if (e.key === 'Enter') searchBtn.click(); 
  });

  // === МОДУЛЬ 2: Предпросмотр технических форматов (п. 2.4 диплома) ===
  previewBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id; 
      previewContainer.innerHTML = '<p class="hint">⏳ Загрузка чертежа...</p>';
      
      try {
        const res = await fetch(`/api/preview/${id}`);
        if (!res.ok) throw new Error('Файл не найден');
        
        const svgText = await res.text();
        previewContainer.innerHTML = svgText;
        
        // Отображение формулы LaTeX (п. 2.4)
        const formula = "\\sigma = \\frac{F}{A} \\quad \\text{(механическое напряжение)}";
        if (window.katex) {
          katex.render(formula, latexDemo, { 
            throwOnError: false, 
            displayMode: true 
          });
        }
      } catch (err) { 
        console.error(err);
        previewContainer.innerHTML = '<p class="hint" style="color:#991b1b">❌ Ошибка загрузки чертежа</p>'; 
      }
    });
  });

  // === МОДУЛЬ 3: Привязка к учебному плану (п. 2.5 диплома) ===
  loadCurriculum.addEventListener('click', async () => {
    const sem = semSelect.value; 
    loadCurriculum.disabled = true; 
    curriculumList.innerHTML = '<li class="hint">⏳ Загрузка материалов...</li>';
    
    try {
      const data = await fetchAPI(`/api/curriculum/${sem}`);
      loadCurriculum.disabled = false;
      
      if (!data || !data.materials || data.materials.length === 0) {
        curriculumList.innerHTML = '<li class="hint">Нет материалов для выбранного семестра</li>';
        return;
      }
      
      curriculumList.innerHTML = data.materials.map(m => `
        <li>
          <strong style="color:#2563eb">${m.title}</strong> 
          <span style="color:#64748b">[${m.type}]</span>
          ${m.author ? `<br><small>Автор: ${m.author}, ${m.year}</small>` : ''}
          ${m.status ? `<br><small>Статус: ${m.status}</small>` : ''}
        </li>
      `).join('');
      
    } catch (err) {
      console.error(err);
      loadCurriculum.disabled = false;
      curriculumList.innerHTML = '<li class="hint" style="color:#991b1b">Ошибка загрузки</li>';
    }
  });
});