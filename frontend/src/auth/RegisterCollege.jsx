import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Building2, User, Lock, Mail, Phone, MapPin, ArrowRight,
    ArrowLeft, ShieldCheck, CheckCircle, Hash
} from "lucide-react";
import { authService } from "../services/authService";

/* ─── two-step form ─── */
const STEPS = [
    { label: "College Details", icon: Building2 },
    { label: "Admin Account", icon: ShieldCheck },
];

const RegisterCollege = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    /* ─── form state ─── */
    const [form, setForm] = useState({
        college_name: "",
        college_code: "",
        contact_email: "",
        contact_phone: "",
        address: "",
        admin_registration_number: "ADMIN001",
        admin_password: "",
        admin_confirm_password: "",
        admin_first_name: "",
        admin_last_name: "",
        admin_email: "",
    });

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    /* ─── step validation ─── */
    const canProceedStep0 = form.college_name.trim() && form.college_code.trim();
    const canSubmit =
        form.admin_registration_number.trim() &&
        form.admin_password.length >= 6 &&
        form.admin_password === form.admin_confirm_password;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError("");
        setLoading(true);

        try {
            const res = await authService.registerCollege(form);
            setSuccess(res.data);
        } catch (err) {
            const data = err.response?.data;
            if (data) {
                /* DRF field errors come back as an object */
                const msg = typeof data === "string"
                    ? data
                    : data.detail
                    || Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\n")
                    || "Registration failed.";
                setError(msg);
            } else {
                setError("Network error. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    /* ─── success screen ─── */
    if (success) {
        return (
            <div className="bg-brand-bg min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="modern-card rounded-2xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-5">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-brand-text mb-2">
                            College Registered!
                        </h2>
                        <p className="text-brand-muted text-sm mb-6">
                            <strong>{success.college.name}</strong> ({success.college.code}) has been created successfully.
                        </p>

                        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Login Credentials</p>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">College</span>
                                <span className="font-semibold text-brand-text">{success.college.code}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Username</span>
                                <span className="font-semibold text-brand-text">{success.admin_username}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Reg Number</span>
                                <span className="font-semibold text-brand-text">{form.admin_registration_number}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate("/login")}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:brightness-110 active:scale-[0.98] shadow-md shadow-indigo-500/25 cursor-pointer transition-all duration-200"
                        >
                            Go to Login
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-brand-bg min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-lg animate-fade-in">
                {/* ── Header ── */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-md shadow-indigo-600/20 mb-4">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-brand-text tracking-tight">
                        Register New College
                    </h1>
                    <p className="text-brand-muted text-sm mt-1">
                        Set up your institution on SPMS
                    </p>
                </div>

                {/* ── Step Indicator ── */}
                <div className="flex gap-2 mb-5 p-1 rounded-xl bg-white border border-brand-border shadow-sm">
                    {STEPS.map((s, idx) => {
                        const Icon = s.icon;
                        const active = idx === step;
                        const done = idx < step;
                        return (
                            <button
                                key={s.label}
                                type="button"
                                onClick={() => { if (idx < step) setStep(idx); }}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${active
                                        ? "bg-indigo-50 text-indigo-600"
                                        : done
                                            ? "text-emerald-600"
                                            : "text-brand-muted"
                                    } ${idx <= step ? "cursor-pointer" : "cursor-default"}`}
                            >
                                {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                {s.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Card ── */}
                <div className="modern-card border-t-4 border-indigo-500 rounded-2xl p-8">
                    {error && (
                        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl whitespace-pre-line">
                            {error}
                        </div>
                    )}

                    <form onSubmit={step === 1 ? handleSubmit : (e) => { e.preventDefault(); setStep(1); }}>
                        {/* ── Step 0: College Details ── */}
                        {step === 0 && (
                            <div className="space-y-4 animate-fade-in">
                                <h2 className="text-lg font-bold text-brand-text flex items-center gap-2 mb-2">
                                    <Building2 className="w-5 h-5 text-indigo-500" />
                                    College Information
                                </h2>

                                {/* College Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        College Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 modern-input rounded-xl placeholder-slate-400"
                                            placeholder="e.g. Delhi Technical University"
                                            value={form.college_name}
                                            onChange={set("college_name")}
                                        />
                                    </div>
                                </div>

                                {/* College Code */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        College Code <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <Hash className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 modern-input rounded-xl placeholder-slate-400 uppercase"
                                            placeholder="e.g. DTU"
                                            value={form.college_code}
                                            onChange={set("college_code")}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Short unique identifier for your college</p>
                                </div>

                                {/* Contact Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Contact Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            className="w-full pl-10 pr-4 py-2.5 modern-input rounded-xl placeholder-slate-400"
                                            placeholder="admin@college.ac.in"
                                            value={form.contact_email}
                                            onChange={set("contact_email")}
                                        />
                                    </div>
                                </div>

                                {/* Contact Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Contact Phone
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2.5 modern-input rounded-xl placeholder-slate-400"
                                            placeholder="011-2345-6789"
                                            value={form.contact_phone}
                                            onChange={set("contact_phone")}
                                        />
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2.5 modern-input rounded-xl placeholder-slate-400"
                                            placeholder="College address"
                                            value={form.address}
                                            onChange={set("address")}
                                        />
                                    </div>
                                </div>

                                {/* Next */}
                                <button
                                    type="submit"
                                    disabled={!canProceedStep0}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-indigo-500/25 cursor-pointer transition-all duration-200"
                                >
                                    Next: Admin Setup
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        )}

                        {/* ── Step 1: Admin Credentials ── */}
                        {step === 1 && (
                            <div className="space-y-4 animate-fade-in">
                                <h2 className="text-lg font-bold text-brand-text flex items-center gap-2 mb-2">
                                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                                    Admin Account
                                </h2>

                                {/* Admin Registration Number */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Admin Registration No <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <User className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 modern-input rounded-xl placeholder-slate-400"
                                            placeholder="e.g. ADMIN001"
                                            value={form.admin_registration_number}
                                            onChange={set("admin_registration_number")}
                                        />
                                    </div>
                                </div>

                                {/* First & Last Name */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 modern-input rounded-xl placeholder-slate-400"
                                            placeholder="Admin"
                                            value={form.admin_first_name}
                                            onChange={set("admin_first_name")}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 modern-input rounded-xl placeholder-slate-400"
                                            placeholder="User"
                                            value={form.admin_last_name}
                                            onChange={set("admin_last_name")}
                                        />
                                    </div>
                                </div>

                                {/* Admin Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Admin Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            className="w-full pl-10 pr-4 py-2.5 modern-input rounded-xl placeholder-slate-400"
                                            placeholder="admin@college.ac.in"
                                            value={form.admin_email}
                                            onChange={set("admin_email")}
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <Lock className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            className="w-full pl-10 pr-4 py-2.5 modern-input rounded-xl placeholder-slate-400"
                                            placeholder="Min 6 characters"
                                            value={form.admin_password}
                                            onChange={set("admin_password")}
                                        />
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <Lock className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 modern-input rounded-xl placeholder-slate-400"
                                            placeholder="Re-enter password"
                                            value={form.admin_confirm_password}
                                            onChange={set("admin_confirm_password")}
                                        />
                                    </div>
                                    {form.admin_confirm_password && form.admin_password !== form.admin_confirm_password && (
                                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(0)}
                                        className="flex items-center justify-center gap-1 px-4 py-3 font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 active:scale-[0.98] cursor-pointer transition-all duration-200"
                                    >
                                        <ArrowLeft size={18} />
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !canSubmit}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-emerald-500/25 cursor-pointer transition-all duration-200"
                                    >
                                        {loading ? (
                                            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Register College
                                                <CheckCircle size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* ── Footer ── */}
                <p className="text-center text-brand-muted text-sm mt-6">
                    Already have a college?{" "}
                    <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterCollege;
