import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight, SlideOutLeft, Layout } from 'react-native-reanimated';
import { create } from 'zustand';
import { Ionicons } from '@expo/vector-icons';
import { api } from './src/api';

const { width } = Dimensions.get('window');

const PAYOUT_STAGE_LABELS = {
  requested: 'Requested',
  fraud_check: 'Fraud Check',
  income_estimation: 'Income Estimation',
  payment_processing: 'Transfer Processing',
  credited: 'Paid',
  held: 'Held',
  blocked: 'Blocked',
  failed: 'Failed',
};

const TERMINAL_STAGES = new Set(['credited', 'held', 'blocked', 'failed']);

function toAvatar(name = 'U') {
  return String(name)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function mapPayoutToHistory(payout, zone) {
  const createdAt = payout?.created_at ? new Date(payout.created_at) : new Date();
  return {
    id: payout.claim_id,
    eventId: (payout.claim_id || 'N/A').slice(0, 16).toUpperCase(),
    amount: Number(payout.amount || 0),
    reason: payout.reason || 'Disruption',
    date: payout.date || createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    status: PAYOUT_STAGE_LABELS[payout.payout_stage] || payout.status || 'Processing',
    zone: zone || 'Unknown Zone',
    details: {
      threshold: payout.reason || 'Disruption trigger',
      gps: 'Verified by backend checks',
      fraud: payout.status || 'Processing',
      transaction: payout.transaction_id || 'Pending',
    },
  };
}

// ═══════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════
const T = {
  // Colors
  bg: '#FFFFFF',
  bgSoft: '#F8FAFC',
  bgMuted: '#F1F5F9',
  primary: '#4F46E5',     // indigo
  primaryLight: '#EEF2FF',
  success: '#059669',
  successLight: '#D1FAE5',
  risk: '#DC2626',
  riskLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  borderFocus: '#4F46E5',
  card: '#FFFFFF',
  // Spacing (8px grid)
  s4: 4, s8: 8, s12: 12, s16: 16, s20: 20, s24: 24, s32: 32, s40: 40, s48: 48,
  // Radius
  r8: 8, r12: 12, r16: 16, r20: 20, r24: 24, rFull: 999,
  // Shadows
  shadow1: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  shadow2: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  shadow3: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 },
};

