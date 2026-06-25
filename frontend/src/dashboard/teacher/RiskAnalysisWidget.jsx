import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { AlertTriangle, CheckCircle, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import TeacherAnalyticsModal from './TeacherAnalyticsModal';

const RiskAnalysisWidget = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await analyticsService.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch analytics stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRunAnalysis = async () => {
        setAnalyzing(true);
        try {
            await analyticsService.runAnalysis();
            await fetchStats(); // Refresh stats after analysis
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <span className="mr-2">📊</span> Student Risk Analysis
                </h3>
                <button
                    onClick={handleRunAnalysis}
                    disabled={analyzing}
                    className={`flex items-center text-sm px-3 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition ${analyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <RefreshCw size={16} className={`mr-2 ${analyzing ? 'animate-spin' : ''}`} />
                    {analyzing ? 'Analyzing...' : 'Run Analysis'}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div 
                    onClick={() => setShowModal(true)}
                    className="p-4 bg-red-50 rounded-lg border border-red-100 text-center cursor-pointer hover:bg-red-100 hover:shadow-md transition-all group"
                >
                    <div className="flex justify-center mb-2">
                        <AlertTriangle className="text-red-500 group-hover:scale-110 transition-transform" size={24} />
                    </div>
                    <div className="text-2xl font-bold text-red-700">{stats?.high || 0}</div>
                    <div className="text-xs text-red-600 font-medium mt-1 flex items-center justify-center gap-1">
                        High Risk <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                <div 
                    onClick={() => setShowModal(true)}
                    className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-center cursor-pointer hover:bg-yellow-100 hover:shadow-md transition-all group"
                >
                    <div className="flex justify-center mb-2">
                        <AlertCircle className="text-yellow-500 group-hover:scale-110 transition-transform" size={24} />
                    </div>
                    <div className="text-2xl font-bold text-yellow-700">{stats?.medium || 0}</div>
                    <div className="text-xs text-yellow-600 font-medium mt-1 flex items-center justify-center gap-1">
                        Medium Risk <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center opacity-70">
                    <div className="flex justify-center mb-2">
                        <CheckCircle className="text-green-500" size={24} />
                    </div>
                    <div className="text-2xl font-bold text-green-700">{stats?.low || 0}</div>
                    <div className="text-xs text-green-600 font-medium mt-1">Low Risk</div>
                </div>
            </div>

            <div className="mt-4 text-xs text-gray-400 text-center">
                Click on High/Medium risk cards to view AI insights.
            </div>
            
            <TeacherAnalyticsModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
};

export default RiskAnalysisWidget;
