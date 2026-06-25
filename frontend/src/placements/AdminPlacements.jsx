import React, { useState, useEffect } from 'react';
import { Briefcase, Building, Users, Activity, Plus } from 'lucide-react';
import { placementService } from '../services/placementService';
import { useAuth } from '../auth/AuthContext';

export default function AdminPlacements() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [jobsData, compsData, appsData] = await Promise.all([
                placementService.getJobs(),
                placementService.getCompanies(),
                placementService.getApplications()
            ]);
            setJobs(jobsData);
            setCompanies(compsData);
            setApplications(appsData);
        } catch (error) {
            console.error("Failed to fetch admin placement data", error);
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Placement Management</h1>
                    <p className="text-slate-500 mt-2">Manage companies, open roles, and track cohort metrics</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors">
                    <Plus className="h-5 w-5" />
                    Post New Job
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Briefcase className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-500 uppercase">Active Jobs</div>
                        <div className="text-2xl font-bold text-slate-900">{jobs.filter(j => j.is_active).length}</div>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                        <Building className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-500 uppercase">Partner Companies</div>
                        <div className="text-2xl font-bold text-slate-900">{companies.length}</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                        <Users className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-500 uppercase">Total Applications</div>
                        <div className="text-2xl font-bold text-slate-900">{applications.length}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-900">Recent Job Postings</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {jobs.slice(0, 5).map(job => (
                        <div key={job.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div>
                                <h3 className="font-bold text-slate-900">{job.title}</h3>
                                <p className="text-slate-500 text-sm mt-1">{job.company.name} • {job.job_type}</p>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                    job.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {job.is_active ? 'ACTIVE' : 'CLOSED'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
