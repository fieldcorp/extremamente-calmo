import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

const BLUE = '#0055FF';
const YELLOW = '#FFE04B';

const EXAMPLES = [
  { l: 'Bruno + Santini', t: 'O Bruno Nogueira está completamente obcecado com o sabor a avelã do Santini e não para de falar nisso em todos os episódios do podcast.' },
  { l: 'Influencer em pânico', t: 'Uma influencer portuguesa perdeu 200 seguidores num dia e está em colapso total, a fazer stories a chorar às 2 da manhã.' },
  { l: 'Coach de vida', t: 'Um coach de vida português publicou um livro chamado Acredita em Ti e está a vender cursos online por 997 euros sobre como ser autêntico.' },
  { l: 'José Castelo Branco', t: 'O José Castelo Branco apareceu numa gala de caridade vestido com uma capa de veludo dourado e um chapéu com penas de pavão.' },
];

const LOADING_MSGS = [
  'A respirar fundo antes de responder',
  'A consultar os arquivos do Extremamente',
  'Joana Marques aprovaria isto',
  'A calibrar a condescendência',
  'Muita calma nessa hora',
];

const WH = [4, 10, 20, 32, 40, 32, 40, 32, 20, 10, 20, 8, 4];

function Wave({ active }) {
  const refs = useRef([]);
  const iv = useRef(null);

  useEffect(() => {
    if (iv.current) clearInterval(iv.current);
    refs.current.forEach((b, i) => { if (b) b.style.height = (active ? WH[i] : 4) + 'px'; });
    if (!active) return;
    iv.current = setInterval(() => {
      refs.current.forEach((b, i) => {
        if (b) b.style.height = Math.max(4, WH[i] * (Math.random() * 0.7 + 0.4)) + 'px';
      });
    }, 110);
    return () => clearInterval(iv.current);
  }, [active]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 36 }}>
      {WH.map((_, i) => (
        <div key={i} ref={el => refs.current[i] = el}
          style={{ width: 4, borderRadius: 2, background: YELLOW, height: 4, transition: 'height .12s ease' }} />
      ))}
    </div>
  );
}

function Lyrics({ text, speaking }) {
  const [active, setActive] = useState(0);
  const lines = text ? text.split(/(?<=[.!?])\s+/).filter(Boolean) : [];

  useEffect(() => {
    if (!speaking || !lines.length) { setActive(0); return; }
    const est = (text.length / 12) * 1000 / 0.85;
    const per = est / lines.length;
    const ts = lines.map((_, i) => setTimeout(() => setActive(i), i * per));
    return () => ts.forEach(clearTimeout);
  }, [speaking, text]);

  return (
    <div style={{ textAlign: 'center' }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontSize: i === active ? 20 : 15,
          fontWeight: i === active ? 600 : 400,
          color: i === active ? '#fff' : i < active ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.32)',
          lineHeight: 1.65, marginBottom: 5, transition: 'all .45s ease',
        }}>{line}</div>
      ))}
    </div>
  );
}

