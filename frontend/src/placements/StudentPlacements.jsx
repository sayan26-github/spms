import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Target, MapPin, Zap, CheckCircle, Clock, User } from 'lucide-react';
import { placementService } from '../services/placementService';
import { useAuth } from '../auth/AuthContext';

export default function StudentPlacements() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [recs, stats] = await Promise.all([
                placementService.getRecommendedJobs(),
                placementService.getPlacementProbability()
            ]);
            setRecommendations(recs);
            setAnalytics(stats);
        } catch (error) {
            console.error("Failed to fetch placement data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
                <div className="h-32 bg-slate-100 rounded-2xl"></div>
                <div className="h-64 bg-slate-100 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Placement Cell</h1>
                    <p className="text-slate-500 mt-2">AI-driven career opportunities tailored to your profile</p>
                </div>
                <Link to="/student/profile" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200 shadow-sm">
                    <User className="h-5 w-5" />
                    Edit Profile & Resume
                </Link>
            </div>

            {analytics && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-indigo-900">Your Placement Prediction</h2>
                        <p className="text-indigo-700/80 mt-1">Based on XGBoost analysis of your academic performance and skills</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Probability</div>
                        <div className="text-4xl font-black text-indigo-700">{Math.round(analytics.placement_probability * 100)}%</div>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Zap className="h-6 w-6 text-yellow-500" />
                    AI Recommended Roles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((rec, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                        rec.match_score > 80 ? 'bg-green-100 text-green-700' :
                                        rec.match_score > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {Math.round(rec.match_score)}% Match
                                    </span>
                                    {rec.placement_probability && (
                                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700">
                                            {Math.round(rec.placement_probability * 100)}% ML Prob
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{rec.job.title}</h3>
                            <p className="text-slate-500 text-sm mt-1 mb-4 flex items-center gap-1">
                                <MapPin className="h-4 w-4" /> {rec.job.company.name} ({rec.job.company.tier})
                            </p>
                            
                            <div className="space-y-2 mb-6">
                                <div className="text-xs font-semibold text-slate-500 uppercase">Missing Skills</div>
                                <div className="flex flex-wrap gap-2">
                                    {rec.missing_skills.length > 0 ? (
                                        rec.missing_skills.map(skill => (
                                            <span key={skill} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-green-600 text-sm flex items-center gap-1">
                                            <CheckCircle className="h-4 w-4" /> Perfect Match
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <button className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
                                Apply Now
                            </button>
                        </div>
                    ))}
                    {recommendations.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                            No recommendations found. Keep improving your skills!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
