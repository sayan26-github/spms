import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle, CheckCircle, HelpCircle, TrendingUp, TrendingDown,
    BookOpen, UserCheck, Lightbulb, ChevronLeft, BarChart3, Target, Zap, Brain
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const PerformanceInsights = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [recsData, setRecsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const [res, recsRes] = await Promise.all([
                    analyticsService.getMyInsights(),
                    analyticsService.getSubjectRecommendations()
                ]);
                setData(res);
                setRecsData(recsRes);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load insights');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-brand-muted font-medium">Analyzing your performance...</p>
            </div>
        </div>
    );
    if (error) return <div className="p-10 text-center text-red-500 bg-red-50 rounded-xl m-8">{error}</div>;
    if (!data) return null;

    const { prediction, recommendations, features, weak_subjects, semester_progression } = data;

    const riskColors = {
        HIGH: { bg: 'from-red-500 to-rose-600', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' },
        MEDIUM: { bg: 'from-amber-500 to-orange-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' },
        LOW: { bg: 'from-emerald-500 to-green-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' },
    };
    const rc = riskColors[prediction.risk_level] || riskColors.LOW;

    const RiskIcon = prediction.risk_level === 'HIGH' ? AlertTriangle : prediction.risk_level === 'MEDIUM' ? HelpCircle : CheckCircle;

    const radarData = [
        { metric: 'Attendance', value: features.overall_attendance_pct || 0, max: 100 },
        { metric: 'Marks Avg', value: features.avg_marks_pct || 0, max: 100 },
        { metric: 'Assignments', value: features.assignment_completion_pct || 0, max: 100 },
        { metric: 'Quizzes', value: features.quiz_avg || 0, max: 100 },
        { metric: 'Consistency', value: Math.max(0, 100 - (features.marks_std_dev || 0) * 2), max: 100 },
        { metric: 'Skills', value: Math.min(100, (features.skill_count || 0) * 20), max: 100 },
    ];

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            {/* Back Button */}
            <button onClick={() => navigate('/')} className="flex items-center text-brand-muted hover:text-brand-primary font-medium transition-colors">
                <ChevronLeft size={18} className="mr-1" /> Back to Dashboard
            </button>

            {/* Hero Section */}
            <div className={`bg-gradient-to-br ${rc.bg} rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden`}>
                <div className="absolute -right-10 -bottom-10 opacity-10">
                    <RiskIcon size={200} />
                </div>
                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                            <p className="text-white/70 font-semibold uppercase tracking-wider text-sm mb-2">AI Performance Analysis</p>
                            <h1 className="text-4xl sm:text-5xl font-black">
                                {prediction.predicted_gpa.toFixed(2)} <span className="text-2xl font-medium text-white/60">/ 10</span>
                            </h1>
                            <p className="text-white/80 mt-2 text-lg">Predicted Semester GPA</p>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20">
                                <RiskIcon size={24} />
                                <div>
                                    <p className="font-bold text-xl">{prediction.risk_level} Risk</p>
                                    <p className="text-sm text-white/70">Confidence: {Math.round(prediction.risk_score * 100)}%</p>
                                </div>
                            </div>
                            <p className="text-xs text-white/40 mt-2">Model: {prediction.model_version}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ML Info Banner */}
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100/50 rounded-2xl p-5 flex gap-4 items-start shadow-sm animate-fade-in">
                <div className="bg-white p-2.5 rounded-xl shadow-sm shrink-0">
                    <Brain className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-indigo-900 mb-1">Powered by XGBoost ML Engine</h3>
                    <p className="text-xs text-indigo-800/80 leading-relaxed max-w-4xl">
                        Your performance prediction is generated by our custom <strong>XGBoost Regressor</strong>. 
                        It evaluates 21 personalized data points—including your attendance patterns, continuous assessment marks, assignment completion rates, skills, and historical consistency—to accurately predict your final semester GPA. 
                        Use the insights below to focus your efforts on the areas that need the most improvement.
                    </p>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Attendance', value: `${features.overall_attendance_pct || 0}%`, icon: UserCheck, color: (features.overall_attendance_pct || 0) >= 75 ? 'text-emerald-600' : 'text-red-600' },
                    { label: 'Avg Marks', value: `${features.avg_marks_pct || 0}%`, icon: BarChart3, color: (features.avg_marks_pct || 0) >= 50 ? 'text-indigo-600' : 'text-red-600' },
                    { label: 'Assignments', value: `${features.assignment_completion_pct || 0}%`, icon: BookOpen, color: (features.assignment_completion_pct || 0) >= 80 ? 'text-emerald-600' : 'text-amber-600' },
                    { label: 'Skills Added', value: features.skill_count || 0, icon: Lightbulb, color: (features.skill_count || 0) >= 3 ? 'text-emerald-600' : 'text-slate-600' },
                    { label: 'Marks Trend', value: `${features.marks_trend > 0 ? '+' : ''}${features.marks_trend || 0}%`, icon: features.marks_trend >= 0 ? TrendingUp : TrendingDown, color: features.marks_trend >= 0 ? 'text-emerald-600' : 'text-red-600' },
                    { label: 'Weak Subjects', value: features.subjects_below_60 || 0, icon: Target, color: (features.subjects_below_60 || 0) === 0 ? 'text-emerald-600' : 'text-amber-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="modern-card rounded-2xl p-5">
                        <Icon size={20} className={`${color} mb-3`} />
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Semester Progression */}
                <div className="modern-card rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center">
                        <TrendingUp size={20} className="mr-2 text-indigo-600" /> Semester GPA Progression
                    </h3>
                    {semester_progression.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={semester_progression}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="semester" tickFormatter={(v) => `Sem ${v}`} fontSize={12} />
                                <YAxis domain={[0, 10]} fontSize={12} />
                                <Tooltip formatter={(v) => [v.toFixed(2), 'SGPA']} labelFormatter={(l) => `Semester ${l}`} />
                                <Line type="monotone" dataKey="sgpa" stroke="#6366f1" strokeWidth={3} dot={{ r: 6, fill: '#6366f1' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-brand-muted text-sm py-10 text-center">No semester data yet.</p>
                    )}
                </div>

                {/* Radar Chart */}
                <div className="modern-card rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center">
                        <Zap size={20} className="mr-2 text-purple-600" /> Performance Radar
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="metric" fontSize={12} />
                            <PolarRadiusAxis domain={[0, 100]} tick={false} />
                            <Radar name="Performance" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recommendations Panel */}
            <div className="modern-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-brand-text mb-5 flex items-center">
                    <Lightbulb size={20} className="mr-2 text-amber-500" /> Personalized Recommendations
                </h3>
                <div className="space-y-3">
                    {recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-brand-border hover:border-indigo-200 transition-colors">
                            <span className="text-lg flex-shrink-0 mt-0.5">{rec.slice(0, 2)}</span>
                            <p className="text-sm text-brand-text font-medium leading-relaxed">{rec.slice(2).trim()}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Smart Elective Recommendations */}
            {recsData && recsData.length > 0 && (
                <div className="modern-card rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-brand-text mb-5 flex items-center">
                        <Brain size={20} className="mr-2 text-indigo-500" /> Smart Elective Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recsData.map((rec, i) => (
                            <div key={i} className="border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white rounded-xl p-5 hover:shadow-md transition-all relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Target size={64} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-indigo-900 line-clamp-1" title={rec.subject_name}>{rec.subject_name}</p>
                                            <p className="text-xs text-indigo-600/80 font-mono font-medium">{rec.subject_code} • Sem {rec.semester}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-semibold text-slate-500 uppercase">Predicted</span>
                                            <span className="text-xl font-black text-indigo-600">{rec.predicted_gpa}<span className="text-sm font-medium text-indigo-400">/10</span></span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(rec.predicted_gpa / 10) * 100}%` }}></div>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed border-t border-indigo-100 pt-3 flex items-start gap-1.5">
                                            <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                            {rec.reason}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Weak Subjects */}
            {weak_subjects && weak_subjects.length > 0 && (
                <div className="modern-card rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-brand-text mb-5 flex items-center">
                        <BookOpen size={20} className="mr-2 text-rose-500" /> Subjects Needing Attention
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {weak_subjects.map((subj) => (
                            <div key={subj.subject_id} className="border border-brand-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-brand-text">{subj.subject_name}</p>
                                        <p className="text-xs text-brand-muted font-mono">{subj.subject_code}</p>
                                    </div>
                                    <span className="text-xs font-medium text-brand-muted">{subj.teacher_name}</span>
                                </div>
                                <div className="flex gap-4">
                                    {subj.attendance_pct !== null && (
                                        <div>
                                            <p className={`text-lg font-bold ${subj.attendance_pct < 75 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {subj.attendance_pct}%
                                            </p>
                                            <p className="text-[10px] text-brand-muted uppercase font-semibold">Attendance</p>
                                        </div>
                                    )}
                                    {subj.marks_pct !== null && (
                                        <div>
                                            <p className={`text-lg font-bold ${subj.marks_pct < 40 ? 'text-red-600' : 'text-amber-600'}`}>
                                                {subj.marks_pct}%
                                            </p>
                                            <p className="text-[10px] text-brand-muted uppercase font-semibold">Marks</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceInsights;
