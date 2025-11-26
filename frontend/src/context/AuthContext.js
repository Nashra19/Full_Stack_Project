import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the context
const AuthContext = createContext(null);

// 2. Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // This effect runs when the app first loads to check if the user is already logged in
  useEffect(() => {
    console.log('AuthContext: useEffect running, checking localStorage');
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    console.log('AuthContext: Stored data - user:', storedUser, 'token:', storedToken);
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        console.log('AuthContext: Restored user data:', userData);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false); // Finished loading
    console.log('AuthContext: useEffect completed, loading set to false');
  }, []); // Empty dependency array - only run once on mount

  // Function to handle user login
  const login = (userData, userToken) => {
    console.log('AuthContext: Login called with:', { userData, userToken });
    
    // Save user data and token to localStorage and state
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update state
    setToken(userToken);
    setUser(userData);
    
    console.log('AuthContext: State updated, token:', userToken, 'user:', userData);
  };

  // Function to handle user logout
  const logout = () => {
    console.log('AuthContext: Logout called');
    // Clear user data from localStorage and state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    console.log('AuthContext: Logout completed, state cleared');
  };
  
  // The value provided to all components that use this context
  const authValue = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user, // Check both token and user exist
    loading,
  };

  return (
  <AuthContext.Provider value={authValue}>
    {children}
  </AuthContext.Provider>
);
};

// 3. Create a custom hook to easily use the context in other components
export const useAuth = () => {
  return useContext(AuthContext);
};