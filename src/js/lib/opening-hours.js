/**
 * Regras de horário de funcionamento — funções puras, usadas no navegador
 * (selo "Aberto agora") e no build (textos e JSON-LD). Testes em
 * tests/opening-hours.test.mjs.
 *
 * Formato de `hours` (vem de site.config.json):
 *   {
 *     timezone: 'America/Sao_Paulo',
 *     schedule: [
 *       { days: [2, 3, 4], opens: 17, closes: 1 },   // terça a quinta, 17h à 1h
 *       { days: [5, 6], opens: 18, closes: 3 },      // sexta e sábado, 18h às 3h
 *       { days: [0], opens: 16, closes: 0 },         // domingo, 16h à meia-noite
 *     ],
 *   }
 *   days: 0 = domingo ... 6 = sábado. Horas inteiras de 0 a 23.
 *   closes <= opens significa que fecha depois da meia-noite (0 = meia-noite).
 */

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
export const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** Dia da semana (0–6) e hora (0–23) de `date` no fuso informado. */
export function getZonedTime(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type).value;
  return { weekday: WEEKDAY_INDEX[get('weekday')], hour: Number(get('hour')) };
}

/** Turno do dia (ou undefined se não abre). */
export const shiftOn = (weekday, { schedule }) => schedule.find((shift) => shift.days.includes(weekday));

const crossesMidnight = (shift) => shift.closes <= shift.opens;

/** "17h", "1h", "meia-noite" */
export const formatHour = (hour) => (hour === 0 ? 'meia-noite' : `${hour}h`);

/** "às 3h", "à 1h", "à meia-noite" (crase correta para cada hora) */
export const atHour = (hour) => (hour === 0 || hour === 1 ? `à ${formatHour(hour)}` : `às ${formatHour(hour)}`);

/**
 * Turno em andamento no momento (o de hoje ou o que começou ontem
 * e passa da meia-noite), ou null se estiver fechado.
 */
export function currentShift({ weekday, hour }, hours) {
  const today = shiftOn(weekday, hours);
  if (today && hour >= today.opens && (crossesMidnight(today) || hour < today.closes)) return today;

  const yesterday = shiftOn((weekday + 6) % 7, hours);
  if (yesterday && crossesMidnight(yesterday) && hour < yesterday.closes) return yesterday;

  return null;
}

export const isOpenAt = (time, hours) => currentShift(time, hours) !== null;

/** Próximo dia (a partir de amanhã) em que a casa abre. */
function nextOpenDay(weekday, hours) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (weekday + offset) % 7;
    if (shiftOn(day, hours)) return day;
  }
  return weekday;
}

/**
 * Texto do selo de status para um momento.
 * @returns {{ open: boolean, label: string }}
 */
export function getOpeningStatus(time, hours) {
  const shift = currentShift(time, hours);
  if (shift) return { open: true, label: `Aberto agora · fecha ${atHour(shift.closes)}` };

  const today = shiftOn(time.weekday, hours);
  if (today && time.hour < today.opens) {
    return { open: false, label: `Fechado agora · abre hoje ${atHour(today.opens)}` };
  }

  const nextDay = nextOpenDay(time.weekday, hours);
  const next = shiftOn(nextDay, hours);
  const when = nextDay === (time.weekday + 1) % 7 ? 'amanhã' : WEEKDAY_NAMES[nextDay];
  if (!today) {
    return {
      open: false,
      label: `${capitalize(WEEKDAY_NAMES[time.weekday])} é folga · abre ${when} ${atHour(next.opens)}`,
    };
  }
  return { open: false, label: `Fechado agora · abre ${when} ${atHour(next.opens)}` };
}

/** "terça a quinta", "sexta e sábado", "domingo" (dias consecutivos) */
function describeDays(days) {
  const sorted = [...days].sort((a, b) => a - b);
  const names = sorted.map((day) => WEEKDAY_NAMES[day]);
  const consecutive = sorted.every((day, i) => i === 0 || day === sorted[i - 1] + 1);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  if (consecutive) return `${names[0]} a ${names.at(-1)}`;
  return `${names.slice(0, -1).join(', ')} e ${names.at(-1)}`;
}

/**
 * Linhas do horário para exibir no site, em ordem de terça a segunda.
 * @returns {Array<{ days: string, hours: string }>}
 *   ex.: { days: 'Terça a quinta', hours: '17h à 1h' }
 */
export function describeSchedule(hours) {
  const weekOrder = [2, 3, 4, 5, 6, 0, 1];
  const rows = [...hours.schedule]
    .sort((a, b) => weekOrder.indexOf(a.days[0]) - weekOrder.indexOf(b.days[0]))
    .map((shift) => ({
      days: capitalize(describeDays(shift.days)),
      hours: `${formatHour(shift.opens)} ${atHour(shift.closes)}`,
    }));

  const openDays = new Set(hours.schedule.flatMap((shift) => shift.days));
  const closed = [0, 1, 2, 3, 4, 5, 6].filter((day) => !openDays.has(day));
  if (closed.length) rows.push({ days: capitalize(describeDays(closed)), hours: 'Fechado' });
  return rows;
}
