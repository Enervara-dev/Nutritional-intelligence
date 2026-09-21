import { useState, useEffect } from 'react';
import {
  getFoods, logFood, getTodayFoodLog, deleteFoodLog,
  getWorkouts, logWorkout, getTodayWorkout, deleteWorkoutLog,
  createProfile, getProfile
} from '../api/api';

// ── Constant Definitions ───────────────────────────────────
const MEAL_TABS = [
  { key: 'breakfast', label: '🌅 Breakfast' },
  { key: 'lunch',     label: '☀️ Lunch' },
  { key: 'dinner',    label: '🌙 Dinner' },
  { key: 'snacks',    label: '🍎 Snacks' },
  { key: 'other',     label: '➕ Other' },
];

const CATEGORIES = [
  'All', 'South Indian', 'Staples', 'Protein', 'Dairy',
  'Drinks', 'Nuts', 'Fats', 'Sweeteners', 'Fruits', 'Vegetables', 'Mains', 'Snacks'
];

const CONDITIONS = [
  'Type 2 Diabetes', 'Hypertension', 'High Cholesterol', 'GERD', 'Celiac Disease',
  'Lactose Intolerance', 'Gout', 'Hypothyroidism', 'Chronic Kidney Disease (CKD)', 'PCOS', 'Fatty Liver'
];

const ALLERGY_OPTIONS = ['Nuts', 'Dairy (Lactose)', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Peanuts', 'Fish'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const GOALS = [
  { value: 'lose_weight', icon: '🔥', title: 'Lose Weight', desc: 'Reduce body fat with calorie deficit' },
  { value: 'gain_weight', icon: '💪', title: 'Gain Weight', desc: 'Build mass with calorie-dense whole foods' },
  { value: 'maintain', icon: '⚖️', title: 'Maintain Weight', desc: 'Keep current weight and balance energy' },
  { value: 'manage_condition', icon: '🏥', title: 'Manage Condition', desc: 'Focus on managing medical conditions' },
];

const PRESET_DURATIONS = [15, 30, 45, 60];

// ── Helper Functions ───────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const d = new Date(dob);
  let age = today.getFullYear() - d.getFullYear();
  if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
  return age;
}

function calcBMI(wt, ht) {
  if (!wt || !ht) return null;
  const numWt = parseFloat(wt);
  const numHt = parseFloat(ht);
  if (!numWt || !numHt) return null;
  return (numWt / ((numHt / 100) ** 2)).toFixed(1);
}

function bmiCategory(bmi) {
  if (!bmi) return '';
  const val = parseFloat(bmi);
  if (val < 18.5) return 'Underweight';
  if (val < 25) return 'Normal weight';
  if (val < 30) return 'Overweight';
  return 'Obese';
}

