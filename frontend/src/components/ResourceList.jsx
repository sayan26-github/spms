import React, { useState, useEffect } from 'react';
import { resourceService } from '../services/resourceService';
import { useAuth } from '../auth/AuthContext';
import { FileText, Link, Trash2, Download, ExternalLink } from 'lucide-react';

const ResourceList = ({ subjectId }) => {
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (subjectId) {
            fetchResources();
        }
    }, [subjectId]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const data = await resourceService.getResourcesBySubject(subjectId);
            setResources(data.results || data);
        } catch (error) {
            console.error("Failed to fetch resources", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this resource?")) {
            try {
                await resourceService.deleteResource(id);
                setResources(resources.filter(r => r.id !== id));
            } catch (error) {
                alert("Failed to delete resource");
            }
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Loading resources...</div>;

    if (resources.length === 0) {
        return <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">No resources uploaded yet.</div>;
    }

    return (
        <div className="space-y-3">
            {resources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${resource.file ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {resource.file ? <FileText size={24} /> : <Link size={24} />}
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">{resource.title}</h4>
                            <p className="text-sm text-gray-500">{resource.description || "No description"}</p>
                            <span className="text-xs text-gray-400">{new Date(resource.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {resource.file ? (
                            <a
                                href={resource.file}
                                download
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                title="Download"
                            >
                                <Download size={20} />
                            </a>
                        ) : (
                            <a
                                href={resource.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                title="Open Link"
                            >
                                <ExternalLink size={20} />
                            </a>
                        )}

                        {user.role === 'TEACHER' && (
                            <button
                                onClick={() => handleDelete(resource.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ResourceList;
