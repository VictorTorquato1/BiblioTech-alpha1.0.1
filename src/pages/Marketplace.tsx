import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, setDoc } from 'firebase/firestore';
import { Store, Plus, Search, X, Tag, User as UserIcon, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Listing State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  
  // Form State
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('good');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'marketplaceListings'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setListings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'marketplaceListings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=5`);
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch (error) {
      console.error("Error searching books:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBook || !price) return;
    
    setIsSubmitting(true);
    const volumeInfo = selectedBook.volumeInfo;
    const bookId = selectedBook.id;
    
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
      // Cache book
      await setDoc(doc(db, 'books', bookId), bookDetails, { merge: true });
      
      // Create listing
      await addDoc(collection(db, 'marketplaceListings'), {
        sellerId: user.uid,
        sellerName: user.displayName || 'Anonymous Reader',
        bookId: bookId,
        price: parseFloat(price),
        condition,
        description,
        status: 'active',
        createdAt: serverTimestamp(),
        bookDetails
      });
      
      setIsCreateOpen(false);
      setSelectedBook(null);
      setSearchQuery('');
      setSearchResults([]);
      setPrice('');
      setDescription('');
      setCondition('good');
      
      fetchListings();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'marketplaceListings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace</h1>
          <p className="text-gray-500">Buy and sell books with the Lumina community.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Sell a Book
        </button>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
              <div className="bg-gray-200 aspect-[3/4] rounded-xl w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <motion.div 
              key={listing.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="aspect-[4/3] bg-gray-50 relative p-4 flex items-center justify-center border-b border-gray-100">
                {listing.bookDetails?.coverUrl ? (
                  <img 
                    src={listing.bookDetails.coverUrl} 
                    alt={listing.bookDetails.title}
                    className="h-full object-contain drop-shadow-md"
                  />
                ) : (
                  <BookOpen size={48} className="text-gray-300" />
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg font-bold text-gray-900 shadow-sm border border-gray-100">
                  ${listing.price.toFixed(2)}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight">
                    {listing.bookDetails?.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                  {listing.bookDetails?.authors?.join(', ')}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                    <Tag size={12} />
                    {listing.condition.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                      <UserIcon size={12} />
                    </div>
                    <span className="truncate max-w-[100px]">{listing.sellerName}</span>
                  </div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                    Contact
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
          <Store className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No active listings</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">There are currently no books for sale. Be the first to list a book!</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Sell a Book
          </button>
        </div>
      )}

      {/* Create Listing Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">List a Book for Sale</h2>
                <button 
                  onClick={() => setIsCreateOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto">
                {!selectedBook ? (
                  <>
                    <form onSubmit={handleSearch} className="relative mb-6">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search for the book you want to sell..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      <button 
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        className="absolute inset-y-1.5 right-1.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isSearching ? 'Searching...' : 'Search'}
                      </button>
                    </form>

                    <div className="space-y-3">
                      {searchResults.map((book) => (
                        <div 
                          key={book.id} 
                          onClick={() => setSelectedBook(book)}
                          className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                        >
                          <img 
                            src={book.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/64x96?text=No+Cover'} 
                            alt={book.volumeInfo?.title}
                            className="w-12 h-16 object-cover rounded shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-900 line-clamp-1">{book.volumeInfo?.title}</h3>
                            <p className="text-sm text-gray-500 mb-1">{book.volumeInfo?.authors?.join(', ')}</p>
                            <p className="text-xs text-gray-400">{book.volumeInfo?.publishedDate?.substring(0, 4)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleCreateListing} className="space-y-6">
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <img 
                        src={selectedBook.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/64x96?text=No+Cover'} 
                        alt={selectedBook.volumeInfo?.title}
                        className="w-16 h-24 object-cover rounded shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{selectedBook.volumeInfo?.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{selectedBook.volumeInfo?.authors?.join(', ')}</p>
                        <button 
                          type="button"
                          onClick={() => setSelectedBook(null)}
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          Change Book
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="block w-full pl-7 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                        <select
                          value={condition}
                          onChange={(e) => setCondition(e.target.value)}
                          className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="new">New</option>
                          <option value="like-new">Like New</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Describe any wear and tear, edition details, etc."
                      />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(false)}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !price}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting ? 'Listing...' : 'List Book'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