// ═══════════════════════════════════════════
// ZUSTAND STORE
// ═══════════════════════════════════════════
const useStore = create((set, get) => ({
  user: null,
  pendingUser: null,
  policy: null,
  token: null,
  onboardingStage: 'METHOD_SELECT',
  activeTab: 'HOME',
  appState: 'NORMAL',
  onboardingLoading: false,
  onboardingError: '',
  dashboardError: '',
  payoutOverlayVisible: false,
  otpReference: '',
  registrationToken: '',
  otpMode: 'register',
  registration: {
    phone: '9876543210',
    name: 'Rahul Kumar',
    city: 'Mumbai',
    zone: 'Mumbai_Kurla',
    platform: 'Amazon',
    upiId: '',
  },
  balance: 4200,
  savedByShield: 0,
  recentPayouts: [],
  activeDisruptions: [],
  workerInsights: null,
  setUser: (user) => set({ user }),
  setOnboardingError: (onboardingError) => set({ onboardingError }),
  setRegistrationField: (field, value) => set((state) => ({
    registration: { ...state.registration, [field]: value },
  })),
  continueWithPhone: async (rawPhone) => {
    const cleanedPhone = String(rawPhone || '').replace(/\D/g, '').slice(-10);
    if (cleanedPhone.length !== 10) {
      set({ onboardingError: 'Enter a valid 10-digit phone number.' });
      return;
    }

    set((state) => ({
      onboardingLoading: true,
      onboardingError: '',
      registration: { ...state.registration, phone: cleanedPhone },
    }));

    try {
      const resp = await api.requestOtp(cleanedPhone);
      set({
        otpMode: 'login',
        otpReference: resp?.data?.reference || '',
        registrationToken: '',
        onboardingStage: 'OTP_INPUT',
        onboardingError: '',
      });
    } catch (e) {
      const msg = e?.message || 'Unable to continue with this phone number.';
      const notRegistered = e?.status === 404 || /not registered/i.test(msg);
      if (notRegistered) {
        set({
          otpMode: 'register',
          otpReference: '',
          registrationToken: '',
          onboardingStage: 'REGISTRATION',
          onboardingError: '',
        });
      } else {
        set({ onboardingError: msg });
      }
    } finally {
      set({ onboardingLoading: false });
    }
  },
  setOnboardingStage: (stage) => set({ onboardingStage: stage }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  hydrateDashboard: async () => {
    const { token, user, pendingUser } = get();
    const currentUser = user || pendingUser;
    if (!token || !currentUser?.id) return;

    try {
      const [payoutResp, disruptionsResp, insightsResp] = await Promise.all([
        api.getPayouts(currentUser.id, token),
        api.getActiveDisruptions(),
        api.getWorkerInsights(token).catch(() => null),
      ]);

      const payouts = Array.isArray(payoutResp?.data) ? payoutResp.data : [];
      const mapped = payouts.map((p) => mapPayoutToHistory(p, currentUser.zone));
      const totalPaid = mapped.reduce((sum, p) => sum + (p.amount || 0), 0);
      const disruptions = Array.isArray(disruptionsResp?.data) ? disruptionsResp.data : [];
      const inProgress = payouts.some((p) => !TERMINAL_STAGES.has(p.payout_stage));

      set({
        recentPayouts: mapped,
        activeDisruptions: disruptions,
        workerInsights: insightsResp?.data || null,
        savedByShield: totalPaid,
        balance: totalPaid > 0 ? totalPaid : 4200,
        dashboardError: '',
        appState: inProgress ? 'TRIGGERED' : (totalPaid > 0 ? 'PAID' : (disruptions.length > 0 ? 'TRIGGERED' : 'NORMAL')),
      });
    } catch (e) {
      set({ dashboardError: e?.message || 'Unable to load dashboard data' });
    }
  },
  sendRegistrationOtp: async () => {
    const { registration } = get();
    const cleanedPhone = String(registration.phone || '').replace(/\D/g, '').slice(-10);

    if (!cleanedPhone || !registration.name || !registration.city || !registration.zone) {
      set({ onboardingError: 'Fill phone, name, city and zone first.' });
      return;
    }

    set({ onboardingLoading: true, onboardingError: '' });
    try {
      const resp = await api.register({
        phone: cleanedPhone,
        name: registration.name,
        city: registration.city,
        zone: registration.zone,
        tier: 'Silver',
        upi_id: registration.upiId,
      });

      set({
        otpMode: 'register',
        registrationToken: resp?.data?.registration_token || '',
        otpReference: resp?.data?.reference || '',
        onboardingStage: 'OTP_INPUT',
        onboardingError: '',
      });
    } catch (e) {
      set({ onboardingError: e?.message || 'Failed to send OTP' });
    } finally {
      set({ onboardingLoading: false });
    }
  },
  verifyRegistrationOtp: async (otpValue) => {
    const { registration, registrationToken, otpMode } = get();
    const cleanedPhone = String(registration.phone || '').replace(/\D/g, '').slice(-10);

    set({ onboardingLoading: true, onboardingError: '' });
    try {
      if (otpMode === 'login') {
        const loginResp = await api.login(cleanedPhone, otpValue);
        const jwt = loginResp?.data?.access_token;
        const worker = loginResp?.data?.worker;
        const policyResp = await api.getPolicy(worker.id, jwt).catch(() => ({ data: null }));

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.localStorage.setItem('zr_token', jwt);
        }

        set({
          token: jwt,
          user: { ...worker, avatar: toAvatar(worker?.name) },
          pendingUser: null,
          policy: policyResp?.data || null,
          otpReference: '',
          registrationToken: '',
          onboardingStage: 'METHOD_SELECT',
          onboardingError: '',
        });

        await get().hydrateDashboard();
        return;
      }

      if (!registrationToken) {
        set({ onboardingError: 'Please request OTP first.' });
        return;
      }

      const resp = await api.verifyRegisterOtp(cleanedPhone, otpValue, registrationToken);
      const jwt = resp?.data?.access_token;
      const worker = resp?.data?.worker;
      const policy = resp?.data?.policy;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem('zr_token', jwt);
      }

      set({
        token: jwt,
        pendingUser: { ...worker, avatar: toAvatar(worker?.name) },
        policy,
        onboardingStage: 'VERIFICATION',
      });
    } catch (e) {
      set({ onboardingError: e?.message || 'OTP verification failed' });
    } finally {
      set({ onboardingLoading: false });
    }
  },
  completeOnboarding: async () => {
    const { pendingUser } = get();
    if (!pendingUser) return;

    set({ user: pendingUser, pendingUser: null, onboardingStage: 'CONFIRMATION' });
    await get().hydrateDashboard();
  },
  logout: () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem('zr_token');
    }
    set({
      user: null,
      pendingUser: null,
      policy: null,
      token: null,
      onboardingStage: 'METHOD_SELECT',
      appState: 'NORMAL',
      payoutOverlayVisible: false,
      onboardingError: '',
      dashboardError: '',
      recentPayouts: [],
      activeDisruptions: [],
      workerInsights: null,
      savedByShield: 0,
      balance: 4200,
      registrationToken: '',
      otpReference: '',
      otpMode: 'register',
      registration: {
        phone: '9876543210',
        name: 'Rahul Kumar',
        city: 'Mumbai',
        zone: 'Mumbai_Kurla',
        platform: 'Amazon',
        upiId: '',
      },
    });
  },
  triggerPayout: async () => {
    const { user, token } = get();
    if (!user?.id || !token) return;

    set({ appState: 'TRIGGERED', dashboardError: '', payoutOverlayVisible: true });
    try {
      await api.initiatePayout(user.id, { disrupted_days: 1 }, token);
      await get().hydrateDashboard();
    } catch (e) {
      set({ dashboardError: e?.message || 'Unable to initiate payout', appState: 'NORMAL' });
    } finally {
      // Always hide the fullscreen loader once initiate flow completes.
      set({ payoutOverlayVisible: false });
    }
  },
}));

