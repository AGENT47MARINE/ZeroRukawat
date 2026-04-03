import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight, SlideOutLeft, Layout } from 'react-native-reanimated';
import { create } from 'zustand';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- ZUSTAND STORE ---
const useStore = create((set) => ({
  user: null, 
  onboardingStage: 'METHOD_SELECT', 
  activeTab: 'HOME',
  isOffline: false,
  appState: 'NORMAL',
  balance: 4200,
  savedByShield: 0,
  recentPayouts: [
    { id: '1', eventId: 'BLR-RAIN-20250614-0823', amount: 350, reason: 'Heavy Rain', date: '14 Jun 2025', time: '08:23 AM', status: 'Paid', zone: 'Koramangala, BLR', details: { threshold: '15mm/hr crossed', gps: 'Match', fraud: 'Passed 99%' } }
  ],
  setUser: (user) => set({ user }),
  setOnboardingStage: (stage) => set({ onboardingStage: stage }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  triggerPayout: () => {
    set({ appState: 'TRIGGERED' });
    setTimeout(() => {
      set((state) => ({ 
        appState: 'PAID', 
        balance: state.balance + 450,
        savedByShield: state.savedByShield + 450,
        recentPayouts: [{ id: Date.now().toString(), eventId: 'BLR-HEAT-20250615', amount: 450, reason: 'Severe Heatwave', date: 'Today', time: '2:15 PM', status: 'Paid', zone: 'Indiranagar, BLR', details: { threshold: '>40°C', gps: 'Match', fraud: 'Passed' } }, ...state.recentPayouts]
      }));
      setTimeout(() => set({ appState: 'NORMAL' }), 6000);
    }, 3000);
  }
}));

// --- ONBOARDING COMPONENTS ---
const MethodSelect = () => {
  const { setOnboardingStage } = useStore();
  return (
    <Animated.View entering={FadeInUp} style={styles.onboardingContainer}>
      <Ionicons name="shield-half" size={80} color="#3B82F6" style={{ marginBottom: 20 }} />
      <Text style={styles.onboardingTitle}>Welcome to GigShield</Text>
      <Text style={styles.onboardingSub}>How would you like to continue your protection journey?</Text>
      <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#25D366', marginTop: 30 }]} onPress={() => alert('Opening WhatsApp Bot...')}>
        <Ionicons name="logo-whatsapp" size={24} color="#fff" />
        <Text style={[styles.btnPrimaryText, { marginLeft: 10 }]}>Continue via WhatsApp</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btnSecondary, { marginTop: 15 }]} onPress={() => setOnboardingStage('PHONE_INPUT')}>
        <Ionicons name="phone-portrait-outline" size={24} color="#3B82F6" />
        <Text style={[styles.btnSecondaryText, { marginLeft: 10, color: '#1E293B' }]}>Continue via App</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const PhoneInput = () => {
  const { setOnboardingStage } = useStore();
  const [phone, setPhone] = useState('9876543210');
  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.onboardingContainer}>
      <TouchableOpacity style={styles.backBtn} onPress={() => setOnboardingStage('METHOD_SELECT')}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
      <Text style={styles.onboardingTitle}>Enter Mobile Number</Text>
      <Text style={styles.onboardingSub}>We'll send an OTP to verify your account</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputPrefix}>+91</Text>
        <TextInput style={styles.input} placeholder="00000 00000" placeholderTextColor="#94A3B8" keyboardType="numeric" maxLength={10} value={phone} onChangeText={setPhone} autoFocus />
      </View>
      <TouchableOpacity style={[styles.btnPrimary, { marginTop: 30, opacity: phone.length === 10 ? 1 : 0.5 }]} disabled={phone.length !== 10} onPress={() => setOnboardingStage('OTP_INPUT')}>
        <Text style={styles.btnPrimaryText}>Send OTP</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const OTPInput = () => {
  const { setOnboardingStage } = useStore();
  const [otp, setOtp] = useState('1234');
  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.onboardingContainer}>
      <TouchableOpacity style={styles.backBtn} onPress={() => setOnboardingStage('PHONE_INPUT')}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
      <View style={styles.otpMessage}>
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text style={{ color: '#10B981', marginLeft: 8, fontWeight: 'bold' }}>OTP sent successfully</Text>
      </View>
      <Text style={styles.onboardingTitle}>Verify OTP</Text>
      <Text style={styles.onboardingSub}>Enter the 4-digit code sent to your phone</Text>
      <TextInput style={styles.otpInput} placeholder="----" placeholderTextColor="#94A3B8" keyboardType="numeric" maxLength={4} value={otp} onChangeText={setOtp} textAlign="center" autoFocus />
      <TouchableOpacity style={[styles.btnPrimary, { marginTop: 30, opacity: otp.length === 4 ? 1 : 0.5 }]} disabled={otp.length !== 4} onPress={() => setOnboardingStage('REGISTRATION')}>
        <Text style={styles.btnPrimaryText}>Verify</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const RegistrationForm = () => {
  const { setOnboardingStage } = useStore();
  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollForm}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setOnboardingStage('OTP_INPUT')}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={[styles.onboardingTitle, { fontSize: 24, textAlign: 'left' }]}>Profile Details</Text>
        <Text style={[styles.onboardingSub, { textAlign: 'left', marginBottom: 20 }]}>Final step to active your protection</Text>
        {[
          { label: 'Full Name', val: 'Rahul Kumar' },
          { label: 'City', val: 'Bengaluru' },
          { label: 'Delivery Zone', val: 'Koramangala' },
          { label: 'Platform', val: 'Zomato & Swiggy' },
          { label: 'UPI ID', val: 'rahul@okicici' }
        ].map((field, i) => (
          <View key={i} style={{ marginBottom: 15 }}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput style={styles.formInput} value={field.val} placeholderTextColor="#94A3B8" editable={true} />
          </View>
        ))}
        <TouchableOpacity style={[styles.btnPrimary, { marginTop: 20, marginBottom: 40 }]} onPress={() => setOnboardingStage('VERIFICATION')}>
          <Text style={styles.btnPrimaryText}>Verify & Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};

