// snake_case DB row → camelCase API response

export function blogFromDb(row) {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    summary: row.summary,
    link: row.link,
    featured: row.featured === 1,
    date: row.date,
    category: row.category,
    tags: safeParseTags(row.tags),
    dayNumber: row.day_number,
    readTime: row.read_time,
    difficulty: row.difficulty,
  };
}

export function blogToDb(body) {
  return {
    source: body.source || '公众号',
    title: body.title,
    summary: body.summary || '',
    link: body.link || '#',
    featured: body.featured ? 1 : 0,
    date: body.date || new Date().toISOString().slice(0, 10),
    category: body.category || '',
    tags: JSON.stringify(body.tags || []),
    day_number: body.dayNumber ?? null,
    read_time: body.readTime || '',
    difficulty: body.difficulty || 'beginner',
  };
}

export function toolFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    icon: row.icon,
    category: row.category,
    tags: safeParseTags(row.tags),
  };
}

export function toolToDb(body) {
  return {
    name: body.name,
    description: body.description || '',
    url: body.url || '#',
    icon: body.icon || '🔧',
    category: body.category || '',
    tags: JSON.stringify(body.tags || []),
  };
}

export function galleryFromDb(row) {
  return {
    id: row.id,
    src: row.src,
    title: row.title,
    description: row.description,
    style: row.style,
    featured: row.featured === 1,
  };
}

export function galleryToDb(body) {
  return {
    src: body.src,
    title: body.title || 'AI 绘图作品',
    description: body.description || '',
    style: body.style || 'AI 绘图',
    featured: body.featured ? 1 : 0,
  };
}

export function worksFromDb(row) {
  return {
    id: row.id,
    type: row.type,
    imageSrc: row.image_src,
    altText: row.alt_text,
    title: row.title,
    description: row.description,
    tag: row.tag,
    detailsLink: row.details_link,
  };
}

export function worksToDb(body) {
  return {
    type: body.type || 'ai-drawing',
    image_src: body.imageSrc,
    alt_text: body.altText || '',
    title: body.title,
    description: body.description || '',
    tag: body.tag || 'AI 绘图',
    details_link: body.detailsLink || '#',
  };
}

export function journalFromDb(row) {
  return {
    id: row.id,
    date: row.date,
    harvest: row.harvest,
    plan: row.plan,
    gratitude: row.gratitude,
    investment: row.investment,
    connect: row.connect,
  };
}

export function journalToDb(body) {
  return {
    date: body.date || body.id,
    harvest: body.harvest || '',
    plan: body.plan || '',
    gratitude: body.gratitude || '',
    investment: body.investment || '',
    connect: body.connect || '',
  };
}

export function journalSettingsFromDb(row) {
  return {
    referenceDate: row.reference_date,
    referenceStreak: row.reference_streak,
    goalDays: row.goal_days,
    goalReward: row.goal_reward,
    reminderTime: row.reminder_time,
  };
}

export function journalSettingsToDb(body) {
  return {
    reference_date: body.referenceDate,
    reference_streak: body.referenceStreak,
    goal_days: body.goalDays,
    goal_reward: body.goalReward,
    reminder_time: body.reminderTime || '06:00',
  };
}

function safeParseTags(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}
