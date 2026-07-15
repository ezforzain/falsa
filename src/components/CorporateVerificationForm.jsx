import { useId, useState } from 'react';
import DragDropUpload from './DragDropUpload';
import LocationDropdown from './LocationDropdown';
import { IconAlertCircle, IconCheck } from './icons';

const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function fieldClass(hasError) {
  return `w-full px-[16px] py-[12px] border rounded-xl text-[14.5px] font-sans bg-white text-ink outline-none transition-shadow ${
    hasError
      ? 'border-orange focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,106,0,0.12)]'
      : 'border-border focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,106,0,0.12)]'
  }`;
}

function Field({ label, required, error, show, children }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-ink-soft mb-2">
        {label} {required && <span className="text-orange">*</span>}
      </label>
      {typeof children === 'function' ? children(id) : children}
      {show && error && (
        <p className="flex items-center gap-1.5 text-xs text-orange-text mt-2">
          <IconAlertCircle width="13" height="13" className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const STEPS = ['Corporation Info', 'Bank Info'];

// A modern 2-step verification wizard for corporate sellers: Corporation Information (legal
// entity details, business address, registration document) then Bank Information. Field
// `name=` attributes use snake_case to match a Laravel-style form contract even though the
// React state/JSON payload stays camelCase, consistent with the rest of this app.
export default function CorporateVerificationForm({ value, onChange, onSubmit, onBack, loading = false, error = null }) {
  const [step, setStep] = useState(1);
  const [step1Attempted, setStep1Attempted] = useState(false);
  const [step2Attempted, setStep2Attempted] = useState(false);
  const [touched, setTouched] = useState({});

  const set = (key) => (val) => onChange({ [key]: val });
  const setFromEvent = (key) => (e) => set(key)(e.target.value);
  const markTouched = (key) => () => setTouched((t) => ({ ...t, [key]: true }));

  const step1Errors = {
    legalCompanyName: !value.legalCompanyName?.trim() ? 'Legal company name is required.' : null,
    registrationNumber: !value.registrationNumber?.trim() ? 'Business registration number is required.' : null,
    ntn: !value.ntn?.trim() ? 'NTN is required.' : null,
    companyEmail: !value.companyEmail?.trim()
      ? 'Company email is required.'
      : !isValidEmail(value.companyEmail)
        ? 'Enter a valid email address.'
        : null,
    companyPhone: !value.companyPhone?.trim() ? 'Company phone number is required.' : null,
    location: !value.location?.trim() ? 'Please select a location.' : null,
    businessAddress: !value.businessAddress?.trim() ? 'Business address is required.' : null,
    businessDocument: !value.businessDocument ? 'Please upload your business document.' : null,
  };
  const step2Errors = {
    bankName: !value.bankName?.trim() ? 'Bank name is required.' : null,
    accountTitle: !value.accountTitle?.trim() ? 'Account title is required.' : null,
    accountNumber: !value.accountNumber?.trim() ? 'Account number is required.' : null,
    iban: !value.iban?.trim() ? 'IBAN is required.' : null,
  };
  const step1Valid = Object.values(step1Errors).every((e) => !e);
  const step2Valid = Object.values(step2Errors).every((e) => !e);

  const shows = (key) => step1Attempted || step2Attempted || touched[key];

  const goNext = () => {
    if (!step1Valid) {
      setStep1Attempted(true);
      return;
    }
    setStep(2);
  };

  const submit = () => {
    if (!step2Valid) {
      setStep2Attempted(true);
      return;
    }
    onSubmit();
  };

  return (
    <div className="animate-fade-up">
      {onBack && (
        <a onClick={onBack} className="cursor-pointer text-[13px] text-text-muted hover:text-orange-text font-medium">
          ← Change seller type
        </a>
      )}

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mt-4 mb-6" role="list" aria-label="Verification steps">
        {STEPS.map((label, i) => {
          const n = i + 1;
          return (
            <div key={n} role="listitem" className={`flex items-center ${n < STEPS.length ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <span
                  aria-current={step === n ? 'step' : undefined}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    step > n
                      ? 'bg-orange border-orange text-white'
                      : step === n
                        ? 'border-orange text-orange bg-orange-tint'
                        : 'border-border text-text-muted bg-white'
                  }`}
                >
                  {step > n ? <IconCheck width="14" height="14" strokeWidth="3" /> : n}
                </span>
                <span className={`text-[10.5px] font-semibold whitespace-nowrap ${step >= n ? 'text-orange-text' : 'text-text-muted'}`}>
                  {label}
                </span>
              </div>
              {n < STEPS.length && <div className={`flex-1 h-[2px] mx-2 rounded-full transition-colors ${step > n ? 'bg-orange' : 'bg-border'}`} />}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-5">
          <IconAlertCircle width="14" height="14" className="shrink-0" />
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <Field label="Legal Company Name" required show={shows('legalCompanyName')} error={step1Errors.legalCompanyName}>
            {(id) => (
              <input
                id={id}
                name="legal_company_name"
                type="text"
                value={value.legalCompanyName}
                onChange={setFromEvent('legalCompanyName')}
                onBlur={markTouched('legalCompanyName')}
                aria-invalid={shows('legalCompanyName') && Boolean(step1Errors.legalCompanyName)}
                placeholder="e.g. Anwar Textile Mills (Private) Limited"
                className={fieldClass(shows('legalCompanyName') && step1Errors.legalCompanyName)}
              />
            )}
          </Field>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Field label="Business Registration Number" required show={shows('registrationNumber')} error={step1Errors.registrationNumber}>
              {(id) => (
                <input
                  id={id}
                  name="registration_number"
                  type="text"
                  value={value.registrationNumber}
                  onChange={setFromEvent('registrationNumber')}
                  onBlur={markTouched('registrationNumber')}
                  aria-invalid={shows('registrationNumber') && Boolean(step1Errors.registrationNumber)}
                  placeholder="e.g. 0123456"
                  className={fieldClass(shows('registrationNumber') && step1Errors.registrationNumber)}
                />
              )}
            </Field>
            <Field label="National Tax Number (NTN)" required show={shows('ntn')} error={step1Errors.ntn}>
              {(id) => (
                <input
                  id={id}
                  name="ntn"
                  type="text"
                  value={value.ntn}
                  onChange={setFromEvent('ntn')}
                  onBlur={markTouched('ntn')}
                  aria-invalid={shows('ntn') && Boolean(step1Errors.ntn)}
                  placeholder="e.g. 1234567-8"
                  className={fieldClass(shows('ntn') && step1Errors.ntn)}
                />
              )}
            </Field>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Field label="Company Email" required show={shows('companyEmail')} error={step1Errors.companyEmail}>
              {(id) => (
                <input
                  id={id}
                  name="company_email"
                  type="email"
                  value={value.companyEmail}
                  onChange={setFromEvent('companyEmail')}
                  onBlur={markTouched('companyEmail')}
                  aria-invalid={shows('companyEmail') && Boolean(step1Errors.companyEmail)}
                  placeholder="accounts@company.com"
                  className={fieldClass(shows('companyEmail') && step1Errors.companyEmail)}
                />
              )}
            </Field>
            <Field label="Company Phone Number" required show={shows('companyPhone')} error={step1Errors.companyPhone}>
              {(id) => (
                <input
                  id={id}
                  name="company_phone"
                  type="text"
                  value={value.companyPhone}
                  onChange={setFromEvent('companyPhone')}
                  onBlur={markTouched('companyPhone')}
                  aria-invalid={shows('companyPhone') && Boolean(step1Errors.companyPhone)}
                  placeholder="+92 42 0000000"
                  className={fieldClass(shows('companyPhone') && step1Errors.companyPhone)}
                />
              )}
            </Field>
          </div>

          <div className="h-px bg-border my-1" />

          <h3 className="text-[13.5px] font-bold text-ink -mb-1">Business address</h3>

          <Field label="Location" required show={shows('location')} error={step1Errors.location}>
            {() => (
              <LocationDropdown
                value={value.location}
                onChange={(city) => {
                  set('location')(city);
                  markTouched('location')();
                }}
                label={null}
                required={false}
              />
            )}
          </Field>

          <Field label="Business Address" required show={shows('businessAddress')} error={step1Errors.businessAddress}>
            {(id) => (
              <textarea
                id={id}
                name="business_address"
                value={value.businessAddress}
                onChange={setFromEvent('businessAddress')}
                onBlur={markTouched('businessAddress')}
                aria-invalid={shows('businessAddress') && Boolean(step1Errors.businessAddress)}
                placeholder="Plot / street, area, city"
                rows={3}
                className={`${fieldClass(shows('businessAddress') && step1Errors.businessAddress)} resize-none`}
              />
            )}
          </Field>

          <DragDropUpload
            label="Business Information Document"
            required
            file={value.businessDocument}
            onFileChange={(file) => {
              set('businessDocument')(file);
              markTouched('businessDocument')();
            }}
            error={shows('businessDocument') ? step1Errors.businessDocument : null}
          />

          <button
            type="button"
            onClick={goNext}
            className="hidden sm:flex items-center justify-center gap-2 cursor-pointer bg-orange hover:bg-orange-hover text-white font-semibold text-[15px] py-[14px] rounded-xl shadow-[0_8px_20px_rgba(255,106,0,0.3)] transition-all hover:-translate-y-0.5 mt-2"
          >
            Next: Bank Information
          </button>

          {/* Sticky on mobile so the primary action is always reachable without scrolling the long form. */}
          <div className="sm:hidden sticky bottom-0 -mx-6 px-6 py-3 bg-white/95 backdrop-blur-sm border-t border-border">
            <button
              type="button"
              onClick={goNext}
              className="w-full flex items-center justify-center gap-2 cursor-pointer bg-orange hover:bg-orange-hover text-white font-semibold text-[15px] py-[14px] rounded-xl shadow-[0_8px_20px_rgba(255,106,0,0.3)] transition-all"
            >
              Next: Bank Information
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <Field label="Bank Name" required show={shows('bankName')} error={step2Errors.bankName}>
            {(id) => (
              <input
                id={id}
                name="bank_name"
                type="text"
                value={value.bankName}
                onChange={setFromEvent('bankName')}
                onBlur={markTouched('bankName')}
                aria-invalid={shows('bankName') && Boolean(step2Errors.bankName)}
                placeholder="e.g. Habib Bank Limited"
                className={fieldClass(shows('bankName') && step2Errors.bankName)}
              />
            )}
          </Field>

          <Field label="Account Title" required show={shows('accountTitle')} error={step2Errors.accountTitle}>
            {(id) => (
              <input
                id={id}
                name="account_title"
                type="text"
                value={value.accountTitle}
                onChange={setFromEvent('accountTitle')}
                onBlur={markTouched('accountTitle')}
                aria-invalid={shows('accountTitle') && Boolean(step2Errors.accountTitle)}
                placeholder="Account holder name, matching the company"
                className={fieldClass(shows('accountTitle') && step2Errors.accountTitle)}
              />
            )}
          </Field>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Field label="Account Number" required show={shows('accountNumber')} error={step2Errors.accountNumber}>
              {(id) => (
                <input
                  id={id}
                  name="account_number"
                  type="text"
                  value={value.accountNumber}
                  onChange={setFromEvent('accountNumber')}
                  onBlur={markTouched('accountNumber')}
                  aria-invalid={shows('accountNumber') && Boolean(step2Errors.accountNumber)}
                  placeholder="0123456789012"
                  className={fieldClass(shows('accountNumber') && step2Errors.accountNumber)}
                />
              )}
            </Field>
            <Field label="IBAN" required show={shows('iban')} error={step2Errors.iban}>
              {(id) => (
                <input
                  id={id}
                  name="iban"
                  type="text"
                  value={value.iban}
                  onChange={setFromEvent('iban')}
                  onBlur={markTouched('iban')}
                  aria-invalid={shows('iban') && Boolean(step2Errors.iban)}
                  placeholder="PK00XXXX0000000000000000"
                  className={fieldClass(shows('iban') && step2Errors.iban)}
                />
              )}
            </Field>
          </div>

          <div className="hidden sm:flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="cursor-pointer bg-white border-[1.5px] border-border text-ink-soft font-semibold text-[15px] py-[14px] px-7 rounded-xl hover:bg-surface-muted transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-orange hover:bg-orange-hover text-white font-semibold text-[15px] py-[14px] rounded-xl shadow-[0_8px_20px_rgba(255,106,0,0.3)] transition-all hover:-translate-y-0.5"
            >
              {loading && (
                <span className="w-4 h-4 border-[2.5px] border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
              )}
              {loading ? 'Submitting…' : 'Submit for Verification'}
            </button>
          </div>

          <div className="sm:hidden sticky bottom-0 -mx-6 px-6 py-3 bg-white/95 backdrop-blur-sm border-t border-border flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="cursor-pointer bg-white border-[1.5px] border-border text-ink-soft font-semibold text-sm py-[14px] px-5 rounded-xl hover:bg-surface-muted transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-orange hover:bg-orange-hover text-white font-semibold text-sm py-[14px] rounded-xl shadow-[0_8px_20px_rgba(255,106,0,0.3)] transition-all"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
              )}
              {loading ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
