import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
    BarChart3, AlertTriangle, ChevronDown, ChevronRight,
    RefreshCw, Users, BookOpen, GraduationCap, ShieldAlert, Brain
} from 'lucide-react';

/* ────────────────── risk colour helpers ────────────────── */
const RISK_STYLES = {
    HIGH: {
        badge: 'bg-red-100 text-red-700 border-red-200',
        dot: 'bg-red-500',
        label: 'High Risk',
    },
    MEDIUM: {
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        label: 'Medium Risk',
    },
};

const RiskBadge = ({ level }) => {
    const s = RISK_STYLES[level] || RISK_STYLES.MEDIUM;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
};

/* ────────────────── metric pill ────────────────── */
const MetricPill = ({ label, value, warn }) => (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${warn ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
        {label}: {value != null ? `${value}%` : '—'}
    </span>
);

/* ────────────────── summary cards ────────────────── */
const SummaryCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl p-5 shadow-premium border border-gray-100/80 flex items-center gap-4 animate-fade-in">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
    </div>
);

/* ────────────────── student row ────────────────── */
const StudentRow = ({ student }) => (
    <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {student.name?.[0] || '?'}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.reg_number}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <RiskBadge level={student.risk_level} />
                {student.predicted_gpa != null && (
                    <span className="text-xs text-gray-400">GPA&nbsp;{student.predicted_gpa.toFixed(2)}</span>
                )}
            </div>
        </div>

        {student.weak_subjects?.length > 0 ? (
            <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Weak Subjects</p>
                <div className="space-y-1.5">
                    {student.weak_subjects.map((ws) => (
                        <div key={ws.subject_id} className="flex flex-wrap items-center gap-2 pl-2 border-l-2 border-red-300">
                            <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="text-sm font-medium text-gray-800">{ws.subject_name}</span>
                            <span className="text-xs text-gray-400">({ws.subject_code})</span>
                            <span className="text-xs text-gray-400 italic ml-auto">
                                {ws.teacher_name}
                            </span>
                            <div className="flex gap-1.5 ml-2">
                                <MetricPill label="Att" value={ws.attendance_pct} warn={ws.attendance_pct != null && ws.attendance_pct < 75} />
                                <MetricPill label="Marks" value={ws.marks_pct} warn={ws.marks_pct != null && ws.marks_pct < 40} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <p className="text-xs text-gray-400 mt-2 italic">No subject-level data available yet.</p>
        )}
    </div>
);

/* ────────────────── department section ────────────────── */
const DepartmentSection = ({ dept }) => (
    <div className="pl-4 border-l-2 border-indigo-200">
        <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-bold text-gray-800">{dept.name} <span className="text-gray-400 font-normal">({dept.code})</span></h4>
            <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">{dept.high_count} high</span>
            <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">{dept.medium_count} medium</span>
        </div>
        <div className="space-y-2">
            {dept.students.map((s) => (
                <StudentRow key={s.id} student={s} />
            ))}
        </div>
    </div>
);

/* ────────────────── batch accordion ────────────────── */
const BatchCard = ({ batch }) => {
    const [open, setOpen] = useState(true);
    const total = batch.high_count + batch.medium_count;

    return (
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100/80 overflow-hidden animate-fade-in">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    {open ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    <Users className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-base font-bold text-gray-900">{batch.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full font-semibold">{batch.high_count} High</span>
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-semibold">{batch.medium_count} Medium</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">{total} total</span>
                </div>
            </button>

            {open && (
                <div className="px-6 pb-5 space-y-5">
                    {batch.departments.map((dept) => (
                        <DepartmentSection key={dept.id} dept={dept} />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════ */
const AdminAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await adminService.getAdminAnalytics();
            setData(res);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch analytics.');
        } finally {
            setLoading(false);
        }
    };

    const handleRunAnalysis = async () => {
        setRunning(true);
        setError('');
        try {
            await adminService.runAnalysis();
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Analysis failed.');
        } finally {
            setRunning(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const summary = data?.summary;
    const batches = data?.batches || [];
    const isEmpty = !loading && summary?.total_at_risk === 0;

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-indigo-600" />
                        Student Analytics
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        At-risk students grouped by batch &amp; department
                    </p>
                </div>
                <button
                    onClick={handleRunAnalysis}
                    disabled={running}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-60 transition-all active:scale-[0.97]"
                >
                    <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
                    {running ? 'Running…' : 'Run Analysis'}
                </button>
            </div>

            {/* ── ML Info Banner ── */}
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
                <div className="bg-white p-2.5 rounded-xl shadow-sm shrink-0">
                    <Brain className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-indigo-900 mb-1">Powered by XGBoost ML Engine</h3>
                    <p className="text-xs text-indigo-800/80 leading-relaxed max-w-4xl">
                        Risk predictions are generated using an <strong>XGBoost Regressor</strong> trained on historical academic data. 
                        The model analyzes 16 distinct features—including attendance trends, mid-semester assessments, and past performance—to predict future GPAs. 
                        These predictions are dynamically classified into High and Medium risk tiers, allowing proactive intervention for students who need it most.
                    </p>
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                    {error}
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div className="text-center py-20 text-gray-400">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3" />
                    <p className="text-sm">Loading analytics…</p>
                </div>
            )}

            {/* ── Empty state ── */}
            {!loading && isEmpty && (
                <div className="text-center py-20 bg-white rounded-2xl shadow-premium border border-gray-100/80">
                    <ShieldAlert className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-lg font-bold text-gray-700 mb-1">No at-risk students found</h2>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto">
                        Either no predictions have been generated yet, or all students are performing well. Click <strong>Run Analysis</strong> to generate fresh predictions.
                    </p>
                </div>
            )}

            {/* ── Summary cards ── */}
            {!loading && summary && summary.total_at_risk > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryCard
                            icon={AlertTriangle}
                            label="Total At-Risk"
                            value={summary.total_at_risk}
                            color="bg-gradient-to-br from-red-500 to-orange-500"
                        />
                        <SummaryCard
                            icon={AlertTriangle}
                            label="High Risk"
                            value={summary.high}
                            color="bg-gradient-to-br from-red-600 to-red-400"
                        />
                        <SummaryCard
                            icon={AlertTriangle}
                            label="Medium Risk"
                            value={summary.medium}
                            color="bg-gradient-to-br from-amber-500 to-yellow-400"
                        />
                    </div>

                    {/* ── Batch cards ── */}
                    <div className="space-y-4">
                        {batches.map((b) => (
                            <BatchCard key={b.id} batch={b} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminAnalytics;
