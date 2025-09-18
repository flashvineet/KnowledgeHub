import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { documentsAPI } from '@/api/api';
import { toast } from '@/hooks/use-toast';
import {
  Edit,
  Trash2,
  Brain,
  Tags,
  Calendar,
  User,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

interface DocCardProps {
  document: Document;
  onUpdate?: () => void;
}

const DocCard: React.FC<DocCardProps> = ({ document, onUpdate }) => {
  const { user } = useAuth();

  const canEdit = user?.role === 'admin' || document.createdBy.email === user?.email;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentsAPI.delete(document._id);
      toast({ title: 'Success', description: 'Document deleted successfully!' });
      onUpdate?.();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete document',
        variant: 'destructive' 
      });
    }
  };

  const handleSummarize = async () => {
    try {
      await documentsAPI.summarize(document._id);
      toast({ title: 'Success', description: 'Document summarized with Gemini AI!' });
      onUpdate?.();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to generate summary',
        variant: 'destructive' 
      });
    }
  };

  const handleGenerateTags = async () => {
    try {
      await documentsAPI.generateTags(document._id);
      toast({ title: 'Success', description: 'Tags generated with Gemini AI!' });
      onUpdate?.();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to generate tags',
        variant: 'destructive' 
      });
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="group hover:shadow-soft transition-all duration-300 bg-knowledge-card border-knowledge-border">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
            {document.title}
          </CardTitle>
          {canEdit && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/edit-doc/${document._id}`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{document.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary or Content Preview */}
        <div>
          {document.summary ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-1 text-ai-primary text-sm font-medium">
                <Sparkles className="h-3 w-3" />
                <span>AI Summary</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {truncateContent(document.summary)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {truncateContent(document.content)}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{document.createdBy.email}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(document.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* AI Actions */}
        <div className="flex space-x-2 pt-2">
          {!document.summary && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSummarize}
              className="flex items-center space-x-1 text-ai-primary border-ai-primary/20 hover:bg-ai-primary/10"
            >
              <Brain className="h-3 w-3" />
              <span>Summarize</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateTags}
            className="flex items-center space-x-1 text-ai-secondary border-ai-secondary/20 hover:bg-ai-secondary/10"
          >
            <Tags className="h-3 w-3" />
            <span>Generate Tags</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocCard;