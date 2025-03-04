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

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [managerName, setManagerName] = useState('');
  const [stadiumName, setStadiumName] = useState('');

  const fetchStadiumName = async (stadiumID) => {
    try {
      const stadiumRef = doc(db, 'stadiums', stadiumID);
      const stadiumSnap = await getDoc(stadiumRef);
      
      if (stadiumSnap.exists()) {
        setStadiumName(stadiumSnap.data().name);
      } else {
        console.error('Stadium not found');
        setStadiumName('Unknown Stadium');
      }
    } catch (error) {
      console.error('Error fetching stadium name:', error);
      setStadiumName('Unknown Stadium');
    }
  };

  const fetchManagerDetails = async (uid) => {
    try {
      const managerRef = doc(db, 'managers', uid);
      const managerSnap = await getDoc(managerRef);
      
      if (managerSnap.exists()) {
        const managerData = managerSnap.data();
        setManagerName(managerData.name);
        
        // Fetch stadium name if stadiumID exists
        if (managerData.stadiumID) {
          await fetchStadiumName(managerData.stadiumID);
        } else {
          setStadiumName('No Stadium Assigned');
        }
      } else {
        setError('Manager profile not found');
        setManagerName('Unknown');
        setStadiumName('No Stadium Assigned');
      }
    } catch (error) {
      console.error('Error fetching manager details:', error);
      setError('Failed to fetch manager details');
      setManagerName('Unknown');
      setStadiumName('Unknown Stadium');
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      await fetchManagerDetails(result.user.uid);
      return result.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchManagerDetails(result.user.uid);
      return result.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await fetchManagerDetails(result.user.uid);
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
      setManagerName('');
      setStadiumName('');
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchManagerDetails(currentUser.uid);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    error,
    managerName,
    stadiumName,
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