import React, { useState } from 'react';
import { resourceService } from '../services/resourceService';
import { Upload, Link, Type, X } from 'lucide-react';

const ResourceUploadModal = ({ subjectId, onClose, onUploadSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('file'); // 'file' or 'link'
    const [file, setFile] = useState(null);
    const [link, setLink] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        const formData = new FormData();
        formData.append('subject', subjectId);
        formData.append('title', title);
        formData.append('description', description);

        if (type === 'file') {
            if (!file) {
                alert("Please select a file");
                setUploading(false);
                return;
            }
            formData.append('file', file);
        } else {
            if (!link) {
                alert("Please enter a link");
                setUploading(false);
                return;
            }
            formData.append('link', link);
        }

        try {
            await resourceService.uploadResource(formData);
            onUploadSuccess();
            onClose();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload resource");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800">Upload Resource</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Resource Type Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('file')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            File Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('link')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'link' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            External Link
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <div className="relative">
                            <Type className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                placeholder="e.g. Lecture Notes - Week 1"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea
                            rows="2"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                            placeholder="Brief description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    {type === 'file' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    required
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                                <div className="flex flex-col items-center justify-center text-gray-400">
                                    <Upload size={32} className="mb-2" />
                                    <span className="text-sm">{file ? file.name : "Click to upload or drag and drop"}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">External Link</label>
                            <div className="relative">
                                <Link className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="url"
                                    required
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="https://"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center space-x-2 font-medium"
                        >
                            {uploading ? "Uploading..." : "Upload Resource"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResourceUploadModal;
