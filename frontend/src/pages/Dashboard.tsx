import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { documentsAPI } from '@/api/api';
import Navbar from '@/components/Navbar';
import DocCard from '@/components/DocCard';
import TagChip from '@/components/TagChip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search, FileText, Sparkles, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Document {
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
}

const Dashboard = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, selectedTags]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await documentsAPI.getAll();
      setDocuments(response.documents || response);
      
      // Extract all unique tags
      const tags = new Set<string>();
      (response.documents || response).forEach((doc: Document) => {
        doc.tags.forEach((tag: string) => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch documents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((doc) =>
        selectedTags.every((tag) => doc.tags.includes(tag))
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
                <FileText className="h-8 w-8 text-primary" />
                <span>Knowledge Dashboard</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and explore your AI-powered knowledge base
              </p>
            </div>
            <Button
              onClick={() => navigate('/add-doc')}
              className="bg-gradient-to-r from-primary to-ai-primary hover:from-primary/90 hover:to-ai-primary/90 shadow-ai"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>

          {/* Search and Filters */}
          <Card className="p-6 bg-knowledge-card border-knowledge-border">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>

              {/* Tag Filters */}
              {allTags.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Filter by Tags:</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <TagChip
                        key={tag}
                        tag={tag}
                        selected={selectedTags.includes(tag)}
                        onClick={handleTagSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Active Filters */}
              {(searchQuery || selectedTags.length > 0) && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredDocuments.length} of {documents.length} documents
                  {selectedTags.length > 0 && (
                    <span> • Filtered by: {selectedTags.join(', ')}</span>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="p-12 text-center bg-knowledge-card border-knowledge-border">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {documents.length === 0
                ? 'Start building your knowledge base by creating your first document.'
                : 'Try adjusting your search query or tag filters.'}
            </p>
            {documents.length === 0 && (
              <Button
                onClick={() => navigate('/add-doc')}
                className="bg-gradient-to-r from-primary to-ai-primary hover:from-primary/90 hover:to-ai-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Document
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((document) => (
              <DocCard
                key={document._id}
                document={document}
                onUpdate={fetchDocuments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;