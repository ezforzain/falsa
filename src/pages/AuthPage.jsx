import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { IconCheck, IconEye, IconEyeOff, IconChevronLeft, IconBox, IconUser, IconMail, IconShield, IconGlobe, IconTruck, IconStore } from '../components/icons';
import OfficialBadge from '../components/OfficialBadge';
import CorporateVerificationForm from '../components/CorporateVerificationForm';
import { fileToDataUrl } from '../lib/file';

const ROLE_BUYER = 'buyer';
const ROLE_SELLER = 'seller';

// Real, login-capable demo accounts — provisioned directly in the dev database (not by a
// separate seed script that has to be re-run per deployment, which is why an earlier version of
// this was removed). Clicking a demo button below runs the exact same signIn() → POST
// /api/auth/signin round trip as typing credentials in by hand: real password check, real JWT,
// real role on the account. Override via env vars if you provision different demo accounts.
const DEMO_ACCOUNTS = {
  admin: {
    email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'qatest.admin@falsafah.test',
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'TestAdmin123!',
    redirectTo: '/admin',
  },
  seller: {
    email: import.meta.env.VITE_DEMO_SELLER_EMAIL || 'qatest.seller@falsafah.test',
    password: import.meta.env.VITE_DEMO_SELLER_PASSWORD || 'TestSeller123!',
    redirectTo: '/seller',
  },
};

// Main product category options for seller sign-up. Broad A–Z coverage of what Pakistani
// exporters/manufacturers actually trade in, so almost every seller finds a real match instead
// of the three-item stub this used to be. "Other" is the deliberate catch-all at the end.
const PRODUCT_CATEGORIES = [
  'Agriculture & Farming',
  'Apparel & Clothing',
  'Automobiles & Auto Parts',
  'Ayurvedic & Herbal Products',
  'Bags, Handbags & Luggage',
  'Bathroom & Sanitary Ware',
  'Beauty & Personal Care',
  'Bedding & Linen',
  'Bicycles & Parts',
  'Books & Stationery',
  'Building & Construction Materials',
  'Candles & Fragrances',
  'Carpets & Rugs',
  'Ceramics & Pottery',
  'Chemicals & Dyes',
  'Cleaning & Janitorial Supplies',
  'Coal, Minerals & Ores',
  'Coffee, Tea & Beverages',
  'Computer Hardware & Accessories',
  'Cosmetics & Skincare',
  'Cotton, Yarn & Threads',
  'Dairy Products',
  'Dates & Dried Fruits',
  'Denim & Jeans',
  'Dental Instruments',
  'Disposable & Hygiene Products',
  'Electrical Equipment & Supplies',
  'Electronics & Home Appliances',
  'Energy & Solar Products',
  'Fabrics & Textiles',
  'Fashion Accessories',
  'Fish & Seafood',
  'Fitness & Gym Equipment',
  'Food & Beverages',
  'Footwear & Shoes',
  'Furniture',
  'Garments & Hosiery',
  'Gems & Jewellery',
  'Gifts & Handicrafts',
  'Gloves (Industrial & Surgical)',
  'Grains, Pulses & Cereals',
  'Hand Tools & Power Tools',
  'Hardware & Fasteners',
  'Health & Medical Supplies',
  'Home Decor',
  'Home Textiles',
  'Hospital & Lab Equipment',
  'Hotel & Restaurant Supplies',
  'Industrial Machinery',
  'Instruments & Meters',
  'Iron, Steel & Metals',
  'Kitchenware & Tableware',
  'Leather & Leather Goods',
  'Lighting & Fixtures',
  'Livestock & Poultry',
  'Marble, Granite & Stone',
  'Martial Arts Equipment',
  'Mattresses',
  'Meat & Poultry Products',
  'Medical & Surgical Disposables',
  'Mobile Phones & Accessories',
  'Musical Instruments',
  'Nuts & Kernels',
  'Office Supplies & Equipment',
  'Oils, Ghee & Fats',
  'Packaging & Printing',
  'Paints & Coatings',
  'Paper & Paper Products',
  'Pet Supplies',
  'Pharmaceuticals',
  'Pipes, Tubes & Fittings',
  'Plastic & Plastic Products',
  'Pumps, Valves & Fittings',
  'Rice',
  'Rubber Products',
  'Safety & Security Products',
  'Salt, Spices & Seasonings',
  'School & Educational Supplies',
  'Scientific & Laboratory Instruments',
  'Seeds & Plant Products',
  'Sewing & Embroidery',
  'Solar Energy Products',
  'Sporting Goods & Sportswear',
  'Stationery & Paper Products',
  'Sugar & Sweeteners',
  'Surgical Instruments',
  'Tents & Camping Gear',
  'Tiles & Sanitary Ware',
  'Tobacco & Cigarettes',
  'Towels & Bathrobes',
  'Toys & Games',
  'Tractor Parts & Agricultural Machinery',
  'Travel & Luggage',
  'Uniforms & Workwear',
  'Vegetables & Fruits',
  'Vehicles & Transportation',
  'Watches & Clocks',
  'Water Treatment & Filtration',
  'Welding Equipment',
  'Wheat, Flour & Bakery',
  'Wood & Timber',
  'Wool & Woolen Products',
  'Other',
];

