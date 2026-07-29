import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconCheck, IconEye, IconEyeOff, IconPhone, IconBox, IconUser } from '../components/icons';
import OfficialBadge from '../components/OfficialBadge';
import CorporateVerificationForm from '../components/CorporateVerificationForm';
import { fileToDataUrl, validateImageFile } from '../lib/file';
import { createHeicAwareFileHandler } from '../lib/heic';

const ROLE_BUYER = 'buyer';
const ROLE_SELLER = 'seller';

// Seeded in src/mocks/db.js — kept here too so the sign-in screen can offer one-click
// quick-login for either demo account instead of making you retype them each time.
const DEMO_BUYER = { identifier: 'buyer@falsafahtot.com', password: 'password123' };
const DEMO_SELLER = { identifier: 'seller@falsafahtot.com', password: 'password123' };
const DEMO_ADMIN = { identifier: 'admin@falsafahtot.com', password: 'password123' };

export default function AuthPage() {
  const { signIn, signUp, verifyOtp, forgotPassword, user } = useAuth();

  const [screen, setScreen] = useState('signin'); // signin | signup | otp | forgot | success
  const [signupStep, setSignupStep] = useState(1); // 1: role, 2: details
  const [role, setRole] = useState(ROLE_BUYER);
  const [showPw, setShowPw] = useState(false);
  const [loadingKey, setLoadingKey] = useState(null);

  const [pendingToken, setPendingToken] = useState(null);
  const [otpPurpose, setOtpPurpose] = useState(null); // 'signin' | 'signup' | 'reset'
  const [otpContact, setOtpContact] = useState('');
  const [banner, setBanner] = useState(null); // one-off success message shown on the sign-in screen

  const [signinForm, setSigninForm] = useState({ identifier: '', password: '' });
  const [signinError, setSigninError] = useState(null);

  const [signupForm, setSignupForm] = useState({
    companyName: '',
    phone: '',
    email: '',
    password: '',
    sellerType: 'individual',
    // Individual path
    address: '',
    cnicNumber: '',
    cnicFront: null,
    cnicBack: null,
    // Corporate path
    location: '',
    businessAddress: '',
    businessDocument: null,
    legalCompanyName: '',
    registrationNumber: '',
    ntn: '',
    companyEmail: '',
    companyPhone: '',
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
  });
  const [signupError, setSignupError] = useState(null);

  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotError, setForgotError] = useState(null);

  const isSeller = role === ROLE_SELLER;

  // Deep links (e.g. the "Become a Partner" / "Customer Sign Up" rows in the account menu) can
  // jump straight to the seller or buyer sign-up form via /auth?screen=signup&role=seller (or
  // role=buyer), instead of always landing on the plain sign-in screen.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const wantsSignup = searchParams.get('screen') === 'signup';
    const wantsSeller = searchParams.get('role') === 'seller';
    const wantsBuyer = searchParams.get('role') === 'buyer';
    if (wantsSeller) setRole(ROLE_SELLER);
    if (wantsBuyer) setRole(ROLE_BUYER);
    if (wantsSignup) {
      setScreen('signup');
      setSignupStep(wantsSeller || wantsBuyer ? 2 : 1);
    }
    // Only ever applies on the initial load of this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goSignin = () => {
    setScreen('signin');
    setSigninError(null);
  };
  const goSignup = () => {
    setScreen('signup');
    setSignupStep(1);
    setSignupError(null);
  };
  const goForgot = () => {
    setScreen('forgot');
    setForgotError(null);
  };

  const handleSignin = async (identifier = signinForm.identifier, password = signinForm.password) => {
    if (loadingKey) return;
    setSigninError(null);
    setSigninForm({ identifier, password }); // keep the visible fields in sync for quick-login too
    setLoadingKey('signin');
    try {
      const { pendingToken: token } = await signIn(identifier, password);
      setPendingToken(token);
      setOtpPurpose('signin');
      setOtpContact(identifier);
      setScreen('otp');
    } catch (err) {
      setSigninError(err.message);
    } finally {
      setLoadingKey(null);
    }
  };

  const isCorporate = isSeller && signupForm.sellerType === 'corporate';

  const handleSignup = async () => {
    if (loadingKey) return;
    setSignupError(null);
    if (!signupForm.companyName || !signupForm.email || !signupForm.password) {
      setSignupError('Please fill in all required fields.');
      return;
    }

    let cnicFront = null;
    let cnicBack = null;
    let businessDocument = null;

    if (isSeller && !isCorporate) {
      const normalizedCnic = signupForm.cnicNumber.replace(/\D/g, '');
      if (!signupForm.address.trim()) {
        setSignupError('Address is required for seller accounts.');
        return;
      }
      if (!/^\d{13}$/.test(normalizedCnic)) {
        setSignupError('CNIC number must be exactly 13 digits.');
        return;
      }
      const frontError = validateImageFile(signupForm.cnicFront);
      if (frontError) {
        setSignupError(`CNIC front photo: ${frontError}`);
        return;
      }
      const backError = validateImageFile(signupForm.cnicBack);
      if (backError) {
        setSignupError(`CNIC back photo: ${backError}`);
        return;
      }
      setLoadingKey('signup');
      try {
        [cnicFront, cnicBack] = await Promise.all([
          fileToDataUrl(signupForm.cnicFront),
          fileToDataUrl(signupForm.cnicBack),
        ]);
      } catch {
        setSignupError('Could not read the CNIC images. Please try uploading them again.');
        setLoadingKey(null);
        return;
      }
    } else if (isCorporate) {
      // The wizard itself already gates its own Next/Submit buttons on both steps being fully
      // valid, so by the time this fires the corporate fields are known-good — only the file
      // read can still fail here.
      setLoadingKey('signup');
      try {
        businessDocument = await fileToDataUrl(signupForm.businessDocument);
      } catch {
        setSignupError('Could not read the business document. Please try uploading it again.');
        setLoadingKey(null);
        return;
      }
    } else {
      setLoadingKey('signup');
    }

    try {
      const { pendingToken: token } = await signUp({
        role,
        companyName: signupForm.companyName,
        country: 'Pakistan',
        phone: signupForm.phone,
        email: signupForm.email,
        password: signupForm.password,
        sellerType: isSeller ? signupForm.sellerType : undefined,
        address: isSeller && !isCorporate ? signupForm.address : undefined,
        cnicNumber: isSeller && !isCorporate ? signupForm.cnicNumber : undefined,
        cnicFront,
        cnicBack,
        location: isCorporate ? signupForm.location : undefined,
        businessAddress: isCorporate ? signupForm.businessAddress : undefined,
        businessDocument,
        legalCompanyName: isCorporate ? signupForm.legalCompanyName : undefined,
        registrationNumber: isCorporate ? signupForm.registrationNumber : undefined,
        ntn: isCorporate ? signupForm.ntn : undefined,
        companyEmail: isCorporate ? signupForm.companyEmail : undefined,
        companyPhone: isCorporate ? signupForm.companyPhone : undefined,
        bankName: isCorporate ? signupForm.bankName : undefined,
        accountTitle: isCorporate ? signupForm.accountTitle : undefined,
        accountNumber: isCorporate ? signupForm.accountNumber : undefined,
        iban: isCorporate ? signupForm.iban : undefined,
      });
      setPendingToken(token);
      setOtpPurpose('signup');
      setOtpContact(signupForm.email);
      setScreen('otp');
    } catch (err) {
      setSignupError(err.message);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleForgot = async () => {
    if (loadingKey) return;
    setForgotError(null);
    if (!forgotIdentifier.trim()) {
      setForgotError('Enter your email or phone number.');
      return;
    }
    setLoadingKey('forgot');
    try {
      const { pendingToken: token } = await forgotPassword(forgotIdentifier);
      setPendingToken(token);
      setOtpPurpose('reset');
      setOtpContact(forgotIdentifier);
      setScreen('otp');
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setLoadingKey(null);
    }
  };

  const [otpError, setOtpError] = useState(null);

  const handleVerifyOtp = async (code) => {
    if (loadingKey) return;
    setOtpError(null);
    setLoadingKey('otp');
    try {
      const result = await verifyOtp(pendingToken, code);
      if (result.purpose === 'reset') {
        setBanner('Password reset confirmed — please sign in.');
        setScreen('signin');
      } else {
        setScreen('success');
      }
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-cream px-4 py-5 overflow-y-auto font-sans text-ink">
      {/* Branding — large bold wordmark doubles as the page heading */}
      <Link to="/" className="flex flex-col items-center gap-1.5 mb-5 sm:mb-6 no-underline shrink-0">
        <span className="flex items-center gap-2">
          <span className="font-display text-[36px] sm:text-[46px] font-bold text-green tracking-tight leading-none">
            Falsafah
          </span>
          <OfficialBadge size={22} tooltipPosition="bottom" />
        </span>
        <span className="text-[13px] sm:text-sm text-text text-center max-w-[300px] text-balance">
          Trade worldwide with sellers you can trust.
        </span>
      </Link>

      {/* Login card */}
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl shadow-black/[0.08] border border-border/60 p-6 sm:p-8">
        {screen === 'signin' && (
          <SignIn
            form={signinForm}
            setForm={setSigninForm}
            showPw={showPw}
            setShowPw={setShowPw}
            loading={loadingKey === 'signin'}
            error={signinError}
            banner={banner}
            onSubmit={handleSignin}
            onQuickLogin={handleSignin}
            goForgot={goForgot}
            goSignup={goSignup}
          />
        )}

        {screen === 'signup' && signupStep === 1 && (
          <SignUpRole role={role} setRole={setRole} onContinue={() => setSignupStep(2)} goSignin={goSignin} />
        )}

        {screen === 'signup' && signupStep === 2 && (
          <SignUpDetails
            form={signupForm}
            setForm={setSignupForm}
            isSeller={isSeller}
            showPw={showPw}
            setShowPw={setShowPw}
            loading={loadingKey === 'signup'}
            error={signupError}
            onBack={() => setSignupStep(1)}
            onSubmit={handleSignup}
            goSignin={goSignin}
          />
        )}

        {screen === 'otp' && (
          <Otp
            contact={otpContact}
            loading={loadingKey === 'otp'}
            error={otpError}
            onSubmit={handleVerifyOtp}
            goSignin={goSignin}
          />
        )}

        {screen === 'forgot' && (
          <Forgot
            identifier={forgotIdentifier}
            setIdentifier={setForgotIdentifier}
            loading={loadingKey === 'forgot'}
            error={forgotError}
            onSubmit={handleForgot}
            goSignin={goSignin}
          />
        )}

        {screen === 'success' && <Success isSeller={user?.role === 'seller'} />}
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-[13.5px] font-semibold text-ink-soft mb-2.5">{children}</label>;
}

const inputClass =
  'w-full px-[18px] py-[15px] border-[1.5px] border-border rounded-xl text-[15px] font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';

function ErrorText({ children }) {
  if (!children) return null;
  return <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{children}</p>;
}

function SubmitButton({ loading, children, ...props }) {
  return (
    <a
      {...props}
      className="flex items-center justify-center gap-2.5 text-center cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-[15.5px] py-4 rounded-full shadow-[0_8px_22px_rgba(14,90,70,0.25)] transition-all hover:-translate-y-0.5"
    >
      {loading && (
        <span className="w-4 h-4 border-[2.5px] border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
      )}
      {children}
    </a>
  );
}

// Facebook-style: placeholder-only fields (no labels), wide tap targets, everything
// visible above the fold — no "Welcome back" copy, the wordmark above the card is the heading.
function SignIn({ form, setForm, showPw, setShowPw, loading, error, banner, onSubmit, onQuickLogin, goForgot, goSignup }) {
  const fbInputClass =
    'w-full px-4 py-[14px] border border-border rounded-xl text-base font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow placeholder:text-text-muted';

  const submit = () => onSubmit();

  return (
    <div className="animate-fade-up flex flex-col gap-3">
      {banner && <p className="text-sm text-green bg-green-tint rounded-lg px-3.5 py-2.5 mb-1">{banner}</p>}
      <ErrorText>{error}</ErrorText>

      <input
        type="text"
        value={form.identifier}
        onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Email or phone number"
        className={fbInputClass}
      />

      <div className="relative">
        <input
          type={showPw ? 'text' : 'password'}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Password"
          className={`${fbInputClass} pr-12`}
        />
        <a
          onClick={() => setShowPw((v) => !v)}
          title="Show / hide password"
          aria-label={showPw ? 'Hide password' : 'Show password'}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-green flex items-center"
        >
          {showPw ? <IconEyeOff /> : <IconEye />}
        </a>
      </div>

      <a
        onClick={submit}
        className="flex items-center justify-center gap-2.5 text-center cursor-pointer bg-green hover:bg-green-hover text-white font-bold text-base py-[14px] rounded-xl shadow-[0_6px_16px_rgba(14,90,70,0.28)] transition-all hover:-translate-y-0.5 mt-1"
      >
        {loading && (
          <span className="w-4 h-4 border-[2.5px] border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
        )}
        {loading ? 'Signing in…' : 'Sign In'}
      </a>

      <a onClick={goForgot} className="cursor-pointer text-center text-sm text-green font-medium hover:underline">
        Forgot Password?
      </a>

      <div className="h-px bg-border my-1.5" />

      <a
        onClick={goSignup}
        className="block text-center cursor-pointer bg-white border-[1.5px] border-orange text-orange-text font-semibold text-[15px] py-[13px] rounded-xl hover:bg-orange-tint transition-colors"
      >
        Create new account
      </a>

      <div className="mt-1">
        <p className="text-center text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2">
          Quick access — demo accounts
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => onQuickLogin(DEMO_BUYER.identifier, DEMO_BUYER.password)}
            className="flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green-tint hover:bg-green-tint/70 text-green font-semibold text-[13px] py-2.5 rounded-lg transition-colors"
          >
            Buyer demo
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onQuickLogin(DEMO_SELLER.identifier, DEMO_SELLER.password)}
            className="flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-orange-tint hover:bg-orange-tint/70 text-orange-text font-semibold text-[13px] py-2.5 rounded-lg transition-colors"
          >
            Seller demo
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onQuickLogin(DEMO_ADMIN.identifier, DEMO_ADMIN.password)}
            className="flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-surface-muted hover:bg-border text-ink-soft font-semibold text-[13px] py-2.5 rounded-lg transition-colors"
          >
            Admin demo
          </button>
        </div>
        <p className="text-center text-[11px] text-text-muted mt-2 leading-relaxed">
          {DEMO_BUYER.identifier} / {DEMO_SELLER.identifier} / {DEMO_ADMIN.identifier} — password: {DEMO_BUYER.password}
        </p>
      </div>
    </div>
  );
}

