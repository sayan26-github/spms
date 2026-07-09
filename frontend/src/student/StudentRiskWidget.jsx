import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { TrendingUp, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

const StudentRiskWidget = () => {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrediction = async () => {
            try {
                // Students only see their own, so list will likely have 1 or 0
                const data = await analyticsService.getPredictions();
                // Assuming it returns a list, take the latest
                const preds = Array.isArray(data) ? data : data.results || [];
                if (preds.length > 0) {
                    setPrediction(preds[0]); // Ordered by date desc in backend view ideally, or we sort
                }
            } catch (error) {
                console.error("Failed to fetch risk prediction", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrediction();
    }, []);

    if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded-lg mb-6"></div>;

    if (!prediction) return null; // Don't show if no data

    const getRiskColor = (level) => {
        switch (level) {
            case 'HIGH': return 'bg-red-50 text-red-700 border-red-200';
            case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'LOW': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getRiskIcon = (level) => {
        switch (level) {
            case 'HIGH': return <AlertTriangle className="h-5 w-5" />;
            case 'MEDIUM': return <HelpCircle className="h-5 w-5" />;
            case 'LOW': return <CheckCircle className="h-5 w-5" />;
            default: return <TrendingUp className="h-5 w-5" />;
        }
    };

    const colorClass = getRiskColor(prediction.risk_level);

    return (
        <div className={`p-4 rounded-xl border ${colorClass} mb-6 flex items-center justify-between shadow-sm`}>
            <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-white/50 rounded-xl shadow-sm">
                    {getRiskIcon(prediction.risk_level)}
                </div>
                <div>
                    <h3 className="font-bold text-lg">Risk Assessment: {prediction.risk_level}</h3>
                    <p className="text-sm opacity-90 mt-0.5">
                        Predicted Semester GPA: <span className="font-bold">{prediction.predicted_gpa}</span> / 10.0
                    </p>
                </div>
            </div>
            <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    Academic Health
                </div>
                <div className="text-xl font-bold">
                    {100 - Math.round(prediction.risk_score * 100)}%
                </div>
            </div>
        </div>
    );
};

export default StudentRiskWidget;
