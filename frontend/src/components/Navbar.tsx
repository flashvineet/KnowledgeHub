import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { 
  Brain, 
  Search, 
  FileText, 
  Plus, 
  MessageSquare, 
  LogOut,
  LayoutDashboard
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-knowledge-card border-knowledge-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-primary to-ai-primary">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              KnowledgeHub
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Button
              variant={isActive('/dashboard') || isActive('/') ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/dashboard" className="flex items-center space-x-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </Button>
            
            <Button
              variant={isActive('/add-doc') ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/add-doc" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Doc</span>
              </Link>
            </Button>
            
            <Button
              variant={isActive('/search') ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/search" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Search</span>
              </Link>
            </Button>
            
            <Button
              variant={isActive('/qa') ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/qa" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>AI Q&A</span>
              </Link>
            </Button>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-muted-foreground">
              {user?.email}
              {user?.role === 'admin' && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Admin
                </span>
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;