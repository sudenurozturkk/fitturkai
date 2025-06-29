'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserIcon, HeartIcon, BeakerIcon, FireIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
// import { UserProfile } from '@/models/User';
import { useRouter } from 'next/navigation';
// import Sidebar from '@/components/Sidebar'

const iconVariants = {
  initial: { rotate: 0, scale: 1 },
  animate: {
    rotate: [0, 10, -10, 0],
    scale: [1, 1.1, 1],
    transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
  },
};

// userId'yi localStorage'dan veya default olarak al
const getUserId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userEmail') || 'test@example.com';
  }
  return 'test@example.com';
};

export default function ProfilePage() {
  const router = useRouter();
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';
  const profileKey = `profile_${userEmail}`;
  const assistantMsgKey = `profileAssistantMsgShown_${userEmail}`;
  const [profile, setProfile] = useState<any>({
    userId: getUserId(),
    personalInfo: {
      name: '',
      age: 0,
      gender: undefined,
      height: 0,
      weight: 0,
      activityLevel: 'moderate',
    },
    healthInfo: {
      allergies: [],
      conditions: [],
      medications: [],
      bloodType: '',
    },
    preferences: {
      dietaryRestrictions: [],
      fitnessGoals: [],
      mealPreferences: [],
      workoutPreferences: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [newItem, setNewItem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [showAssistantMsg, setShowAssistantMsg] = useState(false);

  useEffect(() => {
    if (!userEmail) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [router, userEmail]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!userEmail) {
        router.push('/auth/login');
        return;
      }
      // Kullanıcıya özel profili yükle
      const stored = localStorage.getItem(profileKey);
      if (stored) {
        setProfile(JSON.parse(stored));
        setIsLoading(false);
      } else {
        // users.json'dan bulup kaydet
        import('../../data/users.json').then((mod) => {
          const users = mod.default;
          const user = users.find((u: any) => u.email === userEmail);
          if (user) {
            setProfile((prev: any) => ({
              ...prev,
              personalInfo: {
                ...prev.personalInfo,
                name: user.name,
                age: user.age,
                gender: user.gender,
              },
            }));
          }
          setIsLoading(false);
        });
      }
    }
  }, [router, userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    localStorage.setItem(profileKey, JSON.stringify(profile));
  }, [profile, userEmail, profileKey]);

  useEffect(() => {
    localStorage.setItem('profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    // Sadece ilk girişte göster
    if (typeof window !== 'undefined') {
      const shown = localStorage.getItem(assistantMsgKey);
      if (!shown) {
        setShowAssistantMsg(true);
      }
    }
  }, [assistantMsgKey]);

  useEffect(() => {
    if (showAssistantMsg) {
      const timer = setTimeout(() => {
        setShowAssistantMsg(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem(assistantMsgKey, 'true');
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showAssistantMsg, assistantMsgKey]);

  const handleCloseAssistantMsg = () => {
    setShowAssistantMsg(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(assistantMsgKey, 'true');
    }
  };

  const saveProfile = async (updatedProfile: any) => {
    if (!userEmail) {
      setError('Kullanıcı oturumu yok!');
      router.push('/auth/login');
      return;
    }
    try {
      setError(null);
      const profileToSave = { ...updatedProfile, userId: userEmail };
      console.log('Profil PUT için userId:', userEmail);
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileToSave),
      });
      if (!response.ok) {
        // Eğer profil yoksa, POST ile yeni kayıt oluşturmayı dene
        console.log('PUT başarısız, POST deneniyor...');
        const postRes = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileToSave),
        });
        if (!postRes.ok) throw new Error('Profil kaydedilemedi!');
        const postData = await postRes.json();
        console.log('API POST yanıtı:', postData);
        setProfile(postData);
        setIsEditing(false);
        fetchProfile();
        return;
      }
      const data = await response.json();
      console.log('API PUT yanıtı:', data);
      setProfile(data);
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    }
  };

  const fetchProfile = async () => {
    if (!userEmail) return;
    setIsLoading(true);
    try {
      console.log('Profil GET için userId:', userEmail);
      const response = await fetch(`/api/profile?userId=${userEmail}`);
      if (!response.ok) throw new Error('Profil alınamadı');
      const data = await response.json();
      console.log('API GET yanıtı:', data);
      if (data) setProfile(data);
    } catch {
      // Profil yoksa boş bırak
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (section: keyof any, field: string, value: any) => {
    setProfile((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleArrayChange = (
    section: keyof any,
    field: string,
    action: 'add' | 'remove',
    value: string
  ) => {
    setProfile((prev: any) => {
      const currentArray = prev[section][field as keyof (typeof prev)[typeof section]] as string[];
      const updatedArray =
        action === 'add' ? [...currentArray, value] : currentArray.filter((item) => item !== value);

      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: updatedArray,
        },
      };
    });
  };

  const calculateBMI = () => {
    const { height, weight } = profile.personalInfo;
    if (height && weight) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return '0';
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Zayıf';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Fazla Kilolu';
    return 'Obez';
  };

  const calculateBMR = () => {
    const { age, gender, height, weight } = profile.personalInfo;
    if (age && height && weight) {
      // Mifflin-St Jeor Denklemi
      let bmr = 10 * weight + 6.25 * height - 5 * age;
      bmr = gender === 'male' ? bmr + 5 : bmr - 161;
      return Math.round(bmr);
    }
    return 0;
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };
    return Math.round(
      bmr *
        activityMultipliers[profile.personalInfo.activityLevel as keyof typeof activityMultipliers]
    );
  };

  return (
    <div className="relative flex min-h-screen bg-neutral-light dark:bg-neutral-dark overflow-x-hidden">
      {/* Arka plan blob */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-fitness-blue opacity-20 rounded-full blur-3xl z-0"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 bg-fitness-green opacity-20 rounded-full blur-3xl z-0"
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
      />
      <main className="flex-1 p-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-fitness-blue via-fitness-green to-fitness-orange bg-clip-text text-transparent mb-2">
              Profil
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {profile.personalInfo.name
                ? `Hoş geldin, ${profile.personalInfo.name}!`
                : 'Kişisel bilgilerini ve tercihlerini yönet.'}
            </p>
          </motion.div>

          {/* Özet Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <motion.div
              whileHover={{ scale: 1.07, y: -8, boxShadow: '0 8px 32px 0 rgba(30,144,255,0.15)' }}
              className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-5 flex flex-col items-center text-center transition-transform cursor-pointer"
            >
              <motion.div
                variants={iconVariants}
                initial="initial"
                animate="animate"
                className="p-3 bg-fitness-blue/10 rounded-lg mb-2"
              >
                <UserIcon className="w-7 h-7 text-fitness-blue" />
              </motion.div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Vücut Kitle İndeksi
              </h3>
              <p className="text-2xl font-bold">{calculateBMI()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getBMICategory(parseFloat(calculateBMI()))}
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.07, y: -8, boxShadow: '0 8px 32px 0 rgba(50,205,50,0.15)' }}
              className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-5 flex flex-col items-center text-center transition-transform cursor-pointer"
            >
              <motion.div
                variants={iconVariants}
                initial="initial"
                animate="animate"
                className="p-3 bg-fitness-green/10 rounded-lg mb-2"
              >
                <HeartIcon className="w-7 h-7 text-fitness-green" />
              </motion.div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Bazal Metabolizma
              </h3>
              <p className="text-2xl font-bold">{calculateBMR()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">kcal/gün</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.07, y: -8, boxShadow: '0 8px 32px 0 rgba(255,140,0,0.15)' }}
              className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-5 flex flex-col items-center text-center transition-transform cursor-pointer"
            >
              <motion.div
                variants={iconVariants}
                initial="initial"
                animate="animate"
                className="p-3 bg-fitness-orange/10 rounded-lg mb-2"
              >
                <FireIcon className="w-7 h-7 text-fitness-orange" />
              </motion.div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Günlük Enerji İhtiyacı
              </h3>
              <p className="text-2xl font-bold">{calculateTDEE()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">kcal/gün</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.07, y: -8, boxShadow: '0 8px 32px 0 rgba(30,144,255,0.10)' }}
              className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-5 flex flex-col items-center text-center transition-transform cursor-pointer"
            >
              <motion.div
                variants={iconVariants}
                initial="initial"
                animate="animate"
                className="p-3 bg-fitness-blue/10 rounded-lg mb-2"
              >
                <BeakerIcon className="w-7 h-7 text-fitness-blue" />
              </motion.div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Aktivite Seviyesi
              </h3>
              <p className="text-2xl font-bold">
                {profile.personalInfo.activityLevel === 'sedentary' && 'Hareketsiz'}
                {profile.personalInfo.activityLevel === 'light' && 'Hafif Aktif'}
                {profile.personalInfo.activityLevel === 'moderate' && 'Orta Aktif'}
                {profile.personalInfo.activityLevel === 'active' && 'Aktif'}
                {profile.personalInfo.activityLevel === 'veryActive' && 'Çok Aktif'}
              </p>
            </motion.div>
          </div>

          {/* Profil Bilgileri Kartı */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-semibold">Profil Bilgileri</h2>
              <div className="relative flex items-center">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isEditing) {
                      saveProfile(profile);
                    }
                    setIsEditing(!isEditing);
                  }}
                  className="btn-primary px-6 py-2 rounded-md shadow font-semibold"
                >
                  {isEditing ? 'Kaydet' : 'Düzenle'}
                </motion.button>
                {showAssistantMsg && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 flex items-center z-40">
                    <div className="bg-white dark:bg-neutral-800 border border-fitness-blue dark:border-fitness-green shadow-md rounded-lg px-5 py-2 flex items-center gap-2 text-xs md:text-sm text-gray-700 dark:text-gray-200 animate-fade-in min-w-[260px] max-w-[340px] text-center">
                      <SparklesIcon className="w-5 h-5 text-fitness-green flex-shrink-0" />
                      <span className="leading-tight text-center block whitespace-normal">
                        Profil bilgilerini eksiksiz doldurursan<br />sana daha iyi ve kişisel hizmet sunabiliriz!
                      </span>
                      <button onClick={handleCloseAssistantMsg} className="ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 transition">
                        <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    {/* Ok işareti */}
                    <svg className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="12,0 0,0 6,7" fill="#3b82f6" className="dark:fill-fitness-green" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Sekmeler */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6 flex gap-4">
              <button
                onClick={() => setActiveTab('personal')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                  activeTab === 'personal'
                    ? 'border-fitness-blue text-fitness-blue'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Kişisel Bilgiler
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                  activeTab === 'health'
                    ? 'border-fitness-green text-fitness-green'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Sağlık Bilgileri
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                  activeTab === 'settings'
                    ? 'border-fitness-orange text-fitness-orange'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Ayarlar
              </button>
            </div>

            {/* Kişisel Bilgiler */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={profile.personalInfo.name}
                      onChange={(e) => handleInputChange('personalInfo', 'name', e.target.value)}
                      disabled={!isEditing}
                      className="input w-full rounded-lg shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Yaş
                    </label>
                    <input
                      type="number"
                      value={profile.personalInfo.age}
                      onChange={(e) => handleInputChange('personalInfo', 'age', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="input w-full rounded-lg shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cinsiyet
                    </label>
                    <select
                      value={profile.personalInfo.gender}
                      onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                      disabled={!isEditing}
                      className="input w-full rounded-lg shadow-sm"
                    >
                      <option value="">Seçiniz</option>
                      <option value="male">Erkek</option>
                      <option value="female">Kadın</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Aktivite Seviyesi
                    </label>
                    <select
                      value={profile.personalInfo.activityLevel}
                      onChange={(e) =>
                        handleInputChange('personalInfo', 'activityLevel', e.target.value)
                      }
                      disabled={!isEditing}
                      className="input w-full rounded-lg shadow-sm"
                    >
                      <option value="sedentary">Hareketsiz</option>
                      <option value="light">Hafif Aktif</option>
                      <option value="moderate">Orta Aktif</option>
                      <option value="active">Aktif</option>
                      <option value="veryActive">Çok Aktif</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Boy (cm)
                    </label>
                    <input
                      type="number"
                      value={profile.personalInfo.height}
                      onChange={(e) =>
                        handleInputChange('personalInfo', 'height', parseInt(e.target.value))
                      }
                      disabled={!isEditing}
                      className="input w-full rounded-lg shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kilo (kg)
                    </label>
                    <input
                      type="number"
                      value={profile.personalInfo.weight}
                      onChange={(e) =>
                        handleInputChange('personalInfo', 'weight', parseInt(e.target.value))
                      }
                      disabled={!isEditing}
                      className="input w-full rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sağlık Bilgileri */}
            {activeTab === 'health' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kan Grubu
                  </label>
                  <select
                    value={profile.healthInfo.bloodType}
                    onChange={(e) => handleInputChange('healthInfo', 'bloodType', e.target.value)}
                    disabled={!isEditing}
                    className="input w-full rounded-lg shadow-sm"
                  >
                    <option value="">Seçiniz</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="0+">0+</option>
                    <option value="0-">0-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alerjiler
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.healthInfo.allergies.map((allergy: any, index: any) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm flex items-center"
                      >
                        {allergy}
                        {isEditing && (
                          <button
                            onClick={() =>
                              handleArrayChange('healthInfo', 'allergies', 'remove', allergy)
                            }
                            className="ml-2 text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Alerji ekle..."
                        className="input flex-1 rounded-lg shadow-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newItem.trim()) {
                            handleArrayChange('healthInfo', 'allergies', 'add', newItem.trim());
                            setNewItem('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newItem.trim()) {
                            handleArrayChange('healthInfo', 'allergies', 'add', newItem.trim());
                            setNewItem('');
                          }
                        }}
                        className="btn-secondary px-4 py-2 rounded-lg shadow font-semibold"
                      >
                        Ekle
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sağlık Durumları
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.healthInfo.conditions.map((condition: any, index: any) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm flex items-center"
                      >
                        {condition}
                        {isEditing && (
                          <button
                            onClick={() =>
                              handleArrayChange('healthInfo', 'conditions', 'remove', condition)
                            }
                            className="ml-2 text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Sağlık durumu ekle..."
                        className="input flex-1 rounded-lg shadow-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newItem.trim()) {
                            handleArrayChange('healthInfo', 'conditions', 'add', newItem.trim());
                            setNewItem('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newItem.trim()) {
                            handleArrayChange('healthInfo', 'conditions', 'add', newItem.trim());
                            setNewItem('');
                          }
                        }}
                        className="btn-secondary px-4 py-2 rounded-lg shadow font-semibold"
                      >
                        Ekle
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kullandığı İlaçlar
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.healthInfo.medications.map((medication: any, index: any) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm flex items-center"
                      >
                        {medication}
                        {isEditing && (
                          <button
                            onClick={() =>
                              handleArrayChange('healthInfo', 'medications', 'remove', medication)
                            }
                            className="ml-2 text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="İlaç ekle..."
                        className="input flex-1 rounded-lg shadow-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newItem.trim()) {
                            handleArrayChange('healthInfo', 'medications', 'add', newItem.trim());
                            setNewItem('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newItem.trim()) {
                            handleArrayChange('healthInfo', 'medications', 'add', newItem.trim());
                            setNewItem('');
                          }
                        }}
                        className="btn-secondary px-4 py-2 rounded-lg shadow font-semibold"
                      >
                        Ekle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ayarlar */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Tema Ayarları</h3>
                  <div className="flex items-center justify-between">
                <div>
                      <p className="text-gray-700 dark:text-gray-300">Karanlık Mod</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Uygulamanın görünümünü karanlık temaya geçirir
                      </p>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-fitness-blue focus:ring-offset-2 ${
                        darkMode ? 'bg-fitness-green' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                      </button>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Bildirim Ayarları</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                <div>
                        <p className="text-gray-700 dark:text-gray-300">E-posta Bildirimleri</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Önemli güncellemeler için e-posta al
                        </p>
                  </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-fitness-blue focus:ring-offset-2 ${
                          profile.preferences.emailNotifications ? 'bg-fitness-green' : 'bg-gray-200'
                        }`}
                        onClick={() => handleInputChange('preferences', 'emailNotifications', !profile.preferences.emailNotifications)}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            profile.preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                <div>
                        <p className="text-gray-700 dark:text-gray-300">Push Bildirimleri</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Anlık bildirimler al
                        </p>
                  </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-fitness-blue focus:ring-offset-2 ${
                          profile.preferences.pushNotifications ? 'bg-fitness-green' : 'bg-gray-200'
                        }`}
                        onClick={() => handleInputChange('preferences', 'pushNotifications', !profile.preferences.pushNotifications)}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            profile.preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Gizlilik Ayarları</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                <div>
                        <p className="text-gray-700 dark:text-gray-300">Profil Görünürlüğü</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Profilinizi diğer kullanıcılara göster
                        </p>
                  </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-fitness-blue focus:ring-offset-2 ${
                          profile.preferences.profileVisibility ? 'bg-fitness-green' : 'bg-gray-200'
                        }`}
                        onClick={() => handleInputChange('preferences', 'profileVisibility', !profile.preferences.profileVisibility)}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            profile.preferences.profileVisibility ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
