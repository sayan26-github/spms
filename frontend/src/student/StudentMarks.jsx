import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Award, TrendingUp } from 'lucide-react';
import assessmentService from '../services/assessmentService';
import academicService from '../services/academicService';

const StudentMarks = () => {
    const [searchParams] = useSearchParams();
    const subjectId = searchParams.get('subject');

    const [marks, setMarks] = useState([]);
    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (subjectId) {
                    const subjects = await academicService.getSubjects();
                    const subs = Array.isArray(subjects) ? subjects : subjects.results || [];
                    const found = subs.find(s => s.id.toString() === subjectId);
                    if (found) setSubject(found);
                }

                // Need a way to fetch marks for student. 
                // Currently implemented: assessmentService.getMarks(assessmentId) -> Teacher view
                // We likely need a new service method: getStudentMarks() which calls GET /api/v1/assessments/marks/
                const data = await assessmentService.getAllStudentMarks(); // Assuming we add this
                const allMarks = Array.isArray(data) ? data : data.results || [];

                if (subjectId) {
                    // Filter marks where assessment belongs to subject
                    // Dependent on API returning nested subject info in 'assessment' field
                    setMarks(allMarks.filter(m =>
                        m.assessment.subject === parseInt(subjectId) ||
                        m.assessment.subject?.id === parseInt(subjectId)
                    ));
                } else {
                    setMarks(allMarks);
                }

            } catch (error) {
                console.error("Error fetching marks:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [subjectId]);

    const calculateAverage = () => {
        if (marks.length === 0) return 0;
        const totalObtained = marks.reduce((sum, m) => sum + parseFloat(m.marks_obtained), 0);
        const totalMax = marks.reduce((sum, m) => sum + parseFloat(m.assessment.max_marks), 0);
        if (totalMax === 0) return 0;
        return ((totalObtained / totalMax) * 100).toFixed(1);
    };

    if (loading) return <div className="p-8 text-center">Loading marks...</div>;

    const average = calculateAverage();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                    <Link to="/student/dashboard" className="mr-4 text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Performance {subject ? `- ${subject.name}` : ''}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Assessment Results & Remarks
                        </p>
                    </div>
                </div>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium">Overall Average</span>
                    <div className="text-2xl font-bold">{average}%</div>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {marks.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No marks recorded yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assessment
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Percentage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Remarks
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {marks.map((mark) => {
                                    const percentage = ((mark.marks_obtained / mark.assessment.max_marks) * 100).toFixed(1);
                                    return (
                                        <tr key={mark.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{mark.assessment.name}</div>
                                                <div className="text-xs text-gray-500">Max: {mark.assessment.max_marks}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(mark.assessment.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{mark.marks_obtained}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${percentage >= 75 ? 'bg-green-100 text-green-800' :
                                                    percentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {percentage}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {mark.remarks || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentMarks;