function Toggle({ options, value, onChange }) {
  return (
    <div className="toggle-group">
      {options.map(o => (
        <button
          key={o.value}
          className={`toggle-btn${value === o.value ? ' selected' : ''}`}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Quantity Modal Component (Top-level to preserve focus/state) ──
function FoodQuantityModal({ food, onConfirm, onClose }) {
  const [count, setCount] = useState(1);
  const [size, setSize] = useState('medium');
  const [spoon, setSpoon] = useState('1_tsp');

  const qt = food.quantity_type;

  function handleConfirm() {
    let val;
    if (['count', 'piece', 'slice'].includes(qt)) val = String(count);
    else if (qt === 'spoon') val = spoon;
    else if (qt === 'glass') val = '1';
    else val = size;
    onConfirm(val);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Add {food.name}</h3>
        <p className="text-muted" style={{ marginBottom: 16 }}>
          Category: <strong>{food.category}</strong> · Unit: <strong>{qt}</strong>
        </p>

        {['count', 'piece', 'slice'].includes(qt) && (
          <div>
            <p className="text-muted" style={{ marginBottom: 12 }}>Select Quantity:</p>
            <div className="stepper">
              <button className="stepper-btn" onClick={() => setCount(c => Math.max(1, c - 1))} type="button">−</button>
              <span className="stepper-val">{count}</span>
              <button className="stepper-btn" onClick={() => setCount(c => c + 1)} type="button">+</button>
            </div>
          </div>
        )}

        {['bowl', 'cup', 'plate', 'handful'].includes(qt) && (
          <div>
            <p className="text-muted" style={{ marginBottom: 12 }}>Select Portion Size:</p>
            <div className="size-picker">
              {['small', 'medium', 'large'].map(s => (
                <button
                  key={s}
                  className={`size-btn${size === s ? ' selected' : ''}`}
                  onClick={() => setSize(s)}
                  type="button"
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  {food.size_grams?.[s] ? ` (${food.size_grams[s]}g)` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {qt === 'glass' && (
          <div style={{ textAlign: 'center', padding: '16px', background: '#eef2ff', borderRadius: 10 }}>
            <span style={{ fontSize: 24 }}>🥛</span>
            <p style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>Standard Glass (250 ml)</p>
          </div>
        )}

        {qt === 'spoon' && (
          <div>
            <p className="text-muted" style={{ marginBottom: 12 }}>Select Spoon Size:</p>
            <div className="size-picker">
              <button className={`size-btn${spoon === '1_tsp' ? ' selected' : ''}`} onClick={() => setSpoon('1_tsp')} type="button">
                1 tsp (5 ml)
              </button>
              <button className={`size-btn${spoon === '1_tbsp' ? ' selected' : ''}`} onClick={() => setSpoon('1_tbsp')} type="button">
                1 tbsp (15 ml)
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirm} type="button">Add to Meal</button>
        </div>
      </div>
    </div>
  );
}

// ── Workout Drawer / Modal Component ───────────────────────
function WorkoutModal({ workout, userWeight, onConfirm, onClose }) {
  const [duration, setDuration] = useState(30);
  const [reps, setReps] = useState(20);

  const previewBurn = () => {
    if (!workout) return 0;
    const wt = parseFloat(userWeight) || 70;
    if (workout.input_type === 'duration') {
      return Math.round((workout.met_value || 5) * wt * (duration / 60));
    }
    return Math.round((workout.calories_per_rep || 0.4) * reps);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 380 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 36, textAlign: 'center' }}>{workout.icon}</div>
        <h3 style={{ textAlign: 'center', margin: '6px 0 2px' }}>{workout.name}</h3>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: 20 }}>{workout.category}</p>

        {workout.input_type === 'duration' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label>Duration</label>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{duration} mins</span>
            </div>
            <div className="slider-row">
              <input
                type="range"
                className="slider"
                min="5"
                max="120"
                step="5"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value))}
              />
              <span className="slider-value">{duration}m</span>
            </div>
            <div className="toggle-group mt12">
              {PRESET_DURATIONS.map(p => (
                <button
                  key={p}
                  className={`toggle-btn${duration === p ? ' selected' : ''}`}
                  onClick={() => setDuration(p)}
                  type="button"
                >
                  {p}m
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', textAlign: 'center', marginBottom: 8 }}>Repetitions Count</label>
            <div className="stepper">
              <button className="stepper-btn" onClick={() => setReps(r => Math.max(1, r - 5))} type="button">−</button>
              <span className="stepper-val">{reps}</span>
              <button className="stepper-btn" onClick={() => setReps(r => r + 5)} type="button">+</button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: 12, background: '#f0f4ff', borderRadius: 10, margin: '20px 0' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Estimated Calorie Burn</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary)' }}>🔥 ~{previewBurn()} kcal</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Calculated using weight ({userWeight || 70} kg)</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose} type="button">Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => onConfirm(workout.input_type === 'duration' ? duration : reps)}
            type="button"
          >
            Log Workout
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN UNIFIED DASHBOARD COMPONENT ───────────────────────
export default function Dashboard({ initialSection = 'all' }) {
  // Navigation filter / mode: 'all', 'food', 'workout', 'profile'
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    if (initialSection) setActiveSection(initialSection);
  }, [initialSection]);

  // User profile state
  const [userId, setUserId] = useState(() => localStorage.getItem('enervara_user_id') || 1);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState('');

  // Top level search & tag states (prevent inner remount focus loss)
  const [condSearch, setCondSearch] = useState('');
  const [medInput, setMedInput] = useState('');

  const [profileForm, setProfileForm] = useState({
    name: 'Mahesh',
    dob: '1995-06-15',
    sex: 'Male',
    height_cm: '175',
    weight_kg: '72',
    state: 'Karnataka',
    city: 'Bengaluru',
    diet_type: 'vegetarian',
    exercise_habit: 'yes',
    alcohol: 'no',
    smoking: 'no',
    sleep_hours: 7.5,
    water_cups: 8,
    conditions: ['mild_acidity'],
    allergies: [],
    medications: [],
    surgeries: [],
    mood: 8,
    stress: 4,
    energy: 8,
    work_pressure: 5,
    relaxation: 'daily',
    health_goal: 'maintain',
  });

  // Food logger state
  const [foods, setFoods] = useState([]);
  const [activeMealTab, setActiveMealTab] = useState('breakfast');
  const [activeCategory, setActiveCategory] = useState('All');
  const [foodSearch, setFoodSearch] = useState('');
  const [foodLogData, setFoodLogData] = useState({
    slots: { breakfast: [], lunch: [], dinner: [], snacks: [], other: [] },
    slot_totals: {},
    daily_totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  });
  const [selectedFoodForModal, setSelectedFoodForModal] = useState(null);

  // Workout logger state
  const [workouts, setWorkouts] = useState([]);
  const [loggedWorkouts, setLoggedWorkouts] = useState([]);
  const [totalBurned, setTotalBurned] = useState(0);
  const [selectedWorkoutForModal, setSelectedWorkoutForModal] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const setField = (k, v) => setProfileForm(f => ({ ...f, [k]: v }));

  const bmi = calcBMI(profileForm.weight_kg, profileForm.height_cm);
  const age = calcAge(profileForm.dob);

  // ── Initial Data Loading ─────────────────────────────────
  useEffect(() => {
    fetchFoodsList();
    fetchWorkoutsList();
    if (userId) {
      fetchFoodLogs(userId);
      fetchWorkoutLogs(userId);
      fetchUserProfile(userId);
    }
  }, [userId]);

  async function fetchFoodsList() {
    try {
      const res = await getFoods();
      setFoods(res.data || []);
    } catch (e) {
      console.error('Error fetching foods:', e);
    }
  }

  async function fetchWorkoutsList() {
    try {
      const res = await getWorkouts();
      setWorkouts(res.data || []);
    } catch (e) {
      console.error('Error fetching workouts:', e);
    }
  }

  async function fetchFoodLogs(uid) {
    try {
      const res = await getTodayFoodLog(uid);
      setFoodLogData(res.data || {
        slots: { breakfast: [], lunch: [], dinner: [], snacks: [], other: [] },
        slot_totals: {},
        daily_totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      });
    } catch (e) {
      console.error('Error fetching food logs:', e);
    }
  }

  async function fetchWorkoutLogs(uid) {
    try {
      const res = await getTodayWorkout(uid);
      setLoggedWorkouts(res.data?.workouts || []);
      setTotalBurned(res.data?.total_calories_burned || 0);
    } catch (e) {
      console.error('Error fetching workout logs:', e);
    }
  }

  async function fetchUserProfile(uid) {
    try {
      const res = await getProfile(uid);
      if (res.data) {
        setProfileForm(prev => ({
          ...prev,
          name: res.data.name || prev.name,
          dob: res.data.dob || prev.dob,
          sex: res.data.sex || prev.sex,
          height_cm: res.data.height_cm ? String(res.data.height_cm) : prev.height_cm,
          weight_kg: res.data.weight_kg ? String(res.data.weight_kg) : prev.weight_kg,
          state: res.data.state || prev.state,
          city: res.data.city || prev.city,
          diet_type: res.data.diet_type || prev.diet_type,
          exercise_habit: res.data.exercise_habit || prev.exercise_habit,
          alcohol: res.data.alcohol || prev.alcohol,
          smoking: res.data.smoking || prev.smoking,
          sleep_hours: res.data.sleep_hours ?? prev.sleep_hours,
          water_cups: res.data.water_cups ?? prev.water_cups,
          conditions: res.data.conditions || prev.conditions,
          allergies: res.data.allergies || prev.allergies,
          medications: res.data.medications || prev.medications,
          surgeries: res.data.surgeries || prev.surgeries,
          mood: res.data.mood ?? prev.mood,
          stress: res.data.stress ?? prev.stress,
          energy: res.data.energy ?? prev.energy,
          work_pressure: res.data.work_pressure ?? prev.work_pressure,
          relaxation: res.data.relaxation || prev.relaxation,
          health_goal: res.data.health_goal || prev.health_goal,
        }));
      }
    } catch (e) {
      // If profile not found for uid, continue with defaults
    }
  }

  // ── Food Handlers ────────────────────────────────────────
  async function handleAddFood(qtyValue) {
    if (!selectedFoodForModal) return;
    try {
      await logFood({
        user_id: parseInt(userId) || 1,
        food_id: selectedFoodForModal.id,
        meal_type: activeMealTab,
        quantity_type: selectedFoodForModal.quantity_type,
        quantity_value: qtyValue
      });
      await fetchFoodLogs(userId);
      showToast(`✅ ${selectedFoodForModal.name} added to ${activeMealTab}!`);
    } catch (e) {
      showToast('❌ Failed to log food: ' + (e.response?.data?.detail || e.message));
    } finally {
      setSelectedFoodForModal(null);
    }
  }

  async function handleDeleteFood(logId) {
    try {
      await deleteFoodLog(logId);
      await fetchFoodLogs(userId);
      showToast('🗑️ Food item removed');
    } catch (e) {
      showToast('❌ Failed to delete food item');
    }
  }

  // ── Workout Handlers ─────────────────────────────────────
  async function handleAddWorkout(inputValue) {
    if (!selectedWorkoutForModal) return;
    try {
      await logWorkout({
        user_id: parseInt(userId) || 1,
        workout_id: selectedWorkoutForModal.id,
        input_type: selectedWorkoutForModal.input_type,
        input_value: parseFloat(inputValue)
      });
      await fetchWorkoutLogs(userId);
      showToast(`✅ ${selectedWorkoutForModal.name} logged!`);
    } catch (e) {
      showToast('❌ Failed to log workout: ' + (e.response?.data?.detail || e.message));
    } finally {
      setSelectedWorkoutForModal(null);
    }
  }

  async function handleDeleteWorkout(logId) {
    try {
      await deleteWorkoutLog(logId);
      await fetchWorkoutLogs(userId);
      showToast('🗑️ Workout removed');
    } catch (e) {
      showToast('❌ Failed to remove workout');
    }
  }

  // ── Profile Handlers ─────────────────────────────────────
  async function handleSaveProfile(e) {
    if (e) e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        ...profileForm,
        height_cm: profileForm.height_cm ? parseFloat(profileForm.height_cm) : null,
        weight_kg: profileForm.weight_kg ? parseFloat(profileForm.weight_kg) : null,
        water_cups: profileForm.water_cups ? parseInt(profileForm.water_cups) : 0,
      };
      const res = await createProfile(payload);
      const newId = res.data.id;
      localStorage.setItem('enervara_user_id', newId);
      setUserId(newId);
      showToast(`✅ Profile saved! User ID: ${newId}`);
      await fetchFoodLogs(newId);
      await fetchWorkoutLogs(newId);
    } catch (err) {
      showToast('❌ Error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingProfile(false);
    }
  }

  // Filtering food catalog
  const filteredFoods = foods.filter(f => {
    const matchCat = activeCategory === 'All' || f.category === activeCategory;
    const matchSearch = !foodSearch || f.name.toLowerCase().includes(foodSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const slotItems = foodLogData.slots?.[activeMealTab] || [];
  const slotTotals = foodLogData.slot_totals?.[activeMealTab] || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const dailyFood = foodLogData.daily_totals || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

  const loggedWorkoutIds = new Set(loggedWorkouts.map(w => w.workout_id));
  const netCalories = Math.round((dailyFood.calories || 0) - (totalBurned || 0));

  // Medical tag handlers
  const filteredConditions = CONDITIONS.filter(c =>
    c.toLowerCase().includes(condSearch.toLowerCase())
  );
  const toggleCondition = (c) => {
    setField('conditions', profileForm.conditions.includes(c)
      ? profileForm.conditions.filter(x => x !== c)
      : [...profileForm.conditions, c]
    );
  };
  const addMed = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && medInput.trim()) {
      e.preventDefault();
      if (!profileForm.medications.includes(medInput.trim())) {
        setField('medications', [...profileForm.medications, medInput.trim()]);
      }
      setMedInput('');
    }
  };
  const removeMed = (m) => setField('medications', profileForm.medications.filter(x => x !== m));
  const addAllergy = () => setField('allergies', [...profileForm.allergies, { name: 'Nuts', severity: 'moderate' }]);
  const removeAllergy = (idx) => setField('allergies', profileForm.allergies.filter((_, i) => i !== idx));
  const updateAllergy = (idx, field, val) => {
    const list = [...profileForm.allergies];
    list[idx] = { ...list[idx], [field]: val };
    setField('allergies', list);
  };
  const addSurgery = () => setField('surgeries', [...profileForm.surgeries, { type: '', year: '', hospital: '', recovery_status: 'fully_recovered' }]);
  const removeSurgery = (idx) => setField('surgeries', profileForm.surgeries.filter((_, i) => i !== idx));
  const updateSurgery = (idx, field, val) => {
    const list = [...profileForm.surgeries];
    list[idx] = { ...list[idx], [field]: val };
    setField('surgeries', list);
  };

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── TOP SECTION: APP TITLE & MODE SELECTOR ────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16, borderBottom: '1px solid var(--border)', paddingBottom: 16
      }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
            ENERVARA Intelligence Dashboard
          </h1>
          <p className="text-muted" style={{ marginTop: 4, fontSize: 13 }}>
            Nutrition, Workout & Physiological Tracking in One Unified Platform
          </p>
        </div>

        {/* View mode buttons: Show All (Unified) / Filter to specific */}
        <div style={{ display: 'flex', gap: 6, background: '#eef2ff', padding: 4, borderRadius: 10 }}>
          {[
            { key: 'all', label: '📌 All in One' },
            { key: 'food', label: '🥗 Food Logger' },
            { key: 'workout', label: '🏃 Workout Logger' },
            { key: 'profile', label: '👤 Profile' },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => setActiveSection(m.key)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none',
                background: activeSection === m.key ? 'white' : 'transparent',
                color: activeSection === m.key ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                boxShadow: activeSection === m.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ENERGY & METABOLIC SNAPSHOT ────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2444 0%, #1a4a8a 55%, #2563eb 100%)',
        color: 'white', borderRadius: 16, padding: '24px 28px',
        boxShadow: '0 8px 30px rgba(15, 36, 68, 0.2)',
        display: 'flex', flexDirection: 'column', gap: 18
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, opacity: 0.8, fontWeight: 700 }}>
              Daily Metabolic Summary
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '2px 0 0' }}>
              Today's Net Energy Balance
            </h2>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600
          }}>
            👤 User #{userId || 1} · Goal: {GOALS.find(g => g.value === profileForm.health_goal)?.title || 'Maintain'}
          </div>
        </div>

        {/* Triple metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>🍏 Calories Consumed</div>
            <div style={{ fontSize: 26, fontWeight: 800, margin: '4px 0' }}>
              {dailyFood.calories || 0} <span style={{ fontSize: 14, fontWeight: 500 }}>kcal</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>From logged food & drinks</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>🔥 Calories Burned</div>
            <div style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: '#fca5a5' }}>
              {totalBurned || 0} <span style={{ fontSize: 14, fontWeight: 500 }}>kcal</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>From active workout sessions</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>⚡ Net Energy Balance</div>
            <div style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: netCalories > 0 ? '#86efac' : '#93c5fd' }}>
              {netCalories > 0 ? `+${netCalories}` : netCalories} <span style={{ fontSize: 14, fontWeight: 500 }}>kcal</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Consumed minus burned</div>
          </div>
        </div>

        {/* Macro quick badges */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14 }}>
          <span style={{ fontSize: 12, opacity: 0.9 }}><strong>Macronutrients:</strong></span>
          <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 12 }}>
            🥩 Protein: <strong>{dailyFood.protein_g || 0}g</strong>
          </span>
          <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 12 }}>
            🌾 Carbs: <strong>{dailyFood.carbs_g || 0}g</strong>
          </span>
          <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 12 }}>
            🧈 Fat: <strong>{dailyFood.fat_g || 0}g</strong>
          </span>
        </div>
      </div>

      {/* ── SECTION: FOOD LOGGER ───────────────────────────── */}
      {(activeSection === 'all' || activeSection === 'food') && (
        <section className="card" id="food-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                🥗 Food & Nutrition Logger
              </h2>
              <p className="text-muted" style={{ margin: '2px 0 0' }}>
                Select a meal slot, choose from whole foods & recipes, and monitor real-time macros.
              </p>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
              Logged Today: {dailyFood.calories || 0} kcal
            </div>
          </div>

          {/* Meal Slot Tabs */}
          <div className="meal-tabs">
            {MEAL_TABS.map(t => {
              const count = (foodLogData.slots?.[t.key] || []).length;
              return (
                <button
                  key={t.key}
                  className={`meal-tab${activeMealTab === t.key ? ' active' : ''}`}
                  onClick={() => setActiveMealTab(t.key)}
                  type="button"
                >
                  {t.label} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>

          {/* Food Search & Category Filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search food (e.g. Oats, Dal, Banana, Milk)..."
              value={foodSearch}
              onChange={e => setFoodSearch(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, maxWidth: '100%' }}>
              {CATEGORIES.slice(0, 8).map(c => (
                <button
                  key={c}
                  className={`cat-btn${activeCategory === c ? ' active' : ''}`}
                  onClick={() => setActiveCategory(c)}
                  style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: 12 }}
                  type="button"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Main 3-column Layout */}
          <div className="food-logger-layout">
            {/* Column 1: Full Categories */}
            <div className="category-panel">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                Categories
              </span>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`cat-btn${activeCategory === c ? ' active' : ''}`}
                  onClick={() => setActiveCategory(c)}
                  type="button"
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Column 2: Food Grid */}
            <div>
              <div className="food-grid">
                {filteredFoods.map(f => (
                  <div
                    key={f.id}
                    className="food-card"
                    onClick={() => setSelectedFoodForModal(f)}
                  >
                    <div className="food-name">{f.name}</div>
                    <div className="food-qty-type">{f.quantity_type}</div>
                  </div>
                ))}
              </div>
              {filteredFoods.length === 0 && (
                <p className="text-muted" style={{ textAlign: 'center', padding: 30 }}>
                  No foods match the search or category filter.
                </p>
              )}
            </div>

            {/* Column 3: Slot Macro Bar & Logged Items */}
            <div>
              <div className="macro-bar">
                <h4>📊 {MEAL_TABS.find(t => t.key === activeMealTab)?.label} Breakdown</h4>
                {[
                  { label: 'Calories', val: slotTotals.calories, unit: 'kcal', cls: 'cal', max: 1200 },
                  { label: 'Protein',  val: slotTotals.protein_g, unit: 'g',    cls: 'pro', max: 60 },
                  { label: 'Carbs',    val: slotTotals.carbs_g,   unit: 'g',    cls: 'car', max: 150 },
                  { label: 'Fat',      val: slotTotals.fat_g,     unit: 'g',    cls: 'fat', max: 50 },
                ].map(m => (
                  <div key={m.label} className="macro-row">
                    <div className="macro-label">
                      <span>{m.label}</span>
                      <span>{m.val} {m.unit}</span>
                    </div>
                    <div className="macro-track">
                      <div className={`macro-fill ${m.cls}`} style={{ width: `${Math.min(100, (m.val / m.max) * 100)}%` }} />
                    </div>
                  </div>
                ))}

                {/* Logged items list for this meal */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 8 }}>
                    Items in this meal ({slotItems.length}):
                  </div>
                  <div className="logged-list">
                    {slotItems.map(item => (
                      <div key={item.id} className="logged-item">
                        <div className="logged-item-info">
                          <div className="logged-item-name">{item.food_name}</div>
                          <div className="logged-item-detail">
                            {item.quantity_value} · {item.calories} kcal ({item.protein_g}g P)
                          </div>
                        </div>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16 }}
                          onClick={() => handleDeleteFood(item.id)}
                          title="Remove item"
                          type="button"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {slotItems.length === 0 && (
                      <div className="text-muted" style={{ textAlign: 'center', padding: '14px 0', fontSize: 12 }}>
                        No items logged for {activeMealTab} yet. Click any food on the left to add!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION: WORKOUT LOGGER ────────────────────────── */}
      {(activeSection === 'all' || activeSection === 'workout') && (
        <section className="card" id="workout-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                🏃 Workout & Exercise Tracker
              </h2>
              <p className="text-muted" style={{ margin: '2px 0 0' }}>
                Log your cardio, resistance, and sports workouts. Caloric burn calibrated to your body weight.
              </p>
            </div>
            <div className="burn-bar" style={{ marginTop: 0, padding: '10px 18px', borderRadius: 12 }}>
              <div>
                <div className="burn-label" style={{ fontSize: 11 }}>Today's Total Burn</div>
                <div className="burn-total" style={{ fontSize: 20 }}>🔥 {totalBurned} kcal</div>
              </div>
            </div>
          </div>

          {/* Workout Cards Grid */}
          <div className="workout-grid">
            {workouts.map(wk => (
              <div
                key={wk.id}
                className={`workout-card${loggedWorkoutIds.has(wk.id) ? ' logged' : ''}`}
                onClick={() => setSelectedWorkoutForModal(wk)}
              >
                <div className="wk-icon">{wk.icon}</div>
                <div className="wk-name">{wk.name}</div>
                <div className="wk-cat">{wk.category}</div>
                {loggedWorkoutIds.has(wk.id) && (
                  <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, marginTop: 6 }}>
                    ✓ Logged
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Today's Logged Workouts List */}
          {loggedWorkouts.length > 0 && (
            <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 12 }}>
                Today's Completed Workouts ({loggedWorkouts.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                {loggedWorkouts.map(l => (
                  <div key={l.id} className="logged-item" style={{ padding: '12px 14px' }}>
                    <div className="logged-item-info">
                      <div className="logged-item-name" style={{ fontSize: 13 }}>{l.workout_name}</div>
                      <div className="logged-item-detail">
                        {l.input_type === 'duration' ? `${l.input_value} minutes` : `${l.input_value} reps`} · <strong style={{ color: '#ef4444' }}>🔥 {l.calories_burned} kcal</strong>
                      </div>
                    </div>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16 }}
                      onClick={() => handleDeleteWorkout(l.id)}
                      title="Remove workout"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── SECTION: PROFILE SETTINGS ──────────────────────── */}
      {(activeSection === 'all' || activeSection === 'profile') && (
        <section className="card" id="profile-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                👤 Profile & Physiological Calibration
              </h2>
              <p className="text-muted" style={{ margin: '2px 0 0' }}>
                Your biological baseline drives all calorie burn formulas and nutritional recommendations.
              </p>
            </div>
            {userId && (
              <span style={{ fontSize: 12, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: 20 }}>
                Active Profile ID: #{userId}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* 1. Basic Info */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 12 }}>
                1. Basic Demographics
              </h3>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="e.g. Alex Smith"
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={profileForm.dob}
                    onChange={e => setField('dob', e.target.value)}
                  />
                  {age !== null && (
                    <span className="text-muted mt8" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      Age: {age} years
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Sex</label>
                  <Toggle
                    options={[
                      { label: 'Male', value: 'Male' },
                      { label: 'Female', value: 'Female' },
                      { label: 'Other', value: 'Other' }
                    ]}
                    value={profileForm.sex}
                    onChange={v => setField('sex', v)}
                  />
                </div>

                <div className="form-group">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    step="any"
                    value={profileForm.height_cm}
                    onChange={e => setField('height_cm', e.target.value)}
                    placeholder="e.g. 175"
                  />
                </div>

                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    step="any"
                    value={profileForm.weight_kg}
                    onChange={e => setField('weight_kg', e.target.value)}
                    placeholder="e.g. 72"
                  />
                </div>

                {bmi && (
                  <div className="form-group full">
                    <div className="bmi-badge">
                      <span className="bmi-value">{bmi}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
                          Calculated BMI
                        </div>
                        <div className="bmi-label" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          Status: {bmiCategory(bmi)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>State</label>
                  <select value={profileForm.state} onChange={e => setField('state', e.target.value)}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={e => setField('city', e.target.value)}
                    placeholder="e.g. Bengaluru"
                  />
                </div>
              </div>
            </div>

            {/* 2. Lifestyle */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 12 }}>
                2. Lifestyle Habits
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Diet Preference</label>
                  <select value={profileForm.diet_type} onChange={e => setField('diet_type', e.target.value)}>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="eggetarian">Eggetarian</option>
                    <option value="non_veg">Non-Vegetarian</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Exercise Habit</label>
                  <Toggle
                    options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }, { label: 'Sometimes', value: 'sometimes' }]}
                    value={profileForm.exercise_habit}
                    onChange={v => setField('exercise_habit', v)}
                  />
                </div>

                <div className="form-group">
                  <label>Alcohol</label>
                  <Toggle
                    options={[{ label: 'Never', value: 'no' }, { label: 'Sometimes', value: 'sometimes' }, { label: 'Regular', value: 'yes' }]}
                    value={profileForm.alcohol}
                    onChange={v => setField('alcohol', v)}
                  />
                </div>

                <div className="form-group">
                  <label>Smoking</label>
                  <Toggle
                    options={[{ label: 'Never', value: 'no' }, { label: 'Sometimes', value: 'sometimes' }, { label: 'Regular', value: 'yes' }]}
                    value={profileForm.smoking}
                    onChange={v => setField('smoking', v)}
                  />
                </div>

                <div className="form-group full">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label>Daily Sleep Hours</label>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{profileForm.sleep_hours} hrs</span>
                  </div>
                  <div className="slider-row">
                    <input
                      type="range"
                      className="slider"
                      min="0"
                      max="12"
                      step="0.5"
                      value={profileForm.sleep_hours}
                      onChange={e => setField('sleep_hours', parseFloat(e.target.value))}
                    />
                    <span className="slider-value">{profileForm.sleep_hours}h</span>
                  </div>
                </div>

                <div className="form-group full">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label>Water Intake</label>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {profileForm.water_cups} cups (~{profileForm.water_cups * 250} ml)
                    </span>
                  </div>
                  <div className="slider-row">
                    <input
                      type="range"
                      className="slider"
                      min="0"
                      max="20"
                      step="1"
                      value={profileForm.water_cups}
                      onChange={e => setField('water_cups', parseInt(e.target.value))}
                    />
                    <span className="slider-value">{profileForm.water_cups} cups</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Health & Medical */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 12 }}>
                3. Health & Medical Conditions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label>Medical Conditions</label>
                  <input
                    type="text"
                    placeholder="Search condition (e.g. Diabetes, Hypertension)..."
                    value={condSearch}
                    onChange={e => setCondSearch(e.target.value)}
                  />
                  <div className="condition-dropdown mt8">
                    {filteredConditions.map(c => (
                      <div
                        key={c}
                        className={`condition-option${profileForm.conditions.includes(c) ? ' selected' : ''}`}
                        onClick={() => toggleCondition(c)}
                      >
                        <span>{profileForm.conditions.includes(c) ? '✓' : '○'}</span> {c}
                      </div>
                    ))}
                  </div>
                  {profileForm.conditions.length > 0 && (
                    <div className="tag-input-wrap mt8">
                      {profileForm.conditions.map(c => (
                        <span key={c} className="tag">
                          {c} <span className="remove" onClick={() => toggleCondition(c)}>×</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Allergies */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label>Food Allergies</label>
                    <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }} onClick={addAllergy} type="button">
                      + Add Allergy
                    </button>
                  </div>
                  {profileForm.allergies.map((a, i) => (
                    <div key={i} className="allergy-item mt8" style={{ background: '#f8faff', padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <select value={a.name} onChange={e => updateAllergy(i, 'name', e.target.value)} style={{ flex: 1 }}>
                        {ALLERGY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <select value={a.severity} onChange={e => updateAllergy(i, 'severity', e.target.value)} style={{ flex: 1 }}>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => removeAllergy(i)} type="button">✕</button>
                    </div>
                  ))}
                </div>

                {/* Medications */}
                <div className="form-group">
                  <label>Current Medications <span className="text-muted">(Press Enter to add)</span></label>
                  <div className="tag-input-wrap">
                    {profileForm.medications.map(m => (
                      <span key={m} className="tag">
                        {m} <span className="remove" onClick={() => removeMed(m)}>×</span>
                      </span>
                    ))}
                    <input
                      className="tag-input"
                      value={medInput}
                      onChange={e => setMedInput(e.target.value)}
                      onKeyDown={addMed}
                      placeholder="Type medication and press Enter..."
                    />
                  </div>
                </div>

                {/* Surgeries */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label>Past Surgeries</label>
                    <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }} onClick={addSurgery} type="button">
                      + Add Surgery
                    </button>
                  </div>
                  {profileForm.surgeries.map((s, i) => (
                    <div key={i} className="surgery-block mt8">
                      <div className="form-group"><label style={{ fontSize: 11 }}>Type</label><input value={s.type} onChange={e => updateSurgery(i, 'type', e.target.value)} placeholder="e.g. Appendectomy" /></div>
                      <div className="form-group"><label style={{ fontSize: 11 }}>Year</label><input type="number" value={s.year} onChange={e => updateSurgery(i, 'year', e.target.value)} placeholder="2022" /></div>
                      <div className="form-group"><label style={{ fontSize: 11 }}>Hospital</label><input value={s.hospital} onChange={e => updateSurgery(i, 'hospital', e.target.value)} placeholder="Hospital name" /></div>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Recovery</label>
                        <select value={s.recovery_status} onChange={e => updateSurgery(i, 'recovery_status', e.target.value)}>
                          <option value="fully_recovered">Fully Recovered</option>
                          <option value="recovering">Recovering</option>
                        </select>
                      </div>
                      <div style={{ gridColumn: '1/-1', textAlign: 'right' }}>
                        <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => removeSurgery(i)} type="button">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Mental Wellbeing */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 12 }}>
                4. Mental Wellbeing
              </h3>
              <div className="form-grid">
                {[
                  ['mood', 'Mood Score', ['😞', '😄']],
                  ['stress', 'Stress Level', ['😌', '😰']],
                  ['energy', 'Energy Level', ['🥱', '⚡']],
                  ['work_pressure', 'Work Pressure', ['😎', '🤯']]
                ].map(([key, lbl, [lo, hi]]) => (
                  <div key={key} className="form-group full">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label>{lbl}</label>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{profileForm[key]} / 10</span>
                    </div>
                    <div className="slider-row">
                      <span style={{ fontSize: 14 }}>{lo}</span>
                      <input
                        type="range"
                        className="slider"
                        min="1"
                        max="10"
                        value={profileForm[key]}
                        onChange={e => setField(key, parseInt(e.target.value))}
                      />
                      <span style={{ fontSize: 14 }}>{hi}</span>
                      <span className="slider-value">{profileForm[key]}</span>
                    </div>
                  </div>
                ))}

                <div className="form-group full">
                  <label>Relaxation Practices</label>
                  <Toggle
                    options={[{ label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }, { label: 'Occasionally', value: 'occasionally' }, { label: 'Never', value: 'never' }]}
                    value={profileForm.relaxation}
                    onChange={v => setField('relaxation', v)}
                  />
                </div>
              </div>
            </div>

            {/* 5. Goal */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 12 }}>
                5. Primary Health Goal
              </h3>
              <div className="goal-cards">
                {GOALS.map(g => (
                  <div
                    key={g.value}
                    className={`goal-card${profileForm.health_goal === g.value ? ' selected' : ''}`}
                    onClick={() => setField('health_goal', g.value)}
                  >
                    <div className="goal-icon">{g.icon}</div>
                    <div className="goal-title">{g.title}</div>
                    <div className="goal-desc">{g.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Profile button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
              <button
                className="btn btn-primary"
                style={{ padding: '12px 32px', fontSize: 15 }}
                type="submit"
                disabled={savingProfile}
              >
                {savingProfile ? 'Saving Profile...' : '💾 Save Profile Baseline'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Modals for Food Quantity and Workout Duration/Reps */}
      {selectedFoodForModal && (
        <FoodQuantityModal
          food={selectedFoodForModal}
          onConfirm={handleAddFood}
          onClose={() => setSelectedFoodForModal(null)}
        />
      )}

      {selectedWorkoutForModal && (
        <WorkoutModal
          workout={selectedWorkoutForModal}
          userWeight={profileForm.weight_kg}
          onConfirm={handleAddWorkout}
          onClose={() => setSelectedWorkoutForModal(null)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
