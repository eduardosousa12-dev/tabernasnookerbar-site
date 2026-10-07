import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  atHour,
  describeSchedule,
  getOpeningStatus,
  getZonedTime,
  isOpenAt,
} from '../src/js/lib/opening-hours.js';

// Horário do cardápio impresso (outubro/2026)
const HOURS = {
  timezone: 'America/Sao_Paulo',
  schedule: [
    { days: [2, 3, 4], opens: 17, closes: 1 },
    { days: [5, 6], opens: 18, closes: 3 },
    { days: [0], opens: 16, closes: 0 },
  ],
};
const [SUN, MON, TUE, WED, THU, FRI, SAT] = [0, 1, 2, 3, 4, 5, 6];

describe('isOpenAt', () => {
  it('abre no horário de cada dia', () => {
    assert.equal(isOpenAt({ weekday: TUE, hour: 16 }, HOURS), false);
    assert.equal(isOpenAt({ weekday: TUE, hour: 17 }, HOURS), true);
    assert.equal(isOpenAt({ weekday: FRI, hour: 17 }, HOURS), false);
    assert.equal(isOpenAt({ weekday: FRI, hour: 18 }, HOURS), true);
    assert.equal(isOpenAt({ weekday: SUN, hour: 16 }, HOURS), true);
  });

  it('a madrugada pertence à noite anterior', () => {
    assert.equal(isOpenAt({ weekday: WED, hour: 0 }, HOURS), true); // terça à noite, fecha 1h
    assert.equal(isOpenAt({ weekday: WED, hour: 1 }, HOURS), false);
    assert.equal(isOpenAt({ weekday: SAT, hour: 2 }, HOURS), true); // sexta à noite, fecha 3h
    assert.equal(isOpenAt({ weekday: SUN, hour: 2 }, HOURS), true); // sábado à noite
    assert.equal(isOpenAt({ weekday: SUN, hour: 3 }, HOURS), false);
  });

  it('domingo fecha à meia-noite e segunda não abre', () => {
    assert.equal(isOpenAt({ weekday: SUN, hour: 23 }, HOURS), true);
    assert.equal(isOpenAt({ weekday: MON, hour: 0 }, HOURS), false);
    assert.equal(isOpenAt({ weekday: MON, hour: 20 }, HOURS), false);
  });

  it('funciona para horário que fecha no mesmo dia', () => {
    const daytime = { schedule: [{ days: [1, 2, 3, 4, 5], opens: 9, closes: 18 }] };
    assert.equal(isOpenAt({ weekday: MON, hour: 10 }, daytime), true);
    assert.equal(isOpenAt({ weekday: MON, hour: 18 }, daytime), false);
  });
});

describe('getOpeningStatus', () => {
  it('aberto: mostra quando fecha, com a crase certa', () => {
    assert.equal(getOpeningStatus({ weekday: SAT, hour: 21 }, HOURS).label, 'Aberto agora · fecha às 3h');
    assert.equal(getOpeningStatus({ weekday: THU, hour: 21 }, HOURS).label, 'Aberto agora · fecha à 1h');
    assert.equal(getOpeningStatus({ weekday: SUN, hour: 20 }, HOURS).label, 'Aberto agora · fecha à meia-noite');
  });

  it('fechado antes de abrir', () => {
    assert.deepEqual(getOpeningStatus({ weekday: TUE, hour: 10 }, HOURS), {
      open: false,
      label: 'Fechado agora · abre hoje às 17h',
    });
  });

  it('segunda é folga e avisa o próximo dia', () => {
    assert.equal(getOpeningStatus({ weekday: MON, hour: 20 }, HOURS).label, 'Segunda é folga · abre amanhã às 17h');
  });

  it('depois de fechar na madrugada, aponta para o mesmo dia', () => {
    assert.equal(getOpeningStatus({ weekday: WED, hour: 2 }, HOURS).label, 'Fechado agora · abre hoje às 17h');
  });
});

describe('describeSchedule', () => {
  it('gera as linhas do horário em ordem, com a folga no fim', () => {
    assert.deepEqual(describeSchedule(HOURS), [
      { days: 'Terça a quinta', hours: '17h à 1h' },
      { days: 'Sexta e sábado', hours: '18h às 3h' },
      { days: 'Domingo', hours: '16h à meia-noite' },
      { days: 'Segunda', hours: 'Fechado' },
    ]);
  });

  it('atHour usa a crase certa', () => {
    assert.equal(atHour(1), 'à 1h');
    assert.equal(atHour(0), 'à meia-noite');
    assert.equal(atHour(17), 'às 17h');
  });
});

describe('getZonedTime', () => {
  it('converte para o fuso do bar', () => {
    // 2026-10-03 02:30 UTC = sexta 23:30 em São Paulo (UTC-3)
    assert.deepEqual(getZonedTime(new Date('2026-10-03T02:30:00Z'), 'America/Sao_Paulo'), {
      weekday: 5,
      hour: 23,
    });
  });
});
