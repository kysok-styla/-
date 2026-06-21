const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// === БАЗА ДАННЫХ ГОСТов ===
const GOST_DB = [
  { 
    id: 'g1', 
    title: 'ГОСТ 2.105-2019', 
    fullTitle: 'Единая система конструкторской документации. Общие требования к текстовым документам',
    status: 'действующий', 
    year: 2019, 
    tags: ['оформление', 'документация', 'ЕСКД', 'текстовые документы'] 
  },
  { 
    id: 'g2', 
    title: 'ГОСТ 2.701-2021', 
    fullTitle: 'Единая система конструкторской документации. Виды и комплектность конструкторских документов',
    status: 'действующий', 
    year: 2021, 
    tags: ['схемы', 'чертежи', 'ЕСКД'] 
  },
  { 
    id: 'g3', 
    title: 'ГОСТ 34567-2020', 
    fullTitle: 'Информационные технологии. Системы управления базами данных',
    status: 'отменён', 
    year: 2020, 
    replacedBy: 'ГОСТ 34567-2024',
    tags: ['базы данных', 'ИТ'] 
  },
  { 
    id: 'g4', 
    title: 'ГОСТ 19.101-77', 
    fullTitle: 'Единая система программной документации. Виды программ и программных документов',
    status: 'действующий', 
    year: 1977, 
    tags: ['программная документация', 'ЕСПД'] 
  }
];

// Чертежи
const DWG_CACHE = {
  'dwg1': `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect x="50" y="50" width="500" height="300" fill="none" stroke="#000" stroke-width="2"/>
    <circle cx="300" cy="200" r="80" fill="none" stroke="#00f" stroke-width="1.5"/>
    <text x="275" y="205" font-family="Arial" font-size="14" fill="#00f">R80</text>
  </svg>`,
  'dwg2': `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <path d="M100 300 L200 100 L300 300 Z" fill="none" stroke="#d00" stroke-width="3"/>
    <text x="190" y="250" font-family="Arial" font-size="16" fill="#d00">Узел А</text>
  </svg>`
};

// Учебные материалы
const CURRICULUM_DB = [
  { id: 'm1', title: 'Основы САПР', type: 'учебник', semester: 3, specialty: '09.02.07', author: 'Иванов А.С.', year: 2021 },
  { id: 'm2', title: 'Чтение чертежей', type: 'лабораторная работа', semester: 4, specialty: '09.02.07', author: 'Петров Д.В.', year: 2022 },
  { id: 'm3', title: 'ГОСТ 2.105-2019', type: 'стандарт', semester: 4, specialty: '09.02.07', status: 'действующий' },
  { id: 'm4', title: 'Программирование на Python', type: 'методическое пособие', semester: 5, specialty: '09.02.07', author: 'Сидорова Е.М.', year: 2023 }
];

// === МАРШРУТЫ ===

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Семантический поиск
app.post('/api/search', (req, res) => {
  console.log('🔍 Получен запрос на поиск:', req.body);
  
  const { q } = req.body;
  
  if (!q || q.trim() === '') {
    console.log('❌ Пустой запрос');
    return res.status(400).json({ error: 'Запрос пуст', total: 0, results: [] });
  }

  const query = q.trim().toUpperCase();
  console.log('Поисковый запрос:', query);
  
  // Ищем по всем полям
  const results = GOST_DB.filter(doc => {
    // 1. Точное совпадение по названию
    const exactMatch = doc.title.toUpperCase() === query;
    
    // 2. Частичное совпадение по названию
    const titleMatch = doc.title.toUpperCase().includes(query);
    
    // 3. Совпадение по полному названию
    const fullTitleMatch = doc.fullTitle.toLowerCase().includes(query.toLowerCase());
    
    // 4. Совпадение по тегам
    const tagMatch = doc.tags.some(tag => 
      tag.toLowerCase().includes(query.toLowerCase())
    );
    
    // 5. Поиск по номеру ГОСТ (извлекаем цифры)
    const queryNumbers = query.match(/(\d+)[.-]?(\d+)[.-]?(\d{4})?/);
    const docNumbers = doc.title.match(/(\d+)[.-]?(\d+)[.-]?(\d{4})/);
    
    let numberMatch = false;
    if (queryNumbers && docNumbers) {
      // Сравниваем первые две группы цифр (например, 2.105 или 2-105)
      numberMatch = (queryNumbers[1] === docNumbers[1] && queryNumbers[2] === docNumbers[2]);
    }
    
    const found = exactMatch || titleMatch || fullTitleMatch || tagMatch || numberMatch;
    
    if (found) {
      console.log(`✅ Найдено: ${doc.title} (exact:${exactMatch}, title:${titleMatch}, number:${numberMatch})`);
    }
    
    return found;
  });

  console.log(`✅ Всего найдено: ${results.length}`);
  
  res.json({
    total: results.length,
    results: results.map(r => ({
      id: r.id,
      title: r.title,
      fullTitle: r.fullTitle,
      status: r.status,
      year: r.year,
      tags: r.tags
    }))
  });
});

// API: Предпросмотр чертежей
app.get('/api/preview/:id', (req, res) => {
  const { id } = req.params;
  const svgContent = DWG_CACHE[id];
  
  if (!svgContent) {
    return res.status(404).json({ error: 'Файл не найден' });
  }
  
  res.type('image/svg+xml');
  res.send(svgContent);
});

// API: Учебный план
app.get('/api/curriculum/:semester', (req, res) => {
  const semester = parseInt(req.params.semester);
  
  if (isNaN(semester)) {
    return res.status(400).json({ error: 'Некорректный семестр' });
  }
  
  const specialty = '09.02.07';
  const materials = CURRICULUM_DB.filter(m => 
    m.semester === semester && m.specialty === specialty
  );
  
  res.json({
    semester: semester,
    specialty: specialty,
    total: materials.length,
    materials: materials
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('========================================');
  console.log('   АИС "Электронная библиотека"');
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
  console.log('========================================');
  console.log(`📁 База ГОСТов: ${GOST_DB.length} записей`);
  GOST_DB.forEach(gost => console.log(`   - ${gost.title}`));
  console.log('========================================');
});