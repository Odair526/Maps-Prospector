
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
// Import firebase for compat types and providers
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes using the compat method
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Usuário',
          email: firebaseUser.email || '',
          photoUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email}&background=random`
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  };

  const login = async (email: string, pass: string) => {
    await auth.signInWithEmailAndPassword(email, pass);
  };

  const register = async (name: string, email: string, pass: string) => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
    if (userCredential.user) {
      await userCredential.user.updateProfile({
        displayName: name,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&rounded=true&bold=true`
      });
      // Force update local user state
      setUser({
        id: userCredential.user.uid,
        name: name,
        email: email,
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&rounded=true&bold=true`
      });
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (auth.currentUser) {
      await auth.currentUser.updateProfile({
        displayName: data.name,
        photoURL: data.photoUrl
      });
      setUser(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const logout = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
