import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { vendorApi, productApi } from "../lib/api";
import {
  User,
  MapPin,
  Mail,
  Globe,
  ShoppingBag,
  Info,
  MessageCircle,
  ChevronRight,
  Pencil,
  Phone
} from "lucide-react";

function ShopProfile() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await vendorApi.getById(id);
        if (!mounted) return;
        const s = res.shop || res;
        setShop(s);
        
        setProdLoading(true);
        try {
          const pRes = await productApi.getAll({ vendor: s._id, limit: 100 });
          const finalProducts = pRes.products || pRes.data || pRes.items || pRes.docs || (Array.isArray(pRes) ? pRes : []);
          setProducts(finalProducts);
        } catch (err) {
          console.error("Failed to load products:", err);
        } finally {
          setProdLoading(false);
        }
      } catch (err) {
        console.error("Failed to load shop:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="loading loading-spinner loading-md text-primary" />
    </div>
  );

  if (!shop) return <div className="p-10 text-center font-medium">Shop not found</div>;

  return (
    <>
    <div className="max-w-7xl mx-auto pb-10 ">
      {/* 1. BANNER - Slightly shorter on mobile to save thumb space */}
      <div className="relative w-full h-32 md:h-72 bg-base-300 rounded-2xl overflow-hidden shadow-inner">
        {shop.banner ? (
          <img src={shop.banner} alt="banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-400" />
        )}
      </div>

      {/* 2. BRAND HEADER - Mobile Centered vs Desktop Left-Right */}
      <div className="px-4 md:px-0 flex flex-col md:flex-row md:items-center justify-between mt-0 md:mt-6">
        
        <div className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-6 text-center md:text-left">
          {/* Logo - Smaller on mobile, centered overlap */}
          <div className="w-24 h-24 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-base-100 shadow-lg bg-base-200 -mt-12 md:-mt-20 z-10">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-3xl md:text-5xl text-base-content/20"><User /></div>
            )}
          </div>

          <div className="space-y-1 -mt-0 md:-mt-10">
            <h1 className="text-xl md:text-4xl font-extrabold tracking-tight">{shop.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-[12px] md:text-sm font-medium text-base-content/60">
              <span className="text-base-content">@{shop.name.replace(/\s+/g, '').toLowerCase()}</span>
              <span>•</span>
              <span>{products.length} items</span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Full width buttons on mobile */}
        <div className="flex items-center gap-2 mt-4 md:-mt-10 w-full md:w-auto">
          <button className="flex-1 md:flex-none btn btn-sm md:btn-md btn-ghost bg-base-300 rounded-full px-4 md:px-6 font-bold">
            <MessageCircle size={16} className="md:mr-2" /> <span className="text-xs md:text-sm">Message</span>
          </button>
          <button
            onClick={() => {
              setEditForm({
                name: shop.name || "",
                description: shop.description || "",
                commissionRate: shop.commissionRate || "",
                website: shop.website || "",
                phone: shop.phone || "",
                categories: (shop.categories || []).join(", "),
              });
              setLogoFile(null);
              setBannerFile(null);
              setIsEditOpen(true);
            }}
            className="flex-1 md:flex-none btn btn-sm md:btn-md btn-primary rounded-full px-6 md:px-8 font-bold  "
          >
            <Pencil size={16} className="md:mr-2" /> <span className="text-xs md:text-sm">Edit Shop</span>
          </button>
        </div>
      </div>

      {/* 3. NAVIGATION TABS - Sticky-ready and tighter gaps on mobile */}
      <div className="mt-6 md:mt-10 border-b border-base-300 px-4 md:px-0">
        <div className="flex gap-6 md:gap-10 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab("products")}
            className={`pb-3 md:pb-4 px-1 text-[11px] md:text-[13px] tracking-widest font-black transition-all ${activeTab === 'products' ? 'text-base-content border-b-2 border-base-content' : 'text-base-content/40'}`}
          >
            Products
          </button>
          <button 
            onClick={() => setActiveTab("about")}
            className={`pb-3 md:pb-4 px-1 text-[11px] md:text-[13px] tracking-widest font-black transition-all ${activeTab === 'about' ? 'text-base-content border-b-2 border-base-content' : 'text-base-content/40'}`}
          >
            About
          </button>
        </div>
      </div>

      {/* 4. CONTENT AREA - Reduced vertical spacing on mobile */}
      <div className="mt-4 md:mt-8 px-4 md:px-0">
        {activeTab === "products" ? (
          <div className="space-y-4 md:space-y-8">
            {prodLoading ? (
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                 {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-base-200 animate-pulse rounded-xl md:rounded-2xl" />)}
               </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-3 md:gap-x-6 gap-y-6 md:gap-y-12">
                {products.map((p) => (
                  <div key={p._id} className="group">
                    <div className="aspect-[4/5] rounded-xl md:rounded-2xl bg-base-200 overflow-hidden mb-2 md:mb-4 relative shadow-sm">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-10"><ShoppingBag size={32} /></div>
                      )}
                    </div>
                    <h4 className="font-bold text-xs md:text-[15px] line-clamp-1 mb-0.5">{p.name}</h4>
                    <div className="text-[13px] md:text-sm font-bold text-base-content/80">${p.salePrice?.toFixed(2)}</div>
                    <div className="hidden md:block text-[11px] text-base-content/50 mt-1 uppercase tracking-tighter">
                      {p.stats?.totalQuantitySold || 0} sold • {(p.averageRating || 0).toFixed(1)} ★
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center opacity-30 font-medium">No products available</div>
            )}
          </div>
        ) : (
          /* ABOUT SECTION - Stacked on mobile */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
            <div className="md:col-span-2 space-y-6 md:space-y-10">
              <section>
                <h3 className="text-md md:text-xl font-bold mb-2 md:mb-4">Description</h3>
                <p className="text-sm md:text-lg text-base-content/70 leading-relaxed">
                  {shop.description || "No description available."}
                </p>
              </section>

              <div className="divider opacity-50"></div>

              <section>
                <h3 className="text-md md:text-xl font-bold mb-4 md:mb-6">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                   {/* Contact Item */}
                   <div className="flex items-center gap-3">
                    <div className="p-2 md:p-3 bg-base-200 rounded-lg md:rounded-xl"><Mail size={16} /></div>
                    <div className="text-xs md:text-sm truncate">{shop.email || "No email"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 md:p-3 bg-base-200 rounded-lg md:rounded-xl"><Globe size={16} /></div>
                    <div className="text-xs md:text-sm truncate">{shop.website || "No website"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 md:p-3 bg-base-200 rounded-lg md:rounded-xl"><Phone size={16} /></div>
                    <div className="text-xs md:text-sm truncate">{shop.phone || "No phone"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 md:p-3 bg-base-200 rounded-lg md:rounded-xl"><MapPin size={16} /></div>
                    <div className="text-xs md:text-sm truncate">{shop.address?.city || "Unknown City"}</div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar Stats - Full width on mobile */}
            <div className="bg-base-200/50 p-6 md:p-8 rounded-2xl md:rounded-3xl h-fit">
              <h3 className="text-md md:text-xl font-bold mb-4 md:mb-6">Shop Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-6">
                <div>
                  <div className="text-[10px] md:text-[11px] font-black text-base-content/40 uppercase tracking-widest mb-1">Joined</div>
                  <div className="text-sm md:text-md font-bold">{shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : 'Recent'}</div>
                </div>
                <div>
                  <div className="text-[10px] md:text-[11px] font-black text-base-content/40 uppercase tracking-widest mb-1">Sales</div>
                  <div className="text-sm md:text-md font-bold">{shop.stats?.totalOrders || 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsEditOpen(false)} />
          <div className="relative bg-base-100 rounded-lg shadow-xl w-full max-w-2xl mx-4 z-10 p-6">
            <h3 className="text-lg font-bold mb-4">Edit Shop</h3>
            <div className="space-y-3">
              <div>
                <label className="label"><span className="label-text">Name</span></label>
                <input value={editForm.name || ""} onChange={(e)=>setEditForm(prev=>({...prev,name:e.target.value}))} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label"><span className="label-text">Description</span></label>
                <textarea value={editForm.description || ""} onChange={(e)=>setEditForm(prev=>({...prev,description:e.target.value}))} className="textarea textarea-bordered w-full" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label"><span className="label-text">Website</span></label>
                  <input value={editForm.website || ""} onChange={(e)=>setEditForm(prev=>({...prev,website:e.target.value}))} className="input input-bordered w-full" />
                </div>
                <div>
                  <label className="label"><span className="label-text">Phone</span></label>
                  <input value={editForm.phone || ""} onChange={(e)=>setEditForm(prev=>({...prev,phone:e.target.value}))} className="input input-bordered w-full" />
                </div>
              </div>
              <div>
                <label className="label"><span className="label-text">Commission Rate (%)</span></label>
                <input type="number" value={editForm.commissionRate || ""} onChange={(e)=>setEditForm(prev=>({...prev,commissionRate:e.target.value}))} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label"><span className="label-text">Categories (comma separated)</span></label>
                <input value={editForm.categories || ""} onChange={(e)=>setEditForm(prev=>({...prev,categories:e.target.value}))} className="input input-bordered w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label"><span className="label-text">Logo (replace)</span></label>
                  <input type="file" accept="image/*" onChange={(e)=>setLogoFile(e.target.files?.[0]||null)} className="file-input file-input-bordered w-full" />
                </div>
                <div>
                  <label className="label"><span className="label-text">Banner (replace)</span></label>
                  <input type="file" accept="image/*" onChange={(e)=>setBannerFile(e.target.files?.[0]||null)} className="file-input file-input-bordered w-full" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button className="btn btn-ghost" onClick={() => setIsEditOpen(false)} disabled={saving}>Cancel</button>
              <button
                className={`btn btn-primary ${saving? 'loading' : ''}`}
                onClick={async () => {
                  try {
                    setSaving(true);
                    const fd = new FormData();
                    fd.append('name', editForm.name || '');
                    fd.append('description', editForm.description || '');
                    fd.append('website', editForm.website || '');
                    fd.append('phone', editForm.phone || '');
                    fd.append('commissionRate', editForm.commissionRate || '');
                    if (editForm.categories) fd.append('categories', editForm.categories);
                    if (logoFile) fd.append('logo', logoFile);
                    if (bannerFile) fd.append('banner', bannerFile);
                    const res = await vendorApi.update(shop._id, fd);
                    const updated = res.shop || res;
                    setShop(updated);
                    setIsEditOpen(false);
                  } catch (err) {
                    console.error('Failed to update shop', err);
                    alert('Failed to update shop');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ShopProfile;