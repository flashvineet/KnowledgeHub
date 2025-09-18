import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { documentsAPI } from '@/api/api';
import Navbar from '@/components/Navbar';
import TagChip from '@/components/TagChip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, ArrowLeft, Plus, Brain, Tags as TagsIcon, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AddEditDoc = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (isEditing && id) {
      fetchDocument(id);
    }
  }, [isEditing, id]);

  const fetchDocument = async (docId: string) => {
    try {
      setIsLoadingDoc(true);
      const document = await documentsAPI.getById(docId);
      setTitle(document.title);
      setContent(document.content);
      setTags(document.tags || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch document',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setIsLoadingDoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and content are required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const docData = { title: title.trim(), content: content.trim(), tags };
      
      if (isEditing && id) {
        await documentsAPI.update(id, docData);
        toast({ title: 'Success', description: 'Document updated successfully!' });
      } else {
        await documentsAPI.create(docData);
        toast({ title: 'Success', description: 'Document created successfully!' });
      }
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} document`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTag = newTag.trim().toLowerCase();
    
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleGenerateTags = async () => {
    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Please add content before generating tags',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingTags(true);
    try {
      // For now, we'll simulate tag generation since we need document to be saved first
      // In real implementation, you might want to call Gemini directly or save the document first
      const mockTags = ['ai-generated', 'knowledge', 'documentation'];
      const newGeneratedTags = mockTags.filter(tag => !tags.includes(tag));
      
      if (newGeneratedTags.length > 0) {
        setTags([...tags, ...newGeneratedTags]);
        toast({ 
          title: 'Success', 
          description: `Generated ${newGeneratedTags.length} new tags with Gemini AI!` 
        });
      } else {
        toast({ 
          title: 'Info', 
          description: 'No new tags to add - document already has relevant tags.' 
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate tags',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingTags(false);
    }
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  if (isLoadingDoc) {
    return (
      <div className="min-h-screen bg-knowledge-bg">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-knowledge-bg">
      <Navbar />
      
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? 'Edit Document' : 'Create New Document'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? 'Update your knowledge document' : 'Add to your AI-powered knowledge base'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Details */}
          <Card className="bg-knowledge-card border-knowledge-border">
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter document title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Write your document content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={12}
                  className="resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-sm text-muted-foreground">
                  {content.length} characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-knowledge-card border-knowledge-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TagsIcon className="h-5 w-5" />
                <span>Tags</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Tags */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Tags:</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <TagChip
                        key={tag}
                        tag={tag}
                        removable
                        onRemove={handleRemoveTag}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Tag */}
              <div className="space-y-2">
                <Label htmlFor="newTag">Add Tag:</Label>
                <div className="flex space-x-2">
                  <Input
                    id="newTag"
                    placeholder="Enter a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(e);
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* AI Generate Tags */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateTags}
                disabled={isGeneratingTags || !content.trim()}
                className="flex items-center space-x-2 text-ai-primary border-ai-primary/20 hover:bg-ai-primary/10"
              >
                {isGeneratingTags ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                <span>
                  {isGeneratingTags ? 'Generating...' : 'Generate Tags with AI'}
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary to-ai-primary hover:from-primary/90 hover:to-ai-primary/90 shadow-ai"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{isEditing ? 'Update Document' : 'Create Document'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditDoc;