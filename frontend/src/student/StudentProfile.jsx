import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Mail, Phone, FileText, UploadCloud, CheckCircle2, AlertCircle, Save, Trash2, Plus, Zap } from 'lucide-react';
import { authService } from '../services/authService';
import { placementService } from '../services/placementService';
import { useAuth } from '../auth/AuthContext';

const StudentProfile = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        bio: '',
    });
    const [resumeFile, setResumeFile] = useState(null);
    const [currentResumeUrl, setCurrentResumeUrl] = useState(null);

    // Skills state
    const [mySkills, setMySkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [selectedSkillId, setSelectedSkillId] = useState('');
    const [selectedProficiency, setSelectedProficiency] = useState(3);
    const [skillsLoading, setSkillsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Profile
                const res = await authService.getProfile();
                const data = res.data;
                setFormData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    email: data.email || '',
                    phone_number: data.phone_number || '',
                    bio: data.bio || '',
                });
                if (data.resume) {
                    setCurrentResumeUrl(data.resume);
                }

                // Fetch Skills
                const [skillsData, mySkillsData] = await Promise.all([
                    placementService.getSkills(),
                    placementService.getMySkills()
                ]);
                setAvailableSkills(skillsData);
                setMySkills(mySkillsData);

            } catch (err) {
                setMessage({ type: 'error', text: 'Failed to load profile data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleAddSkill = async () => {
        if (!selectedSkillId) return;
        setSkillsLoading(true);
        try {
            await placementService.addSkill(selectedSkillId, selectedProficiency);
            const mySkillsData = await placementService.getMySkills();
            setMySkills(mySkillsData);
            setSelectedSkillId('');
            setSelectedProficiency(3);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to add skill.' });
        } finally {
            setSkillsLoading(false);
        }
    };

    const handleRemoveSkill = async (studentSkillId) => {
        setSkillsLoading(true);
        try {
            await placementService.removeSkill(studentSkillId);
            const mySkillsData = await placementService.getMySkills();
            setMySkills(mySkillsData);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to remove skill.' });
        } finally {
            setSkillsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const data = new FormData();
            // Append text fields
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            
            // Append file if selected
            if (resumeFile) {
                data.append('student_profile.resume', resumeFile);
            }
            // Append bio under student_profile nested structure for DRF
            if (formData.bio !== undefined) {
                data.append('student_profile.bio', formData.bio);
            }

            const res = await authService.updateProfileWithFile(data);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            
            // Update AuthContext if name changed
            if (res.data.first_name || res.data.last_name) {
                updateUser({ 
                    first_name: res.data.first_name, 
                    last_name: res.data.last_name,
                    name: `${res.data.first_name} ${res.data.last_name}`
                });
            }

            if (res.data.resume) {
                setCurrentResumeUrl(res.data.resume);
                setResumeFile(null); // Clear selected file after successful upload
            }

        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fade-in">
            <button onClick={() => navigate(-1)} className="flex items-center text-brand-muted hover:text-brand-primary font-medium transition-colors">
                <ChevronLeft size={18} className="mr-1" /> Back
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white flex items-center gap-6">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30 shrink-0">
                        <User size={40} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{formData.first_name} {formData.last_name}</h1>
                        <p className="text-blue-100 mt-1 text-lg">
                            {user?.department || 'Department N/A'} • {user?.batch || 'Batch N/A'}
                        </p>
                        <p className="text-blue-200 text-sm mt-1 font-mono">{user?.registrationNumber}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {message.text && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            <p className="font-medium">{message.text}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Mail size={16} className="text-gray-400" /> Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Phone size={16} className="text-gray-400" /> Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">About Me (Bio)</label>
                        <p className="text-sm text-gray-500 mb-3">Add a short bio to highlight your interests and goals to potential recruiters.</p>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows="4"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none"
                            placeholder="I am a passionate software engineering student looking for..."
                        ></textarea>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText size={18} className="text-indigo-600" /> Resume / CV Upload
                        </label>
                        <p className="text-sm text-gray-500 mb-4">Upload your latest resume. This will be automatically attached when you apply for placements.</p>
                        
                        {currentResumeUrl && !resumeFile && (
                            <div className="mb-4 flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 inline-flex">
                                <FileText size={24} className="text-emerald-500" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Current Resume Active</p>
                                    <a href={currentResumeUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">View File</a>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-200 border-dashed rounded-xl cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                                    <p className="text-sm text-indigo-600 font-semibold">
                                        {resumeFile ? resumeFile.name : "Click to upload new resume"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">PDF or DOCX (MAX. 5MB)</p>
                                </div>
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* SKILLS SECTION */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <label className="block text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Zap size={20} className="text-yellow-500" /> Manage Technical Skills
                        </label>
                        <p className="text-sm text-gray-500 mb-6">Add your skills to improve your AI Job Recommendations match score.</p>
                        
                        {/* Current Skills list */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {mySkills.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No skills added yet.</p>
                            ) : (
                                mySkills.map(studentSkill => (
                                    <div key={studentSkill.id} className="group flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold">
                                        <span>{studentSkill.skill.name}</span>
                                        <span className="bg-white text-indigo-600 px-1.5 py-0.5 rounded text-xs ml-1 border border-indigo-100" title="Proficiency (1-5)">
                                            lvl {studentSkill.proficiency}
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveSkill(studentSkill.id)} 
                                            disabled={skillsLoading}
                                            className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Skill Form */}
                        <div className="flex flex-wrap items-end gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Select Skill</label>
                                <select 
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                    value={selectedSkillId}
                                    onChange={(e) => setSelectedSkillId(e.target.value)}
                                >
                                    <option value="">-- Choose a skill --</option>
                                    {availableSkills
                                        .filter(skill => !mySkills.find(ms => ms.skill.id === skill.id))
                                        .map(skill => (
                                            <option key={skill.id} value={skill.id}>{skill.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="w-32">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Proficiency</label>
                                <select 
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                    value={selectedProficiency}
                                    onChange={(e) => setSelectedProficiency(Number(e.target.value))}
                                >
                                    <option value="1">1 - Beginner</option>
                                    <option value="2">2 - Basic</option>
                                    <option value="3">3 - Intermediate</option>
                                    <option value="4">4 - Advanced</option>
                                    <option value="5">5 - Expert</option>
                                </select>
                            </div>
                            <button 
                                type="button"
                                disabled={!selectedSkillId || skillsLoading}
                                onClick={handleAddSkill}
                                className="h-[42px] px-5 bg-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Plus size={18} /> Add
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-sm transition-all disabled:opacity-70"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save size={20} />
                            )}
                            {saving ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentProfile;
