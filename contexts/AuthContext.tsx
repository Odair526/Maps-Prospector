import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: (email: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => void;
}

// Internal interface for the mock database (includes password)
interface StoredUser extends User {
  password?: string;
  authProvider?: 'google' | 'email';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to get users DB from LocalStorage
  const getUsersDB = (): StoredUser[] => {
    try {
      const db = localStorage.getItem('prospector_users_db');
      return db ? JSON.parse(db) : [];
    } catch (e) {
      console.error("Error loading users database", e);
      return [];
    }
  };

  // Helper to save users DB to LocalStorage
  const saveUsersDB = (users: StoredUser[]) => {
    try {
      localStorage.setItem('prospector_users_db', JSON.stringify(users));
    } catch (e) {
      console.error("Error saving users database", e);
    }
  };

  // Check for persisted session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('prospector_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Refresh user data from DB to ensure we have latest profile changes
        const db = getUsersDB();
        const freshUser = db.find(u => u.id === parsedUser.id);
        
        if (freshUser) {
          // Remove password before setting state
          const { password, ...safeUser } = freshUser;
          setUser(safeUser);
        } else {
          // Fallback if not found in DB (e.g. old session)
          setUser(parsedUser);
        }
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async (email: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const db = getUsersDB();
        // Check if this google user already exists
        let existingUser = db.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (existingUser) {
          // User exists, log them in
          const { password, ...safeUser } = existingUser;
          setUser(safeUser);
          localStorage.setItem('prospector_user', JSON.stringify(safeUser));
        } else {
          // New Google User -> Create and Save
          const namePart = email.split('@')[0];
          // Capitalize first letter
          const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          
          const newUser: StoredUser = {
            id: 'google-' + Date.now(),
            name: displayName,
            email: email,
            // Use a specific Google-ish style avatar or just initials
            photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&bold=true`,
            password: '', // No password for google auth
            authProvider: 'google'
          };

          db.push(newUser);
          saveUsersDB(db);

          const { password, ...safeUser } = newUser;
          setUser(safeUser);
          localStorage.setItem('prospector_user', JSON.stringify(safeUser));
        }
        resolve();
      }, 1000);
    });
  };

  const login = async (email: string, pass: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const db = getUsersDB();
        // Case-insensitive email check
        const foundUser = db.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (foundUser) {
          // Check password (if user was created via Google, they might not have a password)
          if (foundUser.authProvider === 'google' && !foundUser.password) {
            reject(new Error("Esta conta usa login via Google. Clique no botão Google."));
            return;
          }

          if (foundUser.password === pass) {
            const { password, ...safeUser } = foundUser;
            setUser(safeUser);
            localStorage.setItem('prospector_user', JSON.stringify(safeUser));
            resolve();
          } else {
            reject(new Error("Senha incorreta."));
          }
        } else {
          reject(new Error("Email não encontrado."));
        }
      }, 1000);
    });
  };

  const register = async (name: string, email: string, pass: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const db = getUsersDB();
        const exists = db.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (exists) {
          reject(new Error("Este email já está cadastrado. Tente fazer login."));
          return;
        }

        // Generate a nice default avatar with initials
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&rounded=true&bold=true`;

        const newUser: StoredUser = {
          id: Date.now().toString(),
          name,
          email,
          photoUrl: defaultAvatar, 
          password: pass,
          authProvider: 'email'
        };

        // SAVE to the persistent mock DB
        db.push(newUser);
        saveUsersDB(db);

        // Auto login after register
        const { password, ...safeUser } = newUser;
        setUser(safeUser);
        localStorage.setItem('prospector_user', JSON.stringify(safeUser));
        resolve();
      }, 1500);
    });
  };

  const updateProfile = async (data: Partial<User>) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (user) {
          const updatedUser = { ...user, ...data };
          
          // Update Session
          setUser(updatedUser);
          localStorage.setItem('prospector_user', JSON.stringify(updatedUser));

          // Update Mock DB so changes persist across logins
          const db = getUsersDB();
          const index = db.findIndex(u => u.id === user.id);
          if (index !== -1) {
            db[index] = { ...db[index], ...data };
            saveUsersDB(db);
          }
        }
        resolve();
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('prospector_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};