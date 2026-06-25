import { createContext, useState, useEffect, useContext } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = localStorage.getItem("user");
            const accessToken = localStorage.getItem("access_token");

            if (storedUser && accessToken) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    
                    // Fetch fresh profile data to get latest details (like batch/department)
                    try {
                        const response = await authService.getProfile();
                        const freshData = response.data;
                        // Merge fresh data (it may have more or updated fields)
                        const updatedUser = { ...parsedUser, ...freshData };
                        setUser(updatedUser);
                        localStorage.setItem("user", JSON.stringify(updatedUser));
                    } catch (fetchErr) {
                        console.error("Failed to fetch fresh profile, using stored data.", fetchErr);
                    }
                } catch (err) {
                    console.error("Failed to parse stored user:", err);
                    localStorage.removeItem("user");
                    localStorage.removeItem("access_token");
                }
            }
            setLoading(false);
        };
        
        initializeAuth();
    }, []);

    const login = async (registrationNumber, password, collegeCode = "IITB") => {
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
