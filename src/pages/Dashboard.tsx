import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { BookOpen, Plus, TrendingUp, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [currentlyReading, setCurrentlyReading] = useState<any[]>([]);
  const [recentBooks, setRecentBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch currently reading
        const readingQuery = query(
          collection(db, 'userBooks'),
          where('userId', '==', user.uid),
          where('status', '==', 'reading'),
          limit(3)
        );
        const readingSnap = await getDocs(readingQuery);
        setCurrentlyReading(readingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch recently added
        const recentQuery = query(
          collection(db, 'userBooks'),
          where('userId', '==', user.uid),
          orderBy('addedAt', 'desc'),
          limit(4)
        );
        const recentSnap = await getDocs(recentQuery);
        setRecentBooks(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'userBooks');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Reader'}! 👋
          </h1>
          <p className="text-gray-500">
            You've read <span className="font-semibold text-blue-600">0 books</span> this year. Keep it up!
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/library"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Book
          </Link>
          <Link
            to="/marketplace"
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Store size={20} />
            Sell Book
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Currently Reading */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="text-blue-600" size={24} />
              Currently Reading
            </h2>
            <Link to="/library" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="animate-pulse flex space-x-4 bg-white p-6 rounded-2xl border border-gray-100">
              <div className="rounded-lg bg-gray-200 h-32 w-24"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ) : currentlyReading.length > 0 ? (
            <div className="grid gap-4">
              {currentlyReading.map((book) => (
                <div key={book.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-6 items-center hover:shadow-md transition-shadow">
                  <img 
                    src={book.bookDetails?.coverUrl || 'https://via.placeholder.com/128x192?text=No+Cover'} 
                    alt={book.bookDetails?.title}
                    className="w-20 h-28 object-cover rounded-lg shadow-sm"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{book.bookDetails?.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{book.bookDetails?.authors?.join(', ')}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-gray-600">
                        <span>{book.progress || 0}% Completed</span>
                        <span>{book.bookDetails?.pageCount ? Math.round((book.progress || 0) / 100 * book.bookDetails.pageCount) : 0} / {book.bookDetails?.pageCount || '?'} pages</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${book.progress || 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <button className="hidden sm:block px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 border border-gray-200">
                    Update
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Not reading anything right now</h3>
              <p className="text-gray-500 mb-4">Find your next great read and track your progress.</p>
              <Link to="/discover" className="text-blue-600 font-medium hover:underline">
                Discover books
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar / Stats */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-blue-400" size={24} />
              <h2 className="text-lg font-bold">Reading Stats</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <div className="text-3xl font-bold mb-1">0</div>
                <div className="text-xs text-slate-300 uppercase tracking-wider font-medium">Books Read</div>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <div className="text-3xl font-bold mb-1">0</div>
                <div className="text-xs text-slate-300 uppercase tracking-wider font-medium">Pages Read</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recently Added</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : recentBooks.length > 0 ? (
              <div className="space-y-3">
                {recentBooks.map(book => (
                  <div key={book.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                    <img 
                      src={book.bookDetails?.coverUrl || 'https://via.placeholder.com/48x72?text=No+Cover'} 
                      alt={book.bookDetails?.title}
                      className="w-12 h-16 object-cover rounded shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{book.bookDetails?.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{book.bookDetails?.authors?.join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No books added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
