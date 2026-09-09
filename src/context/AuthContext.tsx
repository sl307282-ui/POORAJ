import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Alert } from 'react-native';

type Role = 'admin' | 'team' | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  userData: any | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  userData: null,
  isLoading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch role and status from Firestore in real-time
        unsubscribeSnapshot = onSnapshot(doc(db, 'users', currentUser.uid), async (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Check if user is deactivated
            if (data.isActive === false) {
              Alert.alert('Account Deactivated', 'Your account has been deactivated by the Administrator.');
              await signOut(auth);
              setUser(null);
              setRole(null);
              setUserData(null);
            } else {
              setUser(currentUser);
              setRole(data.role as Role);
              setUserData(data);
            }
          } else {
            // No Firestore doc yet — user is mid-signup (e.g. Google new user)
            setUser(currentUser);
            setRole(null);
            setUserData(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error('Error fetching user role:', error);
          setUser(null);
          setRole(null);
          setUserData(null);
          setIsLoading(false);
        });
      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
        setUser(null);
        setRole(null);
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, userData, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
