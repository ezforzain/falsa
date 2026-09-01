import { useEffect, useMemo, useState } from 'react';
import ProductImagesUploader from './ProductImagesUploader';
import CategoryPicker from './CategoryPicker';
import HashtagTextarea from './HashtagTextarea';
import HashtagChipInput from './HashtagChipInput';
import HashtagAiSuggestions from './HashtagAiSuggestions';
import { mergeHashtags } from '../lib/hashtags';
import { getCategoryTemplate, suggestCategories } from '../data/productCategories';
import { IconBox, IconChevronDown, IconClose, IconPlus, IconSparkle, IconTrash } from './icons';

const MAX_IMAGES = 6;
const DISPATCH_OPTIONS = ['Same day', '1-2 days', '3-5 days', '1 week+'];

const emptyForm = {
  name: '',
  category: '',
  description: '',
  sku: '',
  price: '',
  unit: '',
  moq: '',
  stock: '',
  status: 'active',
  images: [],
  tags: [],
  b2bEnabled: false,
  freeShipping: true,
  worldwideFreeShipping: false,
  specifications: {},
  variantAxes: {},
  variants: [],
  shipping: { weightKg: '', lengthCm: '', widthCm: '', heightCm: '', dispatchTime: '', shipsFrom: '', shippingFee: '' },
  priceTiers: [],
};

