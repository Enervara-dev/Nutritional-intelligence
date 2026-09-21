import { useState, useEffect } from 'react';
import { getWorkouts, logWorkout, getTodayWorkout, deleteWorkoutLog } from '../api/api';

export default function WorkoutLogger() {
  const userId = localStorage.getItem('enervara_user_id');
  const [workouts, setWorkouts] = useState([]);
  const [loggedWorkouts, setLoggedWorkouts] = useState([]);
  const [totalBurned, setTotalBurned] = useState(0);
  const [drawer, setDrawer] = useState(null); // currently selected workout
  const [duration, setDuration] = useState(30);
  const [reps, setReps] = useState(10);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchWorkouts(); fetchLog(); }, []);

  async function fetchWorkouts() {
    try { const r = await getWorkouts(); setWorkouts(r.data); } catch(e) { console.error(e); }
  }
  async function fetchLog() {
    if (!userId) return;
    try { const r = await getTodayWorkout(userId); setLoggedWorkouts(r.data.workouts || []); setTotalBurned(r.data.total_calories_burned || 0); }
    catch(e) { console.error(e); }
  }

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(''),2500); }

  const previewBurn = (wk) => {
    if (!wk) return 0;
    if (wk.input_type === 'duration') {
      return Math.round(wk.met_value * 70 * (duration / 60));
    }
    return Math.round(wk.calories_per_rep * reps);
  };

  async function handleLog() {
    if (!userId) { showToast('⚠️ Please create a profile first'); return; }
    const inputValue = drawer.input_type === 'duration' ? duration : reps;
    try {
      await logWorkout({ user_id: parseInt(userId), workout_id: drawer.id, input_type: drawer.input_type, input_value: inputValue });
      await fetchLog();
      showToast(`✅ ${drawer.name} logged!`);
      setDrawer(null);
    } catch(e) { showToast('❌ ' + (e.response?.data?.detail || e.message)); }
  }

  async function handleRemove(logId) {
    try { await deleteWorkoutLog(logId); await fetchLog(); } catch(e) { showToast('❌ Failed to remove'); }
  }

  const loggedIds = new Set(loggedWorkouts.map(l=>l.workout_id));
  const PRESETS = [15, 30, 45, 60];

  return (
    <div>
      <div className="page-title">Workout Logger</div>
      <div className="page-subtitle">Log your workouts for today. Calories burned calculated using your weight.</div>

      {!userId && <div style={{background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:10,padding:'12px 16px',marginBottom:16,fontSize:13,fontWeight:600,color:'#92400e'}}>⚠️ No profile found. Please complete Profile Setup first.</div>}

      {/* Workout Grid */}
      <div className="workout-grid">
        {workouts.map(wk=>(
          <div key={wk.id} className={`workout-card${loggedIds.has(wk.id)?' logged':''}`} onClick={()=>{ setDrawer(wk); setDuration(30); setReps(10); }}>
            <div className="wk-icon">{wk.icon}</div>
            <div className="wk-name">{wk.name}</div>
            <div className="wk-cat">{wk.category}</div>
            {loggedIds.has(wk.id) && <div style={{fontSize:11,color:'var(--success)',fontWeight:600,marginTop:4}}>✓ Logged</div>}
          </div>
        ))}
      </div>

      {/* Logged list */}
      {loggedWorkouts.length > 0 && (
        <div className="card mt20">
          <h4 style={{fontSize:14,fontWeight:700,color:'var(--primary-dark)',marginBottom:12}}>Today's Workouts</h4>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {loggedWorkouts.map(l=>(
              <div key={l.id} className="logged-item">
                <div className="logged-item-info">
                  <div className="logged-item-name">{l.workout_name}</div>
                  <div className="logged-item-detail">
                    {l.input_type==='duration' ? `${l.input_value} min` : `${l.input_value} reps`} · 🔥 {l.calories_burned} kcal burned
                  </div>
                </div>
                <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--danger)',fontSize:16}} onClick={()=>handleRemove(l.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Burn Counter */}
      <div className="burn-bar">
        <div>
          <div className="burn-label">Total Calories Burned Today</div>
          <div className="burn-total">🔥 {totalBurned} kcal</div>
        </div>
        <div style={{fontSize:36}}>💪</div>
      </div>

      {/* Drawer */}
      {drawer && (
        <>
          <div className="drawer-overlay" onClick={()=>setDrawer(null)} />
          <div className="drawer">
            <button className="drawer-close" onClick={()=>setDrawer(null)}>✕</button>
            <div style={{fontSize:40,textAlign:'center'}}>{drawer.icon}</div>
            <h3 style={{textAlign:'center'}}>{drawer.name}</h3>
            <p className="text-muted" style={{textAlign:'center'}}>{drawer.category}</p>

            {drawer.input_type === 'duration' ? (
              <div>
                <label style={{fontSize:13,fontWeight:600,color:'var(--primary-dark)'}}>Duration — <strong>{duration} min</strong></label>
                <div className="slider-row mt8">
                  <input type="range" className="slider" min="5" max="120" step="5" value={duration} onChange={e=>setDuration(parseInt(e.target.value))} />
                  <span className="slider-value">{duration}m</span>
                </div>
                <div className="toggle-group mt12">
                  {PRESETS.map(p=><button key={p} className={`toggle-btn${duration===p?' selected':''}`} onClick={()=>setDuration(p)}>{p}m</button>)}
                </div>
              </div>
            ) : (
              <div>
                <label style={{fontSize:13,fontWeight:600,color:'var(--primary-dark)'}}>Reps</label>
                <div className="stepper mt8">
                  <button className="stepper-btn" onClick={()=>setReps(r=>Math.max(1,r-5))}>−</button>
                  <span className="stepper-val">{reps}</span>
                  <button className="stepper-btn" onClick={()=>setReps(r=>r+5)}>+</button>
                </div>
              </div>
            )}

            <div style={{textAlign:'center',padding:'12px',background:'#f0f4ff',borderRadius:10}}>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>Estimated burn</div>
              <div style={{fontSize:28,fontWeight:700,color:'var(--primary)'}}>🔥 ~{previewBurn(drawer)} kcal</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>(based on 70kg, actual uses your weight)</div>
            </div>

            <button className="btn btn-primary" style={{width:'100%',padding:'12px'}} onClick={handleLog}>Log Workout</button>
          </div>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