// ═══════════════════════════════════════════
// ONBOARDING COMPONENTS
// ═══════════════════════════════════════════
const MethodSelect = () => {
  const { setOnboardingStage } = useStore();
  return (
    <Animated.View entering={FadeInUp} style={s.onboardCenter}>
      <View style={s.logoBadge}>
        <Ionicons name="shield-checkmark" size={36} color={T.primary} />
      </View>
      <Text style={s.heroTitle}>ZeroRukawat</Text>
      <Text style={s.heroSub}>Income protection for gig workers.{'\n'}Instant payouts when disruptions hit.</Text>
      <TouchableOpacity activeOpacity={0.85} style={[s.btn, { backgroundColor: '#25D366', marginTop: 32 }]} onPress={() => alert('Opening WhatsApp Bot...')}>
        <Ionicons name="logo-whatsapp" size={22} color="#fff" />
        <Text style={s.btnText}>Continue via WhatsApp</Text>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.85} style={[s.btnOutline, { marginTop: 12 }]} onPress={() => setOnboardingStage('PHONE_INPUT')}>
        <Ionicons name="phone-portrait-outline" size={20} color={T.primary} />
        <Text style={[s.btnText, { color: T.textPrimary }]}>Continue via App</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const PhoneInput = () => {
  const { setOnboardingStage, onboardingError, setOnboardingError, continueWithPhone, onboardingLoading } = useStore();
  const [phone, setPhone] = useState('9876543210');

  const goNext = async () => {
    setOnboardingError('');
    await continueWithPhone(phone);
  };

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={s.onboardCenter}>
      <TouchableOpacity style={s.backChip} onPress={() => setOnboardingStage('METHOD_SELECT')}>
        <Ionicons name="arrow-back" size={20} color={T.textPrimary} />
      </TouchableOpacity>
      <Text style={s.stepTitle}>Enter Mobile Number</Text>
      <Text style={s.stepSub}>We will check your number and continue with login or registration</Text>
      <View style={s.phoneRow}>
        <View style={s.prefixBox}><Text style={s.prefixText}>+91</Text></View>
        <TextInput style={s.phoneInput} placeholder="00000 00000" placeholderTextColor={T.textTertiary} keyboardType="numeric" maxLength={10} value={phone} onChangeText={setPhone} autoFocus />
      </View>
      {!!onboardingError && <Text style={{ marginTop: 10, color: T.risk, fontSize: 12 }}>{onboardingError}</Text>}
      <TouchableOpacity activeOpacity={0.85} style={[s.btn, { marginTop: 32, opacity: phone.length === 10 && !onboardingLoading ? 1 : 0.4 }]} disabled={phone.length !== 10 || onboardingLoading} onPress={goNext}>
        <Text style={s.btnText}>{onboardingLoading ? 'Checking...' : 'Continue'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const OTPInput = () => {
  const { setOnboardingStage, verifyRegistrationOtp, onboardingLoading, onboardingError, otpReference, otpMode } = useStore();
  const [otp, setOtp] = useState('');

  const verifyOtp = async () => {
    if (otp.length < 4) return;
    await verifyRegistrationOtp(otp);
  };

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={s.onboardCenter}>
      <TouchableOpacity style={s.backChip} onPress={() => setOnboardingStage(otpMode === 'login' ? 'PHONE_INPUT' : 'REGISTRATION')}>
        <Ionicons name="arrow-back" size={20} color={T.textPrimary} />
      </TouchableOpacity>
      <View style={s.successBanner}>
        <Ionicons name="checkmark-circle" size={18} color={T.success} />
        <Text style={{ color: T.success, marginLeft: 8, fontWeight: '700', fontSize: 13 }}>{otpMode === 'login' ? 'Login OTP sent' : 'Registration OTP sent'}{otpReference ? ` · Ref ${otpReference}` : ''}</Text>
      </View>
      <Text style={s.stepTitle}>Verify OTP</Text>
      <Text style={s.stepSub}>Enter the OTP sent to your phone</Text>
      <TextInput style={s.otpField} placeholder="• • • • • •" placeholderTextColor={T.textTertiary} keyboardType="numeric" maxLength={6} value={otp} onChangeText={setOtp} textAlign="center" autoFocus />
      {!!onboardingError && <Text style={{ marginTop: 10, color: T.risk, fontSize: 12 }}>{onboardingError}</Text>}
      <TouchableOpacity activeOpacity={0.85} style={[s.btn, { marginTop: 32, opacity: otp.length >= 4 && !onboardingLoading ? 1 : 0.4 }]} disabled={otp.length < 4 || onboardingLoading} onPress={verifyOtp}>
        <Text style={s.btnText}>{onboardingLoading ? 'Verifying...' : (otpMode === 'login' ? 'Login' : 'Verify')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const RegistrationForm = () => {
  const {
    setOnboardingStage,
    registration,
    setRegistrationField,
    sendRegistrationOtp,
    onboardingLoading,
    onboardingError,
  } = useStore();

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.formScroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backChip} onPress={() => setOnboardingStage('PHONE_INPUT')}>
          <Ionicons name="arrow-back" size={20} color={T.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.stepTitle, { textAlign: 'left', fontSize: 24 }]}>Profile Details</Text>
        <Text style={[s.stepSub, { textAlign: 'left', marginBottom: 24 }]}>Final step to activate your protection</Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={s.fieldLabel}>Full Name</Text>
          <TextInput style={s.fieldInput} value={registration.name} onChangeText={(v) => setRegistrationField('name', v)} placeholderTextColor={T.textTertiary} />
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={s.fieldLabel}>City</Text>
          <TextInput style={s.fieldInput} value={registration.city} onChangeText={(v) => setRegistrationField('city', v)} placeholderTextColor={T.textTertiary} />
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={s.fieldLabel}>Delivery Zone</Text>
          <TextInput style={s.fieldInput} value={registration.zone} onChangeText={(v) => setRegistrationField('zone', v)} placeholderTextColor={T.textTertiary} />
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={s.fieldLabel}>Platform</Text>
          <TextInput style={s.fieldInput} value={registration.platform} onChangeText={(v) => setRegistrationField('platform', v)} placeholderTextColor={T.textTertiary} />
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={s.fieldLabel}>UPI ID</Text>
          <TextInput style={s.fieldInput} value={registration.upiId} onChangeText={(v) => setRegistrationField('upiId', v)} placeholderTextColor={T.textTertiary} />
        </View>

        {!!onboardingError && <Text style={{ marginBottom: 12, color: T.risk, fontSize: 12 }}>{onboardingError}</Text>}

        <TouchableOpacity activeOpacity={0.85} style={[s.btn, { marginTop: 8, marginBottom: 48, opacity: onboardingLoading ? 0.6 : 1 }]} onPress={sendRegistrationOtp} disabled={onboardingLoading}>
          <Text style={s.btnText}>{onboardingLoading ? 'Sending OTP...' : 'Verify & Continue'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};

const VerificationLoading = () => {
  const { setOnboardingStage } = useStore();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [setTimeout(() => setStep(1), 1000), setTimeout(() => setStep(2), 2000), setTimeout(() => setStep(3), 3000), setTimeout(() => setOnboardingStage('PLAN_SELECTION'), 4000)];
    return () => t.forEach(clearTimeout);
  }, []);
  const steps = ['Verifying identity...', 'Checking details...', 'Validating Platform ID...', 'Optimizing AI profile...'];
  return (
    <Animated.View entering={FadeIn} style={s.onboardCenter}>
      <ActivityIndicator size="large" color={T.primary} style={{ marginBottom: 32, transform: [{ scale: 1.4 }] }} />
      <Text style={[s.stepTitle, { marginBottom: 8 }]}>Verification in Progress</Text>
      <View style={{ width: '100%', paddingHorizontal: 24, marginTop: 24 }}>
        {steps.map((text, i) => (
          <Animated.View key={i} entering={FadeInDown} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10, opacity: i <= step ? 1 : 0.15 }}>
            <Ionicons name={i < step ? "checkmark-circle" : "ellipse-outline"} size={20} color={i < step ? T.success : T.textTertiary} />
            <Text style={{ color: i < step ? T.success : T.textPrimary, marginLeft: 12, fontSize: 14, fontWeight: '500' }}>{text}</Text>
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
    { id: 0, title: 'Bronze', earn: 'Up to ₹4,000', price: '₹49/week', maxPayout: '₹2,450', cov: '70%', color: '#92400E', bg: '#FEF3C7', border: '#F59E0B' },
    { id: 1, title: 'Silver', earn: '₹4,000 – ₹7,000', price: '₹79/week', maxPayout: '₹3,850', cov: '70%', color: '#334155', bg: '#F1F5F9', border: '#94A3B8' },
    { id: 2, title: 'Gold', earn: '₹7,000+', price: '₹99/week', maxPayout: '₹6,300', cov: '70%', color: '#92400E', bg: '#FFFBEB', border: '#F59E0B' },
  ];
  return (
    <Animated.View entering={SlideInRight} style={s.onboardPad}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[s.stepTitle, { marginTop: 48 }]}>Choose Your Plan</Text>
        <Text style={s.stepSub}>Select a tier matching your weekly earnings</Text>

        {plans.map((p) => (
          <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => setSelected(p.id)}
            style={[s.planCard, selected === p.id && { borderColor: T.primary, backgroundColor: T.primaryLight, ...T.shadow2 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={[s.planTitle, selected === p.id && { color: T.primary }]}>{p.title}</Text>
                <Text style={s.planEarn}>{p.earn}</Text>
              </View>
              <View style={[s.priceBadge, selected === p.id && { backgroundColor: T.primary }]}>
                <Text style={[s.priceText, selected === p.id && { color: '#fff' }]}>{p.price}</Text>
              </View>
            </View>
            <View style={s.planRow}><Text style={s.planLabel}>Max Payout/Week</Text><Text style={s.planVal}>{p.maxPayout}</Text></View>
            <View style={s.planRow}><Text style={s.planLabel}>Coverage</Text><Text style={[s.planVal, { color: T.success }]}>{p.cov} of lost income</Text></View>
          </TouchableOpacity>
        ))}

        <Animated.View entering={FadeInUp.delay(300)} style={s.aiTip}>
          <Ionicons name="sparkles" size={16} color={T.primary} />
          <Text style={s.aiTipText}>AI recommends <Text style={{ fontWeight: '800' }}>Silver</Text> based on your zone and city risk profile.</Text>
        </Animated.View>

        <TouchableOpacity activeOpacity={0.85} style={[s.btn, { marginTop: 20 }]} onPress={() => setOnboardingStage('CONFIRMATION')}>
          <Text style={s.btnText}>Activate Policy</Text>
        </TouchableOpacity>
        <Text style={s.finePrint}>Auto-deducted every Monday from your UPI. Cancel anytime.</Text>
      </ScrollView>
    </Animated.View>
  );
};

const PolicyConfirmed = () => {
  const { pendingUser, policy, completeOnboarding } = useStore();
  const items = [
    { k: 'Policy ID', v: policy?.id ? policy.id.slice(0, 18).toUpperCase() : 'N/A' },
    { k: 'Tier', v: pendingUser?.tier || 'Silver' },
    { k: 'Premium', v: policy?.weekly_premium ? `₹${policy.weekly_premium}/week` : 'N/A' },
    { k: 'Coverage', v: '70% of daily income', vc: T.success },
    { k: 'Next Premium', v: policy?.end_date || 'Next Monday' },
  ];
  return (
    <Animated.View entering={FadeIn} style={s.onboardCenter}>
      <View style={s.confirmCircle}><Ionicons name="checkmark" size={48} color={T.success} /></View>
      <Text style={[s.stepTitle, { marginTop: 24 }]}>You're protected, {pendingUser?.name?.split(' ')[0] || 'Worker'}!</Text>
      <View style={s.invoiceBox}>
        {items.map((item, i) => (
          <View key={i} style={[s.invoiceRow, i === items.length - 1 && { marginBottom: 0 }]}>
            <Text style={s.invoiceK}>{item.k}</Text>
            <Text style={[s.invoiceV, item.vc && { color: item.vc }]}>{item.v}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity activeOpacity={0.85} style={[s.btn, { position: 'absolute', bottom: 48, width: width - 48 }]} onPress={completeOnboarding}>
        <Text style={s.btnText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════
// MAIN APP TABS
// ═══════════════════════════════════════════
const MiniBar = ({ days }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 110, alignItems: 'flex-end' }}>
    {days.map((d, i) => (
      <View key={i} style={{ alignItems: 'center', flex: 1 }}>
        <View style={{ height: 88, justifyContent: 'flex-end', width: 20 }}>
          <View style={{ height: `${d.val}%`, backgroundColor: d.color, borderRadius: 6, width: '100%', minHeight: d.val > 0 ? 4 : 0 }} />
        </View>
        <Text style={{ color: T.textTertiary, fontSize: 11, marginTop: 6, fontWeight: '600' }}>{d.day}</Text>
      </View>
    ))}
  </View>
);

const DashboardTab = () => {
  const { user, balance, triggerPayout, appState, activeDisruptions, dashboardError, recentPayouts } = useStore();
  const disrupted = appState === 'TRIGGERED' || appState === 'PAID' || activeDisruptions.length > 0;
  const totalPayout = recentPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const createdAt = user?.created_at ? new Date(user.created_at) : null;
  const weeksActive = createdAt ? Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000))) : 1;
  const weekDays = [
    { day: 'M', val: 40, color: T.primary }, { day: 'T', val: 70, color: T.primary },
    { day: 'W', val: 0, color: T.risk }, { day: 'T', val: 80, color: T.primary },
    { day: 'F', val: 100, color: T.primary }, { day: 'S', val: 90, color: T.primary },
    { day: 'S', val: 20, color: T.border },
  ];
  return (
    <ScrollView contentContainerStyle={s.tabScroll} showsVerticalScrollIndicator={false}>
      {/* Greeting */}
      <View style={s.greetRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.greetName}>Good morning, {user.name}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <View style={s.chipSuccess}><Text style={s.chipSuccessText}>● Active</Text></View>
            <View style={s.chipNeutral}><Text style={s.chipNeutralText}>Silver Tier</Text></View>
          </View>
        </View>
        <View style={s.avatar}><Text style={s.avatarLetter}>{user.avatar}</Text></View>
      </View>

      {/* Status Card */}
      <View style={[s.card, s.statusCard, disrupted && { borderColor: T.risk, backgroundColor: T.riskLight }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[s.statusIcon, disrupted && { backgroundColor: T.riskLight }]}>
            <Ionicons name={disrupted ? "alert-circle" : "checkmark-circle"} size={24} color={disrupted ? T.risk : T.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.statusTitle}>{disrupted ? 'Disruption Detected' : 'No Disruption'}</Text>
            <Text style={s.statusSub}>{disrupted ? (appState === 'PAID' ? 'Payout Paid' : 'Payout Processing...') : 'Conditions are normal in your zone.'}</Text>
            {activeDisruptions[0]?.type ? <Text style={[s.statusSub, { marginTop: 4 }]}>{activeDisruptions[0].type} · {activeDisruptions[0].zone}</Text> : null}
          </View>
        </View>
      </View>

      {!!dashboardError && (
        <View style={[s.card, { marginBottom: 10, borderColor: T.riskLight, backgroundColor: T.riskLight }]}>
          <Text style={{ color: T.risk, fontSize: 12, fontWeight: '600' }}>{dashboardError}</Text>
        </View>
      )}

      {/* Weekly Earnings */}
      <Text style={s.sectionTitle}>Weekly Earnings</Text>
      <View style={[s.card, { padding: 20 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            <Text style={s.metaLabel}>Total this week</Text>
            <Text style={s.bigNum}>₹{balance.toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.metaLabel}>Disrupted</Text>
            <Text style={[s.bigNum, { fontSize: 18, color: T.risk }]}>1 Day</Text>
          </View>
        </View>
        <MiniBar days={weekDays} />
      </View>

      {/* Quick Stats */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {[
          { t: 'Payouts', v: `₹${totalPayout.toLocaleString()}`, c: T.success },
          { t: 'Disruptions', v: String(activeDisruptions.length), c: T.risk },
          { t: 'Weeks Active', v: String(weeksActive), c: T.primary },
        ].map((st, i) => (
          <View key={i} style={[s.card, s.statCard]}>
            <Text style={[s.statVal, { color: st.c }]}>{st.v}</Text>
            <Text style={s.statLabel}>{st.t}</Text>
          </View>
        ))}
      </View>

      {/* Dev Trigger */}
      <TouchableOpacity activeOpacity={0.7} style={s.devBtn} onPress={triggerPayout}>
        <Ionicons name="flash" size={14} color={T.textTertiary} />
        <Text style={{ color: T.textTertiary, fontSize: 12, marginLeft: 6 }}>Initiate Payout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const HistoryTab = () => {
  const { recentPayouts } = useStore();
  const [expanded, setExpanded] = useState(null);
  const [activeFilter, setActiveFilter] = useState(0);
  return (
    <ScrollView contentContainerStyle={s.tabScroll} showsVerticalScrollIndicator={false}>
      <Text style={s.pageHeading}>Payout History</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {['All', 'This Week', 'This Month', 'This Year'].map((t, i) => (
          <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => setActiveFilter(i)} style={[s.filterChip, i === activeFilter && s.filterChipActive]}>
            <Text style={[s.filterChipText, i === activeFilter && { color: '#fff' }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {recentPayouts.map(p => {
        const isExp = expanded === p.id;
        return (
          <TouchableOpacity key={p.id} style={[s.card, { padding: 16, marginBottom: 10 }]} onPress={() => setExpanded(isExp ? null : p.id)} activeOpacity={0.9}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={s.iconBubble}><Ionicons name="rainy" size={18} color={T.primary} /></View>
                <View>
                  <Text style={{ color: T.textPrimary, fontWeight: '700', fontSize: 15 }}>{p.reason}</Text>
                  <Text style={{ color: T.textTertiary, fontSize: 12, marginTop: 2 }}>{p.date} · {p.zone}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: T.success, fontWeight: '800', fontSize: 15 }}>+₹{p.amount}</Text>
                <Text style={{ color: T.success, fontSize: 11, marginTop: 2 }}>{p.status}</Text>
              </View>
            </View>
            {isExp && (
              <Animated.View entering={FadeInUp} style={s.expandArea}>
                {[['Event ID', p.eventId], ['Trigger', p.details.threshold], ['GPS', p.details.gps], ['Fraud Score', p.details.fraud], ['UPI Txn', 'TXN89274982739']].map(([k, v], i) => (
                  <View key={i} style={s.detailRow}>
                    <Text style={s.detailK}>{k}</Text>
                    <Text style={s.detailV}>{v}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const AlertsTab = () => {
  const { activeDisruptions } = useStore();

  return (
    <ScrollView contentContainerStyle={s.tabScroll} showsVerticalScrollIndicator={false}>
      <Text style={s.pageHeading}>Disruption Alerts</Text>
      {activeDisruptions.length === 0 ? (
        <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: T.success, padding: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="checkmark-circle" size={18} color={T.success} />
            <Text style={{ color: T.success, fontWeight: '700', fontSize: 15 }}>All Clear</Text>
          </View>
          <Text style={{ color: T.textTertiary, fontSize: 13, marginTop: 8 }}>No active disruptions in your zone right now.</Text>
        </View>
      ) : activeDisruptions.map((d) => (
        <View key={d.id} style={[s.card, { borderLeftWidth: 3, borderLeftColor: T.warning, padding: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="warning" size={18} color={T.warning} />
              <Text style={{ color: T.warning, fontWeight: '700', fontSize: 15 }}>{d.type}</Text>
            </View>
            <View style={s.chipWarning}><Text style={s.chipWarningText}>Active</Text></View>
          </View>
          <Text style={{ color: T.textPrimary, marginTop: 12, fontSize: 14 }}>Zone: {d.zone}</Text>
          <Text style={{ color: T.textTertiary, fontSize: 13, marginTop: 4, lineHeight: 19 }}>Started at {new Date(d.start_time).toLocaleTimeString('en-IN')} · Threshold {d.threshold_value || 'N/A'}</Text>
        </View>
      ))}

    <Text style={[s.sectionTitle, { marginTop: 28 }]}>7-Day Risk Calendar</Text>
    <View style={[s.card, { padding: 16 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => <Text key={i} style={s.calHead}>{d}</Text>)}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[{ p: 10, c: T.success }, { p: 20, c: T.success }, { p: 72, c: T.risk }, { p: 15, c: T.success }, { p: 45, c: T.warning }, { p: 5, c: T.success }, { p: 10, c: T.success }].map((d, i) => (
          <View key={i} style={[s.calCell, { backgroundColor: d.c }]}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{d.p}%</Text>
          </View>
        ))}
      </View>
      <Text style={{ color: T.textTertiary, fontSize: 12, marginTop: 16, textAlign: 'center' }}>Weather risk forecast for your zone</Text>
    </View>
    </ScrollView>
  );
};

const ForecastTab = () => {
  const { workerInsights } = useStore();
  const riskPct = Math.round((workerInsights?.risk?.score ?? 0.5) * 100);
  const riskDays = [
    { day: 'M', val: 78, color: T.risk }, { day: 'T', val: 56, color: T.warning },
    { day: 'W', val: 34, color: T.primary }, { day: 'T', val: 72, color: T.risk },
    { day: 'F', val: 20, color: T.success }, { day: 'S', val: 12, color: T.success },
    { day: 'S', val: 65, color: T.warning },
  ];
  return (
    <ScrollView contentContainerStyle={s.tabScroll} showsVerticalScrollIndicator={false}>
      <Text style={s.pageHeading}>Next Week Forecast</Text>
      <View style={[s.card, { borderWidth: 1, borderColor: T.primary, padding: 20 }]}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <View style={[s.iconBubble, { backgroundColor: T.primaryLight }]}><Ionicons name="hardware-chip" size={18} color={T.primary} /></View>
          <Text style={{ color: T.primary, fontWeight: '700', fontSize: 16 }}>ML Model Prediction</Text>
        </View>
        <View style={s.kvRow}><Text style={s.kvK}>Disruption Prob.</Text><Text style={[s.kvV, { color: T.risk }]}>{riskPct}%</Text></View>
        <View style={s.kvRow}><Text style={s.kvK}>Income at risk</Text><Text style={s.kvV}>₹1,200</Text></View>
        <View style={[s.tipBox, { backgroundColor: T.primaryLight }]}>
          <Text style={{ color: T.primary, fontSize: 13, fontWeight: '600', lineHeight: 19 }}>Recommendation: Maintain at least Silver tier this week due to heavy rains expected.</Text>
        </View>
      </View>

      <Text style={[s.sectionTitle, { marginTop: 24 }]}>Daily Risk Probability</Text>
      <View style={[s.card, { padding: 20 }]}>
        <MiniBar days={riskDays} />
      </View>

      <Text style={[s.sectionTitle, { marginTop: 24 }]}>Risk Breakdown</Text>
      <View style={[s.card, { padding: 20 }]}>
        {[{ l: 'Rain', v: 72, c: T.primary }, { l: 'Heat', v: 8, c: T.warning }, { l: 'Traffic', v: 45, c: T.risk }, { l: 'AQI', v: 12, c: T.textTertiary }].map((b, i) => (
          <View key={i} style={{ marginBottom: i < 3 ? 18 : 0 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: T.textSecondary, fontSize: 13 }}>{b.l}</Text>
              <Text style={{ color: b.c, fontWeight: '700', fontSize: 13 }}>{b.v}%</Text>
            </View>
            <View style={s.progressTrack}><View style={[s.progressFill, { width: `${b.v}%`, backgroundColor: b.c }]} /></View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const ProfileTab = () => {
  const { user, policy, savedByShield, recentPayouts, activeDisruptions, logout } = useStore();
  const [waOn, setWaOn] = useState(true);
  const [pushOn, setPushOn] = useState(true);

  const Section = ({ title, children }) => (
    <View style={[s.card, { padding: 20, marginBottom: 12 }]}>
      <Text style={s.secHead}>{title}</Text>
      {children}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={s.tabScroll} showsVerticalScrollIndicator={false}>
      <Text style={s.pageHeading}>Profile & Policy</Text>

      <Section title="My Policy">
        {[
          ['Policy ID', policy?.id ? policy.id.slice(0, 18).toUpperCase() : 'N/A'],
          ['Tier', user?.tier || 'Silver'],
          ['Premium', policy?.weekly_premium ? `₹${policy.weekly_premium}/week` : 'N/A'],
          ['Status', policy?.status || 'Active'],
        ].map(([k, v], i) => (
          <View key={i} style={s.kvRow}><Text style={s.kvK}>{k}</Text><Text style={[s.kvV, v === 'Active' && { color: T.success }]}>{v}</Text></View>
        ))}
      </Section>

      <Section title="My Details">
        {[
          ['Name', user?.name || 'N/A'],
          ['Mobile', user?.phone || 'N/A'],
          ['City', user?.city || 'N/A'],
          ['Zone', user?.zone || 'N/A'],
          ['Platform', 'Amazon / Flipkart'],
        ].map(([k, v], i) => (
          <View key={i} style={s.kvRow}><Text style={s.kvK}>{k}</Text><Text style={s.kvV}>{v}</Text></View>
        ))}
      </Section>

      <Section title="Income Report (YTD)">
        {[
          ['Total Earnings', `₹${Math.max(savedByShield, 0).toLocaleString()}`],
          ['Disrupted Days', String(activeDisruptions.length)],
          ['Payouts Received', `₹${savedByShield.toLocaleString()}`],
        ].map(([k, v], i) => (
          <View key={i} style={s.kvRow}><Text style={s.kvK}>{k}</Text><Text style={[s.kvV, k === 'Payouts Received' && { color: T.success }]}>{v}</Text></View>
        ))}
        <View style={[s.tipBox, { backgroundColor: T.successLight, marginTop: 12 }]}>
          <Text style={{ color: T.success, textAlign: 'center', fontWeight: '700', fontSize: 13 }}>ZeroRukawat saved you ₹{savedByShield.toLocaleString()} so far</Text>
        </View>
      </Section>

      <Section title="Referral">
        <Text style={{ color: T.textTertiary, fontSize: 13, marginBottom: 12 }}>Refer a partner, earn ₹50</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={s.codeBox}><Text style={s.codeText}>GIGRAHUL50</Text></View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => alert('Copied!')} style={s.copyBtn}>
            <Ionicons name="copy" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </Section>

      <Section title="Settings">
        <TouchableOpacity style={s.settingRow} activeOpacity={0.7}>
          <Text style={s.kvK}>Language</Text><Text style={s.kvV}>English ▾</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.settingRow} activeOpacity={0.7} onPress={() => setWaOn(!waOn)}>
          <Text style={s.kvK}>WhatsApp Alerts</Text>
          <Ionicons name={waOn ? "toggle" : "toggle-outline"} size={30} color={waOn ? T.success : T.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.settingRow, { marginBottom: 0 }]} activeOpacity={0.7} onPress={() => setPushOn(!pushOn)}>
          <Text style={s.kvK}>Push Notifications</Text>
          <Ionicons name={pushOn ? "toggle" : "toggle-outline"} size={30} color={pushOn ? T.success : T.textTertiary} />
        </TouchableOpacity>
      </Section>

      <TouchableOpacity style={s.logoutBtn} activeOpacity={0.65} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={T.risk} />
        <Text style={{ color: T.risk, fontWeight: '700', marginLeft: 8 }}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ═══════════════════════════════════════════
// FULLSCREEN OVERLAY
// ═══════════════════════════════════════════
const FullScreenDisruption = () => {
  const { payoutOverlayVisible } = useStore();
  if (!payoutOverlayVisible) return null;
  return (
    <Animated.View entering={FadeIn} style={s.overlay}>
      <View style={s.overlayInner}>
        <ActivityIndicator size="large" color={T.primary} />
        <Text style={s.overlayTitle}>Processing Payout</Text>
        <Text style={s.overlaySub}>Validating disruption parameters...</Text>
      </View>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════
export default function App() {
  const { user, onboardingStage, activeTab, setActiveTab, hydrateDashboard } = useStore();

  useEffect(() => {
    if (user) return;
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const jwt = window.localStorage.getItem('zr_token');
    if (!jwt) return;

    (async () => {
      try {
        const meResp = await api.getMe(jwt);
        const worker = meResp?.data;
        if (!worker?.id) return;

        const policyResp = await api.getPolicy(worker.id, jwt).catch(() => ({ data: null }));
        useStore.setState({
          token: jwt,
          user: { ...worker, avatar: toAvatar(worker?.name) },
          policy: policyResp?.data || null,
        });
        await useStore.getState().hydrateDashboard();
      } catch {
        window.localStorage.removeItem('zr_token');
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    hydrateDashboard();
  }, [user, hydrateDashboard]);

  if (!user) {
    return (
      <View style={s.root}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ height: Platform.OS === 'ios' ? 60 : 44 }} />
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
    { id: 'HOME', icon: 'home-outline', iconActive: 'home', label: 'Home' },
    { id: 'HISTORY', icon: 'time-outline', iconActive: 'time', label: 'History' },
    { id: 'FORECAST', icon: 'analytics-outline', iconActive: 'analytics', label: 'Forecast' },
    { id: 'ALERTS', icon: 'notifications-outline', iconActive: 'notifications', label: 'Alerts' },
    { id: 'PROFILE', icon: 'person-outline', iconActive: 'person', label: 'Profile' },
  ];

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        {activeTab === 'HOME' && <DashboardTab />}
        {activeTab === 'HISTORY' && <HistoryTab />}
        {activeTab === 'FORECAST' && <ForecastTab />}
        {activeTab === 'ALERTS' && <AlertsTab />}
        {activeTab === 'PROFILE' && <ProfileTab />}
      </View>
      <View style={s.navBar}>
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <TouchableOpacity key={t.id} style={s.navTab} onPress={() => setActiveTab(t.id)} activeOpacity={0.7}>
              <Ionicons name={active ? t.iconActive : t.icon} size={22} color={active ? T.primary : T.textTertiary} />
              <Text style={[s.navLabel, active && { color: T.primary, fontWeight: '700' }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <FullScreenDisruption />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bgSoft },

  // ─── Onboarding ───
  onboardCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  onboardPad: { flex: 1, paddingHorizontal: 24 },
  logoBadge: { width: 72, height: 72, borderRadius: 20, backgroundColor: T.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20, ...T.shadow2 },
  heroTitle: { color: T.textPrimary, fontSize: 32, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  heroSub: { color: T.textSecondary, fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  stepTitle: { color: T.textPrimary, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  stepSub: { color: T.textSecondary, fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 22 },
  backChip: { alignSelf: 'flex-start', marginBottom: 24, padding: 10, borderRadius: 12, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, ...T.shadow1 },
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.successLight, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 20 },

  // ─── Buttons ───
  btn: { backgroundColor: T.primary, flexDirection: 'row', paddingVertical: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 10, width: '100%', ...T.shadow2 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnOutline: { backgroundColor: T.bg, flexDirection: 'row', paddingVertical: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: T.border, width: '100%' },

  // ─── Inputs ───
  phoneRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.bg, borderRadius: 14, marginTop: 24, borderWidth: 1.5, borderColor: T.border, width: '100%', ...T.shadow1 },
  prefixBox: { paddingHorizontal: 16, paddingVertical: 16, borderRightWidth: 1, borderRightColor: T.border },
  prefixText: { color: T.textPrimary, fontSize: 17, fontWeight: '700' },
  phoneInput: { flex: 1, color: T.textPrimary, fontSize: 17, padding: 16, fontWeight: '700' },
  otpField: { backgroundColor: T.bg, borderRadius: 14, marginTop: 24, borderWidth: 1.5, borderColor: T.border, width: '55%', color: T.textPrimary, fontSize: 28, fontWeight: '800', padding: 16, letterSpacing: 16, ...T.shadow1 },
  formScroll: { padding: 24, paddingBottom: 48 },
  fieldLabel: { color: T.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  fieldInput: { backgroundColor: T.bg, borderRadius: 12, borderWidth: 1.5, borderColor: T.border, color: T.textPrimary, padding: 14, fontSize: 15, fontWeight: '500' },

  // ─── Plans ───
  planCard: { borderWidth: 1.5, borderColor: T.border, borderRadius: 16, padding: 20, marginBottom: 12, width: '100%', backgroundColor: T.bg, ...T.shadow1 },
  planTitle: { color: T.textPrimary, fontSize: 18, fontWeight: '800' },
  planEarn: { color: T.textTertiary, fontSize: 13, marginTop: 2 },
  priceBadge: { backgroundColor: T.bgMuted, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  priceText: { color: T.textPrimary, fontWeight: '700', fontSize: 14 },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  planLabel: { color: T.textTertiary, fontSize: 13 },
  planVal: { color: T.textPrimary, fontWeight: '600', fontSize: 13 },
  aiTip: { flexDirection: 'row', backgroundColor: T.primaryLight, padding: 14, borderRadius: 12, gap: 10, marginTop: 8 },
  aiTipText: { color: T.primary, fontSize: 13, flex: 1, lineHeight: 19 },
  finePrint: { color: T.textTertiary, fontSize: 12, marginTop: 16, textAlign: 'center' },

  // ─── Confirmation ───
  confirmCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: T.successLight, borderWidth: 3, borderColor: T.success, alignItems: 'center', justifyContent: 'center' },
  invoiceBox: { backgroundColor: T.bg, padding: 24, borderRadius: 16, width: '100%', marginTop: 28, borderWidth: 1, borderColor: T.border, ...T.shadow2 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  invoiceK: { color: T.textTertiary, fontSize: 14 },
  invoiceV: { color: T.textPrimary, fontSize: 15, fontWeight: '700' },

  // ─── Dashboard ───
  tabScroll: { padding: 20, paddingTop: Platform.OS === 'ios' ? 12 : 44, paddingBottom: 110 },
  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greetName: { color: T.textPrimary, fontSize: 22, fontWeight: '800' },
  chipSuccess: { backgroundColor: T.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chipSuccessText: { color: T.success, fontSize: 11, fontWeight: '700' },
  chipNeutral: { backgroundColor: T.bgMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chipNeutralText: { color: T.textSecondary, fontSize: 11, fontWeight: '700' },
  chipWarning: { backgroundColor: T.warningLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chipWarningText: { color: T.warning, fontSize: 11, fontWeight: '700' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: T.primary },
  avatarLetter: { color: T.primary, fontWeight: '800', fontSize: 16 },

  // ─── Cards ───
  card: { backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.border, ...T.shadow1 },
  statusCard: { padding: 16, borderColor: T.success, backgroundColor: T.bg, marginBottom: 24 },
  statusIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: T.successLight, justifyContent: 'center', alignItems: 'center' },
  statusTitle: { color: T.textPrimary, fontWeight: '700', fontSize: 16 },
  statusSub: { color: T.textTertiary, fontSize: 13, marginTop: 2 },
  sectionTitle: { color: T.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 12 },
  metaLabel: { color: T.textTertiary, fontSize: 12, fontWeight: '500' },
  bigNum: { color: T.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 2 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  statVal: { fontWeight: '800', fontSize: 18 },
  statLabel: { color: T.textTertiary, fontSize: 11, marginTop: 4, fontWeight: '500' },
  devBtn: { marginTop: 28, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: T.border, flexDirection: 'row', justifyContent: 'center', borderStyle: 'dashed', backgroundColor: T.bg },

  // ─── History ───
  pageHeading: { color: T.textPrimary, fontSize: 26, fontWeight: '800', marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: T.bg, marginRight: 8, borderWidth: 1, borderColor: T.border },
  filterChipActive: { backgroundColor: T.primary, borderColor: T.primary },
  filterChipText: { color: T.textSecondary, fontWeight: '600', fontSize: 13 },
  iconBubble: { width: 38, height: 38, borderRadius: 12, backgroundColor: T.primaryLight, justifyContent: 'center', alignItems: 'center' },
  expandArea: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: T.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailK: { color: T.textTertiary, fontSize: 13 },
  detailV: { color: T.textPrimary, fontSize: 13, fontWeight: '600' },

  // ─── Forecast & Alerts ───
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  kvK: { color: T.textSecondary, fontSize: 14 },
  kvV: { color: T.textPrimary, fontWeight: '600', fontSize: 14 },
  tipBox: { padding: 14, borderRadius: 12, marginTop: 8 },
  progressTrack: { height: 6, backgroundColor: T.bgMuted, borderRadius: 3 },
  progressFill: { height: '100%', borderRadius: 3 },
  calHead: { color: T.textTertiary, fontSize: 12, width: 38, textAlign: 'center', fontWeight: '700' },
  calCell: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // ─── Profile ───
  secHead: { color: T.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  codeBox: { flex: 1, backgroundColor: T.bgMuted, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: T.border },
  codeText: { color: T.textPrimary, textAlign: 'center', letterSpacing: 3, fontWeight: '800', fontSize: 14 },
  copyBtn: { backgroundColor: T.primary, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 10 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: T.risk, backgroundColor: T.riskLight, marginTop: 16, marginBottom: 20 },

  // ─── Bottom Nav ───
  navBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 76, backgroundColor: T.bg, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 16 : 0, borderTopWidth: 1, borderTopColor: T.border, ...T.shadow3 },
  navTab: { alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  navLabel: { color: T.textTertiary, fontSize: 10, marginTop: 3, fontWeight: '500' },

  // ─── Overlay ───
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.96)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  overlayInner: { alignItems: 'center', padding: 32 },
  overlayTitle: { color: T.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 24 },
  overlaySub: { color: T.textSecondary, fontSize: 15, marginTop: 10 },
});
