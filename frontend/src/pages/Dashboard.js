import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../api';

const c = {
  bg: '#F7F6F3', surface: '#FFF', surface2: '#F1EFE8',
  border: 'rgba(0,0,0,0.09)', border2: 'rgba(0,0,0,0.16)',
  text: '#1A1A18', text2: '#6B6A64', text3: '#9E9D97',
  accent: '#185FA5', accentBg: '#E6F1FB',
};

const Avatar = ({ initials, color = '#B5D4F4', textColor = '#0C447C', size = 28 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: color, color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600 }}>
    {initials}
  </div>
);

const Metric = ({ value, label }) => (
  <div style={{ background: c.surface2, borderRadius: 10, padding: '0.8rem 1rem' }}>
    <div style={{ fontSize: 22, fontWeight: 600, color: c.text, letterSpacing: -0.5 }}>{value}</div>
    <div style={{ fontSize: 11, color: c.text3, marginTop: 2 }}>{label}</div>
  </div>
);

const StickyColors = { yellow: '#FFF8EC', blue: '#EBF4FE', green: '#EDF7E2', pink: '#FEF0F5', purple: '#F0EFFF' };
const StickyBorders = { yellow: '#FAC775', blue: '#B5D4F4', green: '#C0DD97', pink: '#F4C0D1', purple: '#CECBF6' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const socketRef = useSocket();
  const [view, setView] = useState('brainstorm');
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [epics, setEpics] = useState([]);
  const [members, setMembers] = useState([]);
  const [modal, setModal] = useState(null); // 'idea' | 'task' | 'project' | null
  const [form, setForm] = useState({});
  const [notif, setNotif] = useState('');

  const viewTitles = { brainstorm: 'Brainstorming board', tasks: 'Task board', planning: 'Planning', team: 'Team' };

  // Toast
  const toast = (msg) => { setNotif(msg); setTimeout(() => setNotif(''), 2500); };

  // Load projects on mount
  useEffect(() => {
    api('/projects').then(ps => {
      setProjects(ps);
      if (ps.length) setActiveProject(ps[0]);
    }).catch(() => {});
  }, []);

  // Load project data when project changes
  useEffect(() => {
    if (!activeProject) return;
    const p = activeProject.id;
    socketRef.current?.emit('join-project', p);
    api(`/ideas/${p}`).then(setIdeas).catch(() => {});
    api(`/tasks/${p}`).then(setTasks).catch(() => {});
    api(`/projects/${p}/epics`).then(setEpics).catch(() => {});
    api(`/projects/${p}/members`).then(setMembers).catch(() => {});
  }, [activeProject]);

  // Realtime
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    s.on('idea-added', (idea) => setIdeas(prev => [idea, ...prev]));
    s.on('idea-voted', ({ id, votes }) => setIdeas(prev => prev.map(i => i.id === id ? { ...i, votes } : i)));
    s.on('task-updated', (task) => setTasks(prev => prev.map(t => t.id === task.id ? task : t)));
    return () => { s.off('idea-added'); s.off('idea-voted'); s.off('task-updated'); };
  }, []);

  const addIdea = async () => {
    if (!form.text?.trim() || !activeProject) return;
    try {
      const idea = await api(`/ideas/${activeProject.id}`, { method: 'POST', body: { text: form.text, category: form.category || 'Generale', color: form.color || 'yellow' } });
      setIdeas(prev => [idea, ...prev]);
      socketRef.current?.emit('idea-added', { ...idea, projectId: activeProject.id });
      setModal(null); setForm({});
      toast('Idea aggiunta!');
    } catch (e) { toast(e.message); }
  };

  const voteIdea = async (id) => {
    try {
      const { votes } = await api(`/ideas/${id}/vote`, { method: 'POST' });
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, votes } : i));
      socketRef.current?.emit('idea-voted', { id, votes, projectId: activeProject.id });
    } catch {}
  };

  const addTask = async () => {
    if (!form.title?.trim() || !activeProject) return;
    try {
      const task = await api(`/tasks/${activeProject.id}`, { method: 'POST', body: form });
      setTasks(prev => [task, ...prev]);
      setModal(null); setForm({});
      toast('Task aggiunto!');
    } catch (e) { toast(e.message); }
  };

  const moveTask = async (taskId, status) => {
    try {
      const updated = await api(`/tasks/${taskId}`, { method: 'PATCH', body: { status } });
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      socketRef.current?.emit('task-updated', { ...updated, projectId: activeProject.id });
    } catch {}
  };

  const addProject = async () => {
    if (!form.name?.trim()) return;
    try {
      const p = await api('/projects', { method: 'POST', body: form });
      setProjects(prev => [...prev, p]);
      setActiveProject(p);
      setModal(null); setForm({});
      toast('Progetto creato!');
    } catch (e) { toast(e.message); }
  };

  const tasksByStatus = (s) => tasks.filter(t => t.status === s);

  const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  const startMonth = 3; // Aprile (0-indexed)

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: c.text }}>

      {/* SIDEBAR */}
      <div style={{ width: 230, minWidth: 230, background: c.surface, borderRight: `0.5px solid ${c.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: `0.5px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, background: c.accent, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 16 16" fill="white"><path d="M8 1L2 5v6l6 4 6-4V5L8 1zm0 2.2l4 2.7v4.2L8 12.6 4 10.1V5.9L8 3.2z"/></svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: -0.3 }}>Syncly</span>
        </div>

        <div style={{ padding: '1rem 0.75rem 0.3rem', fontSize: 10, fontWeight: 600, color: c.text3, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Workspace</div>
        {['brainstorm', 'tasks', 'planning', 'team'].map(v => (
          <div key={v} onClick={() => setView(v)} style={{ padding: '0.48rem 0.75rem', margin: '0 6px', borderRadius: 8, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontWeight: view === v ? 500 : 400, background: view === v ? c.accentBg : 'transparent', color: view === v ? c.accent : c.text2, transition: 'background 0.12s' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: { brainstorm: '#185FA5', tasks: '#3B6D11', planning: '#633806', team: '#533AB7' }[v] }} />
            {{ brainstorm: 'Brainstorm', tasks: 'Tasks', planning: 'Planning', team: 'Team' }[v]}
          </div>
        ))}

        <div style={{ padding: '1rem 0.75rem 0.3rem', fontSize: 10, fontWeight: 600, color: c.text3, letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 8 }}>Progetti</div>
        {projects.map(p => (
          <div key={p.id} onClick={() => setActiveProject(p)} style={{ padding: '0.45rem 0.75rem', margin: '0 6px', borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, background: activeProject?.id === p.id ? c.surface2 : 'transparent', color: c.text2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            {p.name}
          </div>
        ))}
        <div onClick={() => { setModal('project'); setForm({}); }} style={{ padding: '0.45rem 0.75rem', margin: '0 6px', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: c.text3, display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 16 }}>+</span> Nuovo progetto
        </div>

        <div style={{ marginTop: 'auto', padding: '1rem', borderTop: `0.5px solid ${c.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Avatar initials={user?.avatar_initials || '?'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: c.text3 }}>Free plan</div>
            </div>
            <span onClick={logout} style={{ fontSize: 11, color: c.text3, cursor: 'pointer', flexShrink: 0 }}>Esci</span>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* TOPBAR */}
        <div style={{ background: c.surface, borderBottom: `0.5px solid ${c.border}`, padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>{viewTitles[view]}</div>
            <div style={{ fontSize: 13, color: c.text3 }}>{activeProject?.name || 'Nessun progetto'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {view === 'brainstorm' && <button onClick={() => { setModal('idea'); setForm({ color: 'yellow', category: 'Generale' }); }} style={{ padding: '7px 14px', borderRadius: 8, border: `0.5px solid ${c.border2}`, background: c.surface, color: c.text, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>+ Idea</button>}
            {view === 'tasks' && <button onClick={() => { setModal('task'); setForm({ status: 'todo' }); }} style={{ padding: '7px 14px', borderRadius: 8, border: `0.5px solid ${c.border2}`, background: c.surface, color: c.text, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>+ Task</button>}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* BRAINSTORM */}
          {view === 'brainstorm' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.25rem' }}>
                <Metric value={ideas.length} label="Idee totali" />
                <Metric value={[...new Set(ideas.map(i => i.category))].length || 0} label="Categorie" />
                <Metric value={ideas.reduce((s, i) => s + (i.votes || 0), 0)} label="Voti" />
                <Metric value={members.length} label="Partecipanti" />
              </div>
              {!activeProject ? (
                <div style={{ textAlign: 'center', color: c.text3, marginTop: '3rem' }}>Crea o seleziona un progetto per iniziare</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 10 }}>
                  {ideas.map(idea => (
                    <div key={idea.id} style={{ padding: '1rem', borderRadius: 10, fontSize: 13, minHeight: 110, position: 'relative', background: StickyColors[idea.color] || StickyColors.yellow, border: `0.5px solid ${StickyBorders[idea.color] || StickyBorders.yellow}` }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{idea.category}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{idea.text}</div>
                      <div onClick={() => voteIdea(idea.id)} style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 11, color: c.text3, cursor: 'pointer', fontWeight: 500 }}>▲ {idea.votes || 0}</div>
                    </div>
                  ))}
                  <div onClick={() => { setModal('idea'); setForm({ color: 'yellow', category: 'Generale' }); }} style={{ padding: '1rem', borderRadius: 10, minHeight: 110, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${c.border2}`, color: c.text3, fontSize: 13 }}>
                    + Nuova idea
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TASKS */}
          {view === 'tasks' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.25rem' }}>
                <Metric value={tasks.length} label="Totali" />
                <Metric value={tasksByStatus('inprogress').length} label="In progress" />
                <Metric value={tasksByStatus('done').length} label="Completati" />
                <Metric value={tasksByStatus('todo').length} label="Da fare" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[['todo', 'Da fare'], ['inprogress', 'In progress'], ['done', 'Fatto']].map(([status, label]) => (
                  <div key={status} style={{ background: c.surface2, borderRadius: 14, padding: '0.85rem', border: `0.5px solid ${c.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: c.text2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                      <span style={{ fontSize: 11, color: c.text3, background: c.surface, padding: '2px 7px', borderRadius: 10, border: `0.5px solid ${c.border}` }}>{tasksByStatus(status).length}</span>
                    </div>
                    {tasksByStatus(status).map(task => (
                      <div key={task.id} style={{ background: c.surface, border: `0.5px solid ${c.border}`, borderRadius: 10, padding: '0.8rem', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, marginBottom: 8, lineHeight: 1.45 }}>{task.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {task.tag && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: '#E6F1FB', color: '#0C447C' }}>{task.tag}</span>}
                          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                            {status !== 'todo' && <button onClick={() => moveTask(task.id, status === 'inprogress' ? 'todo' : 'inprogress')} style={{ fontSize: 10, cursor: 'pointer', border: `0.5px solid ${c.border}`, borderRadius: 6, padding: '2px 6px', background: c.surface, fontFamily: 'inherit' }}>←</button>}
                            {status !== 'done' && <button onClick={() => moveTask(task.id, status === 'todo' ? 'inprogress' : 'done')} style={{ fontSize: 10, cursor: 'pointer', border: `0.5px solid ${c.border}`, borderRadius: 6, padding: '2px 6px', background: c.surface, fontFamily: 'inherit' }}>→</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PLANNING */}
          {view === 'planning' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.25rem' }}>
                <Metric value={`${MONTHS[startMonth]}–${MONTHS[startMonth + 5]}`} label="Timeline" />
                <Metric value={epics.length} label="Epic attive" />
                <Metric value={`${Math.round((tasksByStatus('done').length / Math.max(tasks.length, 1)) * 100)}%`} label="Completamento" />
                <Metric value={members.length} label="Membri" />
              </div>
              <div style={{ background: c.surface, border: `0.5px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr' }}>
                  <div style={{ padding: '7px 12px', fontSize: 10, fontWeight: 600, color: c.text3, background: c.surface2, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `0.5px solid ${c.border}`, borderRight: `0.5px solid ${c.border}` }}>Epic</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', background: c.surface2, borderBottom: `0.5px solid ${c.border}` }}>
                    {[0,1,2,3,4,5].map(i => (
                      <div key={i} style={{ fontSize: 11, color: c.text2, padding: '7px 8px', textAlign: 'center', fontWeight: 500, borderRight: i < 5 ? `0.5px solid ${c.border}` : 'none' }}>{MONTHS[(startMonth + i) % 12]}</div>
                    ))}
                  </div>
                </div>
                {epics.map((epic, idx) => (
                  <div key={epic.id} style={{ display: 'grid', gridTemplateColumns: '170px 1fr', borderBottom: idx < epics.length - 1 ? `0.5px solid ${c.border}` : 'none' }}>
                    <div style={{ padding: '10px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, borderRight: `0.5px solid ${c.border}` }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: epic.color }} />
                      {epic.name}
                    </div>
                    <div style={{ position: 'relative', height: 46, display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: `${((epic.start_month - startMonth) / 6) * 100}%`, width: `${(epic.duration_months / 6) * 100}%`, height: 28, borderRadius: 8, background: epic.color + '40', border: `1.5px solid ${epic.color}`, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 11, fontWeight: 500, color: epic.color, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {epic.name}
                      </div>
                    </div>
                  </div>
                ))}
                {epics.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: c.text3, fontSize: 13 }}>Nessuna epic. Aggiungine una con le API o estendi questa sezione.</div>
                )}
              </div>
            </div>
          )}

          {/* TEAM */}
          {view === 'team' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.25rem' }}>
                <Metric value={members.length} label="Membri" />
                <Metric value={tasks.length} label="Task totali" />
                <Metric value={tasksByStatus('done').length} label="Completati" />
                <Metric value={tasksByStatus('inprogress').length} label="In corso" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))', gap: 12 }}>
                {members.map((m, i) => {
                  const colors = [['#B5D4F4','#0C447C'], ['#C0DD97','#27500A'], ['#CECBF6','#3C3489'], ['#FAC775','#633806'], ['#9FE1CB','#085041']];
                  const [bg, fg] = colors[i % colors.length];
                  const myTasks = tasks.filter(t => t.assignee_id === m.id);
                  return (
                    <div key={m.id} style={{ background: c.surface, border: `0.5px solid ${c.border}`, borderRadius: 14, padding: '1.25rem' }}>
                      <Avatar initials={m.avatar_initials || '?'} color={bg} textColor={fg} size={48} />
                      <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: c.text3, marginBottom: 10 }}>{m.role || 'Membro'}</div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ fontSize: 12, color: c.text2 }}><strong style={{ display: 'block', fontSize: 17, fontWeight: 600, color: c.text }}>{myTasks.length}</strong>task</div>
                        <div style={{ fontSize: 12, color: c.text2 }}><strong style={{ display: 'block', fontSize: 17, fontWeight: 600, color: c.text }}>{myTasks.filter(t => t.status === 'done').length}</strong>fatti</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ background: c.surface, border: `1px dashed ${c.border2}`, borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, cursor: 'pointer', color: c.text3 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>+</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Invita membro</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>via email</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {modal && (
        <div onClick={(e) => e.target === e.currentTarget && setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: c.surface, borderRadius: 16, padding: '1.5rem', width: 420, maxWidth: '92vw', border: `0.5px solid ${c.border2}` }}>
            {modal === 'idea' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Nuova idea</div>
                <textarea value={form.text || ''} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="Descrivi la tua idea..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `0.5px solid ${c.border2}`, fontSize: 13, fontFamily: 'inherit', minHeight: 80, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10, outline: 'none' }} />
                <select value={form.category || 'Generale'} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `0.5px solid ${c.border2}`, fontSize: 13, fontFamily: 'inherit', marginBottom: 12, outline: 'none', background: c.surface }}>
                  {['Generale','Prodotto','Design','Marketing','Engineering'].map(cat => <option key={cat}>{cat}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {Object.entries(StickyColors).map(([col, bg]) => (
                    <div key={col} onClick={() => setForm(f => ({ ...f, color: col }))} style={{ width: 26, height: 26, borderRadius: '50%', background: bg, border: `2px solid ${form.color === col ? c.accent : StickyBorders[col]}`, cursor: 'pointer' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModal(null)} style={{ padding: '7px 14px', borderRadius: 8, border: `0.5px solid ${c.border2}`, background: c.surface, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annulla</button>
                  <button onClick={addIdea} style={{ padding: '7px 14px', borderRadius: 8, background: c.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Aggiungi</button>
                </div>
              </>
            )}
            {modal === 'task' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Nuovo task</div>
                <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titolo del task..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `0.5px solid ${c.border2}`, fontSize: 13, fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box', outline: 'none' }} />
                <input value={form.tag || ''} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="Tag (es. Design, Eng...)" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `0.5px solid ${c.border2}`, fontSize: 13, fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box', outline: 'none' }} />
                <select value={form.status || 'todo'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `0.5px solid ${c.border2}`, fontSize: 13, fontFamily: 'inherit', marginBottom: 12, outline: 'none', background: c.surface }}>
                  <option value="todo">Da fare</option>
                  <option value="inprogress">In progress</option>
                  <option value="done">Fatto</option>
                </select>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModal(null)} style={{ padding: '7px 14px', borderRadius: 8, border: `0.5px solid ${c.border2}`, background: c.surface, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annulla</button>
                  <button onClick={addTask} style={{ padding: '7px 14px', borderRadius: 8, background: c.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Aggiungi</button>
                </div>
              </>
            )}
            {modal === 'project' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Nuovo progetto</div>
                <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome progetto..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `0.5px solid ${c.border2}`, fontSize: 13, fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box', outline: 'none' }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModal(null)} style={{ padding: '7px 14px', borderRadius: 8, border: `0.5px solid ${c.border2}`, background: c.surface, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annulla</button>
                  <button onClick={addProject} style={{ padding: '7px 14px', borderRadius: 8, background: c.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Crea</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      {notif && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: c.text, color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, zIndex: 200 }}>
          {notif}
        </div>
      )}
    </div>
  );
}