function extractHashtags(text) {
  const matches = String(text || '').match(/#\w+/g) || [];
  return [...new Set(matches.map((t) => t.slice(1)))];
}

// specifications is stored/edited as { [attrKey]: value } in form state, but persisted/loaded
// as [{label, value}] to match the backend's specSchema-style shape.
function specsArrayToMap(specifications, template) {
  const map = {};
  for (const attr of template.attributes) {
    const found = (specifications || []).find((s) => s.label === attr.label);
    if (found) map[attr.key] = found.value;
  }
  return map;
}

// Mirrors specsArrayToMap for variant axes, so re-opening an edit reconstructs the same
// "Red, Blue" text input the seller typed, and the cartesian regenerate below can re-merge
// against the already-saved variant rows instead of wiping them.
function axesArrayToMap(variantAxes, template) {
  const map = {};
  for (const axis of template.variantAxes) {
    const found = (variantAxes || []).find((a) => a.name === axis.label);
    if (found) map[axis.key] = found.values.join(', ');
  }
  return map;
}

function cartesianVariants(axesMap, template, basePrice) {
  const axes = template.variantAxes
    .map((axis) => ({ axis, values: (axesMap[axis.key] || '').split(',').map((v) => v.trim()).filter(Boolean) }))
    .filter((a) => a.values.length > 0);
  if (axes.length === 0) return [];

  let combos = [[]];
  for (const { axis, values } of axes) {
    const next = [];
    for (const combo of combos) {
      for (const value of values) next.push([...combo, `${axis.label}: ${value}`]);
    }
    combos = next;
  }
  return combos.map((parts) => ({ name: parts.join(' / '), price: basePrice || '', stock: '' }));
}

// Collapsible section wrapper shared by Product details/Variants, Shipping, and the B2B block —
// a click on the header toggles it, so a seller can fold away whichever parts they aren't
// touching right now instead of scrolling one long flat form.
function Section({ title, open, onToggle, children }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left cursor-pointer bg-surface-muted/60 hover:bg-surface-muted transition-colors"
      >
        <span className="text-[13px] font-bold text-ink">{title}</span>
        <IconChevronDown width="14" height="14" className={`text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="p-3.5 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

export default function ProductFormModal({ open, product, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [openSections, setOpenSections] = useState({ details: true, shipping: true, b2b: true });
  const isEdit = Boolean(product);
  const template = form.category ? getCategoryTemplate(form.category) : null;
  const suggestions = useMemo(() => (form.category ? [] : suggestCategories(form.name, 3)), [form.name, form.category]);
  // #hashtags typed inline in the description (item 7: extra hashtags can live only in the
  // description) — merged with the explicit chip list (form.tags) at submit time below.
  const descriptionTags = useMemo(() => extractHashtags(form.description), [form.description]);

  useEffect(() => {
    if (!open) return;
    if (!product) {
      setForm(emptyForm);
      return;
    }
    const tpl = product.category ? getCategoryTemplate(product.category) : { attributes: [], variantAxes: [] };
    setForm({
      name: product.name,
      category: product.category,
      description: product.description || '',
      sku: product.sku || '',
      price: String(product.price),
      unit: product.unit,
      moq: product.moq,
      stock: String(product.stock),
      status: product.status,
      images: product.images && product.images.length > 0 ? product.images : product.img ? [product.img] : [],
      tags: Array.isArray(product.tags) ? product.tags : [],
      b2bEnabled: Boolean(product.b2bEnabled),
      freeShipping: product.freeShipping !== false,
      worldwideFreeShipping: Boolean(product.worldwideFreeShipping),
      specifications: specsArrayToMap(product.specifications, tpl),
      variantAxes: axesArrayToMap(product.variantAxes, tpl),
      variants: (product.variants || []).map((v) => ({ name: v.name, price: v.price ?? '', stock: v.stock ?? '' })),
      shipping: {
        weightKg: product.shipping?.weightKg ?? '',
        lengthCm: product.shipping?.lengthCm ?? '',
        widthCm: product.shipping?.widthCm ?? '',
        heightCm: product.shipping?.heightCm ?? '',
        dispatchTime: product.shipping?.dispatchTime || '',
        shipsFrom: product.shipping?.shipsFrom || '',
        shippingFee: product.shipping?.shippingFee ?? '',
      },
      priceTiers: (product.priceTiers || []).map((t) => ({
        minQty: t.minQty ?? '',
        maxQty: t.maxQty ?? '',
        price: t.price ?? '',
      })),
    });
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Regenerate the variant matrix whenever the axis values or applicable template change —
  // existing rows are preserved by name so manual price/stock edits survive a re-derive.
  useEffect(() => {
    if (!template || template.variantAxes.length === 0) return;
    setForm((f) => {
      const generated = cartesianVariants(f.variantAxes, template, f.price);
      const byName = Object.fromEntries(f.variants.map((v) => [v.name, v]));
      const merged = generated.map((row) => byName[row.name] || row);
      const sameLength = merged.length === f.variants.length;
      const unchanged = sameLength && merged.every((row, i) => row === f.variants[i]);
      return unchanged ? f : { ...f, variants: merged };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.variantAxes, form.category]);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggle = (key) => () => setForm((f) => ({ ...f, [key]: !f[key], ...(key === 'freeShipping' && f.freeShipping ? { worldwideFreeShipping: false } : {}) }));
  const setImages = (images) => setForm((f) => ({ ...f, images }));
  const setCategory = (name) => setForm((f) => ({ ...f, category: name, specifications: {}, variantAxes: {}, variants: [] }));
  const setSpec = (key) => (e) => setForm((f) => ({ ...f, specifications: { ...f.specifications, [key]: e.target.value } }));
  const setAxis = (key) => (e) => setForm((f) => ({ ...f, variantAxes: { ...f.variantAxes, [key]: e.target.value } }));
  const setVariantField = (index, key) => (e) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v, i) => (i === index ? { ...v, [key]: e.target.value } : v)) }));
  const setShippingField = (key) => (e) => setForm((f) => ({ ...f, shipping: { ...f.shipping, [key]: e.target.value } }));
  const toggleSection = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const setListingType = (b2bEnabled) => setForm((f) => ({ ...f, b2bEnabled }));

  const addPriceTier = () =>
    setForm((f) => ({ ...f, priceTiers: [...f.priceTiers, { minQty: '', maxQty: '', price: '' }] }));
  const removePriceTier = (index) => setForm((f) => ({ ...f, priceTiers: f.priceTiers.filter((_, i) => i !== index) }));
  const setPriceTierField = (index, key) => (e) =>
    setForm((f) => ({ ...f, priceTiers: f.priceTiers.map((t, i) => (i === index ? { ...t, [key]: e.target.value } : t)) }));

  const submit = () => {
    const specifications = template
      ? template.attributes
          .map((attr) => ({ label: attr.label, value: (form.specifications[attr.key] || '').trim() }))
          .filter((s) => s.value)
      : [];
    const variants = form.variants
      .filter((v) => v.stock !== '')
      .map((v) => ({ name: v.name, price: v.price === '' ? Number(form.price) : Number(v.price), stock: Number(v.stock) }));

    const shipping = {
      weightKg: form.shipping.weightKg === '' ? null : Number(form.shipping.weightKg),
      lengthCm: form.shipping.lengthCm === '' ? null : Number(form.shipping.lengthCm),
      widthCm: form.shipping.widthCm === '' ? null : Number(form.shipping.widthCm),
      heightCm: form.shipping.heightCm === '' ? null : Number(form.shipping.heightCm),
      dispatchTime: form.shipping.dispatchTime,
      shipsFrom: form.shipping.shipsFrom.trim(),
      shippingFee: form.freeShipping || form.shipping.shippingFee === '' ? null : Number(form.shipping.shippingFee),
    };

    // Skippable — only rows where the seller actually filled in a min quantity and a price are
    // kept; a half-filled row is dropped rather than saved as a broken tier.
    const priceTiers = form.b2bEnabled
      ? form.priceTiers
          .filter((t) => t.minQty !== '' && t.price !== '')
          .map((t) => ({ minQty: Number(t.minQty), maxQty: t.maxQty === '' ? null : Number(t.maxQty), price: Number(t.price) }))
      : [];

    onSubmit({
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      unit: form.unit.trim(),
      moq: form.moq.trim(),
      stock: Number(form.stock),
      status: form.status,
      images: form.images,
      b2bEnabled: form.b2bEnabled,
      freeShipping: form.freeShipping,
      worldwideFreeShipping: form.freeShipping && form.worldwideFreeShipping,
      tags: mergeHashtags(form.tags, descriptionTags),
      specifications,
      variantAxes: template
        ? template.variantAxes
            .map((axis) => ({ name: axis.label, values: (form.variantAxes[axis.key] || '').split(',').map((v) => v.trim()).filter(Boolean) }))
            .filter((a) => a.values.length > 0)
        : [],
      variants,
      shipping,
      priceTiers,
    });
  };

  const fieldClass =
    'w-full px-[14px] py-[11px] border border-border rounded-lg text-[14px] font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
  const labelClass = 'block text-[12.5px] font-semibold text-ink-soft mb-1.5';
  const sectionTitleClass = 'text-[13px] font-bold text-ink mb-2.5';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative w-full max-w-[460px] max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink">{isEdit ? 'Edit listing' : 'Add new listing'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-ink cursor-pointer p-1">
            <IconClose width="18" height="18" />
          </button>
        </div>

        {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <div>
            <p className={labelClass}>Basic Info</p>
          </div>

          <div>
            <label className={labelClass}>Product name</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Cotton Twill Fabric 280 GSM" className={fieldClass} />
          </div>

          <div>
            <label className={labelClass}>Description (optional)</label>
            <HashtagTextarea
              value={form.description}
              onChange={(description) => setForm((f) => ({ ...f, description }))}
              placeholder="Describe the product — materials, grade, use case… use #hashtags to help buyers find it"
              rows={3}
              className={`${fieldClass} resize-none`}
            />
            {descriptionTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11.5px] font-semibold text-ink-soft">
                  {descriptionTags.length} tag{descriptionTags.length !== 1 ? 's' : ''} in description:
                </span>
                {descriptionTags.map((tag) => (
                  <span key={tag} className="text-[11.5px] font-semibold text-green bg-green/10 rounded-full px-2.5 py-0.5">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Explicit hashtag editor — separate from the description's inline #hashtag typing
              above. Up to 3 of whichever of these tags turn out most popular show under the
              product on its page; the rest stay reachable from the description there. */}
          <div>
            <label className={labelClass}>Hashtags (optional)</label>
            <HashtagChipInput value={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} fieldClass={fieldClass} />
            <HashtagAiSuggestions
              title={form.name}
              category={form.category}
              description={form.description}
              exclude={form.tags}
              onAdd={(tag) =>
                setForm((f) =>
                  f.tags.some((t) => t.toLowerCase() === tag.toLowerCase()) ? f : { ...f, tags: [...f.tags, tag] }
                )
              }
            />
          </div>

          {/* Listing type — decides whether this is a normal single-product B2C listing (kept
              exactly as it's always worked, variants included) or a B2B listing, which trades the
              consumer-facing variant matrix emphasis for the optional bulk-pricing section below.
              This drives the same b2bEnabled flag the B2B marketplace tab already reads — just
              surfaced as a clear choice instead of a checkbox buried under Shipping. */}
          <div>
            <label className={labelClass}>Listing type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setListingType(false)}
                className={`flex items-center gap-2.5 px-4 py-3 border-[1.5px] rounded-xl cursor-pointer transition-colors text-left ${
                  !form.b2bEnabled ? 'border-green bg-green-tint' : 'border-border hover:border-border-strong'
                }`}
              >
                <IconSparkle width="16" height="16" className={!form.b2bEnabled ? 'text-green' : 'text-text-muted'} />
                <span className="min-w-0">
                  <span className={`block text-[13.5px] font-semibold ${!form.b2bEnabled ? 'text-green' : 'text-ink-soft'}`}>Spotlight (B2C)</span>
                  <span className="block text-[11px] text-text-muted">Single product, buyer-facing</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setListingType(true)}
                className={`flex items-center gap-2.5 px-4 py-3 border-[1.5px] rounded-xl cursor-pointer transition-colors text-left ${
                  form.b2bEnabled ? 'border-orange bg-orange-tint' : 'border-border hover:border-border-strong'
                }`}
              >
                <IconBox width="16" height="16" className={form.b2bEnabled ? 'text-orange-text' : 'text-text-muted'} />
                <span className="min-w-0">
                  <span className={`block text-[13.5px] font-semibold ${form.b2bEnabled ? 'text-orange-text' : 'text-ink-soft'}`}>B2B</span>
                  <span className="block text-[11px] text-text-muted">Bulk orders, wholesale</span>
                </span>
              </button>
            </div>
          </div>

          <div>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className="text-[11.5px] text-ink-soft">Suggested:</span>
                {suggestions.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className="text-[11.5px] font-semibold text-green border border-green/30 bg-green/5 hover:bg-green/10 rounded-full px-2.5 py-0.5 cursor-pointer transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            <CategoryPicker value={form.category} onChange={setCategory} fieldClass={fieldClass} labelClass={labelClass} />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={set('status')} className={fieldClass}>
              <option value="active">Active (visible)</option>
              <option value="draft">Draft (hidden)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Price (Rs)</label>
              <input type="text" inputMode="numeric" value={form.price} onChange={set('price')} placeholder="670" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <input type="text" value={form.unit} onChange={set('unit')} placeholder="metre" className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>MOQ</label>
              <input type="text" value={form.moq} onChange={set('moq')} placeholder="500m" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input type="text" inputMode="numeric" value={form.stock} onChange={set('stock')} placeholder="2400" className={fieldClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>SKU (optional)</label>
            <input type="text" value={form.sku} onChange={set('sku')} placeholder="Auto-generated if left blank" className={fieldClass} />
          </div>

          <div>
            <label className={labelClass}>Photos (optional)</label>
            <ProductImagesUploader images={form.images} onChange={setImages} max={MAX_IMAGES} />
          </div>

          {template && (template.attributes.length > 0 || template.variantAxes.length > 0) && (
            <Section title="Product details & Variants" open={openSections.details} onToggle={() => toggleSection('details')}>
              {template.attributes.length > 0 && (
                <div className="flex flex-col gap-3">
                  {template.attributes.map((attr) => (
                    <div key={attr.key}>
                      <label className={labelClass}>{attr.label} (optional)</label>
                      <input
                        type="text"
                        value={form.specifications[attr.key] || ''}
                        onChange={setSpec(attr.key)}
                        placeholder={attr.placeholder}
                        className={fieldClass}
                      />
                    </div>
                  ))}
                </div>
              )}

              {template.variantAxes.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className={sectionTitleClass}>Variants (optional)</p>
                  {template.variantAxes.map((axis) => (
                    <div key={axis.key}>
                      <label className={labelClass}>{axis.label} options</label>
                      <input
                        type="text"
                        value={form.variantAxes[axis.key] || ''}
                        onChange={setAxis(axis.key)}
                        placeholder={axis.placeholder}
                        className={fieldClass}
                      />
                    </div>
                  ))}

                  {form.variants.length > 0 && (
                    <div className="mt-1 flex flex-col gap-2">
                      <p className="text-[11.5px] font-semibold text-ink-soft">Fill in stock for each variant you're offering:</p>
                      {form.variants.map((v, i) => (
                        <div key={v.name} className="grid grid-cols-[1fr_90px_80px] gap-2 items-center">
                          <span className="text-[12.5px] text-ink truncate" title={v.name}>
                            {v.name}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={v.price}
                            onChange={setVariantField(i, 'price')}
                            placeholder={form.price || 'Price'}
                            className={`${fieldClass} !px-2.5 !py-1.5 text-[12.5px]`}
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={v.stock}
                            onChange={setVariantField(i, 'stock')}
                            placeholder="Stock"
                            className={`${fieldClass} !px-2.5 !py-1.5 text-[12.5px]`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Section>
          )}

          <Section title="Shipping" open={openSections.shipping} onToggle={() => toggleSection('shipping')}>
            <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink cursor-pointer">
              <input type="checkbox" checked={form.freeShipping} onChange={toggle('freeShipping')} className="w-4 h-4 accent-green cursor-pointer" />
              Free shipping
            </label>
            {form.freeShipping && (
              <label className="flex items-center gap-2.5 text-[13px] text-ink-soft cursor-pointer pl-6">
                <input
                  type="checkbox"
                  checked={form.worldwideFreeShipping}
                  onChange={toggle('worldwideFreeShipping')}
                  className="w-4 h-4 accent-green cursor-pointer"
                />
                Offer it worldwide, not just within my own country
              </label>
            )}
            {!form.freeShipping && (
              <div>
                <label className={labelClass}>Shipping fee (Rs)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.shipping.shippingFee}
                  onChange={setShippingField('shippingFee')}
                  placeholder="150"
                  className={fieldClass}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Weight (kg)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.shipping.weightKg}
                  onChange={setShippingField('weightKg')}
                  placeholder="0.5"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Ships from (city)</label>
                <input type="text" value={form.shipping.shipsFrom} onChange={setShippingField('shipsFrom')} placeholder="e.g. Karachi" className={fieldClass} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>Length (cm)</label>
                <input type="text" inputMode="decimal" value={form.shipping.lengthCm} onChange={setShippingField('lengthCm')} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Width (cm)</label>
                <input type="text" inputMode="decimal" value={form.shipping.widthCm} onChange={setShippingField('widthCm')} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Height (cm)</label>
                <input type="text" inputMode="decimal" value={form.shipping.heightCm} onChange={setShippingField('heightCm')} className={fieldClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Dispatch time</label>
              <select value={form.shipping.dispatchTime} onChange={setShippingField('dispatchTime')} className={fieldClass}>
                <option value="">Select…</option>
                {DISPATCH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          {form.b2bEnabled && (
            <Section title="B2B Information" open={openSections.b2b} onToggle={() => toggleSection('b2b')}>
              <p className="text-[12px] text-text-muted -mt-1">
                Everything here is optional — buyers already see your MOQ and base price. Add bulk pricing only if you want to
                offer a discount at higher quantities.
              </p>

              {form.priceTiers.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 text-[11px] font-semibold text-text-muted px-0.5">
                    <span>Min qty</span>
                    <span>Max qty</span>
                    <span>Price/unit (Rs)</span>
                    <span />
                  </div>
                  {form.priceTiers.map((t, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 items-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={t.minQty}
                        onChange={setPriceTierField(i, 'minQty')}
                        placeholder="100"
                        className={`${fieldClass} !px-2.5 !py-1.5 text-[12.5px]`}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={t.maxQty}
                        onChange={setPriceTierField(i, 'maxQty')}
                        placeholder="and above"
                        className={`${fieldClass} !px-2.5 !py-1.5 text-[12.5px]`}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={t.price}
                        onChange={setPriceTierField(i, 'price')}
                        placeholder="600"
                        className={`${fieldClass} !px-2.5 !py-1.5 text-[12.5px]`}
                      />
                      <button
                        type="button"
                        onClick={() => removePriceTier(i)}
                        aria-label="Remove price tier"
                        className="cursor-pointer flex items-center justify-center text-text-muted hover:text-orange-text p-1"
                      >
                        <IconTrash width="13" height="13" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addPriceTier}
                className="self-start flex items-center gap-1.5 text-[12.5px] font-semibold text-green hover:underline cursor-pointer"
              >
                <IconPlus width="13" height="13" />
                Add price tier
              </button>
            </Section>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer bg-white border-[1.5px] border-border text-ink-soft font-semibold text-sm py-3 rounded-full hover:bg-surface-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-3 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] transition-colors"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            )}
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add listing'}
          </button>
        </div>
      </div>
    </div>
  );
}
