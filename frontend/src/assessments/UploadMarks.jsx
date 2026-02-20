import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assessmentService } from "../services/assessmentService";
import { Save, ArrowLeft, CheckCircle } from "lucide-react";

const UploadMarks = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchMarks();
    }, [assessmentId]);

    const fetchMarks = async () => {
        try {
            const data = await assessmentService.getMarks(assessmentId);
            // data is list of marks records (or empty if not yet assigned, assuming backend handles this)
            // If backend returns empty list for new assessment, we might need to fetch enrolled students and merge.
            // However, usually "marks" endpoint should return entries for all enrolled students with null marks if not set,
            // OR we need to handle that logic here.
            // Let's assume backend returns pre-populated list or we use the list directly.

            // data is the sheet list directly
            const records = Array.isArray(data) ? data : data.results || [];
            // Backend already sorts, but safe to keep or remove.
            // Field names match what we set in view: student_reg_no, etc.
            setStudents(records);
        } catch (error) {
            console.error("Failed to fetch marks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId, marks) => {
        setStudents(prev => prev.map(record =>
            record.student_id === studentId ? { ...record, marks_obtained: marks } : record
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const payload = students.map(record => ({
                student_id: record.student_id,
                marks: parseFloat(record.marks_obtained) || 0 // Ensure number
            }));

            await assessmentService.updateMarks(assessmentId, payload);
            setMessage({ type: 'success', text: 'Marks saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save marks.' });
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading marks...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Enter Marks</h2>
                        <p className="text-gray-500">Assessment ID: {assessmentId}</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center px-6 py-2 rounded-lg text-white font-semibold shadow-md transition ${saving ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                    {saving ? 'Saving...' : <><Save className="mr-2 h-5 w-5" /> Save Changes</>}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} flex items-center`}>
                    {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
                    {message.text}
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration No</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks Obtained</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((record) => (
                            <tr key={record.student_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.student_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.student_reg_no}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100" // Should ideally be max_marks from context
                                        value={record.marks_obtained !== null ? record.marks_obtained : ''}
                                        onChange={(e) => handleMarkChange(record.student_id, e.target.value)}
                                        className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-24 sm:text-sm border-gray-300 rounded-md"
                                        placeholder="0.00"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UploadMarks;
