import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { attendanceService } from "../services/attendanceService";
import { Save, ArrowLeft, CheckCircle } from "lucide-react";

const MarkAttendance = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null); // We might need to fetch session details if not included in attendance
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchAttendance();
    }, [sessionId]);

    const fetchAttendance = async () => {
        try {
            const data = await attendanceService.getAttendance(sessionId);
            // data is list of attendance records
            // Assuming data = [{ student: {id, reg_no, name}, status: '...'}, ...] based on serializer
            // Or if it returns paginated: data.results
            const records = Array.isArray(data) ? data : data.results || [];

            // Sort by Registration Number
            records.sort((a, b) => a.registration_number.localeCompare(b.registration_number));

            setStudents(records);
        } catch (error) {
            console.error("Failed to fetch attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setStudents(prev => prev.map(record =>
            record.student === studentId ? { ...record, status } : record
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const payload = students.map(record => ({
                student_id: record.student, // record.student is the ID based on serializer
                status: record.status
            }));

            await attendanceService.updateAttendance(sessionId, payload);
            setMessage({ type: 'success', text: 'Attendance saved successfully!' });

            // Auto-hide message
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save attendance.' });
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading attendance...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Mark Attendance</h2>
                        <p className="text-gray-500">Session ID: {sessionId}</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center px-6 py-2 rounded-lg text-white font-semibold shadow-md transition ${saving ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {saving ? 'Saving...' : <><Save className="mr-2 h-5 w-5" /> Save Changes</>}
                </button>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} flex items-center`}>
                    {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
                    {message.text}
                </div>
            )}

            {/* Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Registration No
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((record) => (
                            <tr key={record.id} className={record.status === 'ABSENT' ? 'bg-red-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{record.student_name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{record.registration_number}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="inline-flex rounded-md shadow-sm" role="group">
                                        {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => handleStatusChange(record.student, status)}
                                                className={`
                                    px-4 py-2 text-xs font-medium border
                                    ${record.status === status
                                                        ? (status === 'PRESENT' ? 'bg-green-600 text-white border-green-600' :
                                                            status === 'ABSENT' ? 'bg-red-600 text-white border-red-600' :
                                                                'bg-gray-600 text-white border-gray-600')
                                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}
                                    ${status === 'PRESENT' ? 'rounded-l-lg' : ''}
                                    ${status === 'EXCUSED' ? 'rounded-r-lg' : ''}
                                `}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MarkAttendance;
