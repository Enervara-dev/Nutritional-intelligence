import { useState, useEffect } from 'react';
import {
  getFoods, logFood, getTodayFoodLog, deleteFoodLog,
  getWorkouts, logWorkout, getTodayWorkout, deleteWorkoutLog,
  createProfile, getProfile,
  computeAssessment, getLatestAssessment, getAssessmentHistory,
  getPatientsList
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

  // User profile & Aurora patient state
  const [userId, setUserId] = useState(() => localStorage.getItem('enervara_user_id') || '');
  const [patients, setPatients] = useState([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [showPrescriptionsModal, setShowPrescriptionsModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState('');

  // Top level search & tag states (prevent inner remount focus loss)
  const [condSearch, setCondSearch] = useState('');
  const [medInput, setMedInput] = useState('');

  const [profileForm, setProfileForm] = useState({
    name: 'Patient',
    email: '',
    dob: '',
    sex: 'Male',
    height_cm: '',
    weight_kg: '',
    state: '',
    city: '',
    diet_type: 'non_veg',
    exercise_habit: 'sometimes',
    alcohol: 'no',
    smoking: 'no',
    sleep_hours: 7.5,
    water_cups: 8,
    conditions: [],
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

  const [emailInput, setEmailInput] = useState('');
  const [emailLookupLoading, setEmailLookupLoading] = useState(false);

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

  // Clinical assessment state
  const [assessmentData, setAssessmentData] = useState(null);
  const [evaluatingAssessment, setEvaluatingAssessment] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  async function handleLookupEmail(targetEmail) {
    const emailToSearch = (targetEmail || emailInput).trim();
    if (!emailToSearch) {
      showToast('⚠️ Please enter an email address');
      return;
    }
    setEmailLookupLoading(true);
    try {
      const res = await getProfile(emailToSearch);
      if (res.data) {
        const patientId = res.data.id;
        setUserId(patientId);
        localStorage.setItem('enervara_user_id', patientId);
        setEmailInput(res.data.email || emailToSearch);
        await fetchUserProfile(patientId);
        await fetchFoodLogs(patientId);
        await fetchWorkoutLogs(patientId);
        await fetchAssessment(patientId);
        await fetchAssessmentHistory(patientId);
        showToast(`✅ Loaded patient: ${res.data.name} (${res.data.email || emailToSearch})`);
      }
    } catch (err) {
      showToast(`❌ ${err.response?.data?.detail || 'No patient record found for this email'}`);
    } finally {
      setEmailLookupLoading(false);
    }
  }

  const setField = (k, v) => setProfileForm(f => ({ ...f, [k]: v }));

  const bmi = calcBMI(profileForm.weight_kg, profileForm.height_cm);
  const age = calcAge(profileForm.dob);

  // ── Initial Data Loading ─────────────────────────────────
  useEffect(() => {
    fetchPatientsList();
    fetchFoodsList();
    fetchWorkoutsList();
  }, []);

  async function fetchPatientsList() {
    try {
      const res = await getPatientsList();
      if (res.data && res.data.length > 0) {
        setPatients(res.data);
        const stored = localStorage.getItem('enervara_user_id');
        const match = res.data.find(p => p.id === stored || p.email === stored);
        const defaultId = match ? match.id : res.data[0].id;
        setUserId(defaultId);
        localStorage.setItem('enervara_user_id', defaultId);
        if (match && match.email) {
          setEmailInput(match.email);
        } else if (res.data[0].email) {
          setEmailInput(res.data[0].email);
        }
      }
    } catch (e) {
      console.error('Error fetching patients list from DB:', e);
    }
  }

  useEffect(() => {
    if (userId) {
      fetchFoodLogs(userId);
      fetchWorkoutLogs(userId);
      fetchUserProfile(userId);
      fetchAssessment(userId);
      fetchAssessmentHistory(userId);
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
        if (res.data.email) {
          setEmailInput(res.data.email);
        }
        if (res.data.prescriptions) {
          setPatientPrescriptions(res.data.prescriptions);
        }
        setProfileForm(prev => ({
          ...prev,
          name: res.data.name || prev.name,
          email: res.data.email || prev.email,
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
      console.error('Error fetching profile from Aurora DB:', e);
    }
  }

  async function fetchAssessment(uid) {
    try {
      const res = await getLatestAssessment(uid);
      setAssessmentData(res.data);
      if (res.data?.assessment_id) {
        setSelectedHistoryId(res.data.assessment_id);
      }
    } catch (e) {
      console.error('Error fetching assessment:', e);
    }
  }

  async function fetchAssessmentHistory(uid) {
    try {
      const activeId = uid || userId;
      const res = await getAssessmentHistory(activeId);
      setAssessmentHistory(res.data || []);
    } catch (e) {
      console.error('Error fetching assessment history:', e);
    }
  }

  async function handleRunAssessment(targetUid) {
    setEvaluatingAssessment(true);
    try {
      const activeId = targetUid || userId;
      const allCurrentFoods = foodLogData.slots ? Object.values(foodLogData.slots).flat() : [];
      const payload = {
        user_id: activeId,
        profile_override: {
          ...profileForm,
          height_cm: profileForm.height_cm ? parseFloat(profileForm.height_cm) : null,
          weight_kg: profileForm.weight_kg ? parseFloat(profileForm.weight_kg) : null,
          water_cups: profileForm.water_cups ? parseInt(profileForm.water_cups) : 0,
        },
        foods: allCurrentFoods,
        workouts: loggedWorkouts
      };
      const res = await computeAssessment(payload);
      setAssessmentData(res.data);
      if (res.data?.assessment_id) {
        setSelectedHistoryId(res.data.assessment_id);
      }
      await fetchAssessmentHistory(activeId);
      showToast('AI Clinical Guidance updated based on patient baseline + intake');
    } catch (e) {
      showToast('Assessment error: ' + (e.response?.data?.detail || e.message));
    } finally {
      setEvaluatingAssessment(false);
    }
  }

  // ── Food Handlers ────────────────────────────────────────
  async function handleAddFood(qtyValue) {
    if (!selectedFoodForModal) return;
    try {
      await logFood({
        user_id: userId,
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
        user_id: userId,
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
      showToast('Profile saved! Running AI Metabolic Analysis...');
      await fetchFoodLogs(newId);
      await fetchWorkoutLogs(newId);
      await handleRunAssessment(newId);
      setTimeout(() => {
        document.getElementById('ai-clinical-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
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
            { key: 'profile', label: '📋 DB Patient Record' },
            { key: 'rules', label: '🧠 AI Clinical Guidance' },
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

      {/* ── CLINICAL DATABASE & PATIENT EMAIL LOOKUP BAR ──────────── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1.5px solid #cbd5e1',
        padding: '16px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        {/* Status Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: 20,
              padding: '4px 11px',
              fontSize: 12,
              fontWeight: 700
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Aurora RDS DB Connected (Read-Only)
            </div>

            <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
              👤 Active Patient: <span style={{ color: 'var(--primary-dark)', fontWeight: 800 }}>{profileForm.name || 'Loading...'}</span>
              {profileForm.email && (
                <span style={{ color: '#2563eb', fontWeight: 600, marginLeft: 6 }}>
                  ({profileForm.email})
                </span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {patientPrescriptions.length > 0 && (
              <button
                onClick={() => setShowPrescriptionsModal(true)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid #c7d2fe',
                  background: '#e0e7ff',
                  color: '#3730a3',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                📋 View Clinical Rx ({patientPrescriptions.length})
              </button>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
              {profileForm.conditions.length} Conditions · {profileForm.medications.length} Meds
            </span>
          </div>
        </div>

        {/* Email Entry & Quick Select Row */}
        <div style={{
          background: '#f8fafc',
          padding: '12px 16px',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
              ✉️ Enter User Email:
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookupEmail();
              }}
              style={{ display: 'flex', gap: 8, flex: 1, minWidth: 280 }}
            >
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter email (e.g. srivathsaksherasagar2006@gmail.com, kkrishnarajr@gmail.com)"
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 13,
                  background: '#ffffff',
                  color: '#0f172a'
                }}
              />
              <button
                type="submit"
                disabled={emailLookupLoading}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: 13, whiteSpace: 'nowrap', fontWeight: 700 }}
              >
                {emailLookupLoading ? 'Loading...' : '🔍 Load Patient'}
              </button>
            </form>
          </div>

          {/* Quick Select Buttons for Registered Users in DB */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', borderTop: '1px dashed #e2e8f0', paddingTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Quick Load Users:
            </span>
            {[
              { email: 'srivathsaksherasagar2006@gmail.com', name: 'SRIVATHSA' },
              { email: 'kkrishnarajr@gmail.com', name: 'Krishna K' },
              { email: 'akselcruses@gmail.com', name: 'Aksel Cruses' },
              { email: 'admin@enervara.com', name: 'Admin' }
            ].map(u => (
              <button
                key={u.email}
                type="button"
                onClick={() => {
                  setEmailInput(u.email);
                  handleLookupEmail(u.email);
                }}
                style={{
                  background: (emailInput.toLowerCase() === u.email.toLowerCase() || (profileForm.email && profileForm.email.toLowerCase() === u.email.toLowerCase())) ? '#2563eb' : '#e2e8f0',
                  color: (emailInput.toLowerCase() === u.email.toLowerCase() || (profileForm.email && profileForm.email.toLowerCase() === u.email.toLowerCase())) ? '#ffffff' : '#1e293b',
                  border: 'none',
                  borderRadius: 14,
                  padding: '4px 11px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                👤 {u.name} <span style={{ opacity: 0.75, fontWeight: 400 }}>({u.email})</span>
              </button>
            ))}
          </div>
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
            👤 {profileForm.name || 'Patient'} · Goal: {GOALS.find(g => g.value === profileForm.health_goal)?.title || 'Maintain'}
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





      {/* ── SECTION: PATIENT CLINICAL DOSSIER (READ-ONLY FROM DB) ── */}
      {(activeSection === 'all' || activeSection === 'profile') && (
        <section className="card" id="profile-section" style={{ border: '1.5px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                  📋 Patient Medical Baseline (Fetched from Database)
                </h2>
                <span style={{ fontSize: 11, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontWeight: 700, padding: '3px 9px', borderRadius: 12 }}>
                  Aurora PostgreSQL 17
                </span>
              </div>
              <p className="text-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                Verified biological stats, doctor prescriptions, and medications fetched directly from your database.
              </p>
            </div>
            {userId && (
              <span style={{ fontSize: 12, fontWeight: 700, background: '#e0e7ff', color: '#3730a3', padding: '6px 14px', borderRadius: 20 }}>
                Patient ID: {userId}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 1. Demographics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14
            }}>
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>PATIENT NAME</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {profileForm.name || 'Unnamed Patient'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Sex: <strong>{profileForm.sex || 'Not specified'}</strong> · Blood: <strong>{profileForm.blood_group || 'N/A'}</strong>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>AGE & BIRTH DATE</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {age !== null ? `${age} years` : 'Age N/A'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  DOB: {profileForm.dob ? profileForm.dob : 'Not specified'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>BODY STATS & BMI</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {profileForm.height_cm || '--'} cm / {profileForm.weight_kg || '--'} kg
                </div>
                <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, marginTop: 2 }}>
                  BMI: {bmi || '--'} {bmi ? `(${bmiCategory(bmi)})` : ''}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>LOCATION</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {profileForm.city || 'City N/A'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  State: {profileForm.state || 'N/A'}
                </div>
              </div>
            </div>

            {/* 2. Medical Conditions */}
            <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🏥 Extracted Medical Conditions ({profileForm.conditions.length})
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>From Doctor Diagnoses & Records</span>
              </div>
              {profileForm.conditions.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profileForm.conditions.map(c => (
                    <span
                      key={c}
                      style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                        padding: '5px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      ⚠️ {c.toUpperCase()}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontStyle: 'italic' }}>
                  No chronic conditions flagged in records.
                </p>
              )}
            </div>

            {/* 3. Doctor Prescriptions retrieved from DB */}
            <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🩺 Doctor Prescriptions in DB ({patientPrescriptions.length})
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aurora RDS `prescriptions` Table</span>
              </div>

              {patientPrescriptions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {patientPrescriptions.map((rx, idx) => (
                    <div
                      key={rx.id || idx}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '12px 16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <strong style={{ fontSize: 14, color: '#1e293b' }}>
                            {rx.doctor ? `Dr. ${rx.doctor}` : 'Doctor not recorded'}
                          </strong>
                          {rx.clinic && (
                            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                              at {rx.clinic}
                            </span>
                          )}
                        </div>
                        {rx.date && (
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                            📅 {rx.date}
                          </span>
                        )}
                      </div>

                      {(rx.indication || rx.notes) && (
                        <div style={{ marginTop: 6, fontSize: 13, color: '#334155', background: '#f1f5f9', padding: '6px 10px', borderRadius: 6 }}>
                          <strong>Indication / Diagnosis:</strong> {rx.indication || rx.notes}
                        </div>
                      )}

                      {rx.medications && rx.medications.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                            Medications Prescribed:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                            {rx.medications.map((m, mIdx) => (
                              <span
                                key={mIdx}
                                style={{
                                  background: '#e0e7ff',
                                  color: '#3730a3',
                                  border: '1px solid #c7d2fe',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600
                                }}
                              >
                                💊 {m.name} {m.dosage ? `(${m.dosage})` : ''} {m.timing ? `· ${m.timing}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontStyle: 'italic' }}>
                  No uploaded doctor prescriptions for this patient in the database.
                </p>
              )}
            </div>

            {/* 4. Active Medications Table / Summary */}
            <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  💊 Active Medications ({profileForm.medications.length})
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Retrieved from DB</span>
              </div>

              {profileForm.medications.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profileForm.medications.map((m, i) => (
                    <span
                      key={i}
                      style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      ✓ {m}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontStyle: 'italic' }}>
                  No active medications currently listed.
                </p>
              )}
            </div>

            {/* 5. Database Status & Integrity Note */}
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#64748b'
            }}>
              <span>🔒 <strong>Mode:</strong> Strict Read-Only Fetch</span>
              <span><strong>Source:</strong> AWS Aurora PostgreSQL 17</span>
              <span><strong>Writes / Inserts:</strong> 0 (Disabled)</span>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION: AI CLINICAL GUIDANCE & METABOLIC DIRECTIVES ───── */}
      {(activeSection === 'all' || activeSection === 'rules') && (
        <section className="card" id="ai-clinical-section" style={{ border: '1.5px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                  AI Clinical Guidance
                </h2>
                <span style={{ fontSize: 11, background: '#ede9fe', color: '#6d28d9', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  Gemini AI
                </span>
              </div>
              <p className="text-muted" style={{ margin: '3px 0 0', fontSize: 13 }}>
                Metabolic analysis of your conditions and logged intake.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="btn btn-outline"
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderColor: showHistory ? 'var(--primary)' : '#cbd5e1',
                  background: showHistory ? '#eff6ff' : 'white',
                  color: showHistory ? 'var(--primary)' : 'var(--text)'
                }}
                onClick={() => setShowHistory(prev => !prev)}
                type="button"
              >
                {showHistory ? 'Hide History' : `History (${assessmentHistory.length})`}
              </button>
              <button
                className="btn btn-outline"
                style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600 }}
                onClick={() => handleRunAssessment()}
                disabled={evaluatingAssessment}
                type="button"
              >
                {evaluatingAssessment ? 'Analyzing...' : 'Refresh AI'}
              </button>
            </div>
          </div>

          {/* Collapsible Assessment History Drawer */}
          {showHistory && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '16px',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--primary-dark)' }}>
                    Past Assessment & Plan History
                  </h3>
                  <span style={{ fontSize: 11, background: '#e2e8f0', color: '#475569', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
                    {assessmentHistory.length} saved
                  </span>
                </div>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}
                  onClick={() => setShowHistory(false)}
                  type="button"
                >
                  Close
                </button>
              </div>

              {assessmentHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No previous assessments saved yet. Click "Save Profile Baseline" or "Refresh AI" to generate your first plan.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
                  {assessmentHistory.map((item, idx) => {
                    const isSelected = selectedHistoryId === item.assessment_id || (!selectedHistoryId && idx === 0);
                    const formattedDate = item.assessed_at
                      ? new Date(item.assessed_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : `Assessment #${item.assessment_id}`;

                    return (
                      <div
                        key={item.assessment_id}
                        style={{
                          background: isSelected ? '#ffffff' : '#f8fafc',
                          border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '12px 14px',
                          boxShadow: isSelected ? '0 2px 6px rgba(59,130,246,0.1)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                              {formattedDate}
                            </span>
                            {idx === 0 && (
                              <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                                LATEST
                              </span>
                            )}
                          </div>
                          <button
                            className="btn btn-outline"
                            style={{
                              padding: '3px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                              borderColor: isSelected ? '#3b82f6' : '#cbd5e1',
                              color: isSelected ? '#2563eb' : '#475569',
                              background: isSelected ? '#eff6ff' : 'white'
                            }}
                            onClick={() => {
                              setSelectedHistoryId(item.assessment_id);
                              setAssessmentData(item);
                            }}
                            type="button"
                          >
                            {isSelected ? 'Viewing This Plan' : 'Load This Plan'}
                          </button>
                        </div>

                        {item.ai_report && (
                          <div style={{
                            fontSize: 12,
                            color: '#475569',
                            margin: '8px 0 6px',
                            lineHeight: 1.4,
                            whiteSpace: 'pre-wrap',
                            maxHeight: isSelected ? 'none' : '44px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.ai_report}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!assessmentData && (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)' }}>
              <p style={{ margin: '0 auto 12px', fontSize: 13 }}>
                Click <strong>"Save Profile Baseline"</strong> above to generate your short AI clinical summary.
              </p>
              <button
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: 13 }}
                onClick={() => handleRunAssessment()}
                disabled={evaluatingAssessment}
                type="button"
              >
                {evaluatingAssessment ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
            </div>
          )}

          {assessmentData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* 1. Clinical Status Banner */}
              {assessmentData.guidance && (
                <div style={{
                  background: assessmentData.guidance.is_good ? '#f0fdf4' : '#fef2f2',
                  border: `1.5px solid ${assessmentData.guidance.is_good ? '#86efac' : '#fecaca'}`,
                  borderRadius: 12,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{assessmentData.guidance.is_good ? '🟢' : '🔴'}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: assessmentData.guidance.is_good ? '#166534' : '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {assessmentData.guidance.is_good ? 'Clinically Beneficial Intake' : 'Metabolic / Condition Contraindication Detected'}
                      </div>
                      <div style={{ fontSize: 12.5, color: assessmentData.guidance.is_good ? '#15803d' : '#b91c1c', marginTop: 2 }}>
                        Evaluated against {profileForm.name}'s medical baseline and doctor prescriptions
                      </div>
                    </div>
                  </div>
                  {profileForm.conditions.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {profileForm.conditions.map((c, i) => (
                        <span key={i} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#334155' }}>
                          🩺 {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Structured AI Clinical Synthesis */}
              {assessmentData.ai_report && (
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  {assessmentData.ai_report.split('\n').filter(line => line.trim()).map((line, idx) => {
                    const colonIdx = line.indexOf(':');
                    if (colonIdx !== -1 && colonIdx < 35) {
                      const label = line.substring(0, colonIdx).trim();
                      const val = line.substring(colonIdx + 1).trim();
                      const isAlert = label.toLowerCase().includes('pattern') || label.toLowerCase().includes('warning');
                      return (
                        <div key={idx} style={{
                          fontSize: 13.5,
                          lineHeight: 1.6,
                          padding: isAlert ? '8px 12px' : '0',
                          background: isAlert ? '#fffbeb' : 'transparent',
                          border: isAlert ? '1px solid #fde68a' : 'none',
                          borderRadius: isAlert ? 8 : 0
                        }}>
                          <strong style={{ color: isAlert ? '#b45309' : 'var(--primary-dark)', fontWeight: 700 }}>
                            {label}:{' '}
                          </strong>
                          <span style={{ color: isAlert ? '#92400e' : '#334155' }}>{val}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} style={{ fontSize: 13.5, lineHeight: 1.6, color: '#334155' }}>
                        {line}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. Clinical Directives & Lifestyle Guidance (Tips) */}
              {assessmentData.tips && assessmentData.tips.length > 0 && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary-dark)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    💡 Clinical Directives & Doctor Guidelines ({profileForm.name})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                    {assessmentData.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}


            </div>
          )}
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

      {/* Clinical Prescriptions Modal from Aurora DB */}
      {showPrescriptionsModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 700,
            maxHeight: '85vh', overflowY: 'auto', padding: '24px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 18
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--primary-dark)' }}>
                  📋 Retrieved Clinical Prescriptions ({patientPrescriptions.length})
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Fetched from Aurora PostgreSQL database for {profileForm.name}
                </p>
              </div>
              <button
                onClick={() => setShowPrescriptionsModal(false)}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: 8,
                  width: 32, height: 32, fontSize: 16, cursor: 'pointer', fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {patientPrescriptions.map((rx, idx) => (
                <div key={idx} style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px',
                  display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>
                      👨‍⚕️ {rx.doctor ? `Dr. ${rx.doctor}` : 'Attending Physician'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      🗓️ {rx.date || 'Undated'}
                    </div>
                  </div>

                  {rx.clinic && (
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      🏥 {rx.clinic}
                    </div>
                  )}

                  {rx.indication && (
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                      padding: '8px 12px', fontSize: 12.5, color: '#991b1b', lineHeight: 1.5
                    }}>
                      <strong>Clinical Indication & Diagnosis:</strong> {rx.indication}
                    </div>
                  )}

                  {rx.notes && (
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                      padding: '8px 12px', fontSize: 12.5, color: '#166534', lineHeight: 1.5
                    }}>
                      <strong>Doctor's Advice:</strong> {rx.notes}
                    </div>
                  )}

                  {rx.medications && rx.medications.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                        Prescribed Medications ({rx.medications.length}):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {rx.medications.map((m, mIdx) => (
                          <div key={mIdx} style={{
                            background: 'white', border: '1px solid #cbd5e1', borderRadius: 6,
                            padding: '6px 10px', fontSize: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6
                          }}>
                            <div>
                              <strong style={{ color: '#0f172a' }}>{m.name}</strong>
                              {m.generic_name && <span style={{ color: '#64748b', marginLeft: 6 }}>({m.generic_name})</span>}
                            </div>
                            <div style={{ color: '#0369a1', fontWeight: 600 }}>
                              {[m.dosage, m.frequency, m.timing, m.duration_text].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
