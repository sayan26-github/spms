import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { X, AlertTriangle, AlertCircle, RefreshCw, ChevronRight, Brain } from 'lucide-react';

const TeacherAnalyticsModal = ({ isOpen, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchAnalytics();
        }
    }, [isOpen]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const result = await analyticsService.getTeacherAnalytics();
            setData(result);
        } catch (err) {
            console.error("Failed to fetch teacher analytics", err);
            setError("Failed to load insights. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Brain className="w-6 h-6 text-indigo-600" />
                            AI Insights: At-Risk Students
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Students enrolled in your subjects who require attention.
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                            <p>Analyzing student performance...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-center border border-red-100">
                            {error}
                        </div>
                    ) : data?.at_risk_students?.length > 0 ? (
                        <div className="space-y-4">
                            {data.at_risk_students.map(student => (
                                <div key={student.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                                            <p className="text-sm text-gray-500">{student.reg_number} • {student.batch}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {student.risk_level === 'HIGH' ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100">
                                                    <AlertTriangle size={14} /> HIGH RISK
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                                                    <AlertCircle size={14} /> MEDIUM RISK
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* AI Insights Section */}
                                    <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-50">
                                        <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                            <Brain size={14} className="text-indigo-600" /> Key Risk Factors
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {student.top_risk_factors.map((factor, idx) => (
                                                <span 
                                                    key={idx} 
                                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 border
                                                        ${factor.severity === 'high' 
                                                            ? 'bg-red-50 text-red-700 border-red-100' 
                                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                                        }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${factor.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                    {factor.factor}
                                                </span>
                                            ))}
                                            {student.top_risk_factors.length === 0 && (
                                                <span className="text-sm text-gray-500">No specific factors detected.</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Subject Context */}
                                    {student.my_weak_subjects.length > 0 && (
                                        <div className="mt-4 pl-1">
                                            <p className="text-xs font-medium text-gray-500 mb-2">Performance in your subjects:</p>
                                            <div className="flex flex-col gap-2">
                                                {student.my_weak_subjects.map(ws => (
                                                    <div key={ws.subject_id} className="flex items-center text-sm gap-3">
                                                        <ChevronRight size={14} className="text-gray-400" />
                                                        <span className="font-semibold text-gray-700">{ws.subject_name}</span>
                                                        <span className="text-gray-400 text-xs">({ws.subject_code})</span>
                                                        <div className="ml-auto flex gap-2">
                                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                                Att: {ws.attendance_pct ?? 'N/A'}%
                                                            </span>
                                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                                Marks: {ws.marks_pct ?? 'N/A'}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle size={32} className="text-gray-300" />
                            </div>
                            <p className="font-medium text-gray-900 mb-1">No At-Risk Students</p>
                            <p className="text-sm">Great news! None of your students are currently flagged as high risk.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherAnalyticsModal;
