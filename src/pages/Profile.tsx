import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User as UserIcon, Settings, BookOpen, Store, Star } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState({ read: 0, listings: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const userRef = doc(db, 'users', user!.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfileData(data);
        setBio(data.bio || '');
      }

      // Fetch stats
      const readQuery = query(collection(db, 'userBooks'), where('userId', '==', user!.uid), where('status', '==', 'completed'));
      const readSnap = await getDocs(readQuery);
      
      const listingsQuery = query(collection(db, 'marketplaceListings'), where('sellerId', '==', user!.uid));
      const listingsSnap = await getDocs(listingsQuery);

      setStats({
        read: readSnap.size,
        listings: listingsSnap.size
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users/userBooks/marketplaceListings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { bio });
      setProfileData({ ...profileData, bio });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
        <div className="h-48 bg-gray-200 rounded-3xl"></div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        
        <div className="relative z-10 pt-16 md:pt-12 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
          <img 
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}&size=128`} 
            alt="Profile" 
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white object-cover"
          />
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{user?.displayName || 'Reader'}</h1>
            <p className="text-gray-500 mb-4">{user?.email}</p>
            
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  rows={3}
                  placeholder="Write a short bio about your reading preferences..."
                />
                <div className="flex gap-2 justify-center md:justify-start">
                  <button 
                    onClick={handleSaveBio}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setBio(profileData?.bio || ''); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-center md:justify-start gap-4">
                <p className="text-gray-700 max-w-lg text-sm md:text-base">
                  {profileData?.bio || <span className="text-gray-400 italic">No bio added yet.</span>}
                </p>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                  title="Edit Bio"
                >
                  <Settings size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.read}</div>
            <div className="text-sm font-medium text-gray-500">Books Read</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <Store size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.listings}</div>
            <div className="text-sm font-medium text-gray-500">Active Listings</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Star size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{profileData?.reputationScore || 0}</div>
            <div className="text-sm font-medium text-gray-500">Reputation Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
