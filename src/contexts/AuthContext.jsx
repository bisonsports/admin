import { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  provider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  db
} from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

// Cache implementation for both managers and stadiums
const cache = {
  data: {
    managers: new Map(),
    stadiums: new Map()
  },
  maxAge: 5 * 60 * 1000, // 5 minutes in milliseconds

  set(type, id, data) {
    this.data[type].set(id, {
      data: data,
      timestamp: Date.now()
    });
  },

  get(type, id) {
    const cached = this.data[type].get(id);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.maxAge) {
      this.data[type].delete(id);
      return null;
    }
    
    return cached.data;
  },

  clear() {
    this.data.managers.clear();
    this.data.stadiums.clear();
  }
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [managerData, setManagerData] = useState(null);
  const [stadiumData, setStadiumData] = useState(null);

  const fetchStadiumData = async (stadiumID) => {
    try {
      // Check cache first
      const cachedStadium = cache.get('stadiums', stadiumID);
      if (cachedStadium) {
        setStadiumData(cachedStadium);
        return;
      }

      // If not in cache, fetch from Firestore
      const stadiumRef = doc(db, 'stadiums', stadiumID);
      const stadiumSnap = await getDoc(stadiumRef);
      
      if (stadiumSnap.exists()) {
        const stadiumData = stadiumSnap.data();
        // Store complete stadium data in cache
        cache.set('stadiums', stadiumID, stadiumData);
        setStadiumData(stadiumData);
      } else {
        console.error('Stadium not found');
        setStadiumData(null);
      }
    } catch (error) {
      console.error('Error fetching stadium data:', error);
      setStadiumData(null);
    }
  };

  const fetchManagerData = async (uid) => {
    try {
      // Check cache first
      const cachedManager = cache.get('managers', uid);
      if (cachedManager) {
        setManagerData({ ...cachedManager, id: uid });
        // If manager has stadiumID, fetch stadium data
        if (cachedManager.stadiumID) {
          await fetchStadiumData(cachedManager.stadiumID);
        }
        return;
      }

      // If not in cache, fetch from Firestore
      const managerRef = doc(db, 'managers', uid);
      const managerSnap = await getDoc(managerRef);
      
      if (managerSnap.exists()) {
        const managerData = { ...managerSnap.data(), id: uid };
        // Store complete manager data in cache
        cache.set('managers', uid, managerData);
        setManagerData(managerData);
        
        // If manager has stadiumID, fetch stadium data
        if (managerData.stadiumID) {
          await fetchStadiumData(managerData.stadiumID);
        } else {
          setStadiumData(null);
        }
      } else {
        setError('Manager profile not found');
        setManagerData(null);
        setStadiumData(null);
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
      setError('Failed to fetch manager data');
      setManagerData(null);
      setStadiumData(null);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      await fetchManagerData(result.user.uid);
      return result.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchManagerData(result.user.uid);
      return result.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await fetchManagerData(result.user.uid);
      return result.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setManagerData(null);
      setStadiumData(null);
      cache.clear(); // Clear all caches on logout
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchManagerData(currentUser.uid);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    error,
    managerData,
    stadiumData,
    setStadiumData,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 