import { useState, useEffect } from 'react';
import { getFoods, logFood, getTodayFoodLog, deleteFoodLog } from '../api/api';

const MEAL_TABS = [
  { key: 'breakfast', label: '🌅 Breakfast' },
  { key: 'lunch',     label: '☀️ Lunch' },
  { key: 'dinner',    label: '🌙 Dinner' },
  { key: 'snacks',    label: '🍎 Snacks' },
  { key: 'other',     label: '➕ Other' },
];
const CATEGORIES = ['All', 'South Indian', 'Staples', 'Protein', 'Dairy', 'Drinks', 'Nuts', 'Fats', 'Sweeteners', 'Fruits', 'Vegetables', 'Mains', 'Snacks'];
const MAX_CAL = 2500;

function QuantityModal({ food, onConfirm, onClose }) {
  const [count, setCount] = useState(1);
  const [size, setSize] = useState('medium');
  const [spoon, setSpoon] = useState('1_tsp');

  const qt = food.quantity_type;

  function confirm() {
    let val;
    if (['count','piece','slice'].includes(qt)) val = String(count);
    else if (qt === 'spoon') val = spoon;
    else if (qt === 'glass') val = '1';
    else val = size;
    onConfirm(val);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <h3>{food.name}</h3>
        {['count','piece','slice'].includes(qt) && (
          <div>
            <p className="text-muted" style={{marginBottom:14}}>How many?</p>
            <div className="stepper">
              <button className="stepper-btn" onClick={()=>setCount(c=>Math.max(1,c-1))}>−</button>
              <span className="stepper-val">{count}</span>
              <button className="stepper-btn" onClick={()=>setCount(c=>c+1)}>+</button>
            </div>
          </div>
        )}
        {['bowl','cup','plate','handful'].includes(qt) && (
          <div>
            <p className="text-muted" style={{marginBottom:14}}>Select size:</p>
            <div className="size-picker">
              {['small','medium','large'].map(s=>(
                <button key={s} className={`size-btn${size===s?' selected':''}`} onClick={()=>setSize(s)}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
        {qt === 'glass' && <p style={{textAlign:'center',fontSize:14,color:'var(--primary)',fontWeight:600}}>1 Glass = 250ml</p>}
        {qt === 'spoon' && (
          <div>
            <p className="text-muted" style={{marginBottom:14}}>Select amount:</p>
            <div className="size-picker">
              <button className={`size-btn${spoon==='1_tsp'?' selected':''}`} onClick={()=>setSpoon('1_tsp')}>1 tsp (5ml)</button>
              <button className={`size-btn${spoon==='1_tbsp'?' selected':''}`} onClick={()=>setSpoon('1_tbsp')}>1 tbsp (15ml)</button>
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:10,marginTop:24}}>
          <button className="btn btn-outline" style={{flex:1}} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{flex:1}} onClick={confirm}>Add to Log</button>
        </div>
      </div>
    </div>
  );
}

export default function FoodLogger() {
  const userId = localStorage.getItem('enervara_user_id');
  const [foods, setFoods] = useState([]);
  const [activeTab, setActiveTab] = useState('breakfast');
  const [activeCategory, setActiveCategory] = useState('All');
  const [logData, setLogData] = useState({ slots: {breakfast:[],lunch:[],dinner:[],snacks:[],other:[]}, slot_totals: {}, daily_totals: { calories:0, protein_g:0, carbs_g:0, fat_g:0 } });
  const [selectedFood, setSelectedFood] = useState(null);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchFoods(); fetchLog(); }, []);

  async function fetchFoods() {
    try { const r = await getFoods(); setFoods(r.data); } catch(e) { console.error(e); }
  }
  async function fetchLog() {
    if (!userId) return;
    try { const r = await getTodayFoodLog(userId); setLogData(r.data); } catch(e) { console.error(e); }
  }

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(''),2500); }

  async function handleAddFood(quantityValue) {
    if (!userId) { showToast('⚠️ Please create a profile first'); return; }
    setLoading(true);
    try {
      await logFood({ user_id: userId, food_id: selectedFood.id, meal_type: activeTab, quantity_type: selectedFood.quantity_type, quantity_value: quantityValue });
      await fetchLog();
      showToast(`✅ ${selectedFood.name} added to ${activeTab}`);
    } catch(e) { showToast('❌ ' + (e.response?.data?.detail || e.message)); }
    finally { setLoading(false); setSelectedFood(null); }
  }

  async function handleRemove(logId) {
    try { await deleteFoodLog(logId); await fetchLog(); } catch(e) { showToast('❌ Failed to remove'); }
  }

  const filtered = activeCategory === 'All' ? foods : foods.filter(f => f.category === activeCategory);
  const slotItems = logData.slots?.[activeTab] || [];
  const slotTotals = logData.slot_totals?.[activeTab] || { calories:0, protein_g:0, carbs_g:0, fat_g:0 };
  const daily = logData.daily_totals || { calories:0, protein_g:0, carbs_g:0, fat_g:0 };

  return (
    <div>
      <div className="page-title">Food Logger</div>
      <div className="page-subtitle">Log what you eat for each meal. Macros calculated automatically.</div>

      {!userId && <div style={{background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:10,padding:'12px 16px',marginBottom:16,fontSize:13,fontWeight:600,color:'#92400e'}}>⚠️ No profile found. Please complete Profile Setup first so your logs are saved.</div>}

      {/* Meal Tabs */}
      <div className="meal-tabs">
        {MEAL_TABS.map(t=><button key={t.key} className={`meal-tab${activeTab===t.key?' active':''}`} onClick={()=>setActiveTab(t.key)}>{t.label}</button>)}
      </div>

      <div className="food-logger-layout">
        {/* Category Panel */}
        <div className="category-panel">
          {CATEGORIES.map(c=><button key={c} className={`cat-btn${activeCategory===c?' active':''}`} onClick={()=>setActiveCategory(c)}>{c}</button>)}
        </div>

        {/* Food Grid */}
        <div>
          <div className="food-grid">
            {filtered.map(f=>(
              <div key={f.id} className="food-card" onClick={()=>setSelectedFood(f)}>
                <div className="food-name">{f.name}</div>
                <div className="food-qty-type">{f.quantity_type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Macro Panel */}
        <div>
          <div className="macro-bar">
            <h4>📊 {MEAL_TABS.find(t=>t.key===activeTab)?.label} Totals</h4>
            {[
              {label:'Calories', val:slotTotals.calories, unit:'kcal', cls:'cal', max:MAX_CAL},
              {label:'Protein', val:slotTotals.protein_g, unit:'g', cls:'pro', max:150},
              {label:'Carbs', val:slotTotals.carbs_g, unit:'g', cls:'car', max:300},
              {label:'Fat', val:slotTotals.fat_g, unit:'g', cls:'fat', max:100},
            ].map(m=>(
              <div key={m.label} className="macro-row">
                <div className="macro-label"><span>{m.label}</span><span>{m.val}{m.unit}</span></div>
                <div className="macro-track"><div className="macro-fill" style={{width:`${Math.min(100,(m.val/m.max)*100)}%`}} /></div>
              </div>
            ))}

            {/* Logged items */}
            <div className="logged-list">
              {slotItems.map(item=>(
                <div key={item.id} className="logged-item">
                  <div className="logged-item-info">
                    <div className="logged-item-name">{item.food_name}</div>
                    <div className="logged-item-detail">{item.quantity_value} · {item.calories} kcal</div>
                  </div>
                  <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--danger)',fontSize:16}} onClick={()=>handleRemove(item.id)}>✕</button>
                </div>
              ))}
              {slotItems.length===0&&<div className="text-muted" style={{textAlign:'center',paddingTop:12}}>No food logged for this meal yet</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Summary Bar */}
      <div className="daily-summary">
        {[['🔥','Calories',daily.calories,'kcal'],['🥩','Protein',daily.protein_g,'g'],['🌾','Carbs',daily.carbs_g,'g'],['🧈','Fat',daily.fat_g,'g']].map(([icon,lbl,val,unit])=>(
          <div key={lbl} className="summary-item">
            <div className="summary-value">{icon} {val}{unit}</div>
            <div className="summary-label">Daily {lbl}</div>
          </div>
        ))}
      </div>

      {selectedFood && <QuantityModal food={selectedFood} onConfirm={handleAddFood} onClose={()=>setSelectedFood(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
