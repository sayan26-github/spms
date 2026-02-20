import { Link } from "react-router-dom";

const Unauthorized = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-6xl font-bold text-red-600">403</h1>
            <p className="text-2xl mt-4 font-semibold text-gray-800">Unauthorized Access</p>
            <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
            <Link to="/" className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Go Home
            </Link>
        </div>
    );
};

export default Unauthorized;
