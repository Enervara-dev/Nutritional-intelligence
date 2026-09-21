import { useState } from 'react';
import { createProfile } from '../api/api';

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
  { value: 'lose_weight', icon: '🔥', title: 'Lose Weight', desc: 'Reduce body fat with calorie control' },
  { value: 'gain_weight', icon: '💪', title: 'Gain Weight', desc: 'Build mass with calorie-dense whole foods' },
  { value: 'maintain', icon: '⚖️', title: 'Maintain Weight', desc: 'Keep current weight and stay balanced' },
  { value: 'manage_condition', icon: '🏥', title: 'Manage Condition', desc: 'Focus on managing medical conditions' },
];

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

export default function ProfileSetup() {
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(localStorage.getItem('enervara_user_id') || null);
  const [toast, setToast] = useState('');

  // Search & input helper states at top level to avoid hook issues and focus loss
  const [condSearch, setCondSearch] = useState('');
  const [medInput, setMedInput] = useState('');

  // All form fields in one unified state
  const [form, setForm] = useState({
    name: '',
    dob: '',
    sex: 'Male',
    height_cm: '',
    weight_kg: '',
    state: '',
    city: '',
    diet_type: 'vegetarian',
    exercise_habit: 'sometimes',
    alcohol: 'no',
    smoking: 'no',
    sleep_hours: 7.5,
    water_cups: 8,
    conditions: [],
    allergies: [],
    medications: [],
    surgeries: [],
    mood: 7,
    stress: 4,
    energy: 7,
    work_pressure: 5,
    relaxation: 'daily',
    health_goal: 'maintain',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const bmi = calcBMI(form.weight_kg, form.height_cm);
  const age = calcAge(form.dob);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  // Medical conditions handlers
  const filteredConditions = CONDITIONS.filter(c =>
    c.toLowerCase().includes(condSearch.toLowerCase())
  );

  const toggleCondition = (c) => {
    set('conditions', form.conditions.includes(c)
      ? form.conditions.filter(x => x !== c)
      : [...form.conditions, c]
    );
  };

  // Medications handlers
  const addMed = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && medInput.trim()) {
      e.preventDefault();
      if (!form.medications.includes(medInput.trim())) {
        set('medications', [...form.medications, medInput.trim()]);
      }
      setMedInput('');
    }
  };

  const removeMed = (m) => set('medications', form.medications.filter(x => x !== m));

  // Allergies handlers
  const addAllergy = () => set('allergies', [...form.allergies, { name: 'Nuts', severity: 'moderate' }]);
  const removeAllergy = (idx) => set('allergies', form.allergies.filter((_, i) => i !== idx));
  const updateAllergy = (idx, field, val) => {
    const list = [...form.allergies];
    list[idx] = { ...list[idx], [field]: val };
    set('allergies', list);
  };

  // Surgery handlers
  const addSurgery = () => set('surgeries', [...form.surgeries, { type: '', year: '', hospital: '', recovery_status: 'fully_recovered' }]);
  const removeSurgery = (idx) => set('surgeries', form.surgeries.filter((_, i) => i !== idx));
  const updateSurgery = (idx, field, val) => {
    const list = [...form.surgeries];
    list[idx] = { ...list[idx], [field]: val };
    set('surgeries', list);
  };

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        water_cups: form.water_cups ? parseInt(form.water_cups) : 0,
      };
      const res = await createProfile(payload);
      const newId = res.data.id;
      localStorage.setItem('enervara_user_id', newId);
      setSavedId(newId);
      showToast(`✅ Profile saved! User ID: ${newId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showToast('❌ Error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title" style={{ fontSize: 26 }}>Comprehensive Profile Setup</h1>
        <p className="page-subtitle" style={{ marginBottom: 12 }}>
          Fill out all sections below in one place to calibrate ENERVARA’s nutrition intelligence.
        </p>

        {/* Quick Nav Anchors */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {[
            { label: '1. Basic Info', id: '#sec-basic' },
            { label: '2. Lifestyle', id: '#sec-lifestyle' },
            { label: '3. Health & Medical', id: '#sec-health' },
            { label: '4. Mental Wellbeing', id: '#sec-wellbeing' },
            { label: '5. Primary Goal', id: '#sec-goal' },
          ].map(a => (
            <a
              key={a.id}
              href={a.id}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--primary)',
                background: '#eef2ff',
                padding: '6px 14px',
                borderRadius: 20,
                textDecoration: 'none',
                border: '1px solid var(--border)',
                transition: 'all 0.2s'
              }}
            >
              {a.label}
            </a>
          ))}
        </div>
      </div>

      {savedId && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>
              ✅ Profile Active (User ID: <strong>{savedId}</strong>)
            </div>
            <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>
              Your food and workout logs are automatically connected to this profile.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/food" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 12, background: 'white' }}>
              Go to Food Logger →
            </a>
            <a href="/workout" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
              Go to Workout Logger →
            </a>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* SECTION 1: BASIC INFO */}
        <section id="sec-basic" className="card" style={{ scrollMarginTop: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <span style={{
              background: 'var(--primary)', color: 'white', width: 26, height: 26,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700
            }}>1</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
              Basic Information
            </h2>
          </div>

          <div className="form-grid">
            <div className="form-group full">
              <label>Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Alex Smith"
              />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={e => set('dob', e.target.value)}
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
                value={form.sex}
                onChange={v => set('sex', v)}
              />
            </div>

            <div className="form-group">
              <label>Height (cm)</label>
              <input
                type="number"
                step="any"
                value={form.height_cm}
                onChange={e => set('height_cm', e.target.value)}
                placeholder="e.g. 175"
              />
            </div>

            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                step="any"
                value={form.weight_kg}
                onChange={e => set('weight_kg', e.target.value)}
                placeholder="e.g. 70"
              />
            </div>

            {bmi && (
              <div className="form-group full">
                <div className="bmi-badge" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="bmi-value" style={{ fontSize: 24 }}>{bmi}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
                      Body Mass Index (BMI)
                    </div>
                    <div className="bmi-label" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      Category: {bmiCategory(bmi)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>State</label>
              <select value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="e.g. Bengaluru"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: LIFESTYLE */}
        <section id="sec-lifestyle" className="card" style={{ scrollMarginTop: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <span style={{
              background: 'var(--primary)', color: 'white', width: 26, height: 26,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700
            }}>2</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
              Lifestyle & Daily Habits
            </h2>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Diet Type</label>
              <select value={form.diet_type} onChange={e => set('diet_type', e.target.value)}>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="non_veg">Non-Vegetarian</option>
              </select>
            </div>

            <div className="form-group">
              <label>Regular Exercise Habit</label>
              <Toggle
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                  { label: 'Sometimes', value: 'sometimes' }
                ]}
                value={form.exercise_habit}
                onChange={v => set('exercise_habit', v)}
              />
            </div>

            <div className="form-group">
              <label>Alcohol Consumption</label>
              <Toggle
                options={[
                  { label: 'Never', value: 'no' },
                  { label: 'Sometimes', value: 'sometimes' },
                  { label: 'Regular', value: 'yes' }
                ]}
                value={form.alcohol}
                onChange={v => set('alcohol', v)}
              />
            </div>

            <div className="form-group">
              <label>Smoking</label>
              <Toggle
                options={[
                  { label: 'Never', value: 'no' },
                  { label: 'Sometimes', value: 'sometimes' },
                  { label: 'Regular', value: 'yes' }
                ]}
                value={form.smoking}
                onChange={v => set('smoking', v)}
              />
            </div>

            <div className="form-group full">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label>Daily Sleep Hours</label>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{form.sleep_hours} hrs</span>
              </div>
              <div className="slider-row">
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>0h</span>
                <input
                  type="range"
                  className="slider"
                  min="0"
                  max="12"
                  step="0.5"
                  value={form.sleep_hours}
                  onChange={e => set('sleep_hours', parseFloat(e.target.value))}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>12h</span>
              </div>
            </div>

            <div className="form-group full">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label>Daily Water Intake</label>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {form.water_cups} cups (~{form.water_cups * 250} ml)
                </span>
              </div>
              <div className="slider-row">
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>0 cups</span>
                <input
                  type="range"
                  className="slider"
                  min="0"
                  max="20"
                  step="1"
                  value={form.water_cups}
                  onChange={e => set('water_cups', parseInt(e.target.value))}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>20 cups</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: HEALTH & MEDICAL */}
        <section id="sec-health" className="card" style={{ scrollMarginTop: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <span style={{
              background: 'var(--primary)', color: 'white', width: 26, height: 26,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700
            }}>3</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
              Health & Medical History
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Conditions */}
            <div className="form-group">
              <label>Medical Conditions (Click to select or search)</label>
              <input
                type="text"
                placeholder="Search conditions (e.g. Diabetes, Hypertension)..."
                value={condSearch}
                onChange={e => setCondSearch(e.target.value)}
              />
              <div className="condition-dropdown mt8">
                {filteredConditions.map(c => (
                  <div
                    key={c}
                    className={`condition-option${form.conditions.includes(c) ? ' selected' : ''}`}
                    onClick={() => toggleCondition(c)}
                  >
                    <span>{form.conditions.includes(c) ? '✓' : '○'}</span>
                    {c}
                  </div>
                ))}
              </div>
              {form.conditions.length > 0 && (
                <div className="tag-input-wrap mt8" style={{ cursor: 'default' }}>
                  {form.conditions.map(c => (
                    <span key={c} className="tag">
                      {c}
                      <span className="remove" onClick={() => toggleCondition(c)}>×</span>
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

              {form.allergies.length === 0 ? (
                <p className="text-muted">No allergies added yet. Click "+ Add Allergy" if you have any.</p>
              ) : (
                form.allergies.map((a, i) => (
                  <div key={i} className="allergy-item mt8" style={{ background: '#f8faff', padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <select value={a.name} onChange={e => updateAllergy(i, 'name', e.target.value)} style={{ flex: 1 }}>
                      {ALLERGY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <select value={a.severity} onChange={e => updateAllergy(i, 'severity', e.target.value)} style={{ flex: 1 }}>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => removeAllergy(i)} type="button">
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Medications */}
            <div className="form-group">
              <label>
                Current Medications <span className="text-muted">(Type name and press Enter or comma)</span>
              </label>
              <div className="tag-input-wrap">
                {form.medications.map(m => (
                  <span key={m} className="tag">
                    {m}
                    <span className="remove" onClick={() => removeMed(m)}>×</span>
                  </span>
                ))}
                <input
                  className="tag-input"
                  value={medInput}
                  onChange={e => setMedInput(e.target.value)}
                  onKeyDown={addMed}
                  placeholder="e.g. Metformin, Thyroxine..."
                />
              </div>
            </div>

            {/* Surgeries */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label>Past Surgeries / Procedures</label>
                <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }} onClick={addSurgery} type="button">
                  + Add Surgery
                </button>
              </div>

              {form.surgeries.length === 0 ? (
                <p className="text-muted">No surgeries recorded.</p>
              ) : (
                form.surgeries.map((s, i) => (
                  <div key={i} className="surgery-block mt8">
                    <div className="form-group">
                      <label style={{ fontSize: 11 }}>Surgery / Procedure</label>
                      <input
                        type="text"
                        value={s.type}
                        onChange={e => updateSurgery(i, 'type', e.target.value)}
                        placeholder="e.g. Appendectomy"
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 11 }}>Year</label>
                      <input
                        type="number"
                        value={s.year}
                        onChange={e => updateSurgery(i, 'year', e.target.value)}
                        placeholder="e.g. 2022"
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 11 }}>Hospital / Clinic</label>
                      <input
                        type="text"
                        value={s.hospital}
                        onChange={e => updateSurgery(i, 'hospital', e.target.value)}
                        placeholder="Hospital name"
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 11 }}>Recovery Status</label>
                      <select value={s.recovery_status} onChange={e => updateSurgery(i, 'recovery_status', e.target.value)}>
                        <option value="fully_recovered">Fully Recovered</option>
                        <option value="recovering">Currently Recovering</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                      <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => removeSurgery(i)} type="button">
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* SECTION 4: MENTAL WELLBEING */}
        <section id="sec-wellbeing" className="card" style={{ scrollMarginTop: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <span style={{
              background: 'var(--primary)', color: 'white', width: 26, height: 26,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700
            }}>4</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
              Mental Wellbeing & Energy
            </h2>
          </div>

          <div className="form-grid">
            {[
              ['mood', 'Overall Mood Score', ['😞 Low', '😄 Great']],
              ['stress', 'Stress Level', ['😌 Low', '😰 High']],
              ['energy', 'Daily Energy Level', ['🥱 Fatigued', '⚡ High Energy']],
              ['work_pressure', 'Work / Academic Pressure', ['😎 Manageable', '🤯 Intense']]
            ].map(([key, lbl, [lo, hi]]) => (
              <div key={key} className="form-group full">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label>{lbl}</label>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {form[key]} / 10
                  </span>
                </div>
                <div className="slider-row">
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lo}</span>
                  <input
                    type="range"
                    className="slider"
                    min="1"
                    max="10"
                    step="1"
                    value={form[key]}
                    onChange={e => set(key, parseInt(e.target.value))}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hi}</span>
                  <span className="slider-value">{form[key]}</span>
                </div>
              </div>
            ))}

            <div className="form-group full">
              <label>Relaxation / Mindfulness Practices</label>
              <Toggle
                options={[
                  { label: 'Daily', value: 'daily' },
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Occasionally', value: 'occasionally' },
                  { label: 'Never', value: 'never' }
                ]}
                value={form.relaxation}
                onChange={v => set('relaxation', v)}
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: GOAL */}
        <section id="sec-goal" className="card" style={{ scrollMarginTop: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <span style={{
              background: 'var(--primary)', color: 'white', width: 26, height: 26,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700
            }}>5</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
              Primary Health Goal
            </h2>
          </div>

          <p className="text-muted" style={{ marginBottom: 16 }}>
            Select your main goal. ENERVARA calibrates caloric targets and macronutrient ratios to support this goal.
          </p>

          <div className="goal-cards">
            {GOALS.map(g => (
              <div
                key={g.value}
                className={`goal-card${form.health_goal === g.value ? ' selected' : ''}`}
                onClick={() => set('health_goal', g.value)}
              >
                <div className="goal-icon">{g.icon}</div>
                <div className="goal-title">{g.title}</div>
                <div className="goal-desc">{g.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SUBMIT BUTTON BAR */}
        <div style={{
          position: 'sticky',
          bottom: 20,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1.5px solid var(--border)',
          borderRadius: 16,
          padding: '16px 24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          zIndex: 50
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-dark)' }}>
              Ready to save your profile?
            </div>
            <div className="text-muted">
              {savedId ? `Updating profile for User ID: ${savedId}` : 'All 5 sections will be saved together'}
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ padding: '12px 32px', fontSize: 15 }}
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving Profile...' : '💾 Save Profile'}
          </button>
        </div>

      </form>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