const VerificationLoading = () => {
  const { setOnboardingStage } = useStore();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 2000),
      setTimeout(() => setStep(3), 3000),
      setTimeout(() => setOnboardingStage('PLAN_SELECTION'), 4000)
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  const steps = ['Verifying identity...', 'Checking details...', 'Validating Platform ID...', 'Optimizing AI profile...'];
  return (
    <Animated.View entering={FadeIn} style={styles.onboardingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" style={{ marginBottom: 30, transform: [{ scale: 1.5 }] }} />
      <Text style={[styles.onboardingTitle, { marginBottom: 10 }]}>Verification in Progress</Text>
      <View style={{ width: '100%', paddingHorizontal: 20, marginTop: 20 }}>
        {steps.map((text, i) => (
          <Animated.View key={i} entering={FadeInDown} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, opacity: i <= step ? 1 : 0.2 }}>
            <Ionicons name={i < step ? "checkmark-circle" : "ellipse-outline"} size={20} color={i < step ? "#10B981" : "#64748B"} />
            <Text style={{ color: i < step ? '#10B981' : '#1E293B', marginLeft: 10, fontSize: 14 }}>{text}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

const PlanSelection = () => {
  const { setOnboardingStage } = useStore();
  const [selected, setSelected] = useState(1);
  const plans = [
    { id: 0, title: 'Bronze Card', earn: 'Up to ₹4,000', price: '₹49/week', maxPayout: '₹2,450', cov: '70% of lost income', color: '#B08D57', bg: 'rgba(176,141,87,0.1)' },
    { id: 1, title: 'Silver Card', earn: '₹4,000 - ₹7,000', price: '₹79/week', maxPayout: '₹3,850', cov: '70% of lost income', color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
    { id: 2, title: 'Gold Card', earn: '₹7,000 and above', price: '₹99/week', maxPayout: '₹6,300', cov: '70% of lost income', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
  ];

  return (
    <Animated.View entering={SlideInRight} style={styles.onboardingContainerPad}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}>
        <Text style={[styles.onboardingTitle, { marginTop: 40 }]}>Your Weekly Premium</Text>
        <Text style={styles.onboardingSub}>Select a tier to match your earnings</Text>
        
        {plans.map((p, i) => (
          <TouchableOpacity 
            key={i} 
            activeOpacity={0.8}
            onPress={() => setSelected(p.id)}
            style={[styles.tierCard, { borderColor: selected === p.id ? p.color : '#E2E8F0', backgroundColor: selected === p.id ? p.bg : '#F1F5F9' }]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: p.color, fontSize: 20, fontWeight: '800' }}>{p.title}</Text>
              <View style={styles.pricePill}><Text style={{ color: '#1E293B', fontWeight: 'bold' }}>{p.price}</Text></View>
            </View>
            <Text style={styles.tierStatText}>Weekly Earnings: <Text style={{ color: '#1E293B', fontWeight: '500' }}>{p.earn}</Text></Text>
            <Text style={styles.tierStatText}>Max Payout/Week: <Text style={{ color: '#1E293B', fontWeight: '500' }}>{p.maxPayout}</Text></Text>
            <Text style={styles.tierStatText}>Coverage: <Text style={{ color: '#10B981', fontWeight: 'bold' }}>{p.cov}</Text></Text>
          </TouchableOpacity>
        ))}

        <Animated.View entering={FadeInUp.delay(300)} style={styles.aiBadge}>
          <Ionicons name="sparkles" size={16} color="#3B82F6" />
          <Text style={styles.aiBadgeText}>Our AI has assigned you Silver based on your zone ("Koramangala") and city risk.</Text>
        </Animated.View>

        <TouchableOpacity style={[styles.btnPrimary, { marginTop: 20, width: '100%' }]} onPress={() => setOnboardingStage('CONFIRMATION')}>
          <Text style={styles.btnPrimaryText}>Activate Policy</Text>
        </TouchableOpacity>
        <Text style={{ color: '#64748B', fontSize: 12, marginTop: 16, textAlign: 'center' }}>Auto-deducted every Monday from your UPI. Cancel anytime.</Text>
      </ScrollView>
    </Animated.View>
  );
};

const PolicyConfirmed = () => {
  const { setUser, setOnboardingStage } = useStore();
  return (
    <Animated.View entering={FadeIn} style={styles.onboardingContainer}>
      <Ionicons name="checkmark-done-circle" size={100} color="#10B981" />
      <Text style={[styles.onboardingTitle, { marginTop: 24 }]}>You're protected, Rahul!</Text>
      <View style={styles.invoiceCard}>
        <Text style={styles.invoiceLabel}>Policy ID:</Text>
        <Text style={styles.invoiceValue}>GS-BLR-002847</Text>
        <Text style={styles.invoiceLabel}>Tier:</Text>
        <Text style={[styles.invoiceValue, { color: '#64748B' }]}>Silver Card</Text>
        <Text style={styles.invoiceLabel}>Premium:</Text>
        <Text style={styles.invoiceValue}>₹79/week</Text>
        <Text style={styles.invoiceLabel}>Coverage:</Text>
        <Text style={[styles.invoiceValue, { color: '#10B981' }]}>70% of daily income</Text>
        <Text style={styles.invoiceLabel}>Next premium date:</Text>
        <Text style={styles.invoiceValue}>Next Monday</Text>
      </View>
      <TouchableOpacity style={[styles.btnPrimary, { position: 'absolute', bottom: 40, width: width - 60 }]} onPress={() => setUser({ name: 'Rahul', plan: 'Silver', avatar: 'R' })}>
        <Text style={styles.btnPrimaryText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- MAIN APP TABS ---
const BarChart = () => {
  const days = [
    { day: 'M', val: 40, color: '#3B82F6' },
    { day: 'T', val: 70, color: '#3B82F6' },
    { day: 'W', val: 0, color: '#EF4444' }, // disrupted
    { day: 'T', val: 80, color: '#3B82F6' },
    { day: 'F', val: 100, color: '#3B82F6' },
    { day: 'S', val: 90, color: '#3B82F6' },
    { day: 'S', val: 20, color: '#E2E8F0' }, // pending
  ];
  return (
    <View style={styles.chartArea}>
      {days.map((d, i) => (
        <View key={i} style={styles.chartCol}>
          <View style={{ height: 100, justifyContent: 'flex-end', width: 24 }}>
            <View style={[{ height: `${d.val}%`, backgroundColor: d.color, borderRadius: 6, width: '100%' }]} />
          </View>
          <Text style={styles.chartLabel}>{d.day}</Text>
        </View>
      ))}
    </View>
  );
};

const DashboardTab = () => {
  const { user, balance, triggerPayout, appState } = useStore();
  const disruptedToday = appState === 'TRIGGERED' || appState === 'PAID';
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.dashGreet}>Good morning, {user.name} 👋</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
            <View style={styles.pillGreen}><Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold' }}>● Active</Text></View>
            <View style={styles.pillSilver}><Text style={{ color: '#1E293B', fontSize: 11, fontWeight: 'bold' }}>Silver Tier</Text></View>
          </View>
        </View>
        <View style={styles.avatarMini}><Text style={styles.avaText}>{user.avatar}</Text></View>
      </View>

      <View style={[styles.statusCardBig, { borderColor: disruptedToday ? '#EF4444' : '#10B981', backgroundColor: disruptedToday ? 'rgba(239,68,68,0.05)' : '#FFFFFF' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Ionicons name={disruptedToday ? "alert-circle" : "checkmark-circle"} size={28} color={disruptedToday ? "#EF4444" : "#10B981"} />
          <Text style={{ fontSize: 18, color: '#1E293B', fontWeight: 'bold' }}>{disruptedToday ? 'Disruption Detected' : 'No Disruption'}</Text>
        </View>
        {disruptedToday && <Text style={{ color: '#EF4444', marginBottom: 8, fontWeight: '600' }}>Heavy Rain — Rainfall {'>'} 15mm/hr</Text>}
        <Text style={{ color: '#64748B' }}>{disruptedToday ? (appState === 'PAID' ? 'Payout Paid' : 'Payout Processing...') : 'Conditions are normal in your zone. Safe rides!'}</Text>
      </View>

      <Text style={styles.sectionHeader}>Weekly Earnings Tracker</Text>
      <View style={styles.trackerCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            <Text style={{ color: '#64748B', fontSize: 12 }}>Total this week</Text>
            <Text style={{ color: '#1E293B', fontSize: 24, fontWeight: '800' }}>₹{balance}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#64748B', fontSize: 12 }}>Disrupted days</Text>
            <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '800' }}>1 Day</Text>
          </View>
        </View>
        <BarChart />
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
        {[{ title: 'Payouts', val: '₹450' }, { title: 'Disruptions', val: '1' }, { title: 'Weeks Active', val: '12' }].map((s, i) => (
          <View key={i} style={styles.statSquare}>
            <Text style={{ color: '#1E293B', fontWeight: 'bold', fontSize: 18 }}>{s.val}</Text>
            <Text style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>{s.title}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.devTrigger} onPress={triggerPayout}>
        <Ionicons name="bug" size={14} color="#64748B" />
        <Text style={{ color: '#64748B', fontSize: 12, marginLeft: 6 }}>Dev: Trigger Disruption Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const HistoryTab = () => {
  const { recentPayouts } = useStore();
  const [expanded, setExpanded] = useState(null);
  const [activeFilter, setActiveFilter] = useState(0);
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Payout History</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {['All', 'This Week', 'This Month', 'This Year'].map((t, i) => (
          <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => setActiveFilter(i)} style={[styles.filterPill, i===activeFilter && styles.filterPillActive]}>
            <Text style={[styles.filterPillText, i===activeFilter && { color: '#fff' }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {recentPayouts.map(p => {
        const isExp = expanded === p.id;
        return (
          <TouchableOpacity key={p.id} style={styles.historyCard} onPress={() => setExpanded(isExp ? null : p.id)} activeOpacity={0.9}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.iconCircle}><Ionicons name="rainy" size={20} color="#3B82F6" /></View>
                <View>
                  <Text style={{ color: '#1E293B', fontWeight: 'bold', fontSize: 16 }}>{p.reason}</Text>
                  <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{p.date} • {p.zone}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 16 }}>+₹{p.amount}</Text>
                <Text style={{ color: '#10B981', fontSize: 11, marginTop: 2 }}>{p.status}</Text>
              </View>
            </View>
            {isExp && (
              <Animated.View entering={FadeInUp} style={styles.expandedHistoryDetails}>
                <Text style={styles.detailText}>Event ID: {p.eventId}</Text>
                <Text style={styles.detailText}>Trigger: {p.details.threshold}</Text>
                <Text style={styles.detailText}>GPS Validation: <Text style={{ color: '#10B981' }}>{p.details.gps}</Text></Text>
                <Text style={styles.detailText}>Fraud Score: <Text style={{ color: '#10B981' }}>{p.details.fraud}</Text></Text>
                <Text style={styles.detailText}>UPI Txn: TXN89274982739</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const AlertsTab = () => {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Disruption Alerts</Text>
      
      <View style={styles.alertCardActive}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Heavy Rain Warning</Text>
          </View>
          <Text style={{ color: '#64748B', fontSize: 12 }}>Active</Text>
        </View>
        <Text style={{ color: '#1E293B', marginTop: 10 }}>Zone: Koramangala, BLR</Text>
        <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>Detected at 12:45 PM. 240+ workers affected. Payout triggered in 15 mins if sustained.</Text>
      </View>

      <Text style={[styles.sectionHeader, { marginTop: 30 }]}>Disruption Calendar (7-Day Forecast)</Text>
      <View style={styles.calendarCard}>
        <View style={styles.calRow}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=><Text key={i} style={styles.calDayHead}>{d}</Text>)}
        </View>
        <View style={styles.calRow}>
          {[ { p: 10, c: '#10B981' }, { p: 20, c: '#10B981' }, { p: 72, c: '#EF4444' }, { p: 15, c: '#10B981' }, { p: 45, c: '#F59E0B' }, { p: 5, c: '#10B981' }, { p: 10, c: '#10B981' } ].map((d, i) => (
            <View key={i} style={[styles.calCell, { backgroundColor: d.c }]}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{d.p}%</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: '#64748B', fontSize: 12, marginTop: 16, textAlign: 'center' }}>Next 7-day weather risk forecast for your zone</Text>
      </View>
    </ScrollView>
  );
};

const ProfileTab = () => {
  const { setUser } = useStore();
  const [waOn, setWaOn] = useState(true);
  const [pushOn, setPushOn] = useState(true);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Profile & Policy</Text>
      <View style={styles.profileSectionCard}>
        <Text style={styles.secTitleSmall}>My Policy</Text>
        <View style={styles.secKV}><Text style={styles.secK}>Policy ID</Text><Text style={styles.secV}>GS-BLR-002847</Text></View>
        <View style={styles.secKV}><Text style={styles.secK}>Tier</Text><Text style={[styles.secV, { color: '#64748B' }]}>Silver</Text></View>
        <View style={styles.secKV}><Text style={styles.secK}>Premium</Text><Text style={styles.secV}>₹79/week</Text></View>
        <View style={styles.secKV}><Text style={styles.secK}>Status</Text><Text style={[styles.secV, { color: '#10B981' }]}>Active</Text></View>
      </View>

      <View style={styles.profileSectionCard}>
        <Text style={styles.secTitleSmall}>My Details</Text>
        <View style={styles.secKV}><Text style={styles.secK}>Name</Text><Text style={styles.secV}>Rahul Kumar</Text></View>
        <View style={styles.secKV}><Text style={styles.secK}>Mobile</Text><Text style={styles.secV}>+91 98765 43210</Text></View>
        <View style={styles.secKV}><Text style={styles.secK}>City</Text><Text style={styles.secV}>Bengaluru</Text></View>
        <View style={styles.secKV}><Text style={styles.secK}>Zone</Text><Text style={styles.secV}>Koramangala</Text></View>
        <View style={styles.secKV}><Text style={styles.secK}>Platform</Text><Text style={styles.secV}>Zomato & Swiggy</Text></View>
        <View style={[styles.secKV, { alignItems: 'center' }]}><Text style={styles.secK}>UPI ID</Text><View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Text style={styles.secV}>rahul@okicici</Text><Ionicons name="pencil" size={14} color="#64748B" /></View></View>
      </View>

      <View style={styles.profileSectionCard}>
        <Text style={styles.secTitleSmall}>Income Report Card (YTD)</Text>
        <View style={styles.secKV}><Text style={styles.secK}>Total Earnings</Text><Text style={styles.secV}>₹48,500</Text></View>
        <View style={styles.secKV}><Text style={styles.secK}>Disrupted Days</Text><Text style={styles.secV}>8</Text></View>
        <View style={styles.secKV}><Text style={styles.secK}>Payouts Received</Text><Text style={[styles.secV, { color: '#10B981' }]}>₹2,800</Text></View>
        <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', padding: 12, borderRadius: 8, marginTop: 10 }}>
          <Text style={{ color: '#10B981', textAlign: 'center', fontWeight: 'bold' }}>GigShield has saved you ₹2,800 this year</Text>
        </View>
      </View>

      <View style={styles.profileSectionCard}>
        <Text style={styles.secTitleSmall}>Referral</Text>
        <Text style={{ color: '#64748B', fontSize: 13, marginBottom: 12 }}>Refer a partner, earn ₹50</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text style={{ color: '#1E293B', textAlign: 'center', letterSpacing: 2, fontWeight: 'bold' }}>GIGRAHUL50</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => alert('Referral code copied to clipboard!')} style={{ backgroundColor: '#3B82F6', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 8 }}>
            <Ionicons name="copy" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.profileSectionCard}>
        <Text style={styles.secTitleSmall}>Settings</Text>
        <TouchableOpacity style={[styles.secKV, { alignItems: 'center' }]} activeOpacity={0.7}>
          <Text style={styles.secK}>Language</Text><Text style={styles.secV}>English ▾</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secKV, { alignItems: 'center' }]} activeOpacity={0.7} onPress={() => setWaOn(!waOn)}>
          <Text style={styles.secK}>WhatsApp Notifications</Text><Ionicons name={waOn ? "toggle" : "toggle-outline"} size={32} color={waOn ? "#10B981" : "#94A3B8"} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secKV, { alignItems: 'center', marginBottom: 0 }]} activeOpacity={0.7} onPress={() => setPushOn(!pushOn)}>
          <Text style={styles.secK}>Push Notifications</Text><Ionicons name={pushOn ? "toggle" : "toggle-outline"} size={32} color={pushOn ? "#10B981" : "#94A3B8"} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.6} onPress={() => setUser(null)}>
        <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const ForecastTab = () => {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Next Week Forecast</Text>
      
      <View style={[styles.profileSectionCard, { borderColor: '#3B82F6', borderWidth: 1 }]}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="hardware-chip" size={20} color="#3B82F6" />
          <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 16 }}>ML Model Prediction</Text>
        </View>
        <View style={styles.secKV}><Text style={styles.secK}>Disruption Prob.</Text><Text style={[styles.secV, { color: '#EF4444' }]}>78%</Text></View>
        <View style={styles.secKV}><Text style={styles.secK}>Income at risk</Text><Text style={styles.secV}>₹1,200</Text></View>
        <View style={{ backgroundColor: 'rgba(59,130,246,0.1)', padding: 12, borderRadius: 8, marginTop: 10 }}>
          <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '600' }}>💡 Recommendation: Maintain at least Silver tier this week due to heavy rains expected.</Text>
        </View>
      </View>

      <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Daily Risk Probability</Text>
      <View style={styles.trackerCard}>
        <View style={styles.chartArea}>
          {[ { day: 'M', val: 78, color: '#EF4444' }, { day: 'T', val: 56, color: '#F59E0B' }, { day: 'W', val: 34, color: '#3B82F6' }, { day: 'T', val: 72, color: '#EF4444' }, { day: 'F', val: 20, color: '#10B981' }, { day: 'S', val: 12, color: '#10B981' }, { day: 'S', val: 65, color: '#F59E0B' } ].map((d, i) => (
            <View key={i} style={styles.chartCol}>
              <View style={{ height: 100, justifyContent: 'flex-end', width: 24 }}>
                <View style={[{ height: `${d.val}%`, backgroundColor: d.color, borderRadius: 6, width: '100%' }]} />
              </View>
              <Text style={styles.chartLabel}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Probability Breakdown</Text>
      <View style={styles.profileSectionCard}>
        {[ { label: 'Rain', val: '72%', w: '72%', col: '#3B82F6' }, { label: 'Heat', val: '8%', w: '8%', col: '#F59E0B' }, { label: 'Traffic', val: '45%', w: '45%', col: '#EF4444' }, { label: 'AQI', val: '12%', w: '12%', col: '#94A3B8' }].map((b, i) => (
          <View key={i} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}><Text style={{ color: '#1E293B' }}>{b.label}</Text><Text style={{ color: b.col, fontWeight: 'bold' }}>{b.val}</Text></View>
            <View style={{ height: 8, backgroundColor: '#F1F5F9', borderRadius: 4 }}><View style={{ width: b.w, height: '100%', backgroundColor: b.col, borderRadius: 4 }} /></View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};


const FullScreenDisruption = () => {
  const { appState } = useStore();
  if (appState !== 'TRIGGERED' && appState !== 'PAID') return null;

  return (
    <Animated.View entering={FadeIn} style={styles.fullScreenOverlay}>
      {appState === 'TRIGGERED' ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.fullScreenTitle}>Processing Payout</Text>
          <Text style={styles.fullScreenSub}>Validating disruption parameters...</Text>
        </View>
      ) : (
        <Animated.View entering={FadeInUp} style={styles.centered}>
          <View style={styles.successCircle}><Ionicons name="checkmark" size={60} color="#10B981" /></View>
          <Text style={styles.successTitle}>₹450 Paid!</Text>
          <Text style={styles.successSub}>For Severe Heatwave disruption.</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

export default function App() {
  const { user, onboardingStage, activeTab, setActiveTab } = useStore();

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.safeAreaSpacing} />
          {onboardingStage === 'METHOD_SELECT' && <MethodSelect />}
          {onboardingStage === 'PHONE_INPUT' && <PhoneInput />}
          {onboardingStage === 'OTP_INPUT' && <OTPInput />}
          {onboardingStage === 'REGISTRATION' && <RegistrationForm />}
          {onboardingStage === 'VERIFICATION' && <VerificationLoading />}
          {onboardingStage === 'PLAN_SELECTION' && <PlanSelection />}
          {onboardingStage === 'CONFIRMATION' && <PolicyConfirmed />}
        </KeyboardAvoidingView>
      </View>
    );
  }

  const tabs = [
    { id: 'HOME', icon: 'home' },
    { id: 'HISTORY', icon: 'time' },
    { id: 'FORECAST', icon: 'analytics' },
    { id: 'ALERTS', icon: 'notifications' },
    { id: 'PROFILE', icon: 'person' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        {activeTab === 'HOME' && <DashboardTab />}
        {activeTab === 'HISTORY' && <HistoryTab />}
        {activeTab === 'FORECAST' && <ForecastTab />}
        {activeTab === 'ALERTS' && <AlertsTab />}
        {activeTab === 'PROFILE' && <ProfileTab />}
      </View>
      
      <View style={styles.bottomNav}>
        {tabs.map((t) => (
          <TouchableOpacity key={t.id} style={styles.navItem} onPress={() => setActiveTab(t.id)}>
            <Ionicons name={t.icon} size={24} color={activeTab === t.id ? '#3B82F6' : '#94A3B8'} />
            {activeTab === t.id && <View style={styles.navIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
      <FullScreenDisruption />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeAreaSpacing: { height: Platform.OS === 'ios' ? 60 : 40 },
  onboardingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  onboardingContainerPad: { flex: 1, paddingHorizontal: 20 },
  scrollForm: { padding: 24, paddingBottom: 50 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20, padding: 8, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  onboardingTitle: { color: '#1E293B', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  onboardingSub: { color: '#64748B', fontSize: 16, textAlign: 'center', marginTop: 10, marginBottom: 20, lineHeight: 24 },
  btnPrimary: { backgroundColor: '#3B82F6', flexDirection: 'row', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnSecondary: { backgroundColor: '#FFFFFF', flexDirection: 'row', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', width: '100%' },
  btnSecondaryText: { color: '#1E293B', fontSize: 16, fontWeight: 'bold' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, marginTop: 20, borderWidth: 1, borderColor: '#E2E8F0', width: '100%' },
  inputPrefix: { color: '#1E293B', fontSize: 18, padding: 16, fontWeight: 'bold', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  input: { flex: 1, color: '#1E293B', fontSize: 18, padding: 16, fontWeight: 'bold' },
  otpInput: { backgroundColor: '#FFFFFF', borderRadius: 16, marginTop: 20, borderWidth: 1, borderColor: '#E2E8F0', width: '60%', color: '#1E293B', fontSize: 32, fontWeight: 'bold', padding: 16, letterSpacing: 20 },
  label: { color: '#64748B', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  formInput: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', color: '#1E293B', padding: 14, fontSize: 16 },
  tierCard: { borderWidth: 2, borderRadius: 16, padding: 20, marginBottom: 16, width: '100%' },
  pricePill: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tierStatText: { color: '#64748B', fontSize: 14, marginBottom: 6 },
  aiBadge: { flexDirection: 'row', backgroundColor: 'rgba(59,130,246,0.1)', padding: 12, borderRadius: 12, gap: 10, marginBottom: 10 },
  aiBadgeText: { color: '#3B82F6', fontSize: 13, flex: 1, lineHeight: 18 },
  invoiceCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, width: '100%', marginTop: 30, borderWidth: 1, borderColor: '#E2E8F0' },
  invoiceLabel: { color: '#64748B', fontSize: 14, marginTop: 12 },
  invoiceValue: { color: '#1E293B', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  
  // Dashboard & Tabs
  scrollContent: { padding: 20, paddingTop: Platform.OS==='ios'?10:40, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  dashGreet: { color: '#1E293B', fontSize: 24, fontWeight: 'bold' },
  pillGreen: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  pillSilver: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderColor: '#E2E8F0', borderWidth: 1 },
  avatarMini: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3B82F6' },
  avaText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 16 },
  statusCardBig: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  sectionHeader: { color: '#1E293B', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  trackerCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  chartArea: { flexDirection: 'row', justifyContent: 'space-between', height: 120, alignItems: 'flex-end' },
  chartCol: { alignItems: 'center', width: 30 },
  chartLabel: { color: '#64748B', fontSize: 12, marginTop: 8 },
  statSquare: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  devTrigger: { marginTop: 30, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'center', borderStyle: 'dashed', backgroundColor: '#FFFFFF' },
  
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(255,255,255,0.95)', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 20 : 0, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  navItem: { alignItems: 'center', justifyContent: 'center', height: '100%', width: 60 },
  navIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3B82F6', marginTop: 4 },
  
  fullScreenOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(248,250,252,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  centered: { alignItems: 'center', padding: 30 },
  fullScreenTitle: { color: '#1E293B', fontSize: 24, fontWeight: 'bold', marginTop: 24 },
  fullScreenSub: { color: '#64748B', fontSize: 16, marginTop: 12 },
  successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 3, borderColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  successTitle: { color: '#10B981', fontSize: 36, fontWeight: '900', marginTop: 24 },
  
  pageTitle: { color: '#1E293B', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  filterPillActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  filterPillText: { color: '#64748B', fontWeight: '600' },
  historyCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.1)', justifyContent: 'center', alignItems: 'center' },
  expandedHistoryDetails: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 6 },
  detailText: { color: '#64748B', fontSize: 13 },
  
  alertCardActive: { backgroundColor: 'rgba(245,158,11,0.05)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  calendarCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  calRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  calDayHead: { color: '#64748B', fontSize: 12, width: 35, textAlign: 'center', fontWeight: 'bold' },
  calCell: { width: 35, height: 35, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  
  profileSectionCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  secTitleSmall: { color: '#1E293B', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  secKV: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  secK: { color: '#64748B' },
  secV: { color: '#1E293B', fontWeight: '600' },
  logoutBtn: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.05)', alignItems: 'center', marginTop: 20 }
});