function SignUpRole({ role, setRole, onContinue, goSignin }) {
  const RoleCard = ({ value, icon, iconBg, title, desc }) => {
    const active = role === value;
    return (
      <div
        onClick={() => setRole(value)}
        className="flex gap-[18px] items-start bg-white border-2 rounded-2xl p-[22px] cursor-pointer transition-colors hover:border-green"
        style={{ borderColor: active ? '#0E5A46' : '#E4E0D6' }}
      >
        <span className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          {icon}
        </span>
        <span className="flex-1">
          <span className="flex items-center justify-between">
            <span className="font-bold text-base">{title}</span>
            <span
              className="w-[21px] h-[21px] rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: active ? '#0E5A46' : '#E4E0D6' }}
            >
              <span className="w-[11px] h-[11px] rounded-full" style={{ background: active ? '#0E5A46' : 'transparent' }} />
            </span>
          </span>
          <span className="block text-[13.5px] text-text leading-relaxed mt-1.5">{desc}</span>
        </span>
      </div>
    );
  };

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-[26px] font-bold m-0 mb-2.5 tracking-tight">Create your account</h1>
      <p className="text-[15px] text-text mb-6">Step 1 of 2 — choose your account type</p>

      <div className="flex flex-col gap-4">
        <RoleCard
          value={ROLE_BUYER}
          icon={<IconUser className="text-green" />}
          iconBg="#E8F3EE"
          title="I'm a Buyer"
          desc="Source wholesale products from verified sellers worldwide."
        />
        <RoleCard
          value={ROLE_SELLER}
          icon={<IconBox className="text-orange-text" />}
          iconBg="#FBEEDD"
          title="I'm a Seller"
          desc="List products, reach buyers in 190+ countries, get verified."
        />

        <a
          onClick={onContinue}
          className="block text-center cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-[15.5px] py-4 rounded-full mt-1 shadow-[0_8px_22px_rgba(14,90,70,0.25)] transition-all hover:-translate-y-0.5"
        >
          Continue
        </a>
      </div>

      <p className="text-center text-sm text-text mt-6">
        Already have an account?{' '}
        <a onClick={goSignin} className="cursor-pointer font-bold text-green hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}

function SignUpDetails({ form, setForm, isSeller, showPw, setShowPw, loading, error, onBack, onSubmit, goSignin }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  // Converts HEIC/HEIF photos (the default format on iPhones) to JPEG the moment they're
  // selected, so a downstream Android/desktop admin reviewing this KYC photo can actually see it.
  const setFile = (key) => createHeicAwareFileHandler((file) => setForm((f) => ({ ...f, [key]: file })));
  const fileInputClass = `${inputClass} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-green-tint file:px-3 file:py-2 file:text-xs file:font-semibold file:text-green`;
  const isCorporate = isSeller && form.sellerType === 'corporate';
  const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-[26px] font-bold m-0 mb-2.5 tracking-tight">Create your account</h1>
      <p className="text-[15px] text-text mb-6">Step 2 of 2 — your business details</p>

      <div
        className="inline-flex items-center gap-2 text-[12.5px] font-bold px-4 py-1.5 rounded-full mb-5"
        style={{ background: isSeller ? '#FBEEDD' : '#E8F3EE', color: isSeller ? '#A05E17' : '#0E5A46' }}
      >
        {isSeller ? 'Seller' : 'Buyer'} account{' '}
        <a onClick={onBack} className="cursor-pointer underline font-semibold">
          change
        </a>
      </div>

      {!isCorporate && <ErrorText>{error}</ErrorText>}

      <div className="mb-[18px]">
        <FieldLabel>{isSeller ? 'Business / factory name' : 'Company name'}</FieldLabel>
        <input
          type="text"
          value={form.companyName}
          onChange={set('companyName')}
          placeholder={isSeller ? 'e.g. Anwar Textile Mills' : 'e.g. Al-Karam Traders'}
          className={inputClass}
        />
      </div>

      {isSeller && (
        <div className="mb-[18px]">
          <FieldLabel>Seller type</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'individual', label: 'Individual' },
              { value: 'corporate', label: 'Corporate' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2.5 px-4 py-3 border-[1.5px] rounded-xl cursor-pointer transition-colors ${
                  form.sellerType === opt.value ? 'border-orange bg-orange-tint' : 'border-border hover:border-border-strong'
                }`}
              >
                <input
                  type="radio"
                  name="seller_type"
                  value={opt.value}
                  checked={form.sellerType === opt.value}
                  onChange={() => patchForm({ sellerType: opt.value })}
                  className="accent-orange w-4 h-4"
                />
                <span className={`text-[14px] font-semibold ${form.sellerType === opt.value ? 'text-orange-text' : 'text-ink-soft'}`}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 mb-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div>
          <FieldLabel>Country</FieldLabel>
          <div className="flex items-center justify-between px-[18px] py-[15px] border-[1.5px] border-border rounded-xl text-[15px] bg-white cursor-pointer hover:border-green transition-colors">
            <span>🇵🇰 Pakistan</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A857A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        <div>
          <FieldLabel>Phone number</FieldLabel>
          <input type="text" value={form.phone} onChange={set('phone')} placeholder="+92 300 0000000" className={inputClass} />
        </div>
      </div>

      {isSeller && (
        <div className="mb-[18px]">
          <FieldLabel>Main product category</FieldLabel>
          <div className="flex items-center justify-between px-[18px] py-[15px] border-[1.5px] border-border rounded-xl text-[15px] bg-white cursor-pointer hover:border-green transition-colors">
            <span className="text-text-muted">Select — Textiles, Surgical, Sports…</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A857A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      )}

      {isSeller && !isCorporate && (
        <div className="mb-[18px]">
          <FieldLabel>Business address</FieldLabel>
          <textarea
            value={form.address}
            onChange={set('address')}
            placeholder="Plot / street, city, province"
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      )}

      {isSeller && !isCorporate && (
        <div className="mb-[18px]">
          <FieldLabel>CNIC number</FieldLabel>
          <input
            type="text"
            inputMode="numeric"
            value={form.cnicNumber}
            onChange={set('cnicNumber')}
            placeholder="42101-1234567-1"
            maxLength={15}
            className={inputClass}
          />
          <p className="text-[11.5px] text-text-muted mt-1.5">13 digits — dashes are fine, we'll strip them automatically.</p>
        </div>
      )}

      {isSeller && !isCorporate && (
        <div className="grid gap-4 mb-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <div>
            <FieldLabel>CNIC front photo</FieldLabel>
            <input type="file" accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif" onChange={setFile('cnicFront')} className={fileInputClass} />
            {form.cnicFront && <p className="text-[11.5px] text-green mt-1.5 truncate">✓ {form.cnicFront.name}</p>}
          </div>
          <div>
            <FieldLabel>CNIC back photo</FieldLabel>
            <input type="file" accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif" onChange={setFile('cnicBack')} className={fileInputClass} />
            {form.cnicBack && <p className="text-[11.5px] text-green mt-1.5 truncate">✓ {form.cnicBack.name}</p>}
          </div>
        </div>
      )}

      <div className="mb-[18px]">
        <FieldLabel>{isSeller ? 'Account email (for signing in)' : 'Business email'}</FieldLabel>
        <input type="text" value={form.email} onChange={set('email')} placeholder="name@company.com" className={inputClass} />
      </div>

      <div className="mb-6">
        <FieldLabel>Password</FieldLabel>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            placeholder="At least 8 characters"
            className={inputClass}
            style={{ paddingRight: 52 }}
          />
          <a
            onClick={() => setShowPw((v) => !v)}
            title="Show / hide password"
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-green flex items-center"
          >
            {showPw ? <IconEyeOff /> : <IconEye />}
          </a>
        </div>
      </div>

      {isSeller && !isCorporate && (
        <div className="flex gap-3 items-start bg-orange-tint rounded-xl px-[18px] py-[15px] mb-6">
          <IconShieldSmall />
          <span className="text-[13px] text-orange-text-dark leading-relaxed">
            Seller accounts go through CNIC identity verification before listings go live — usually within 2 working
            days. Your CNIC images are stored securely and only visible to our review team.
          </span>
        </div>
      )}

      {isCorporate && (
        <div className="flex gap-3 items-start bg-orange-tint rounded-xl px-[18px] py-[15px] mb-6">
          <IconShieldSmall />
          <span className="text-[13px] text-orange-text-dark leading-relaxed">
            Corporate accounts go through business verification (registration, NTN, and bank details) before
            listings go live — usually within 2 working days.
          </span>
        </div>
      )}

      {isCorporate ? (
        <CorporateVerificationForm
          value={form}
          onChange={patchForm}
          onSubmit={onSubmit}
          onBack={() => patchForm({ sellerType: 'individual' })}
          loading={loading}
          error={error}
        />
      ) : (
        <>
          <SubmitButton onClick={onSubmit} loading={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </SubmitButton>
          <p className="text-xs text-text-muted text-center mt-[18px] leading-relaxed">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </>
      )}

      <p className="text-center text-sm text-text mt-6">
        Already have an account?{' '}
        <a onClick={goSignin} className="cursor-pointer font-bold text-green hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}

function IconShieldSmall() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A05E17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function Otp({ contact, loading, error, onSubmit, goSignin }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (i, raw) => {
    const clean = raw.replace(/[^0-9]/g, '').slice(-1);
    setDigits((d) => {
      const next = [...d];
      next[i] = clean;
      return next;
    });
    if (clean && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === 'Enter') submit();
  };

  const submit = () => {
    const code = digits.join('');
    if (code.length === 6) onSubmit(code);
  };

  return (
    <div className="text-center animate-fade-up">
      <span className="w-14 h-14 rounded-[18px] bg-green-tint inline-flex items-center justify-center mb-5">
        <IconPhone width="24" height="24" className="text-green" />
      </span>
      <h1 className="font-display text-2xl font-bold m-0 mb-2.5 tracking-tight">Verify your account</h1>
      <p className="text-sm text-text mb-6 leading-relaxed">
        Enter the demo code <strong className="text-ink">123456</strong> to continue{contact ? (
          <>
            {' '}
            for <strong className="text-ink">{contact}</strong>
          </>
        ) : null}
        .
      </p>

      <ErrorText>{error}</ErrorText>

      <div className="flex gap-2 justify-center mb-6">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-[44px] h-[54px] text-center font-display text-xl font-bold border-[1.5px] border-border rounded-xl bg-white text-green outline-none focus:border-green"
          />
        ))}
      </div>

      <SubmitButton onClick={submit} loading={loading}>
        {loading ? 'Verifying…' : 'Verify & continue'}
      </SubmitButton>
      <p className="text-sm text-text mt-5">
        Didn't get the code?{' '}
        <a className="cursor-pointer font-bold text-green hover:underline">Resend in 0:42</a>
      </p>
      <p className="mt-4">
        <a onClick={goSignin} className="cursor-pointer text-[13.5px] text-text-muted hover:text-green">
          ← Back to sign in
        </a>
      </p>
    </div>
  );
}

function Forgot({ identifier, setIdentifier, loading, error, onSubmit, goSignin }) {
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl font-bold m-0 mb-2.5 tracking-tight">Reset your password</h1>
      <p className="text-[15px] text-text mb-6 leading-relaxed">
        Enter your email or phone and we'll send you a reset code.
      </p>

      <ErrorText>{error}</ErrorText>

      <div className="mb-6">
        <FieldLabel>Email or phone number</FieldLabel>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="name@company.com or +92 300 0000000"
          className={inputClass}
        />
      </div>

      <SubmitButton onClick={onSubmit} loading={loading}>
        {loading ? 'Sending…' : 'Send reset code'}
      </SubmitButton>
      <p className="text-center mt-5">
        <a onClick={goSignin} className="cursor-pointer text-[13.5px] text-text-muted hover:text-green">
          ← Back to sign in
        </a>
      </p>
    </div>
  );
}

function Success({ isSeller }) {
  return (
    <div className="text-center animate-fade-up">
      <span className="w-16 h-16 rounded-full bg-green inline-flex items-center justify-center mb-5 shadow-[0_12px_30px_rgba(14,90,70,0.3)]">
        <IconCheck width="28" height="28" className="text-white" strokeWidth="2.6" />
      </span>
      <h1 className="font-display text-2xl font-bold m-0 mb-2.5 tracking-tight">You're all set!</h1>
      <p className="text-[15px] text-text mb-6 leading-relaxed">
        {isSeller
          ? "Your seller account is verified. We'll email you once your listings review is complete."
          : 'You are signed in. Enjoy free shipping on your first order.'}
      </p>
      <Link
        to="/"
        className="block text-center cursor-pointer bg-orange hover:bg-orange-hover text-white font-semibold text-[15.5px] py-4 rounded-full no-underline shadow-[0_8px_22px_rgba(201,123,45,0.3)] transition-all hover:-translate-y-0.5"
      >
        Start exploring the marketplace
      </Link>
    </div>
  );
}
