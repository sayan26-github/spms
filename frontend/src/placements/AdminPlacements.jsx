import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, Building, Users, Activity, Plus } from 'lucide-react';
import { useJobs, useCompanies, useApplications, useCreateJob, useCreateCompany } from '../hooks/usePlacementQueries';
import { useAuth } from '../auth/AuthContext';

export default function AdminPlacements() {
    const { user } = useAuth();

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        company_id: '',
        job_type: 'FULL_TIME',
        min_gpa: '0.00',
        ctc: '',
        deadline: '',
        description: ''
    });

    // Company Modal state
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [companySaving, setCompanySaving] = useState(false);
    const [companyError, setCompanyError] = useState('');
    const [companyFormData, setCompanyFormData] = useState({
        name: '',
        tier: 'Tier 2',
        website: '',
        description: ''
    });

    const { data: jobs = [], isLoading: loadingJobs } = useJobs();
    const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
    const { data: applications = [], isLoading: loadingApps } = useApplications();
    const loading = loadingJobs || loadingCompanies || loadingApps;

    const createJobMutation = useCreateJob();
    const createCompanyMutation = useCreateCompany();

    useEffect(() => {
        if (companies.length > 0 && !formData.company_id) {
            setFormData(prev => ({ ...prev, company_id: companies[0].id }));
        }
    }, [companies, formData.company_id]);

    const handleCreateJob = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await createJobMutation.mutateAsync({
                ...formData,
                min_gpa: parseFloat(formData.min_gpa) || 0.0,
                ctc: formData.ctc ? parseFloat(formData.ctc) : null,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : new Date().toISOString()
            });
            setShowModal(false);
            setFormData({
                title: '',
                company_id: companies[0]?.id || '',
                job_type: 'FULL_TIME',
                min_gpa: '0.00',
                ctc: '',
                deadline: '',
                description: ''
            });
        } catch (err) {
            setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create job posting');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        setCompanyError('');
        setCompanySaving(true);
        try {
            await createCompanyMutation.mutateAsync(companyFormData);
            setShowCompanyModal(false);
            setCompanyFormData({
                name: '',
                tier: 'Tier 2',
                website: '',
                description: ''
            });
        } catch (err) {
            setCompanyError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create company');
        } finally {
            setCompanySaving(false);
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

    const companyModal = showCompanyModal ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="modern-card w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-900">Add Partner Company</h2>
                    <button onClick={() => setShowCompanyModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                        <Plus size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto bg-white flex-1 space-y-4">
                    {companyError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{companyError}</div>
                    )}
                    <form id="company-form" onSubmit={handleCreateCompany} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Company Name *</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Google" 
                                value={companyFormData.name} 
                                onChange={e => setCompanyFormData({ ...companyFormData, name: e.target.value })} 
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                                required 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tier *</label>
                            <select 
                                value={companyFormData.tier} 
                                onChange={e => setCompanyFormData({ ...companyFormData, tier: e.target.value })} 
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white"
                                required
                            >
                                <option value="Tier 1">Tier 1</option>
                                <option value="Tier 2">Tier 2</option>
                                <option value="Tier 3">Tier 3</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Website URL</label>
                            <input 
                                type="url" 
                                placeholder="e.g. https://google.com" 
                                value={companyFormData.website} 
                                onChange={e => setCompanyFormData({ ...companyFormData, website: e.target.value })} 
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Description</label>
                            <textarea 
                                rows={3} 
                                placeholder="Brief description of the company..." 
                                value={companyFormData.description} 
                                onChange={e => setCompanyFormData({ ...companyFormData, description: e.target.value })} 
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none" 
                            />
                        </div>
                        <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3 mt-4">
                            <button type="button" onClick={() => setShowCompanyModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={companySaving} className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors">
                                {companySaving ? 'Adding...' : 'Add Company'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    const modal = showModal ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="modern-card w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-900">Post New Job</h2>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                        <Plus size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto bg-white flex-1 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
                    )}
                    <form id="job-form" onSubmit={handleCreateJob} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Job Title *</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Software Engineer" 
                                value={formData.title} 
                                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Company *</label>
                                <select 
                                    value={formData.company_id} 
                                    onChange={e => setFormData({ ...formData, company_id: e.target.value })} 
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white"
                                    required
                                >
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Job Type *</label>
                                <select 
                                    value={formData.job_type} 
                                    onChange={e => setFormData({ ...formData, job_type: e.target.value })} 
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white"
                                    required
                                >
                                    <option value="FULL_TIME">Full-Time</option>
                                    <option value="INTERNSHIP">Internship</option>
                                    <option value="PART_TIME">Part-Time</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Min GPA *</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    min="0" 
                                    max="10" 
                                    value={formData.min_gpa} 
                                    onChange={e => setFormData({ ...formData, min_gpa: e.target.value })} 
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                                    required 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">CTC (LPA)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    placeholder="e.g. 12.5" 
                                    value={formData.ctc} 
                                    onChange={e => setFormData({ ...formData, ctc: e.target.value })} 
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Deadline *</label>
                            <input 
                                type="datetime-local" 
                                value={formData.deadline} 
                                onChange={e => setFormData({ ...formData, deadline: e.target.value })} 
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                                required 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Description *</label>
                            <textarea 
                                rows={3} 
                                placeholder="Describe the job profile, responsibilities..." 
                                value={formData.description} 
                                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none" 
                                required 
                            />
                        </div>
                        <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3 mt-4">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors">
                                {saving ? 'Posting...' : 'Post Job'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Placement Management</h1>
                    <p className="text-slate-500 mt-2">Manage companies, open roles, and track cohort metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowCompanyModal(true)} 
                        className="flex items-center gap-2 bg-slate-100 text-slate-900 border border-slate-200 px-5 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition-colors shadow-sm"
                    >
                        <Plus className="h-5 w-5" />
                        Add Company
                    </button>
                    <button 
                        onClick={() => setShowModal(true)} 
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Post New Job
                    </button>
                </div>
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
            {modal}
            {companyModal}
        </div>
    );
}
