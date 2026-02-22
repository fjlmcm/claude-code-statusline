'use strict';

const { debugLog } = require('./debug');

const STRINGS = {
  en: {
    ctx: 'context', dirty: 'dirty', session: 'session', lines: 'lines',
    quota_5h: '5h quota', quota_7d: '7d quota',
    reset_wrap: '(reset {time})',
    tasks: 'tasks',
  },
  zh: {
    ctx: '上下文', dirty: '修改', session: '会话', lines: '行变化',
    quota_5h: '5小时额度', quota_7d: '7天额度',
    reset_wrap: '({time}重置)',
    tasks: '任务',
  },
  ja: {
    ctx: 'コンテキスト', dirty: '変更', session: '経過', lines: '行',
    quota_5h: '5時間枠', quota_7d: '7日間枠',
    reset_wrap: '({time}リセット)',
    tasks: 'タスク',
  },
  ko: {
    ctx: '컨텍스트', dirty: '변경', session: '세션', lines: '줄',
    quota_5h: '5시간', quota_7d: '7일',
    reset_wrap: '({time} 리셋)',
    tasks: '작업',
  },
  fr: {
    ctx: 'contexte', dirty: 'modif', session: 'session', lines: 'lignes',
    quota_5h: 'quota 5h', quota_7d: 'quota 7j',
    reset_wrap: '(réinit {time})',
    tasks: 'taches',
  },
  de: {
    ctx: 'Kontext', dirty: 'geändert', session: 'Sitzung', lines: 'Zeilen',
    quota_5h: '5h-Limit', quota_7d: '7d-Limit',
    reset_wrap: '(Reset {time})',
    tasks: 'Aufgaben',
  },
  es: {
    ctx: 'contexto', dirty: 'modif', session: 'sesión', lines: 'líneas',
    quota_5h: 'cuota 5h', quota_7d: 'cuota 7d',
    reset_wrap: '(reinicio {time})',
    tasks: 'tareas',
  },
  pt: {
    ctx: 'contexto', dirty: 'modif', session: 'sessão', lines: 'linhas',
    quota_5h: 'cota 5h', quota_7d: 'cota 7d',
    reset_wrap: '(reinício {time})',
    tasks: 'tarefas',
  },
  ru: {
    ctx: 'контекст', dirty: 'изменено', session: 'сессия', lines: 'строк',
    quota_5h: 'лимит 5ч', quota_7d: 'лимит 7д',
    reset_wrap: '(сброс {time})',
    tasks: 'задачи',
  },
};

// {h}=12h hour, {H}=24h hour, {ap}=am/pm, {M}=month, {d}=day
const TIME_FORMATS = {
  en: {
    h24: false, am: 'am', pm: 'pm',
    time: '{h}{ap}', datetime: '{M}{d} {h}{ap}',
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  },
  zh: {
    h24: false, am: '上午', pm: '下午',
    time: '{ap}{h}点', datetime: '{M}{d}日{ap}{h}点',
    months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  },
  ja: {
    h24: false, am: '午前', pm: '午後',
    time: '{ap}{h}時', datetime: '{M}{d}日{ap}{h}時',
    months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  },
  ko: {
    h24: false, am: '오전', pm: '오후',
    time: '{ap}{h}시', datetime: '{M}{d}일{ap}{h}시',
    months: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  },
  fr: {
    h24: true, time: '{H}h', datetime: '{d} {M} {H}h',
    months: ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'],
  },
  de: {
    h24: true, time: '{H}:00', datetime: '{d}. {M} {H}:00',
    months: ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'],
  },
  es: {
    h24: true, time: '{H}h', datetime: '{d} {M} {H}h',
    months: ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],
  },
  pt: {
    h24: true, time: '{H}h', datetime: '{d} {M} {H}h',
    months: ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'],
  },
  ru: {
    h24: true, time: '{H}:00', datetime: '{d} {M} {H}:00',
    months: ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'],
  },
};

const DURATION_UNITS = {
  en: ['h', 'm', 's'],
  zh: ['小时', '分钟', '秒'],
  ja: ['時間', '分', '秒'],
  ko: ['시간', '분', '초'],
  fr: ['h', 'min', 's'],
  de: ['Std', 'Min', 'Sek'],
  es: ['h', 'min', 's'],
  pt: ['h', 'min', 's'],
  ru: ['ч', 'мин', 'с'],
};

function fill(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

function detectLang() {
  try {
    const loc = process.env.CCSL_LANG || process.env.LANG || process.env.LC_ALL || '';
    if (loc) {
      const lang = loc.slice(0, 2).toLowerCase();
      if (STRINGS[lang]) return lang;
    }
    const intlLang = Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2).toLowerCase();
    if (STRINGS[intlLang]) return intlLang;
  } catch (e) { debugLog(e); }
  return 'en';
}

function formatResetTime(str, lang) {
  if (!str) return '';
  try {
    const dt = new Date(str);
    if (isNaN(dt.getTime())) return '';
    const now = new Date();
    const tf = TIME_FORMATS[lang] || TIME_FORMATS.en;
    const monthStr = tf.months[dt.getMonth()];
    const day = dt.getDate();
    const isToday = dt.toDateString() === now.toDateString();

    if (tf.h24) {
      const H = dt.getHours();
      return isToday ? fill(tf.time, { H }) : fill(tf.datetime, { H, M: monthStr, d: day });
    }
    const h = dt.getHours() % 12 || 12;
    const ap = dt.getHours() < 12 ? tf.am : tf.pm;
    return isToday ? fill(tf.time, { h, ap }) : fill(tf.datetime, { h, ap, M: monthStr, d: day });
  } catch (e) { debugLog(e); }
  return '';
}

function formatDuration(ms, lang) {
  if (!ms || ms <= 0) return '';
  const [hU, mU, sU] = DURATION_UNITS[lang] || DURATION_UNITS.en;
  const totalS = Math.floor(ms / 1000);
  const hours = Math.floor(totalS / 3600);
  const minutes = Math.floor((totalS % 3600) / 60);
  if (hours > 0) return `${hours}${hU}${minutes}${mU}`;
  if (minutes > 0) return `${minutes}${mU}`;
  return `${totalS}${sU}`;
}

module.exports = {
  STRINGS, TIME_FORMATS, DURATION_UNITS,
  fill, detectLang, formatResetTime, formatDuration,
};
