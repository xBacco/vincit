import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../../api.js';
import { useLang } from '../../i18n.js';
import { useToast } from '../../Toast.jsx';
import { COLORS } from '../Atoms.jsx';
import { validatePassword } from '../../passwordPolicy.js';
import { wipeFreshAccountFlags } from '../../freshReset.js';

// Editorial style: sections separate by hairline + whitespace, not by box.
// `raised` is reserved for genuinely raised surfaces (danger-zone, the
// pending-nuke panel). Buttons are pills, no chunky borders.
const S = {
  card:    { padding: '20px 0', borderBottom: '1px solid var(--rule)', marginBottom: 0 },
  raised:  { background: 'var(--card)', border: '1px solid var(--rule)', borderRadius: 14, padding: 16, marginBottom: 12 },
  row:     { padding: '14px 0', borderBottom: '1px solid var(--rule)' },
  label:   { fontSize: 9, color: 'var(--dim)', letterSpacing: '.3em', textTransform: 'uppercase', fontWeight: 600 },
  small:   { fontSize: 11, color: 'var(--mut)' },
  pre:     { background: 'var(--inp)', color: 'var(--txt)', borderRadius: 4, padding: 12, fontSize: 11, fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
  btn:     (variant) => ({
    padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
    fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
    background: variant === 'danger' ? 'transparent' : variant === 'ghost' ? 'transparent' : 'var(--pur)',
    border: `1px solid ${variant === 'danger' ? 'var(--red)66' : variant === 'ghost' ? 'transparent' : 'transparent'}`,
    color: variant === 'danger' ? 'var(--red)' : variant === 'ghost' ? 'var(--dim)' : '#1a1530',
    boxShadow: variant === 'danger' || variant === 'ghost' ? 'none' : '0 8px 24px -10px var(--pur)',
  }),
};

function Avatar({ p, size = 36 }) {
  const color = COLORS[p?.colorKey || p?.color_key] || '#5b8af0';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}33`, border: `2px solid ${color}66`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.5), overflow: 'hidden', flexShrink: 0,
    }}>
      {p?.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (p?.avatar || '?')}
    </div>
  );
}

export default function AdminView({ isDesktop, meId }) {
  const { t }   = useLang();
  const toast   = useToast();
  const [tab, setTab] = useState('users'); // 'users' | 'groups' | 'integrity'

  // ── Shared data ──────────────────────────────────────────────────────
  const [users,     setUsers]     = useState([]);
  const [groups,    setGroups]    = useState([]);
  const [integrity, setIntegrity] = useState(null);
  const [nukeAvailable, setNukeAvailable] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [query,     setQuery]     = useState('');
  const [selectedId,  setSelectedId]  = useState(null);
  const [detail,      setDetail]      = useState(null);
  const [busy,        setBusy]        = useState(false);
  const [pwNew, setPwNew] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [u, g, i, n] = await Promise.all([
        api.adminUsers().catch(() => []),
        api.adminGroups().catch(() => []),
        api.adminIntegrity().catch(() => null),
        api.adminNukeStatus().catch(() => ({ available: false })),
      ]);
      setUsers(u); setGroups(g); setIntegrity(i);
      setNukeAvailable(!!n?.available);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // When a user is selected, fetch the detail by-email lookup so we get
  // groups, bets, friends in a single round-trip.
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    const u = users.find(x => x.id === selectedId);
    if (!u?.email) return;
    api.adminUserByEmail(u.email).then(setDetail).catch(() => setDetail(null));
  }, [selectedId, users]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.email || '').toLowerCase().includes(q) ||
      (u.name  || '').toLowerCase().includes(q));
  }, [users, query]);

  // ── Actions ─────────────────────────────────────────────────────────
  const wrap = (fn, okMsg) => async (...args) => {
    setBusy(true);
    try { await fn(...args); toast.success(okMsg || 'OK ✓'); refresh(); }
    catch (e) { console.error(e); toast.error(e?.message || 'errore'); }
    finally { setBusy(false); }
  };

  const deleteUser  = wrap(async id => {
    if (!window.confirm('Cancellare DEFINITIVAMENTE questo account?\n\nVerranno eliminati: bets, crediti, achievements, reazioni, gruppi, amicizie. Non recuperabile.')) {
      throw new Error('cancelled');
    }
    await api.adminDeleteUser(id);
    setSelectedId(null);
  }, 'Account eliminato');

  const clearLegacy = wrap(async id => api.adminClearLegacy(id), 'Legacy room_id pulito');
  const addToGroup  = wrap(async (gid, uid) => api.adminAddToGroup(gid, uid), 'Aggiunto al gruppo ✓');
  const removeFromGroup = wrap(async (gid, uid) => api.adminRemoveFromGroup(gid, uid), 'Rimosso dal gruppo');
  const regenCode   = wrap(async gid => {
    const r = await api.adminRegenCode(gid);
    toast.success(`Nuovo codice: ${r.invite_code}`);
  });
  const setPassword = wrap(async (uid, pw) => {
    const policyErr = validatePassword(pw);
    if (policyErr) throw new Error(t(`pw.${policyErr.replace('password_', '')}`));
    await api.adminSetPassword(uid, pw);
    setPwNew('');
  }, 'Password aggiornata ✓');
  const resetTrophies = wrap(async (uid, who) => {
    const isSelf = !!meId && uid === meId;
    const confirmMsg = isSelf
      ? `Reset COMPLETO del tuo account?\n\nCancella TUTTI i trofei (anche i 5 segreti) e azzera i flag locali del tutorial + easter egg. Dopo il reload rivedrai onboarding e animazioni come a un account appena creato.`
      : `Reset COMPLETO di ${who}?\n\nCancella TUTTI i trofei (anche i 5 segreti). ${who} rivedrà tutorial + animazioni dei trofei segreti alla prossima apertura dell'app, come a un account appena creato.`;
    if (!window.confirm(confirmMsg)) throw new Error('cancelled');
    // Always send full=true: the server bumps fresh_reset_at and the target's
    // client wipes its own LS flags on the next /me load.
    const r = await api.adminResetTrophies(uid, { full: true });
    if (isSelf) {
      // Self-reset: also wipe LS flags on THIS device immediately so we
      // don't have to wait for a /me round-trip on reload.
      wipeFreshAccountFlags();
      toast.success(`Reset completo (${r.deleted} trofei). Ricarico…`);
      setTimeout(() => window.location.reload(), 700);
    } else {
      toast.success(`Reset completo per ${who} (${r.deleted} trofei)`);
    }
  });
  const toggleAdmin = wrap(async (uid, currentlyAdmin, who) => {
    const action = currentlyAdmin ? 'rimuovere i privilegi admin a' : 'promuovere ad admin';
    if (!window.confirm(`Sicuro di voler ${action} ${who}?`)) throw new Error('cancelled');
    const r = await api.adminToggleAdmin(uid);
    toast.success(r.is_admin ? '★ ora è admin' : 'admin rimosso');
  });

  // ── Render ──────────────────────────────────────────────────────────
  const TabBtn = ({ id, label }) => {
    const active = tab === id;
    return (
      <button onClick={() => { setTab(id); setSelectedId(null); }} style={{
        padding: '6px 0 14px',
        background: 'transparent',
        color: active ? 'var(--txt)' : 'var(--dim)',
        border: 'none', borderBottom: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
        marginBottom: -1, cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
        fontSize: 11, fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase',
        whiteSpace: 'nowrap', transition: 'all .18s',
      }}>{label}</button>
    );
  };

  if (loading && !users.length) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--dim)' }}>caricamento…</div>;
  }

  return (
    <div className="sUp" style={{ paddingBottom: isDesktop ? 32 : 96 }}>
      <div style={{ marginBottom: 32, paddingTop: isDesktop ? 16 : 8 }}>
        <div className="bc-meta" style={{ marginBottom: 10 }}>— Riservato</div>
        <div className="bc-hero" style={{ fontSize: isDesktop ? 54 : 38 }}>Admin</div>
        <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6, marginTop: 14, maxWidth: 520 }}>
          Pannello di controllo. Le azioni sono immediate e non recuperabili — pensaci due volte.
        </div>
      </div>

      {/* Underline tabs — no boxed strip */}
      <div style={{
        display: 'flex', gap: 24, borderBottom: '1px solid var(--rule)',
        marginBottom: 4, overflowX: 'auto',
      }}>
        <TabBtn id="users"     label={`Utenti · ${users.length}`}/>
        <TabBtn id="groups"    label={`Gruppi · ${groups.length}`}/>
        <TabBtn id="integrity" label={`Integrità${integrity ? ` · ${(integrity.dangling_room_ids?.length||0) + (integrity.duplicate_names?.length||0) + (integrity.orphan_user_groups?.length||0) + (integrity.duplicate_emails?.length||0)}` : ''}`}/>
        {nukeAvailable && <TabBtn id="nuke" label="🔥 Reset"/>}
      </div>

      {/* ── UTENTI ─────────────────────────────────────────── */}
      {tab === 'users' && !selectedId && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 2px', marginTop: 18, marginBottom: 4,
            borderBottom: '1px solid var(--brd)',
          }}>
            <span style={{ color: 'var(--dim)', fontSize: 14 }}>🔍</span>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Cerca per email o nome…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--txt)', fontFamily: "'Manrope',sans-serif", fontSize: 14, letterSpacing: '.01em' }}/>
          </div>

          {filteredUsers.map(u => {
            const flagged = u.legacy_room_id && u.legacy_room_exists === false;
            return (
              <div key={u.id} onClick={() => setSelectedId(u.id)}
                style={{ ...S.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                <Avatar p={u} size={42}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.name} {u.is_admin && <span style={{ fontSize: 10, color: 'var(--gold)' }}>★ admin</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.email}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--mut)', marginTop: 4, letterSpacing: 0.5 }}>
                    👥{u.group_count} · 🎲{u.bets_created} · 🤝{u.friend_count} {u.friend_requests_in > 0 && `· in:${u.friend_requests_in}`} · {Math.round(u.credits ?? 0)}₡
                  </div>
                </div>
                {flagged && (
                  <span title="users.room_id punta a un gruppo cancellato"
                    style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: 'var(--red)' }}>⚠ orfano</span>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* User detail */}
      {tab === 'users' && selectedId && (() => {
        const u = users.find(x => x.id === selectedId);
        if (!u) return null;
        const myGroups = groups; // any group for force-add
        const userGroupIds = new Set((detail?.groups || []).map(g => g.id));
        // Other accounts that collide on lowercase email (the "reset doesn't reach" trap)
        const emailSiblings = users.filter(o =>
          o.id !== u.id && (o.email || '').toLowerCase() === (u.email || '').toLowerCase()
        );

        return (
          <>
            <button onClick={() => setSelectedId(null)} style={S.btn('ghost')}>← indietro</button>

            <div style={{ marginTop: 24, marginBottom: 12, paddingBottom: 22, borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 18 }}>
              <Avatar p={u} size={64}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 30, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.01em' }}>{u.name}</div>
                <div style={{ fontSize: 13, color: 'var(--dim)', marginTop: 4 }}>{u.email}</div>
                <div style={{ fontSize: 10, color: 'var(--mut)', marginTop: 6, fontFamily: 'monospace', letterSpacing: '.04em' }}>{u.id}</div>
              </div>
            </div>

            {emailSiblings.length > 0 && (
              <div style={{ ...S.raised, borderColor: 'var(--red)55', background: 'var(--red)0d' }}>
                <div style={{ ...S.label, color: 'var(--red)' }}>⚠ Email duplicata</div>
                <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4, marginBottom: 10 }}>
                  Altri {emailSiblings.length} account hanno questa stessa email. Il login va a quello che il DB restituisce per primo — potrebbe non essere quello su cui stai impostando la password. Cancella quelli sbagliati o imposta la password sul record giusto.
                </div>
                {emailSiblings.map(s => (
                  <div key={s.id} onClick={() => setSelectedId(s.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                      borderBottom: '1px solid var(--brd)33', cursor: 'pointer' }}>
                    <Avatar p={s} size={32}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--dim)' }}>
                        <code style={{ color: 'var(--gold)' }}>{s.email}</code> · creato {new Date(Number(s.created_at)).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--mut)', fontFamily: 'monospace' }}>{s.id.slice(0, 12)}…</div>
                    </div>
                    <span style={{ color: 'var(--gold)', fontSize: 11 }}>apri →</span>
                  </div>
                ))}
              </div>
            )}

            {u.legacy_room_id && (
              <div style={S.card}>
                <div style={S.label}>Legacy room_id</div>
                <div style={{ fontSize: 12, marginTop: 6, marginBottom: 8, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {u.legacy_room_id} {u.legacy_room_exists === false && <span style={{ color: 'var(--red)' }}>(non esiste)</span>}
                </div>
                <button onClick={() => clearLegacy(u.id)} disabled={busy} style={S.btn()}>Cancella riferimento</button>
              </div>
            )}

            <div style={S.card}>
              <div style={S.label}>Gruppi di cui è membro</div>
              {(detail?.groups || []).length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 8 }}>nessun gruppo</div>
              )}
              {(detail?.groups || []).map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--brd)33' }}>
                  <span style={{ fontSize: 18 }}>{g.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--mut)' }}>{g.role} · codice {g.invite_code}</div>
                  </div>
                  <button onClick={() => removeFromGroup(g.id, u.id)} disabled={busy} style={S.btn('danger')}>Rimuovi</button>
                </div>
              ))}
            </div>

            <div style={S.card}>
              <div style={S.label}>Aggiungi a un gruppo</div>
              <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4, marginBottom: 10 }}>
                Forza l'iscrizione · niente codice invito.
              </div>
              {myGroups.filter(g => !userGroupIds.has(g.id)).map(g => (
                <button key={g.id} onClick={() => addToGroup(g.id, u.id)} disabled={busy}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', marginBottom: 6,
                    background: 'transparent', border: '1px dashed var(--brd)',
                    borderRadius: 10, cursor: busy ? 'wait' : 'pointer',
                    color: 'var(--txt)', textAlign: 'left',
                  }}>
                  <span style={{ fontSize: 16 }}>{g.emoji}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{g.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--mut)' }}>👥{g.member_count} · {g.invite_code}</span>
                  <span style={{ color: 'var(--gold)' }}>＋</span>
                </button>
              ))}
            </div>

            {(() => {
              const pwErr = validatePassword(pwNew);
              const hasInput = pwNew.length > 0;
              return (
                <div style={S.card}>
                  <div style={S.label}>Imposta password</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4, marginBottom: 10 }}>
                    Bypass del flusso "dimentica password". {t('pw.hint')}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={pwNew} onChange={e => setPwNew(e.target.value)} type="text"
                      placeholder="nuova password"
                      style={{ flex: 1, background: 'var(--inp)', border: `1px solid ${hasInput && pwErr ? 'var(--red)55' : hasInput ? 'var(--grn)55' : 'var(--brd)'}`, borderRadius: 8, color: 'var(--txt)', padding: '8px 10px', fontFamily: "'Manrope',sans-serif", fontSize: 13, outline: 'none' }}/>
                    <button onClick={() => setPassword(u.id, pwNew)} disabled={busy || !!pwErr} style={S.btn()}>
                      Applica
                    </button>
                  </div>
                  {hasInput && (
                    <div style={{
                      marginTop: 8, fontSize: 11, fontWeight: 600,
                      color: pwErr ? 'var(--red)' : 'var(--grn)',
                    }}>
                      {pwErr ? t(`pw.${pwErr.replace('password_', '')}`) : t('pw.ok')}
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={S.card}>
              <div style={S.label}>🏆 Reset completo</div>
              <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4, marginBottom: 10 }}>
                {u.id === meId
                  ? <>Cancella TUTTI i tuoi trofei (anche i 5 segreti) <b>e</b> azzera tutorial + easter egg sul tuo device. Dopo il reload rivedi onboarding e animazioni come a un account appena creato.</>
                  : <>Cancella TUTTI i trofei di {u.name} (anche i 5 segreti). {u.name} rivedrà tutorial + animazioni dei trofei segreti alla prossima apertura dell'app, come a un account appena creato.</>}
              </div>
              <button onClick={() => resetTrophies(u.id, u.name)} disabled={busy} style={S.btn()}>
                Reset trofei + tutorial
              </button>
            </div>

            <div style={S.card}>
              <div style={S.label}>★ Ruolo admin</div>
              <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4, marginBottom: 10 }}>
                {u.is_admin
                  ? `${u.name} è admin e ha accesso a questo pannello.`
                  : `${u.name} è un utente normale. Promuovendolo gli dai accesso al pannello admin.`}
              </div>
              <button onClick={() => toggleAdmin(u.id, u.is_admin, u.name)}
                disabled={busy}
                style={u.is_admin ? S.btn('danger') : S.btn()}>
                {u.is_admin ? 'Rimuovi admin' : 'Promuovi ad admin'}
              </button>
            </div>

            <div style={{ ...S.raised, borderColor: 'var(--red)44' }}>
              <div style={{ ...S.label, color: 'var(--red)' }}>Danger zone</div>
              <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4, marginBottom: 10 }}>
                Cancella l'account e ogni traccia (bet, crediti, achievements, reazioni, amicizie, gruppi).
              </div>
              <button onClick={() => deleteUser(u.id)} disabled={busy} style={S.btn('danger')}>
                Elimina account
              </button>
            </div>

            {detail && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', color: 'var(--dim)', fontSize: 12 }}>JSON grezzo</summary>
                <pre style={S.pre}>{JSON.stringify(detail, null, 2)}</pre>
              </details>
            )}
          </>
        );
      })()}

      {/* ── GRUPPI ─────────────────────────────────────────── */}
      {tab === 'groups' && (
        <>
          {groups.map(g => (
            <div key={g.id} style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{g.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--mut)', fontFamily: 'monospace' }}>{g.id}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: 11, color: 'var(--dim)', marginBottom: 10 }}>
                <span>codice <code style={{ background: 'var(--inp)', padding: '2px 6px', borderRadius: 4, color: 'var(--gold)' }}>{g.invite_code}</code></span>
                <span>· 👥{g.member_count}</span>
                <span>· 🎲{g.bet_count}</span>
              </div>
              <button onClick={() => regenCode(g.id)} disabled={busy} style={S.btn()}>
                Rigenera codice
              </button>
            </div>
          ))}
        </>
      )}

      {/* ── INTEGRITÀ ──────────────────────────────────────── */}
      {tab === 'integrity' && integrity && (
        <>
          <div style={{ ...S.raised, borderColor: integrity.duplicate_emails?.length ? 'var(--red)55' : 'var(--rule)' }}>
            <div style={{ ...S.label, color: integrity.duplicate_emails?.length ? 'var(--red)' : 'var(--dim)' }}>
              Email duplicate
            </div>
            <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4, marginBottom: 10 }}>
              Stessa email su più account (es. 'Anna@x' e 'anna@x'). Causa il classico bug "reimposto la password ma lei non riesce a entrare" — la reset arriva a un record diverso da quello su cui atterra il login.
            </div>
            {(!integrity.duplicate_emails || integrity.duplicate_emails.length === 0) && (
              <div style={{ fontSize: 12, color: 'var(--grn)' }}>✓ nessuno</div>
            )}
            {(integrity.duplicate_emails || []).map(d => (
              <div key={d.lemail} style={{ padding: '8px 0', borderBottom: '1px solid var(--brd)33' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>{d.lemail} ({d.n} account)</div>
                {d.users.map(u => (
                  <div key={u.id} onClick={() => { setTab('users'); setSelectedId(u.id); }}
                    style={{ fontSize: 11, color: 'var(--dim)', cursor: 'pointer', marginTop: 6, padding: '4px 0' }}>
                    · <code style={{ color: 'var(--gold)' }}>{u.email}</code> · {u.name}
                    <span style={{ color: 'var(--mut)', fontFamily: 'monospace', fontSize: 10, marginLeft: 6 }}>
                      {u.id.slice(0, 12)}…
                    </span>
                    {u.room_id && <span style={{ color: 'var(--mut)', marginLeft: 6 }}>· room {u.room_id.slice(0,8)}…</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.label}>Legacy room_id orfani</div>
            <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4, marginBottom: 10 }}>
              users.room_id punta a un gruppo cancellato. Causa "fantasmi" nello state legacy.
            </div>
            {integrity.dangling_room_ids.length === 0 && <div style={{ fontSize: 12, color: 'var(--grn)' }}>✓ nessuno</div>}
            {integrity.dangling_room_ids.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--brd)33' }}>
                <div style={{ flex: 1, fontSize: 12 }}>
                  <div>{r.name} · <span style={{ color: 'var(--dim)' }}>{r.email}</span></div>
                  <div style={{ fontSize: 10, color: 'var(--mut)', fontFamily: 'monospace' }}>→ {r.room_id}</div>
                </div>
                <button onClick={() => clearLegacy(r.id)} disabled={busy} style={S.btn()}>Pulisci</button>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.label}>Nomi duplicati</div>
            <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4, marginBottom: 10 }}>
              Più account con lo stesso nome (possibile doppione di un utente).
            </div>
            {integrity.duplicate_names.length === 0 && <div style={{ fontSize: 12, color: 'var(--grn)' }}>✓ nessuno</div>}
            {integrity.duplicate_names.map(d => (
              <div key={d.lname} style={{ padding: '8px 0', borderBottom: '1px solid var(--brd)33' }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{d.lname} ({d.n})</div>
                {d.users.map(u => (
                  <div key={u.id} onClick={() => { setTab('users'); setSelectedId(u.id); }} style={{ fontSize: 11, color: 'var(--dim)', cursor: 'pointer', marginTop: 4 }}>
                    · {u.email} <span style={{ color: 'var(--mut)', fontFamily: 'monospace', fontSize: 10 }}>{u.id.slice(0, 12)}…</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.label}>user_groups orfani</div>
            <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4, marginBottom: 10 }}>
              Membri di gruppi che non esistono più (o per utenti cancellati).
            </div>
            {integrity.orphan_user_groups.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--grn)' }}>✓ nessuno</div>
              : <pre style={S.pre}>{JSON.stringify(integrity.orphan_user_groups, null, 2)}</pre>}
          </div>

          {/* Reset my trophies — dev tool. Wipes the trophy table for the
              admin's own user AND clears every local LS flag tied to the
              easter-egg popups + onboarding tour, so each animation and
              first-time-tip can fire again from scratch. */}
          <div style={{ ...S.raised, borderColor: 'var(--gold)55', background: 'var(--gold)0a', marginTop: 14 }}>
            <div style={{ ...S.label, color: 'var(--gold)' }}>🏆 Reset miei trofei</div>
            <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4, marginBottom: 10, lineHeight: 1.5 }}>
              Cancella TUTTI i trofei sbloccati sul tuo account (anche i 5 segreti) e azzera i flag locali degli easter egg + del tutorial onboarding. Dopo potrai re-triggerare ogni animazione e ogni notifica trofeo dall'inizio.
              <br/><span style={{ color: 'var(--gold)' }}>Tocca solo il tuo account.</span>
            </div>
            <button
              disabled={busy}
              onClick={async () => {
                if (!window.confirm("Cancellare TUTTI i tuoi trofei (compresi i segreti) e azzerare i flag locali?\n\nGli altri account NON sono toccati.")) return;
                setBusy(true);
                try {
                  const r = await api.resetMyAchievements();
                  wipeFreshAccountFlags();
                  toast.success(`Trofei azzerati (${r.deleted}). Ricarico…`);
                  setTimeout(() => window.location.reload(), 700);
                } catch (e) {
                  console.error('[reset-trophies]', e);
                  toast.error(e?.message || 'errore');
                } finally { setBusy(false); }
              }}
              style={{
                ...S.btn(),
                background: 'var(--gold)',
                color: '#1a1530',
                width: '100%', padding: '12px 0', fontSize: 13,
              }}>
              {busy ? '…' : 'Azzera trofei + flag easter egg'}
            </button>
          </div>
        </>
      )}

      {/* ── RESET TOTALE (one-shot) ─────────────────────────── */}
      {tab === 'nuke' && nukeAvailable && (
        <div style={{ ...S.raised, borderColor: 'var(--red)55', background: 'var(--red)0d' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 800, color: 'var(--red)', marginBottom: 8 }}>
            🔥 Reset totale
          </div>
          <div style={{ fontSize: 12, color: 'var(--mut)', lineHeight: 1.6, marginBottom: 14 }}>
            Cancella <b>TUTTO</b>: bet, contatori, reazioni, crediti, trofei, profili, gruppi, amicizie, richieste, template, notifiche.
            Sopravvive solo il tuo account admin (crediti resettati a 100).
            <br/><br/>
            Pensato per il momento "fine test → produzione". È <b>usa-e-getta</b>: dopo che lo clicchi, questo bottone scompare per sempre. Non si torna indietro.
          </div>
          <button
            disabled={busy}
            onClick={async () => {
              if (!window.confirm('Cancellare DEFINITIVAMENTE tutti i dati?\n\nResterà solo il tuo account admin. Non recuperabile.')) return;
              const phrase = window.prompt("Scrivi NUKE in maiuscolo per confermare:");
              if (phrase !== 'NUKE') { toast.error('Reset annullato'); return; }
              setBusy(true);
              try {
                const r = await api.adminNuke();
                console.log('[nuke] wiped:', r.wiped);
                toast.success('Reset eseguito. Ricarico la pagina…');
                setTimeout(() => window.location.reload(), 800);
              } catch (e) {
                console.error(e);
                toast.error(e?.message || 'errore');
              } finally { setBusy(false); }
            }}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12, border: '1px solid var(--red)',
              background: 'var(--red)', color: '#fff',
              fontFamily: "'Manrope',sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: 0.5,
              cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1,
            }}>
            {busy ? '…' : '🔥 RESET TOTALE'}
          </button>
        </div>
      )}
    </div>
  );
}
