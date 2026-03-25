import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { Search, Plus, BookOpen, CheckCircle, Clock, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Library() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reading' | 'completed' | 'want-to-read'>('reading');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchBooks();
  }, [user, activeTab]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'userBooks'),
        where('userId', '==', user?.uid),
        where('status', '==', activeTab)
      );
      const snap = await getDocs(q);
      setBooks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'userBooks');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=10`);
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch (error) {
      console.error("Error searching books:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addBook = async (bookData: any, status: string) => {
    if (!user) return;
    
    const volumeInfo = bookData.volumeInfo;
    const bookId = bookData.id;
    
    const bookDetails: any = {
      id: bookId,
      title: volumeInfo.title || 'Unknown Title',
    };
    if (volumeInfo.authors) bookDetails.authors = volumeInfo.authors;
    if (volumeInfo.description) bookDetails.description = volumeInfo.description;
    if (volumeInfo.pageCount) bookDetails.pageCount = volumeInfo.pageCount;
    if (volumeInfo.imageLinks?.thumbnail) bookDetails.coverUrl = volumeInfo.imageLinks.thumbnail.replace('http:', 'https:');
    if (volumeInfo.publishedDate) bookDetails.publishedDate = volumeInfo.publishedDate;
    if (volumeInfo.categories) bookDetails.categories = volumeInfo.categories;

    try {
      // 1. Cache book details in 'books' collection
      await setDoc(doc(db, 'books', bookId), bookDetails, { merge: true });
      
      // 2. Add to userBooks
      await addDoc(collection(db, 'userBooks'), {
        userId: user.uid,
        bookId: bookId,
        status: status,
        progress: 0,
        rating: 0,
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        bookDetails: bookDetails
      });
      
      setIsSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      if (status === activeTab) {
        fetchBooks();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'userBooks');
    }
  };

  const tabs = [
    { id: 'reading', label: 'Reading', icon: BookOpen },
    { id: 'want-to-read', label: 'Want to Read', icon: Clock },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">My Library</h1>
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Book
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl max-w-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all",
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="bg-gray-200 aspect-[2/3] rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book) => (
            <motion.div 
              key={book.id}
              layoutId={book.id}
              className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="aspect-[2/3] w-full overflow-hidden bg-gray-100 relative">
                {book.bookDetails?.coverUrl ? (
                  <img 
                    src={book.bookDetails.coverUrl} 
                    alt={book.bookDetails.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <BookOpen size={48} />
                  </div>
                )}
                {activeTab === 'reading' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200">
                    <div 
                      className="h-full bg-blue-600" 
                      style={{ width: `${book.progress || 0}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 line-clamp-1 mb-1" title={book.bookDetails?.title}>
                  {book.bookDetails?.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1 mb-3">
                  {book.bookDetails?.authors?.join(', ')}
                </p>
                <div className="mt-auto">
                  {activeTab === 'completed' && (
                    <div className="flex items-center text-yellow-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} className={cn("w-4 h-4", star <= (book.rating || 0) ? "fill-current" : "text-gray-300 fill-current")} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No books found</h3>
          <p className="mt-1 text-gray-500">Get started by adding a book to your {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} list.</p>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Book
          </button>
        </div>
      )}

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">Add a Book</h2>
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto">
                <form onSubmit={handleSearch} className="relative mb-8">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-4 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg shadow-sm"
                    placeholder="Search by title, author, or ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button 
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="absolute inset-y-2 right-2 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </form>

                <div className="space-y-4">
                  {searchResults.map((book) => (
                    <div key={book.id} className="flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all bg-white">
                      <img 
                        src={book.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/64x96?text=No+Cover'} 
                        alt={book.volumeInfo?.title}
                        className="w-16 h-24 object-cover rounded-lg shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{book.volumeInfo?.title}</h3>
                        <p className="text-sm text-gray-500 mb-1">{book.volumeInfo?.authors?.join(', ')}</p>
                        <p className="text-xs text-gray-400 mb-3">{book.volumeInfo?.publishedDate?.substring(0, 4)} • {book.volumeInfo?.pageCount || '?'} pages</p>
                        
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => addBook(book, 'reading')}
                            className="text-xs font-medium px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                          >
                            Reading
                          </button>
                          <button 
                            onClick={() => addBook(book, 'want-to-read')}
                            className="text-xs font-medium px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                          >
                            Want to Read
                          </button>
                          <button 
                            onClick={() => addBook(book, 'completed')}
                            className="text-xs font-medium px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100"
                          >
                            Completed
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
