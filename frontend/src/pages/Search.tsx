import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { searchAPI } from '@/api/api';
import Navbar from '@/components/Navbar';
import DocCard from '@/components/DocCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search as SearchIcon, 
  Sparkles, 
  Filter, 
  Clock,
  Brain,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SearchResult {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  summary?: string;
  createdBy: {
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  relevanceScore?: number;
}

const Search = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'regular' | 'semantic'>('regular');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await searchAPI.searchDocuments(searchQuery, searchMode === 'semantic');
      setSearchResults(results.documents || results);
      
      // Save to recent searches
      const updatedRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(updatedRecent);
      localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
      
      toast({
        title: 'Search Complete',
        description: `Found ${results.documents?.length || results.length} documents`,
      });
    } catch (error) {
      toast({
        title: 'Search Error',
        description: 'Failed to search documents. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
    // Trigger search automatically
    setTimeout(() => {
      const form = document.getElementById('search-form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-knowledge-bg">
      <Navbar />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
            <SearchIcon className="h-8 w-8 text-primary" />
            <span>AI-Powered Search</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Find documents with regular text search or AI semantic understanding
          </p>
        </div>

        {/* Search Interface */}
        <Card className="mb-8 bg-knowledge-card border-knowledge-border shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <SearchIcon className="h-5 w-5" />
                <span>Search Knowledge Base</span>
              </CardTitle>
              
              {/* Search Mode Toggle */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={searchMode === 'regular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchMode('regular')}
                  className="flex items-center space-x-1"
                >
                  <Filter className="h-3 w-3" />
                  <span>Regular</span>
                </Button>
                <Button
                  variant={searchMode === 'semantic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchMode('semantic')}
                  className="flex items-center space-x-1 bg-gradient-to-r from-ai-primary to-ai-secondary text-white border-ai-primary hover:from-ai-primary/90 hover:to-ai-secondary/90"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>AI Semantic</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Search Form */}
            <form id="search-form" onSubmit={handleSearch} className="space-y-4">
              <div className="flex space-x-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      searchMode === 'semantic' 
                        ? "Ask anything... AI will understand the context"
                        : "Search by title, content, or tags..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className={
                    searchMode === 'semantic'
                      ? "bg-gradient-to-r from-ai-primary to-ai-secondary hover:from-ai-primary/90 hover:to-ai-secondary/90 shadow-ai"
                      : "bg-gradient-to-r from-primary to-ai-primary hover:from-primary/90 hover:to-ai-primary/90 shadow-ai"
                  }
                >
                  {isSearching ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Searching...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {searchMode === 'semantic' ? (
                        <Brain className="h-4 w-4" />
                      ) : (
                        <SearchIcon className="h-4 w-4" />
                      )}
                      <span>Search</span>
                    </div>
                  )}
                </Button>
                {hasSearched && (
                  <Button variant="outline" onClick={clearSearch}>
                    Clear
                  </Button>
                )}
              </div>
            </form>

            {/* Search Mode Info */}
            <div className="bg-accent/50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                {searchMode === 'semantic' ? (
                  <Sparkles className="h-5 w-5 text-ai-primary mt-0.5" />
                ) : (
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                )}
                <div>
                  <h4 className="font-medium text-foreground">
                    {searchMode === 'semantic' ? 'AI Semantic Search' : 'Regular Text Search'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {searchMode === 'semantic' 
                      ? 'AI understands context and meaning. Try: "How to implement authentication?" or "Documents about databases"'
                      : 'Searches exact words in titles, content, and tags. Use specific keywords for best results.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && !hasSearched && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Recent Searches:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((query, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => handleRecentSearch(query)}
                    >
                      {query}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Search Results
                {searchResults.length > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({searchResults.length} found)
                  </span>
                )}
              </h2>
              {searchQuery && (
                <Badge variant="outline" className="text-primary">
                  "{searchQuery}"
                </Badge>
              )}
            </div>

            {/* Results Grid */}
            {searchResults.length === 0 ? (
              <Card className="p-12 text-center bg-knowledge-card border-knowledge-border">
                <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No documents found
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchMode === 'semantic'
                    ? 'Try rephrasing your question or switching to regular search mode.'
                    : 'Try different keywords or switch to AI semantic search for better results.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearchMode(searchMode === 'semantic' ? 'regular' : 'semantic')}
                >
                  Switch to {searchMode === 'semantic' ? 'Regular' : 'AI Semantic'} Search
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((document) => (
                  <DocCard key={document._id} document={document} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;