function Dots({ active }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: i === active ? 20 : 6, height: 6, borderRadius: 3,
          background: i === active ? YELLOW : 'rgba(255,255,255,.25)',
          transition: 'all .3s',
        }} />
      ))}
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState(0);
  const [story, setStory] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState(0);
  const [result, setResult] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const livRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!loading) { clearInterval(livRef.current); return; }
    livRef.current = setInterval(() => setLoadMsg(m => (m + 1) % LOADING_MSGS.length), 1800);
    return () => clearInterval(livRef.current);
  }, [loading]);

  function stopSpeak() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);
  }

  async function autoSpeak(text) {
    stopSpeak();
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const data = await res.json();
      const audio = new Audio('data:audio/mp3;base64,' + data.audioContent);
      audioRef.current = audio;
      const est = (text.length / 12) * 1000 / 0.85;
      audio.onplay = () => setSpeaking(true);
      audio.onended = audio.onerror = () => setSpeaking(false);
      audio.play();
    } catch (e) {
      console.error('TTS error:', e);
    }
  }

  function toggleSpeak() {
    if (speaking) { stopSpeak(); }
    else if (result) { autoSpeak(result.mantra); }
  }

  async function generate() {
    if (!story.trim()) { setError(true); return; }
    setError(false); setLoading(true); setScreen(1);
    try {
      const res = await fetch('/api/mantra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: story.trim() }),
      });
      if (!res.ok) throw new Error('API failed');
      const r = await res.json();
      setResult(r); setLoading(false);
      setTimeout(() => autoSpeak(r.mantra), 600);
    } catch (e) {
      setLoading(false); setScreen(0);
      alert('Erro ao gerar mantra. Tenta de novo.');
    }
  }

  const pad = { padding: '28px 24px 80px', background: BLUE, minHeight: '100vh' };
  const btnY = { display: 'block', width: '100%', padding: 17, background: YELLOW, color: BLUE, border: 'none', borderRadius: 14, fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 2, cursor: 'pointer' };
  const btnG = { display: 'block', width: '100%', padding: 14, background: 'transparent', color: 'rgba(255,255,255,.5)', border: '1.5px solid rgba(255,255,255,.18)', borderRadius: 14, fontSize: 15, cursor: 'pointer', marginTop: 10 };
  const maxW = { maxWidth: 480, margin: '0 auto' };

  return (
    <>
      <Head>
        <title>Extremamente Calmo</title>
        <meta name="description" content="O gerador de mantras do Extremamente Desagradável" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Extremamente Calmo" />
        <meta property="og:description" content="Descreve a situação. Recebe a calma." />
        <meta property="og:image" content="/og.png" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* SCREEN 1 — INPUT */}
      {screen === 0 && (
        <div style={pad}>
          <div style={maxW}>
            <Dots active={0} />
            <p style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>
              Extremamente Desagradável
            </p>
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(48px, 13vw, 68px)', lineHeight: .88, color: YELLOW, letterSpacing: 2, marginBottom: 10 }}>
              EXTREMAMENTE<br />CALMO
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.6)', marginBottom: 32 }}>
              O que aconteceu desta vez?
            </p>

            <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 8, display: 'block' }}>
              Descreve a situação
            </label>
            <textarea
              value={story}
              onChange={e => { setStory(e.target.value); setError(false); }}
              placeholder="Ex: O Bruno Nogueira está completamente obcecado com o gelado de avelã do Santini..."
              rows={5}
              style={{
                display: 'block', width: '100%', background: '#1a3aaa',
                border: `1.5px solid ${error ? '#ff8080' : 'rgba(255,255,255,.4)'}`,
                borderRadius: 14, padding: '14px 16px', fontSize: 16,
                color: '#fff', lineHeight: 1.6, resize: 'vertical', outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {error && <p style={{ fontSize: 13, color: '#ff8080', marginTop: 6 }}>Conta-nos o que aconteceu primeiro, jovem.</p>}

            <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', margin: '20px 0 10px' }}>
              Exemplos rápidos
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
              {EXAMPLES.map(ex => (
                <button key={ex.l} onClick={() => { setStory(ex.t); setError(false); }}
                  style={{ padding: '8px 16px', borderRadius: 99, border: '1.5px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.85)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {ex.l}
                </button>
              ))}
            </div>

            <button style={btnY} onClick={generate}>PRECISO DE CALMA →</button>
          </div>
        </div>
      )}

      {/* SCREEN 2 — GENERATE + RESULT */}
      {screen === 1 && (
        <div style={pad}>
          <div style={maxW}>
            <Dots active={1} />
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 20 }}>
                <div style={{ fontSize: 52, animation: 'br 2s ease-in-out infinite' }}>🧘</div>
                <style>{`@keyframes br{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}`}</style>
                <Wave active={true} />
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', textAlign: 'center' }}>{LOADING_MSGS[loadMsg]}</p>
              </div>
            ) : result && (
              <>
                <div style={{ borderLeft: '3px solid rgba(255,255,255,.18)', padding: '8px 14px', marginBottom: 28 }}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,.38)', fontStyle: 'italic', lineHeight: 1.5 }}>"{story}"</p>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <button onClick={toggleSpeak} style={{
                    width: 76, height: 76, borderRadius: '50%',
                    background: speaking ? YELLOW : 'rgba(255,224,75,.1)',
                    border: `2px solid ${YELLOW}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', margin: '0 auto 16px',
                    fontSize: 26, color: speaking ? BLUE : YELLOW, transition: 'all .3s',
                  }}>
                    {speaking ? '⏸' : '▶'}
                  </button>
                  <Wave active={speaking} />
                  <p style={{ fontSize: 11, color: 'rgba(255,224,75,.5)', marginTop: 8, letterSpacing: 1 }}>
                    ♀ Google WaveNet pt-BR
                  </p>
                </div>

                <p style={{ fontSize: 11, letterSpacing: 2, color: YELLOW, marginBottom: 6, textTransform: 'uppercase' }}>Calma, jovem</p>
                <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 38, color: '#fff', letterSpacing: 1, lineHeight: 1, marginBottom: 20 }}>
                  {result.titulo}
                </h2>
                <Lyrics text={result.mantra} speaking={speaking} />

                <div style={{ marginTop: 32 }}>
                  <button style={btnY} onClick={() => { stopSpeak(); setScreen(2); }}>PARTILHAR →</button>
                  <button style={btnG} onClick={() => { stopSpeak(); setScreen(0); }}>← Tentar outra situação</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 3 — SHARE */}
      {screen === 2 && (
        <div style={pad}>
          <div style={maxW}>
            <Dots active={2} />
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(38px, 11vw, 52px)', color: YELLOW, lineHeight: .9, letterSpacing: 2, marginBottom: 8 }}>
              EXTREMAMENTE<br />CALMO
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.4)', marginBottom: 28 }}>O mundo precisa disto</p>

            <div style={{ background: '#fff', borderRadius: 20, padding: 22, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', cursive", fontSize: 13, color: YELLOW, flexShrink: 0 }}>ED</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: BLUE }}>Extremamente Desagradável</p>
                  <p style={{ fontSize: 12, color: '#aaa' }}>Renascença · As Três da Manhã</p>
                </div>
              </div>
              <div style={{ height: 1, background: '#eee', margin: '12px 0' }} />
              <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#bbb', marginBottom: 5 }}>A situação</p>
              <p style={{ fontSize: 13, color: '#888', fontStyle: 'italic', lineHeight: 1.5 }}>"{story}"</p>
              <div style={{ height: 1, background: '#eee', margin: '12px 0' }} />
              <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#bbb', marginBottom: 5 }}>Calma, jovem</p>
              <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: BLUE, letterSpacing: 1, lineHeight: 1.1, marginBottom: 10 }}>{result?.titulo}</p>
              <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7 }}>{result?.mantra}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {['#ExtremamenteCalmo', '#ExtremamenteDesagradável'].map(t => (
                  <span key={t} style={{ fontSize: 11, color: BLUE, background: '#e8eeff', padding: '3px 10px', borderRadius: 99 }}>{t}</span>
                ))}
              </div>
            </div>

            <button
              style={{ ...btnY, background: copied ? '#1e7a4a' : YELLOW, color: copied ? '#fff' : BLUE, transition: 'all .3s' }}
              onClick={() => {
                navigator.clipboard.writeText(`Calma, jovem\n\n${result?.mantra}\n\n#ExtremamenteCalmo #ExtremamenteDesagradável`);
                setCopied(true); setTimeout(() => setCopied(false), 2500);
              }}>
              {copied ? '✓ COPIADO' : 'COPIAR MANTRA'}
            </button>
            <button style={btnG} onClick={() => { setResult(null); setStory(''); setScreen(0); setCopied(false); }}>
              ← Gerar outro mantra
            </button>
          </div>
        </div>
      )}
    </>
  );
}
