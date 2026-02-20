import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Lock, User, ArrowRight, ShieldCheck, BookOpen, GraduationCap, Building2
} from "lucide-react";
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

/* ─── role config ─── */
const ROLES = [
    {
        key: "ADMIN",
        label: "Admin",
        icon: ShieldCheck,
        placeholder: "e.g. A001",
        gradient: "from-violet-600 to-indigo-600",
        glow: "shadow-indigo-500/25",
        accent: "border-indigo-500",
        desc: "College administration access",
    },
    {
        key: "TEACHER",
        label: "Teacher",
        icon: BookOpen,
        placeholder: "e.g. T001",
        gradient: "from-emerald-600 to-teal-600",
        glow: "shadow-emerald-500/25",
        accent: "border-emerald-500",
        desc: "Faculty & course management",
    },
    {
        key: "STUDENT",
        label: "Student",
        icon: GraduationCap,
        placeholder: "e.g. S001",
        gradient: "from-amber-500 to-orange-500",
        glow: "shadow-amber-500/25",
        accent: "border-orange-500",
        desc: "View grades & attendance",
    },
];

const Login = () => {
    const [activeRole, setActiveRole] = useState(0);
    const [regNumber, setRegNumber] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [colleges, setColleges] = useState([]);
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [collegesLoading, setCollegesLoading] = useState(true);

    const { login } = useAuth();
    const navigate = useNavigate();

    /* fetch colleges on mount */
    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const res = await api.get(ENDPOINTS.COLLEGES);
                setColleges(res.data);
                if (res.data.length > 0) {
                    setSelectedCollege(res.data[0]);
                }
            } catch {
                setColleges([]);
            } finally {
                setCollegesLoading(false);
            }
        };
        fetchColleges();
    }, []);

    const role = ROLES[activeRole];
    const RoleIcon = role.icon;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const collegeCode = selectedCollege?.code || "";
        const result = await login(regNumber, password, collegeCode);

        if (result.success) {
            navigate("/");
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="bg-premium-gradient min-h-screen flex items-center justify-center p-4">
            {/* decorative orbs */}
            <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
            <div className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in relative">
                {/* ── Branding ── */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-4">
                        <span className="text-white text-2xl font-extrabold">S</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">SPMS</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Student Performance Monitoring System
                    </p>
                </div>

                {/* ── College Name ── */}
                {!collegesLoading && selectedCollege && (
                    <div className="text-center mb-6 animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                            <Building2 className="w-4 h-4 text-indigo-400" />
                            {colleges.length > 1 ? (
                                <select
                                    value={selectedCollege.code}
                                    onChange={(e) =>
                                        setSelectedCollege(colleges.find((c) => c.code === e.target.value))
                                    }
                                    className="bg-transparent text-white font-semibold text-sm outline-none cursor-pointer"
                                >
                                    {colleges.map((c) => (
                                        <option key={c.code} value={c.code} className="bg-gray-900">
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className="text-white font-semibold text-sm">
                                    {selectedCollege.name}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Role Tabs ── */}
                <div className="flex gap-2 mb-5 p-1 rounded-xl bg-white/5 border border-white/10">
                    {ROLES.map((r, idx) => {
                        const Icon = r.icon;
                        const active = idx === activeRole;
                        return (
                            <button
                                key={r.key}
                                onClick={() => {
                                    setActiveRole(idx);
                                    setError("");
                                }}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${active
                                        ? `bg-gradient-to-r ${r.gradient} text-white shadow-md ${r.glow}`
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {r.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Card ── */}
                <div className={`glass-card rounded-2xl p-8 shadow-2xl border-t-2 ${role.accent} transition-all duration-300`}>
                    {/* role header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-lg ${role.glow}`}>
                            <RoleIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {role.label} Login
                            </h2>
                            <p className="text-slate-400 text-xs">{role.desc}</p>
                        </div>
                    </div>

                    {/* error */}
                    {error && (
                        <div className="mb-4 p-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Registration Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                    <User className="w-4 h-4 text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus-glow"
                                    placeholder={role.placeholder}
                                    value={regNumber}
                                    onChange={(e) => setRegNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                    <Lock className="w-4 h-4 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus-glow"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-gradient-to-r ${role.gradient} rounded-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-lg ${role.glow} cursor-pointer transition-all duration-200`}
                        >
                            {loading ? (
                                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In as {role.label}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-xs mt-6">
                    © 2026 SPMS • AI-Driven Student Performance Monitoring
                </p>
            </div>
        </div>
    );
};

export default Login;