// The left brand panel's trust bullets (desktop only — see the lg:grid split below).
const TRUST_POINTS = [
  { icon: IconShield, label: 'Verified sellers, reviewed before they list' },
  { icon: IconGlobe, label: 'Trading partners in 190+ countries' },
  { icon: IconTruck, label: 'Buyer protection on every order' },
];

// The left brand panel's stat row, under the trust bullets.
const TRUST_STATS = [
  { value: '48k+', label: 'Verified sellers' },
  { value: '190+', label: 'Countries' },
  { value: '99.2%', label: 'Orders protected' },
];

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const { notify } = useNotifications();
  const navigate = useNavigate();

  const [screen, setScreen] = useState('signin'); // signin | signup | forgot | success
  const [signupStep, setSignupStep] = useState(1); // 1: role, 2: details
  const [role, setRole] = useState(ROLE_BUYER);
  const [showPw, setShowPw] = useState(false);
  const [loadingKey, setLoadingKey] = useState(null);

  const [signinForm, setSigninForm] = useState({ identifier: '', password: '' });
  const [signinError, setSigninError] = useState(null);

  const [verifyEmailSendFailed, setVerifyEmailSendFailed] = useState(false);

  const [signupForm, setSignupForm] = useState({
    companyName: '',
    phone: '',
    email: '',
    password: '',
    sellerType: 'individual',
    category: '',
    // Individual path
    address: '',
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
  };

  // A page that requires sign-in (currently just checkout) sends people here as
  // /auth?redirect=/cart so they land back where they were instead of the role-based default.
  // Only a same-app relative path is honored — starts with a single '/', never '//' (which a
  // browser would treat as protocol-relative, i.e. an external redirect).
  const getSafeRedirect = () => {
    const redirect = searchParams.get('redirect');
    return redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : null;
  };

  const handleSignin = async (identifier = signinForm.identifier, password = signinForm.password) => {
    if (loadingKey) return;
    setSigninError(null);
    setLoadingKey('signin');
    try {
      const { user: signedInUser } = await signIn(identifier, password);
      notify('account', 'Signed in', `Welcome back, ${signedInUser.companyName}.`);
      const redirect = getSafeRedirect();
      if (redirect) navigate(redirect);
      else if (signedInUser.role === 'admin') navigate('/admin');
      else if (signedInUser.role === 'seller') navigate('/seller');
      else navigate('/');
    } catch (err) {
      setSigninError(err.message);
    } finally {
      setLoadingKey(null);
    }
  };

  // Demo buttons jump straight into the relevant dashboard rather than sitting through the
  // normal post-signin flow — a one-click preview.
  const handleDemoLogin = async (key) => {
    if (loadingKey) return;
    setSigninError(null);
    setLoadingKey(`demo-${key}`);
    const { email, password, redirectTo } = DEMO_ACCOUNTS[key];
    try {
      const { user: signedInUser } = await signIn(email, password);
      notify('account', 'Signed in', `Welcome back, ${signedInUser.companyName}.`);
      navigate(redirectTo);
    } catch (err) {
      setSigninError(
        err.status === 401
          ? "This demo account isn't set up on this server yet."
          : err.message
      );
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
    if (!signupForm.phone?.trim()) {
      setSignupError('Phone number is required.');
      return;
    }

    let businessDocument = null;

    if (isCorporate) {
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
      const result = await signUp({
        role,
        companyName: signupForm.companyName,
        country: 'Pakistan',
        phone: signupForm.phone,
        email: signupForm.email,
        password: signupForm.password,
        sellerType: isSeller ? signupForm.sellerType : undefined,
        category: isSeller ? signupForm.category || undefined : undefined,
        address: isSeller && !isCorporate ? signupForm.address || undefined : undefined,
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
      setVerifyEmailSendFailed(!!result.emailSendFailed);
      setScreen('success');
    } catch (err) {
      setSignupError(err.message);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div
      className="min-h-[100dvh] w-full font-sans lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] xl:grid-cols-[minmax(0,1fr)_520px]"
      style={{ background: '#eef1f6', color: '#14161c' }}
    >
      {/* Brand panel — desktop/tablet-landscape only. On narrower viewports the wordmark above
          the form card (below) carries the branding instead, so nothing is lost, just relocated. */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden text-white px-12 py-14 xl:px-16"
        style={{ background: 'radial-gradient(120% 130% at 72% 18%, #16386e 0%, #0d2147 46%, #06101f 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(112deg, rgba(90,160,255,.4) 0 1px, rgba(90,160,255,0) 1px 10px)' }}
        />
        <div
          className="absolute -top-32 -left-28 w-[32rem] h-[32rem] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(60,130,255,.28) 0%, rgba(60,130,255,0) 70%)' }}
        />
        <div
          className="absolute top-[12%] -right-24 w-[26rem] h-[26rem] rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(120,180,255,.22)' }}
        />
        <div
          className="absolute top-[18%] -right-10 w-[19rem] h-[19rem] rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(120,180,255,.18)' }}
        />

        <Link to="/" className="relative flex items-center gap-2 no-underline w-fit">
          <span className="font-display text-[26px] font-bold text-white tracking-tight leading-none">Falsafah</span>
          <OfficialBadge size={19} tooltipPosition="bottom" />
        </Link>

        <div className="relative max-w-md my-auto flex flex-col gap-6">
          <span
            className="self-start inline-flex items-center gap-2 text-[11px] font-bold tracking-[1.1px] uppercase px-3.5 py-[7px] rounded-full"
            style={{ color: '#bcd9ff', background: 'rgba(120,180,255,.12)', boxShadow: '0 0 0 1px rgba(120,180,255,.22) inset' }}
          >
            B2B marketplace
          </span>
          <h2 className="font-display text-[clamp(30px,3.6vw,46px)] font-bold leading-[1.12] tracking-tight m-0 text-balance">
            Trade worldwide with sellers you can trust.
          </h2>
          <div className="flex flex-col gap-4">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3.5">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(120,180,255,.16)', color: '#bcd9ff' }}
                >
                  <Icon width="16" height="16" />
                </span>
                <span className="text-[14.5px] font-medium leading-snug" style={{ color: 'rgba(226,238,255,.9)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3.5 pt-6" style={{ boxShadow: 'inset 0 -1px 0 rgba(150,190,255,.16)' }}>
            {TRUST_STATS.map(({ value, label }) => (
              <div key={label} className="flex-1 min-w-[110px]">
                <div className="font-display text-2xl font-bold tracking-tight">{value}</div>
                <div className="mt-1 text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(188,217,255,.65)' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center gap-5 px-4 py-8 sm:py-10 lg:px-10 xl:px-14 min-h-[100dvh] overflow-y-auto">
        {/* Branding — hidden on lg+ since the brand panel already carries it there */}
        <Link to="/" className="lg:hidden flex items-center gap-2 no-underline shrink-0">
          <span className="font-display text-[clamp(30px,3.6vw,40px)] font-bold tracking-tight leading-none" style={{ color: '#0d2147' }}>
            Falsafah
          </span>
          <OfficialBadge size={22} tooltipPosition="bottom" />
        </Link>

        <div
          className="w-full max-w-[440px] bg-white rounded-[26px] p-6 sm:p-[34px] flex flex-col"
          style={{ boxShadow: '0 1px 2px rgba(13,33,71,.05), 0 24px 50px -18px rgba(13,33,71,.25)' }}
        >
          {screen === 'signin' && (
            <>
              <SignIn
                form={signinForm}
                setForm={setSigninForm}
                showPw={showPw}
                setShowPw={setShowPw}
                loading={loadingKey === 'signin'}
                error={signinError}
                onSubmit={handleSignin}
                goForgot={goForgot}
                goSignup={goSignup}
              />
              <DemoAccounts loadingKey={loadingKey} onDemoLogin={handleDemoLogin} />
            </>
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

          {screen === 'forgot' && <Forgot goSignin={goSignin} />}

          {screen === 'success' && (
            <Success isSeller={user?.role === 'seller'} email={user?.email} sendFailed={verifyEmailSendFailed} />
          )}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-[12.5px] font-bold text-[#1d2027] mb-[7px]">{children}</label>;
}

const inputClass =
  'w-full px-4 py-[14px] bg-[#f1f3f7] border-0 rounded-xl text-sm text-[#2a2e38] outline-none placeholder:text-[#9aa0aa] focus:shadow-[0_0_0_1.5px_#0b6bf2_inset] transition-shadow';

// Shared across every primary CTA on this page so radius, shadow, and hover/active feedback
// stay identical everywhere.
const primaryBtnClass =
  'flex items-center justify-center gap-2.5 text-center cursor-pointer bg-[#0b6bf2] hover:bg-[#0a5fd8] text-white font-bold text-[15.5px] py-[15px] rounded-2xl shadow-[0_10px_24px_rgba(11,107,242,0.3)] transition-all active:translate-y-px';

function ErrorText({ children }) {
  if (!children) return null;
  return <p className="text-[13px] font-semibold text-[#c0392b] bg-[#fdecea] rounded-[10px] px-3.5 py-2.5 m-0">{children}</p>;
}

function Spinner({ className = '' }) {
  return (
    <span
      className={`w-4 h-4 border-[2.5px] border-white/35 rounded-full inline-block shrink-0 ${className}`}
      style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }}
    />
  );
}

function SubmitButton({ loading, children, ...props }) {
  return (
    <a {...props} className={primaryBtnClass}>
      {loading && <Spinner />}
      {children}
    </a>
  );
}

const DEMO_ROLE_META = {
  admin: { icon: IconShield, title: 'Login as Admin', loadingTitle: 'Signing in as Admin…', subtitle: DEMO_ACCOUNTS.admin.email },
  seller: { icon: IconStore, title: 'Login as Seller', loadingTitle: 'Signing in as Seller…', subtitle: DEMO_ACCOUNTS.seller.email },
};

function DemoButton({ roleKey, loadingKey, onDemoLogin }) {
  const { icon: Icon, title, loadingTitle, subtitle } = DEMO_ROLE_META[roleKey];
  const isLoading = loadingKey === `demo-${roleKey}`;
  const disabled = Boolean(loadingKey);

  return (
    <button
      type="button"
      onClick={() => onDemoLogin(roleKey)}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-[15px] py-[13px] bg-[#f8f9fc] rounded-xl text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[#eef3fd] transition-colors"
    >
      <span className="w-[38px] h-[38px] rounded-full bg-[#e4edfd] text-[#0b6bf2] flex items-center justify-center shrink-0">
        <Icon width="18" height="18" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-[#14161c]">{isLoading ? loadingTitle : title}</span>
        <span className="block text-[11.5px] text-[#8b9099] mt-0.5 truncate">{subtitle}</span>
      </span>
      {isLoading && (
        <span
          className="w-4 h-4 border-2 border-[#0b6bf2]/25 rounded-full inline-block shrink-0"
          style={{ borderTopColor: '#0b6bf2', animation: 'spin 0.8s linear infinite' }}
        />
      )}
    </button>
  );
}

// One-click preview of the admin/seller experience — signs in with a real, pre-provisioned
// account through the exact same signIn() call as the form above, so role-based access,
// redirects, and permissions all behave exactly like a real account because it is one.
function DemoAccounts({ loadingKey, onDemoLogin }) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px bg-[#e4e7ee] flex-1" />
        <span className="text-[10.5px] font-bold uppercase tracking-[.6px] text-[#9aa0aa] shrink-0">Or explore a demo</span>
        <div className="h-px bg-[#e4e7ee] flex-1" />
      </div>
      <div className="flex flex-col gap-2.5">
        <DemoButton roleKey="admin" loadingKey={loadingKey} onDemoLogin={onDemoLogin} />
        <DemoButton roleKey="seller" loadingKey={loadingKey} onDemoLogin={onDemoLogin} />
      </div>
      <p className="text-[11px] text-[#9aa0aa] text-center mt-3">
        {DEMO_ACCOUNTS.admin.email} / {DEMO_ACCOUNTS.admin.password} &nbsp;·&nbsp; {DEMO_ACCOUNTS.seller.email} / {DEMO_ACCOUNTS.seller.password}
      </p>
    </div>
  );
}

function SignIn({ form, setForm, showPw, setShowPw, loading, error, onSubmit, goForgot, goSignup }) {
  const submit = () => onSubmit();

  return (
    <div className="animate-fade-up flex flex-col gap-[14px]">
      <div className="font-display text-[21px] font-bold tracking-tight text-[#14161c]">Sign in to your account</div>

      <ErrorText>{error}</ErrorText>

      <div className="flex flex-col gap-[7px]">
        <FieldLabel>Email or phone</FieldLabel>
        <input
          type="text"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          autoComplete="username"
          value={form.identifier}
          onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Enter your email"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-[7px]">
        <FieldLabel>Password</FieldLabel>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Enter your password"
            className={`${inputClass} pr-[50px]`}
          />
          <a
            onClick={() => setShowPw((v) => !v)}
            title="Show / hide password"
            aria-label={showPw ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#9aa0aa] hover:text-[#0b6bf2] flex items-center transition-colors"
          >
            {showPw ? <IconEyeOff /> : <IconEye />}
          </a>
        </div>
        <div className="text-right">
          <a
            onClick={goForgot}
            className="cursor-pointer text-[11.5px] font-semibold text-[#0b6bf2] underline underline-offset-2"
          >
            Forget Password?
          </a>
        </div>
      </div>

      <a onClick={submit} className={`${primaryBtnClass} mt-0.5`}>
        {loading && <Spinner />}
        {loading ? 'Signing in…' : 'Log In'}
      </a>

      <p className="m-0 text-center text-[12.5px] font-semibold text-[#6f7580]">
        Do you have account?{' '}
        <a onClick={goSignup} className="cursor-pointer font-semibold text-[#0b6bf2] underline underline-offset-2">
          Sign Up
        </a>
      </p>
    </div>
  );
}

function SignUpRole({ role, setRole, onContinue, goSignin }) {
  const RoleCard = ({ value, icon, title, desc }) => {
    const active = role === value;
    return (
      <div
        onClick={() => setRole(value)}
        className={`flex gap-4 items-start bg-[#f8f9fc] rounded-2xl p-[18px] cursor-pointer transition-shadow ${
          active ? 'shadow-[0_0_0_2px_#0b6bf2_inset]' : 'shadow-[0_0_0_1.5px_#e6e9f0_inset]'
        }`}
      >
        <span className="w-11 h-11 rounded-[13px] bg-[#e4edfd] text-[#0b6bf2] flex items-center justify-center shrink-0">{icon}</span>
        <span className="flex-1">
          <span className="flex items-center justify-between gap-2.5">
            <span className="text-[15.5px] font-bold text-[#14161c]">{title}</span>
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                active ? 'shadow-[0_0_0_2px_#0b6bf2_inset]' : 'shadow-[0_0_0_2px_#cfd4de_inset]'
              }`}
            >
              <span className={`w-[10px] h-[10px] rounded-full ${active ? 'bg-[#0b6bf2]' : 'bg-transparent'}`} />
            </span>
          </span>
          <span className="block text-[13px] text-[#6f7580] leading-relaxed mt-1.5">{desc}</span>
        </span>
      </div>
    );
  };

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      <div>
        <div className="font-display text-[21px] font-bold tracking-tight text-[#14161c]">Sign up to your account</div>
        <p className="m-0 mt-1.5 text-[13.5px] text-[#6f7580]">Step 1 of 2 — choose your account type</p>
      </div>

      <RoleCard
        value={ROLE_BUYER}
        icon={<IconUser width="19" height="19" />}
        title="I'm a Buyer"
        desc="Source wholesale products from verified sellers worldwide."
      />
      <RoleCard
        value={ROLE_SELLER}
        icon={<IconBox width="21" height="21" />}
        title="I'm a Seller"
        desc="List products, reach buyers in 190+ countries, get verified."
      />

      <a onClick={onContinue} className={primaryBtnClass}>
        Continue
      </a>

      <p className="m-0 text-center text-[12.5px] font-semibold text-[#6f7580]">
        Do you have account?{' '}
        <a onClick={goSignin} className="cursor-pointer font-semibold text-[#0b6bf2] underline underline-offset-2">
          Sign In
        </a>
      </p>
    </div>
  );
}

// Searchable category picker — a real dropdown, with a search box pinned to the top so a seller
// can type "surg" instead of scrolling the full A–Z list.
function CategorySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? PRODUCT_CATEGORIES.filter((c) => c.toLowerCase().includes(needle))
    : PRODUCT_CATEGORIES;

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-between px-4 py-[14px] rounded-xl text-sm bg-[#f1f3f7] cursor-pointer transition-shadow ${
          open ? 'shadow-[0_0_0_1.5px_#0b6bf2_inset]' : ''
        }`}
      >
        <span className={value ? 'text-[#2a2e38]' : 'text-[#9aa0aa]'}>{value || 'Select — Textiles, Surgical, Sports…'}</span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9aa0aa"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white rounded-xl shadow-[0_20px_44px_-16px_rgba(13,33,71,0.24)] overflow-hidden">
          <div className="p-2 border-b border-[#e4e7ee]">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="w-full px-3.5 py-2.5 bg-[#f1f3f7] border-0 rounded-lg text-[14px] text-[#2a2e38] outline-none focus:shadow-[0_0_0_1.5px_#0b6bf2_inset]"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-[13.5px] text-[#9aa0aa]">No categories match “{query.trim()}”.</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-[#eef3fd] transition-colors ${
                    value === c ? 'text-[#0b6bf2] font-semibold' : 'text-[#14161c]'
                  }`}
                >
                  <span>{c}</span>
                  {value === c && <IconCheck width="15" height="15" className="shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Client-side-only strength meter — purely cosmetic feedback as someone types; it does not gate
// submission, which stays governed entirely by handleSignup's existing validation.
function passwordStrength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/[0-9]|[^A-Za-z0-9]/.test(p)) s++;
  return p ? Math.max(1, s) : 0;
}

function SignUpDetails({ form, setForm, isSeller, showPw, setShowPw, loading, error, onBack, onSubmit, goSignin }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isCorporate = isSeller && form.sellerType === 'corporate';
  const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));

  const strength = passwordStrength(form.password);
  const strengthColor = strength >= 3 ? '#12b76a' : strength === 2 ? '#f5a524' : '#e0403a';
  const strengthLabel = strength === 0 ? '' : strength === 1 ? 'Weak' : strength === 2 ? 'Fair' : 'Strong';

  return (
    <div className="animate-fade-up">
      <div className="font-display text-[21px] font-bold tracking-tight text-[#14161c]">Sign up to your account</div>
      <p className="m-0 mt-1.5 mb-5 text-[13.5px] text-[#6f7580]">Step 2 of 2 — your business details</p>

      <div className="inline-flex items-center gap-2 text-[12px] font-bold px-3.5 py-1.5 rounded-full mb-5 bg-[#e4edfd] text-[#0a56c2]">
        {isSeller ? 'Seller' : 'Buyer'} account{' '}
        <a onClick={onBack} className="cursor-pointer underline underline-offset-2 font-bold">
          change
        </a>
      </div>

      {!isCorporate && <div className="mb-[18px]"><ErrorText>{error}</ErrorText></div>}

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
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl cursor-pointer transition-shadow ${
                  form.sellerType === opt.value ? 'shadow-[0_0_0_1.5px_#0b6bf2_inset] bg-[#e4edfd]' : 'shadow-[0_0_0_1.5px_#e6e9f0_inset]'
                }`}
              >
                <input
                  type="radio"
                  name="seller_type"
                  value={opt.value}
                  checked={form.sellerType === opt.value}
                  onChange={() => patchForm({ sellerType: opt.value })}
                  className="accent-[#0b6bf2] w-4 h-4"
                />
                <span className={`text-[14px] font-semibold ${form.sellerType === opt.value ? 'text-[#0a56c2]' : 'text-[#1d2027]'}`}>
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
          <div className="flex items-center justify-between px-4 py-[14px] rounded-xl text-sm bg-[#f1f3f7] text-[#2a2e38] cursor-pointer">
            <span>🇵🇰 Pakistan</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9aa0aa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        <div>
          <FieldLabel>Phone number *</FieldLabel>
          <input type="text" value={form.phone} onChange={set('phone')} placeholder="+92 300 0000000" className={inputClass} />
        </div>
      </div>

      {isSeller && (
        <div className="mb-[18px]">
          <FieldLabel>Main product category</FieldLabel>
          <CategorySelect value={form.category} onChange={(c) => patchForm({ category: c })} />
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

      <div className="mb-[18px]">
        <FieldLabel>{isSeller ? 'Account email (for signing in)' : 'Business email'}</FieldLabel>
        <input
          type="text"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          placeholder="name@company.com"
          className={inputClass}
        />
      </div>

      <div className="mb-6">
        <FieldLabel>Password</FieldLabel>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            placeholder="At least 8 characters"
            className={`${inputClass} pr-[50px]`}
          />
          <a
            onClick={() => setShowPw((v) => !v)}
            title="Show / hide password"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#9aa0aa] hover:text-[#0b6bf2] flex items-center transition-colors"
          >
            {showPw ? <IconEyeOff /> : <IconEye />}
          </a>
        </div>
        {form.password && (
          <div className="flex items-center gap-[9px] mt-2">
            <span className="flex-1 h-1 rounded-full" style={{ background: strength >= 1 ? strengthColor : '#e4e7ee' }} />
            <span className="flex-1 h-1 rounded-full" style={{ background: strength >= 2 ? strengthColor : '#e4e7ee' }} />
            <span className="flex-1 h-1 rounded-full" style={{ background: strength >= 3 ? strengthColor : '#e4e7ee' }} />
            <span className="min-w-[44px] text-right text-[11px] font-bold text-[#8b9099]">{strengthLabel}</span>
          </div>
        )}
      </div>

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
            {loading ? 'Creating account…' : 'Create Account'}
          </SubmitButton>
          <p className="text-xs text-[#8b9099] text-center mt-[18px] leading-relaxed">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </>
      )}

      <p className="text-center text-[12.5px] font-semibold text-[#6f7580] mt-6">
        Do you have account?{' '}
        <a onClick={goSignin} className="cursor-pointer font-semibold text-[#0b6bf2] underline underline-offset-2">
          Sign In
        </a>
      </p>
    </div>
  );
}

function Forgot({ goSignin }) {
  return (
    <div className="animate-fade-up flex flex-col gap-[14px]">
      <button
        type="button"
        onClick={goSignin}
        title="Back to sign in"
        className="w-[38px] h-[38px] rounded-full bg-[#f1f3f7] hover:bg-[#e7eaf1] flex items-center justify-center text-[#3a3f48] cursor-pointer transition-colors"
      >
        <IconChevronLeft width="13" height="13" />
      </button>
      <div className="text-center">
        <div className="font-display text-[20px] font-bold tracking-tight text-[#14161c]">Reset your password</div>
        <p className="m-0 mt-2 text-[12.5px] text-[#6f7580] leading-relaxed">
          Self-service password reset isn't available yet. Please contact support to reset your password.
        </p>
      </div>

      <p className="mt-2 text-center">
        <a onClick={goSignin} className="cursor-pointer text-[13.5px] text-[#8b9099] hover:text-[#0b6bf2] transition-colors">
          ← Back to sign in
        </a>
      </p>
    </div>
  );
}

function Success({ isSeller, email, sendFailed }) {
  const { resendVerificationEmail } = useAuth();
  const [resendState, setResendState] = useState('idle'); // idle | sending | sent | error
  const [resendError, setResendError] = useState(null);

  const handleResend = async () => {
    if (resendState === 'sending') return;
    setResendState('sending');
    setResendError(null);
    try {
      await resendVerificationEmail();
      setResendState('sent');
    } catch (err) {
      setResendError(err.message);
      setResendState('error');
    }
  };

  return (
    <div className="animate-fade-up text-center flex flex-col items-center gap-4">
      <span
        className="w-[60px] h-[60px] rounded-full bg-[#0b6bf2] inline-flex items-center justify-center"
        style={{ boxShadow: '0 12px 28px rgba(11,107,242,.32)' }}
      >
        <IconCheck width="26" height="26" className="text-white" strokeWidth="2.6" />
      </span>
      <div>
        <div className="font-display text-[20px] font-bold tracking-tight text-[#14161c]">You're all set!</div>
        <p className="m-0 mt-2 text-[13.5px] text-[#6f7580] leading-relaxed">
          {isSeller
            ? "Your seller account is created. We'll email you once your listings review is complete."
            : 'You are signed in. Enjoy free shipping on your first order.'}
        </p>
      </div>

      {/* Email verification status — the account stays unverified until the link in this email is opened. */}
      <div className="w-full text-left bg-[#f1f5fd] rounded-2xl p-4 flex gap-3">
        <span className="w-9 h-9 rounded-full bg-white inline-flex items-center justify-center shrink-0 text-[#0b6bf2]">
          <IconMail width="16" height="16" />
        </span>
        <div className="min-w-0">
          {sendFailed ? (
            <>
              <p className="text-[13.5px] font-bold text-[#14161c] m-0">Couldn't send your verification email</p>
              <p className="text-[12.5px] text-[#8b9099] mt-1 mb-2 leading-snug">We'll retry when you tap resend.</p>
            </>
          ) : (
            <>
              <p className="text-[13.5px] font-bold text-[#14161c] m-0">Verify your email</p>
              <p className="text-[12.5px] text-[#8b9099] mt-1 mb-2 leading-snug break-words">
                We sent a verification link to <span className="font-semibold text-[#14161c]">{email}</span>. Open it to confirm your account.
              </p>
            </>
          )}
          {resendState === 'sent' ? (
            <p className="text-[12.5px] font-bold text-[#12b76a] m-0">Email sent — check your inbox.</p>
          ) : (
            <a
              onClick={handleResend}
              className={`text-[12.5px] font-bold text-[#0b6bf2] cursor-pointer hover:underline ${resendState === 'sending' ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {resendState === 'sending' ? 'Sending…' : 'Resend email'}
            </a>
          )}
          {resendState === 'error' && <p className="text-[12px] text-[#c0392b] mt-1.5 mb-0">{resendError}</p>}
        </div>
      </div>

      <Link
        to="/"
        className="w-full block text-center cursor-pointer bg-[#0b6bf2] hover:bg-[#0a5fd8] text-white font-bold text-[15.5px] py-[15px] rounded-2xl no-underline shadow-[0_10px_24px_rgba(11,107,242,0.3)] transition-all"
      >
        Start exploring the marketplace
      </Link>
    </div>
  );
}
