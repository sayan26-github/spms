import { createContext, useState, useEffect, useContext } from "react";
import { useProfile } from '../hooks/useAuthQueries';
import { authService } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const accessToken = localStorage.getItem("access_token");

    // We still load initial state from localStorage for instantaneous first paint
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser && accessToken) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (err) {
                localStorage.removeItem("user");
                localStorage.removeItem("access_token");
            }
        }
        setLoading(false);
    }, [accessToken]);

    // Use React Query to keep the profile fresh in the background.
    // It will auto-refetch on window focus or after staleTime.
    const { data: freshData, isSuccess, isError, error } = useProfile(!!accessToken && !loading);

    useEffect(() => {
        if (isSuccess && freshData) {
            setUser((prev) => {
                const updatedUser = { ...prev, ...freshData };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                return updatedUser;
            });
        }
    }, [isSuccess, freshData]);

    useEffect(() => {
        if (isError) {
            console.error("Failed to fetch fresh profile.", error);
        }
    }, [isError, error]);

    const login = async (registrationNumber, password, collegeCode) => {
        try {
            const response = await authService.login(registrationNumber, password, collegeCode);

            const { access, refresh, role, name, first_name, last_name, college, batch, department } = response.data;

            const userData = { role, name, first_name, last_name, college, registrationNumber, batch, department };

            localStorage.setItem("access_token", access);
            localStorage.setItem("refresh_token", refresh);
            localStorage.setItem("user", JSON.stringify(userData));

            setUser(userData);
            return { success: true };
        } catch (error) {
            console.error("Login failed:", error);
            return {
                success: false,
                message: error.response?.data?.detail || "Login failed"
            };
        }
    };

    const updateUser = (newUserData) => {
        // Merge existing user data with new updates
        const updatedUser = { ...user, ...newUserData };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
