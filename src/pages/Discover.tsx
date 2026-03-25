import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { GoogleGenAI, Type } from '@google/genai';
import { Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Discover() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    generateRecommendations();
  }, [user]);

  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch user's reading history
      const q = query(collection(db, 'userBooks'), where('userId', '==', user?.uid));
      const snap = await getDocs(q);
      const userBooks = snap.docs.map(doc => doc.data());
      
      const readTitles = userBooks.map(b => b.bookDetails?.title).filter(Boolean);
      const favoriteAuthors = userBooks.map(b => b.bookDetails?.authors?.[0]).filter(Boolean);

      // 2. Call Gemini API
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const prompt = `
        Based on these books the user has read: ${readTitles.join(', ') || 'None yet'}.
        And these authors they like: ${favoriteAuthors.join(', ') || 'None yet'}.
        Recommend 5 books they might enjoy. 
        If they haven't read anything, recommend 5 universally acclaimed modern fiction and non-fiction books.
        Do not recommend books they have already read.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Book title" },
                author: { type: Type.STRING, description: "Author name" },
                reason: { type: Type.STRING, description: "Why they might like it (1-2 sentences)" },
                genre: { type: Type.STRING, description: "Primary genre" }
              },
              required: ["title", "author", "reason", "genre"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim() || '[]';
      const parsedRecommendations = JSON.parse(jsonStr);
      
      // 3. Fetch cover images from Google Books API
      const enrichedRecommendations = await Promise.all(
        parsedRecommendations.map(async (rec: any) => {
          try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(rec.title)}+inauthor:${encodeURIComponent(rec.author)}&maxResults=1`);
            const data = await res.json();
            const volumeInfo = data.items?.[0]?.volumeInfo;
            return {
              ...rec,
              coverUrl: volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
              pageCount: volumeInfo?.pageCount || '?',
              publishedDate: volumeInfo?.publishedDate?.substring(0, 4) || '?'
            };
          } catch (e) {
            return rec;
          }
        })
      );

      setRecommendations(enrichedRecommendations);
    } catch (err: any) {
      console.error("Error generating recommendations:", err);
      setError(err.message || "Failed to generate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 to-indigo-900 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Sparkles size={200} className="transform translate-x-1/4 -translate-y-1/4" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="text-purple-300" />
            AI Recommendations
          </h1>
          <p className="text-purple-200 max-w-2xl">
            Personalized book suggestions powered by Gemini, based on your reading history and preferences.
          </p>
        </div>
        <button
          onClick={generateRecommendations}
          disabled={loading}
          className="relative z-10 whitespace-nowrap bg-white text-purple-900 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors disabled:opacity-70"
        >
          {loading ? 'Analyzing...' : 'Refresh Picks'}
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse flex gap-4">
              <div className="w-24 h-36 bg-gray-200 rounded-lg shrink-0"></div>
              <div className="flex-1 space-y-3 py-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-2 pt-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-center">
          <p className="font-medium">{error}</p>
          <button onClick={generateRecommendations} className="mt-4 underline hover:text-red-800">Try again</button>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full"
            >
              <div className="flex gap-4 mb-4">
                {rec.coverUrl ? (
                  <img src={rec.coverUrl} alt={rec.title} className="w-24 h-36 object-cover rounded-lg shadow-sm shrink-0" />
                ) : (
                  <div className="w-24 h-36 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                    <BookOpen size={32} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md mb-2">
                    {rec.genre}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{rec.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{rec.author}</p>
                  <p className="text-xs text-gray-400">{rec.publishedDate} • {rec.pageCount} pages</p>
                </div>
              </div>
              
              <div className="mt-auto bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-700 italic">"{rec.reason}"</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <Sparkles className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No recommendations yet</h3>
          <p className="mt-1 text-gray-500">Read more books to get personalized suggestions.</p>
        </div>
      )}
    </div>
  );
}
