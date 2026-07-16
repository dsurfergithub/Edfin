import { useEffect, useMemo, useState } from 'react';
import './styles.css';

type DecisionKey = 'study' | 'work' | 'invest' | 'spend' | 'mentor';

type Tone = 'good' | 'warn' | 'bad' | 'neutral';

type TimelineEntry = {
  title: string;
  body: string;
  tone: Tone;
};

type ScoreEntry = {
  name: string;
  score: number;
  date: string;
};

type State = {
  started: boolean;
  ended: boolean;
  name: string;
  age: number;
  cash: number;
  portfolio: number;
  knowledge: number;
  freedom: number;
  health: number;
  discipline: number;
  mentor: string;
  timeline: TimelineEntry[];
};

const SCORE_KEY = 'edfin_scores_v1';

const decisionCopy: Record<DecisionKey, { label: string; mentor: string }> = {
  study: {
    label: 'Estudiar y mejorar habilidades',
    mentor: 'Has priorizado aprendizaje. Suele doler hoy y rendir mañana.',
  },
  work: {
    label: 'Trabajar pronto',
    mentor: 'Has priorizado ingresos tempranos y experiencia real.',
  },
  invest: {
    label: 'Invertir una parte de tus ahorros',
    mentor: 'Has puesto a trabajar tu capital. Aquí manda la paciencia.',
  },
  spend: {
    label: 'Gastar en placer inmediato',
    mentor: 'La gratificación inmediata ayuda hoy, pero reduce margen mañana.',
  },
  mentor: {
    label: 'Buscar mentoría y aprender',
    mentor: 'Aprender con guía suele evitar errores caros.',
  },
};

const ageOptions = [15, 18, 20, 25];
const stepOptions = [1, 3, 5];

function euro(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}

function saveScore(entry: ScoreEntry) {
  try {
    const list = loadScores();
    const next = [entry, ...list].slice(0, 10);
    localStorage.setItem(SCORE_KEY, JSON.stringify(next));
  } catch {
    // noop
  }
}

function randomEvent(age: number, step: number, state: Pick<State, 'cash' | 'portfolio' | 'knowledge' | 'freedom' | 'health' | 'discipline'>) {
  const roll = Math.random();

  if (age < 22) {
    if (roll < 0.33) {
      return {
        title: 'Oportunidad inesperada',
        body: 'Te ofrecen participar en un proyecto pequeño. Sube tu experiencia y puede abrir puertas.',
        cash: 120 * step,
        knowledge: 2 * step,
        freedom: 2 * step,
        tone: 'good' as Tone,
      };
    }
    if (roll < 0.66) {
      return {
        title: 'Distracción costosa',
        body: 'Un gasto impulsivo recorta tu colchón y baja tu disciplina.',
        cash: -80 * step,
        discipline: -2 * step,
        tone: 'warn' as Tone,
      };
    }
    return null;
  }

  if (roll < 0.28 && state.portfolio > 0) {
    return {
      title: 'Mercado favorable',
      body: 'Tus inversiones avanzan con el tiempo. El interés compuesto empieza a notarse.',
      portfolio: Math.round(state.portfolio * (0.04 * step)),
      freedom: 2 * step,
      tone: 'good' as Tone,
    };
  }
  if (roll < 0.52) {
    return {
      title: 'Inflación silenciosa',
      body: 'Tu dinero pierde algo de poder adquisitivo si no se mueve con intención.',
      cash: -40 * step,
      tone: 'warn' as Tone,
    };
  }
  if (roll < 0.7) {
    return {
      title: 'Cambio de contexto',
      body: 'Tu entorno cambia y te obliga a adaptarte. Aprender rápido te protege.',
      knowledge: 1 * step,
      discipline: 1 * step,
      tone: 'neutral' as Tone,
    };
  }
  return null;
}

function scoreLife(state: Pick<State, 'cash' | 'portfolio' | 'knowledge' | 'freedom' | 'health' | 'discipline'>) {
  return Math.round(
    state.cash +
      state.portfolio * 1.1 +
      state.knowledge * 80 +
      state.freedom * 60 +
      state.health * 20 +
      state.discipline * 35,
  );
}

export default function App() {
  const [state, setState] = useState<State>({
    started: false,
    ended: false,
    name: 'Daba',
    age: 15,
    cash: 0,
    portfolio: 0,
    knowledge: 5,
    freedom: 0,
    health: 100,
    discipline: 50,
    mentor: 'Introduce tu nombre y empieza la simulación.',
    timeline: [],
  });

  const [decision, setDecision] = useState<DecisionKey>('study');
  const [stepYears, setStepYears] = useState(1);
  const [nameInput, setNameInput] = useState('Daba');
  const [startAge, setStartAge] = useState(15);
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    setScores(loadScores());
  }, []);

  const overallScore = useMemo(() => scoreLife(state), [state]);

  function pushTimeline(title: string, body: string, tone: Tone) {
    setState((current) => ({
      ...current,
      timeline: [{ title, body, tone }, ...current.timeline].slice(0, 24),
    }));
  }

  function startGame() {
    const safeName = nameInput.trim() || 'Jugador';
    const cash = startAge <= 15 ? 0 : 500;

    setState({
      started: true,
      ended: false,
      name: safeName,
      age: startAge,
      cash,
      portfolio: 0,
      knowledge: 5,
      freedom: 0,
      health: 100,
      discipline: 50,
      mentor: `Bienvenido, ${safeName}. Tienes ${startAge} años y una vida por construir.`,
      timeline: [
        {
          title: 'Comienzo',
          body: `La simulación arranca a los ${startAge} años con foco en decisiones acumulativas.`,
          tone: 'good',
        },
      ],
    });
  }

  function applyDecision() {
    if (!state.started || state.ended) return;

    setState((current) => {
      const step = stepYears;
      const before = {
        cash: current.cash,
        portfolio: current.portfolio,
        knowledge: current.knowledge,
        freedom: current.freedom,
        health: current.health,
        discipline: current.discipline,
      };

      let next = { ...current };
      let mentorText = decisionCopy[decision].mentor;
      let tone: Tone = 'neutral';

      if (decision === 'study') {
        next.knowledge += 8 * step;
        next.discipline += 2 * step;
        next.cash -= 120 * step;
        next.freedom += 3 * step;
        tone = 'good';
      }

      if (decision === 'work') {
        next.cash += 650 * step;
        next.knowledge += 2 * step;
        next.discipline += 1 * step;
        next.freedom += 1 * step;
        tone = 'good';
      }

      if (decision === 'invest') {
        const amount = Math.min(next.cash, 250 * step);
        next.cash -= amount;
        next.portfolio += amount;
        next.freedom += 5 * step;
        next.discipline += 2 * step;
        tone = amount > 0 ? 'good' : 'warn';
        mentorText = amount > 0 ? 'Has convertido liquidez en capital paciente.' : 'No había suficiente caja para invertir, pero la intención cuenta.';
      }

      if (decision === 'spend') {
        next.cash -= 220 * step;
        next.health += 1 * step;
        next.freedom -= 1 * step;
        next.discipline -= 2 * step;
        tone = 'warn';
      }

      if (decision === 'mentor') {
        next.knowledge += 6 * step;
        next.freedom += 4 * step;
        next.cash -= 60 * step;
        next.discipline += 3 * step;
        tone = 'good';
      }

      if (next.portfolio > 0) {
        const compound = Math.round(next.portfolio * (0.05 + Math.random() * 0.03) * step);
        next.portfolio += compound;
      }

      const event = randomEvent(next.age, step, next);
      if (event) {
        next.cash += event.cash ?? 0;
        next.portfolio += event.portfolio ?? 0;
        next.knowledge += event.knowledge ?? 0;
        next.freedom += event.freedom ?? 0;
        next.health += event.health ?? 0;
        next.discipline += event.discipline ?? 0;
        tone = event.tone;
        mentorText = `${mentorText} ${event.body}`;
      }

      next.age += step;
      next.health = clamp(next.health - step * 0.5, 0, 100);
      next.discipline = clamp(next.discipline, 0, 100);
      next.freedom = Math.max(0, next.freedom);
      next.cash = Math.max(0, Math.round(next.cash));
      next.portfolio = Math.max(0, Math.round(next.portfolio));
      next.knowledge = Math.max(0, Math.round(next.knowledge));

      const deltaCash = next.cash + next.portfolio - (before.cash + before.portfolio);
      const deltaKnowledge = Math.round(next.knowledge - before.knowledge);
      const deltaFreedom = Math.round(next.freedom - before.freedom);

      const title = `A los ${next.age} años: ${decisionCopy[decision].label}`;
      const body = `${mentorText} Resultado acumulado: ${deltaCash >= 0 ? '+' : ''}${euro(deltaCash)} · ${deltaKnowledge >= 0 ? '+' : ''}${deltaKnowledge} conocimiento · ${deltaFreedom >= 0 ? '+' : ''}${deltaFreedom} libertad.`;

      const timelineEntry: TimelineEntry = { title, body, tone };
      next.timeline = [timelineEntry, ...current.timeline].slice(0, 24);
      next.mentor = mentorText;

      return next;
    });
  }

  function finishGame() {
    if (!state.started) return;

    const score = scoreLife(state);
    const entry: ScoreEntry = {
      name: state.name,
      score,
      date: new Date().toISOString(),
    };

    saveScore(entry);
    setScores(loadScores());
    setState((current) => ({
      ...current,
      ended: true,
      mentor: `Fin de la simulación. Tu Índice de Talentos es ${score}.`,
      timeline: [
        {
          title: 'Cierre',
          body: `La simulación termina con un Índice de Talentos de ${score}.`,
          tone: 'good',
        },
        ...current.timeline,
      ].slice(0, 24),
    }));
  }

  function resetGame() {
    setState({
      started: false,
      ended: false,
      name: 'Daba',
      age: 15,
      cash: 0,
      portfolio: 0,
      knowledge: 5,
      freedom: 0,
      health: 100,
      discipline: 50,
      mentor: 'Introduce tu nombre y empieza la simulación.',
      timeline: [],
    });
    setNameInput('Daba');
    setStartAge(15);
    setDecision('study');
    setStepYears(1);
  }

  const summaryCards = [
    { label: 'Edad', value: state.age },
    { label: 'Cash', value: euro(state.cash) },
    { label: 'Portfolio', value: euro(state.portfolio) },
    { label: 'Conocimiento', value: Math.round(state.knowledge) },
    { label: 'Libertad', value: Math.round(state.freedom) },
    { label: 'Salud', value: Math.round(state.health) },
    { label: 'Disciplina', value: Math.round(state.discipline) },
    { label: 'Índice', value: overallScore },
  ];

  return (
    <div className="app-shell">
      <main className="page">
        <section className="hero">
          <div className="hero-copy card">
            <p className="eyebrow">Edfin · simulador de talentos</p>
            <h1>Decisiones financieras que cambian una vida.</h1>
            <p className="lede">
              Empiezas con una edad, una identidad y pocos recursos. Cada elección deja una huella en el futuro,
              y el interés compuesto tarda, pero pesa.
            </p>
            <div className="chips">
              <span>Inicio y fin</span>
              <span>Desplegables</span>
              <span>IA mentora</span>
              <span>Línea temporal</span>
            </div>
          </div>

          <div className="hero-side card">
            <div className="hero-grid">
              {summaryCards.slice(0, 4).map((card) => (
                <article className="mini-stat" key={card.label}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </div>
            <div className="mentor-box">
              <strong>Mentoría</strong>
              <p>{state.mentor}</p>
            </div>
          </div>
        </section>

        <section className="workspace">
          <article className="card panel controls">
            <header className="panel-head">
              <div>
                <h2>Partida</h2>
                <p>Introduce nombre, elige edad inicial y toma decisiones con consecuencias.</p>
              </div>
              <span className={`status ${state.started ? 'live' : 'idle'}`}>{state.started ? 'En curso' : 'Preparado'}</span>
            </header>

            <div className="grid two">
              <label>
                <span>Nombre</span>
                <input value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="Tu nombre" />
              </label>
              <label>
                <span>Edad inicial</span>
                <select value={startAge} onChange={(event) => setStartAge(Number(event.target.value))}>
                  {ageOptions.map((age) => (
                    <option key={age} value={age}>
                      {age} años
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid two mt">
              <label>
                <span>Decisión</span>
                <select value={decision} onChange={(event) => setDecision(event.target.value as DecisionKey)} disabled={!state.started || state.ended}>
                  {Object.entries(decisionCopy).map(([key, item]) => (
                    <option value={key} key={key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Avance temporal</span>
                <select value={stepYears} onChange={(event) => setStepYears(Number(event.target.value))} disabled={!state.started || state.ended}>
                  {stepOptions.map((step) => (
                    <option value={step} key={step}>
                      {step} año{step > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="actions">
              <button onClick={startGame}>{state.started ? 'Reiniciar partida' : 'Empezar partida'}</button>
              <button className="secondary" onClick={applyDecision} disabled={!state.started || state.ended}>
                Aplicar decisión
              </button>
              <button className="secondary" onClick={finishGame} disabled={!state.started}>
                Finalizar
              </button>
              <button className="ghost" onClick={resetGame}>
                Reset
              </button>
            </div>

            <div className="result-box">
              <strong>{state.name}</strong>
              <p>
                Edad actual: {state.age} · Dinero: {euro(state.cash)} · Inversiones: {euro(state.portfolio)} · Conocimiento:{' '}
                {Math.round(state.knowledge)} · Salud: {Math.round(state.health)} · Disciplina: {Math.round(state.discipline)}
              </p>
              {state.ended ? <p className="final-score">Índice de Talentos final: {overallScore}</p> : <p>La partida sigue abierta. Cada turno cambia el futuro.</p>}
            </div>
          </article>

          <aside className="card panel side">
            <div className="panel-head">
              <div>
                <h2>Bitácora</h2>
                <p>Hechos recientes y consecuencias visibles.</p>
              </div>
            </div>
            <div className="timeline">
              {state.timeline.length === 0 ? (
                <p className="empty">Sin eventos todavía.</p>
              ) : (
                state.timeline.map((entry, index) => (
                  <article className={`timeline-item ${entry.tone}`} key={`${entry.title}-${index}`}>
                    <strong>{entry.title}</strong>
                    <p>{entry.body}</p>
                  </article>
                ))
              )}
            </div>

            <div className="leaderboard">
              <h3>Marcador</h3>
              {scores.length === 0 ? (
                <p className="empty">Todavía no hay partidas cerradas.</p>
              ) : (
                <ol>
                  {scores.slice(0, 5).map((entry, index) => (
                    <li key={`${entry.name}-${entry.date}`}>
                      <span>{index + 1}. {entry.name}</span>
                      <strong>{entry.score}</strong>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
